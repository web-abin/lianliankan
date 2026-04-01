/**
 * Supabase 世界榜与登录占位：密钥仅服务端/.env，客户端不硬编码
 * 接入时：wx.login → Edge Function 换 token → REST 上报/拉榜
 */

export interface WorldRankRow {
  rank: number
  name: string
  level: number
  steps: number
  clearedAt: number
}

/** 占位：无服务端时返回空列表 */
export async function fetchWorldRank(_topN = 50): Promise<WorldRankRow[]> {
  return []
}

/** 占位：通关后上报（实现时带限频与签名校验） */
export async function reportProgressToCloud(_payload: {
  level: number
  steps: number
  clearedAt: number
}): Promise<void> {
  return
}
