import * as store from '~/core/store'

const SELECT_SRC = 'assets/sounds/select.mp3'
const XIAOCHU_SRC = 'assets/sounds/xiaochu.mp3'
const BAOXIANG_SRC = 'assets/sounds/baoxiang.mp3'
const BGM_SRC = 'http://tcp690219.hn-bkt.clouddn.com/bgm.mp3'

/** 局内循环 BGM 单例，离开局内需 stopGameBgm 释放 */
let gameBgmCtx: wx.IInnerAudioContext | null = null

function destroyCtx(c: wx.IInnerAudioContext) {
  try {
    c.destroy()
  } catch (_) {}
}

/** 选中砖块（代码包内音频） */
export function playSelectSound(): void {
  if (!store.mem.user.settings.voice) return
  const c = wx.createInnerAudioContext({ useWebAudioImplement: true })
  c.src = SELECT_SRC
  c.onEnded(() => destroyCtx(c))
  c.onError(() => destroyCtx(c))
  c.play()
}

/**
 * 配对成功瞬间：播一次选中音；消除爆裂音在爆裂时机由 `playEliminationBurstSound` 触发。
 */
export function playSelectThenClear(): void {
  if (!store.mem.user.settings.voice) return
  const s = wx.createInnerAudioContext({ useWebAudioImplement: true })
  s.src = SELECT_SRC
  s.onEnded(() => destroyCtx(s))
  s.onError(() => destroyCtx(s))
  s.play()
}

/** 消除爆裂（与棋盘爆裂特效同步） */
export function playEliminationBurstSound(): void {
  if (!store.mem.user.settings.voice) return
  const c = wx.createInnerAudioContext({ useWebAudioImplement: true })
  c.src = XIAOCHU_SRC
  c.onEnded(() => destroyCtx(c))
  c.onError(() => destroyCtx(c))
  c.play()
}

/** 收集星飞入宝箱命中时 */
export function playChestCollectSound(): void {
  if (!store.mem.user.settings.voice) return
  const c = wx.createInnerAudioContext({ useWebAudioImplement: true })
  c.src = BAOXIANG_SRC
  c.onEnded(() => destroyCtx(c))
  c.onError(() => destroyCtx(c))
  c.play()
}

/** 局内背景音乐：循环播放，尊重「音乐」开关；BGM 用非 WebAudio 实现兼容性更好 */
export function startGameBgm(): void {
  stopGameBgm()
  if (!store.mem.user.settings.music) return
  const c = wx.createInnerAudioContext({ useWebAudioImplement: false })
  c.src = BGM_SRC
  c.loop = true
  c.volume = 0.45
  c.onError(() => {
    if (gameBgmCtx === c) gameBgmCtx = null
    destroyCtx(c)
  })
  gameBgmCtx = c
  c.play()
}

export function stopGameBgm(): void {
  if (!gameBgmCtx) return
  const c = gameBgmCtx
  gameBgmCtx = null
  try {
    c.stop()
  } catch (_) {}
  destroyCtx(c)
}
