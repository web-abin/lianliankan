import * as store from '~/core/store'

const SELECT_SRC = 'assets/sounds/select.mp3'
const CLEAR_SRC = 'assets/sounds/clear.mp3'

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
 * 成功消除：先播完选中音，再播消除音（不叠在选中未结束时）。
 */
export function playSelectThenClear(): void {
  if (!store.mem.user.settings.voice) return
  const s = wx.createInnerAudioContext({ useWebAudioImplement: true })
  s.src = SELECT_SRC
  s.onEnded(() => {
    destroyCtx(s)
    const cl = wx.createInnerAudioContext({ useWebAudioImplement: true })
    cl.src = CLEAR_SRC
    cl.onEnded(() => destroyCtx(cl))
    cl.onError(() => destroyCtx(cl))
    cl.play()
  })
  s.onError(() => {
    destroyCtx(s)
    const cl = wx.createInnerAudioContext({ useWebAudioImplement: true })
    cl.src = CLEAR_SRC
    cl.onEnded(() => destroyCtx(cl))
    cl.onError(() => destroyCtx(cl))
    cl.play()
  })
  s.play()
}
