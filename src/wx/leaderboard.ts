/**
 * 排行榜：开放数据域 / 云开发上报与拉取（MVP 先本地 + 开放数据域占位）
 */
const RANK_KEY = 'durian_rank_list'

export interface RankItem {
  openid?: string
  nickname: string
  avatarUrl?: string
  score: number
  maxLevel?: number
}

/** 上报本局分数（本地缓存，开放数据域需在 context 内实现） */
export function reportScore(score: number, maxLevel: number): void {
  try {
    const w = wx as unknown as { getStorageSync?: (key: string) => unknown; setStorageSync?: (key: string, data: unknown) => void }
    const raw = w.getStorageSync?.(RANK_KEY)
    const list: RankItem[] = Array.isArray(raw) ? raw : []
    list.push({ nickname: '我', score, maxLevel })
    list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    w.setStorageSync?.(RANK_KEY, list.slice(0, 100))
  } catch (_) {}
  try {
    const ctx = wx.getOpenDataContext?.()
    ctx?.postMessage?.({ type: 'submitScore', score, maxLevel })
  } catch (_) {}
}

/** 请求开放数据域拉取排行榜（由 openDataContext 监听后渲染） */
export function requestRank(): void {
  try {
    const ctx = wx.getOpenDataContext?.()
    ctx?.postMessage?.({ type: 'rank' })
  } catch (_) {}
}
