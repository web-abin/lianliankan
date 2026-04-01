/**
 * 通关上报 Edge Function（部署于 Supabase）
 *
 * 客户端通关后调用，更新世界榜聚合字段（仅当新关卡 > 旧最高关卡时才刷新步数/时间戳）。
 *
 * 请求体：
 *   { userId, level, steps, clearedAt }
 *
 * 防刷策略（MVP 基础版）：
 *   1. 每个 userId 限频：两次上报间隔 ≥ 30s（以 last_report_at 判断）
 *   2. 步数合理性校验：最少步数 = 当前关卡配置对数 * 2，超出阈值倍数则标记
 *   3. suspicious_count 累计 ≥ 3 时不更新排行榜字段（记录日志供审核）
 *
 * 环境变量：
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（同 wx-login）
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 防刷：两次上报最短间隔（ms）
const MIN_REPORT_INTERVAL_MS = 30_000
// 防刷：步数上限倍数（actual_steps > MIN_STEPS * MAX_STEP_FACTOR 则标记）
const MAX_STEP_FACTOR = 20
// 防刷：每关最少合法步数（对数 * 2）= level * 2 作为粗略下界
const minStepsForLevel = (level: number) => Math.max(2, level * 2)
// 可疑次数阈值，达到后不更新排行榜
const SUSPICIOUS_THRESHOLD = 3

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return json(null, 204)
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405)
  }

  // ── 1. 解析请求体 ──────────────────────────────────────────
  let userId: string
  let level: number
  let steps: number
  let clearedAt: number
  try {
    const body = await req.json() as {
      userId?: string
      level?: number
      steps?: number
      clearedAt?: number
    }
    userId = (body.userId ?? '').trim()
    level = Number(body.level ?? 0)
    steps = Number(body.steps ?? 0)
    clearedAt = Number(body.clearedAt ?? 0)
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  if (!userId || level < 1 || steps < 1 || clearedAt < 1) {
    return json({ error: 'invalid params' }, 400)
  }

  // ── 2. 操作 Supabase ───────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })

  // 拉取当前记录
  const { data: row, error: fetchErr } = await supabase
    .from('llk_users')
    .select('id, current_level, best_level_steps, best_level_cleared_at, last_report_at, suspicious_count')
    .eq('id', userId)
    .maybeSingle()

  if (fetchErr) {
    console.error('fetch error', fetchErr)
    return json({ error: 'db_error' }, 500)
  }
  if (!row) {
    return json({ error: 'user not found' }, 404)
  }

  const now = Date.now()

  // ── 3. 限频检查 ────────────────────────────────────────────
  if (now - (row.last_report_at ?? 0) < MIN_REPORT_INTERVAL_MS) {
    // 过于频繁，忽略但不报错（防止客户端利用错误信息推断逻辑）
    return json({ ok: true, skipped: 'rate_limited' })
  }

  // ── 4. 步数合理性校验 ──────────────────────────────────────
  const minSteps = minStepsForLevel(level)
  const isSuspicious =
    steps < minSteps ||
    steps > minSteps * MAX_STEP_FACTOR

  let suspiciousCount = row.suspicious_count ?? 0
  if (isSuspicious) {
    suspiciousCount += 1
    console.warn(`suspicious report: userId=${userId} level=${level} steps=${steps}`)
  } else {
    // 合法上报可以小幅减少可疑计数（恢复信誉），但不低于 0
    suspiciousCount = Math.max(0, suspiciousCount - 1)
  }

  // 可疑次数超阈值：只更新 last_report_at 和 suspicious_count，不更新排行榜字段
  if (suspiciousCount >= SUSPICIOUS_THRESHOLD) {
    await supabase
      .from('llk_users')
      .update({ last_report_at: now, suspicious_count: suspiciousCount })
      .eq('id', userId)
    return json({ ok: true, skipped: 'suspicious' })
  }

  // ── 5. 更新世界榜聚合字段 ──────────────────────────────────
  // 规则：只有通过了更高关卡，或同关同步数更早，才更新
  const oldLevel = row.current_level ?? 1
  // level 是刚通过的关卡；newCurrentLevel = level + 1
  const newCurrentLevel = level + 1

  let shouldUpdateRank = false
  let newSteps = row.best_level_steps ?? 0
  let newClearedAt = row.best_level_cleared_at ?? 0

  if (newCurrentLevel > oldLevel) {
    // 通关了更高关卡，直接刷新所有排行榜字段
    shouldUpdateRank = true
    newSteps = steps
    newClearedAt = clearedAt
  } else if (newCurrentLevel === oldLevel) {
    // 同关卡：步数更少才更新
    const oldSteps = row.best_level_steps ?? Number.MAX_SAFE_INTEGER
    if (steps < oldSteps) {
      shouldUpdateRank = true
      newSteps = steps
      newClearedAt = clearedAt
    } else if (steps === oldSteps && clearedAt < (row.best_level_cleared_at ?? Number.MAX_SAFE_INTEGER)) {
      // 步数相同时取更早的时间戳
      shouldUpdateRank = true
      newClearedAt = clearedAt
    }
  }

  const updatePayload: Record<string, unknown> = {
    last_report_at: now,
    suspicious_count: suspiciousCount
  }
  if (shouldUpdateRank) {
    updatePayload.current_level = newCurrentLevel
    updatePayload.best_level_steps = newSteps
    updatePayload.best_level_cleared_at = newClearedAt
  }

  const { error: updateErr } = await supabase
    .from('llk_users')
    .update(updatePayload)
    .eq('id', userId)

  if (updateErr) {
    console.error('update error', updateErr)
    return json({ error: 'db_update_error' }, 500)
  }

  return json({ ok: true, updated: shouldUpdateRank })
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  })
}
