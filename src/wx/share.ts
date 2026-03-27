/**
 * 分享：结算页炫耀、挑战文案
 */
export function shareWithScore(score: number): void {
  const title = `我合成大榴莲得了${score}分，敢来挑战吗？`
  try {
    wx.onShareAppMessage?.(() => ({ title, query: `score=${score}` }))
    wx.shareAppMessage?.({ title, query: `score=${score}` })
  } catch (_) {}
}

export function setShareMenu(): void {
  try {
    wx.showShareMenu?.({ menus: ['shareAppMessage', 'shareTimeline'] })
  } catch (_) {}
}
