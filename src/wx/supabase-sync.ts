/**
 * Supabase 世界榜同步
 *
 * 流程：
 *   1. 调用 wx.login() 拿 code
 *   2. POST /wx-login（Edge Function）换取 userId（Supabase 表行 id）
 *   3. 通关后 POST /llk-report 上报关卡、步数、时间戳
 *   4. fetchWorldRank() 直接 GET Supabase REST API（anon key 只读）
 *
 * 密钥管理：
 *   - Anon Key（可公开）写在 vite.config.ts 的 define 里，构建时注入
 *   - Service Role Key 仅在 Edge Function 服务端，客户端永远不持有
 *   - AppSecret 也仅在 Edge Function（WX_APP_SECRET 环境变量）
 */

// vite.config.ts 的 define 中注入构建时常量
declare const __SUPABASE_URL__: string
declare const __SUPABASE_ANON_KEY__: string
declare const __EDGE_BASE_URL__: string

const SUPABASE_URL: string = (typeof __SUPABASE_URL__ !== 'undefined')
  ? __SUPABASE_URL__
  : 'https://krajrhnieoplqshmujwa.supabase.co'

const SUPABASE_ANON_KEY: string = (typeof __SUPABASE_ANON_KEY__ !== 'undefined')
  ? __SUPABASE_ANON_KEY__
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYWpyaG5pZW9wbHFzaG11andhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDg2NDYsImV4cCI6MjA5MDQyNDY0Nn0.IoyFT23YGvFV0kv7ff2Mcb3fw_W5MTDCV9WlY4FvhsA'

const EDGE_BASE_URL: string = (typeof __EDGE_BASE_URL__ !== 'undefined')
  ? __EDGE_BASE_URL__
  : `${SUPABASE_URL}/functions/v1`

// ── 本地缓存：登录后保存 userId，避免每次通关都重新 wx.login ──
const SESSION_KEY = 'llk_supabase_session_v1'

interface Session {
  userId: string
  expiresAt: number
}

function loadSession(): Session | null {
  try {
    const raw = wx.getStorageSync(SESSION_KEY) as string | undefined
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (Date.now() > s.expiresAt) return null
    return s
  } catch {
    return null
  }
}

function saveSession(s: Session): void {
  try {
    wx.setStorageSync(SESSION_KEY, JSON.stringify(s))
  } catch (_) {}
}

function clearSession(): void {
  try {
    wx.removeStorageSync(SESSION_KEY)
  } catch (_) {}
}

// ── 微信 wx.login 获取 code ─────────────────────────────────
function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res: { code?: string }) => {
        if (res.code) resolve(res.code)
        else reject(new Error('wx.login: no code'))
      },
      fail: (err: unknown) => reject(err)
    })
  })
}

// ── 通用 wx.request 包装（返回 Promise）──────────────────────
function wxRequest<T>(opts: {
  url: string
  method?: 'GET' | 'POST'
  data?: unknown
  header?: Record<string, string>
}): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: opts.url,
      method: opts.method ?? 'GET',
      data: opts.data as Record<string, unknown>,
      header: {
        'Content-Type': 'application/json',
        ...opts.header
      },
      success: (res: { statusCode: number; data: unknown }) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err: unknown) => reject(err)
    })
  })
}

// ── 登录并获取 userId（带本地缓存）─────────────────────────────
export async function ensureLoggedIn(): Promise<string | null> {
  const cached = loadSession()
  if (cached) return cached.userId

  try {
    const code = await wxLogin()
    const resp = await wxRequest<{ ok: boolean; user?: { id: string } }>({
      url: `${EDGE_BASE_URL}/wx-login`,
      method: 'POST',
      data: { code }
    })
    if (!resp.ok || !resp.user?.id) return null

    const session: Session = {
      userId: resp.user.id,
      // Session 有效期 2 小时（wx.login code 本身 5 分钟，后续靠 userId 即可）
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    }
    saveSession(session)
    return session.userId
  } catch (e) {
    console.warn('[supabase-sync] login failed:', e)
    return null
  }
}

// ── 通关上报（5.3）────────────────────────────────────────────
export interface ReportPayload {
  /** 刚通过的关卡序号（从 1 开始） */
  level: number
  /** 本关消耗步数（配对次数） */
  steps: number
  /** 通关物理时间（Unix ms） */
  clearedAt: number
}

export async function reportProgressToCloud(payload: ReportPayload): Promise<void> {
  const userId = await ensureLoggedIn()
  if (!userId) return

  try {
    await wxRequest<{ ok: boolean }>({
      url: `${EDGE_BASE_URL}/llk-report`,
      method: 'POST',
      data: { userId, ...payload }
    })
  } catch (e) {
    // 上报失败不阻断游戏流程，静默忽略
    console.warn('[supabase-sync] report failed:', e)
    // 若因 session 失效，清除缓存让下次重新登录
    if (String(e).includes('404') || String(e).includes('401')) {
      clearSession()
    }
  }
}

// ── 世界榜查询（5.4）──────────────────────────────────────────
export interface WorldRankRow {
  rank: number
  name: string
  avatarUrl: string
  level: number
  steps: number
  clearedAt: number
}

/**
 * 查询世界榜 Top N（默认 50）
 * 排序键：current_level DESC → best_level_steps ASC → best_level_cleared_at ASC
 */
export async function fetchWorldRank(topN = 50): Promise<WorldRankRow[]> {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/llk_users` +
      `?select=nickname,avatar_url,current_level,best_level_steps,best_level_cleared_at` +
      `&order=current_level.desc,best_level_steps.asc,best_level_cleared_at.asc` +
      `&limit=${topN}` +
      `&suspicious_count=lt.3`

    const rows = await wxRequest<Array<{
      nickname: string
      avatar_url: string
      current_level: number
      best_level_steps: number
      best_level_cleared_at: number
    }>>({
      url,
      method: 'GET',
      header: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    return rows.map((r, i) => ({
      rank: i + 1,
      name: r.nickname || '小探险家',
      avatarUrl: r.avatar_url || '',
      // current_level = 下一可进入关 = 已通最高关 + 1；展示时减 1
      level: Math.max(1, r.current_level - 1),
      steps: r.best_level_steps,
      clearedAt: r.best_level_cleared_at
    }))
  } catch (e) {
    console.warn('[supabase-sync] fetchWorldRank failed:', e)
    return []
  }
}
