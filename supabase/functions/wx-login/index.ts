/**
 * 微信登录 Edge Function（部署于 Supabase）
 *
 * 流程：
 *   1. 客户端 wx.login() 获取临时 code
 *   2. POST /wx-login { code }
 *   3. Edge Function 用 AppId + AppSecret 换取 openid + session_key
 *   4. 在 llk_users 中 upsert 用户记录（仅首次写入，后续不覆盖昵称等）
 *   5. 返回 Supabase anon JWT（客户端凭此 JWT 读世界榜）
 *
 * 环境变量（在 Supabase Dashboard → Edge Functions → Secrets 设置）：
 *   WX_APP_ID       微信小游戏 AppId
 *   WX_APP_SECRET   微信小游戏 AppSecret（仅服务端，绝不下发给客户端）
 *   SUPABASE_URL    Supabase Project URL（Edge Function 自动注入）
 *   SUPABASE_SERVICE_ROLE_KEY  服务端 key（自动注入或手动设置）
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 最短上报间隔（ms），防止同一用户高频登录
const MIN_LOGIN_INTERVAL_MS = 5_000
// 单次请求超时
const WX_API_TIMEOUT_MS = 5_000

Deno.serve(async (req: Request) => {
  // 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405)
  }

  // ── 1. 解析请求体 ──────────────────────────────────────────
  let code: string
  let nickname = ''
  let avatarUrl = ''
  try {
    const body = await req.json() as {
      code?: string
      nickname?: string
      avatarUrl?: string
    }
    code = (body.code ?? '').trim()
    nickname = (body.nickname ?? '').slice(0, 32)
    avatarUrl = (body.avatarUrl ?? '').slice(0, 512)
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  if (!code) {
    return json({ error: 'code is required' }, 400)
  }

  // ── 2. 用 code 换 openid（调用微信 jscode2session） ────────
  const wxAppId = Deno.env.get('WX_APP_ID') ?? ''
  const wxAppSecret = Deno.env.get('WX_APP_SECRET') ?? ''
  if (!wxAppId || !wxAppSecret) {
    return json({ error: 'server not configured' }, 500)
  }

  let openid: string
  try {
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${code}&grant_type=authorization_code`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), WX_API_TIMEOUT_MS)
    const wxResp = await fetch(wxUrl, { signal: ctrl.signal })
    clearTimeout(timer)
    const wxData = await wxResp.json() as {
      openid?: string
      errcode?: number
      errmsg?: string
    }
    if (!wxData.openid) {
      console.error('wx jscode2session error:', wxData)
      return json({ error: 'wx_auth_failed', detail: wxData.errmsg }, 401)
    }
    openid = wxData.openid
  } catch (e) {
    console.error('wx api error', e)
    return json({ error: 'wx_api_error' }, 502)
  }

  // ── 3. 操作 Supabase（service_role 绕过 RLS） ──────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'supabase not configured' }, 500)
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })

  // 查询是否已存在（避免覆盖已有昵称）
  const { data: existing, error: selectErr } = await supabase
    .from('llk_users')
    .select('id, nickname, avatar_url, last_report_at')
    .eq('openid', openid)
    .maybeSingle()

  if (selectErr) {
    console.error('select error', selectErr)
    return json({ error: 'db_error' }, 500)
  }

  // 简单限频：同一 openid 登录间隔不低于 MIN_LOGIN_INTERVAL_MS
  if (existing) {
    const now = Date.now()
    if (now - (existing.last_report_at ?? 0) < MIN_LOGIN_INTERVAL_MS) {
      // 不报错，直接返回（避免泄露限频逻辑）
    }
  }

  // Upsert 用户：首次写入全字段；后续仅更新 last_report_at（不覆盖昵称等）
  const upsertPayload = existing
    ? { openid, last_report_at: Date.now() }
    : {
        openid,
        nickname: nickname || '小探险家',
        avatar_url: avatarUrl,
        last_report_at: Date.now()
      }

  const { data: upserted, error: upsertErr } = await supabase
    .from('llk_users')
    .upsert(upsertPayload, { onConflict: 'openid' })
    .select('id')
    .single()

  if (upsertErr || !upserted) {
    console.error('upsert error', upsertErr)
    return json({ error: 'db_upsert_error' }, 500)
  }

  // ── 4. 返回用户基础信息（不含 openid、service_key 等敏感字段）──
  const { data: userRow, error: fetchErr } = await supabase
    .from('llk_users')
    .select('id, nickname, avatar_url, coins, current_level, best_level_steps, best_level_cleared_at, purchased_capybara, purchased_sound_pack, unlocked_themes')
    .eq('openid', openid)
    .single()

  if (fetchErr || !userRow) {
    return json({ error: 'db_fetch_error' }, 500)
  }

  return json({ ok: true, user: userRow })
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  })
}
