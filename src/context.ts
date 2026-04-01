// 开放数据域：好友榜渲染与主域 postMessage 对齐（关卡数 → 步数 → 时间戳）
wx.onMessage((data: { type?: string }) => {
  if (data?.type === 'rank') {
    // 实际项目在此用关系链数据绘制排行榜画布；主域仅发 { type: 'rank' }
  }
})
