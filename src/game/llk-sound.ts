/**
 * 局内音效与 BGM（均读取 llk 本地设置开关）
 */
import { llk } from '~/game/llk-save'

// 音效路径（待美术提供后替换为正式资源）
const SELECT_SRC = 'assets/sounds/select.mp3'
const XIAOCHU_SRC = 'assets/sounds/xiaochu.mp3'
const JELLY_BREAK_SRC = 'assets/sounds/jelly-break.mp3'
const BAOXIANG_SRC = 'assets/sounds/baoxiang.mp3'
const GRAVITY_LAND_SRC = 'assets/sounds/gravity-land.mp3'
// 局内 BGM 使用本地文件（待实际音频资源放入 assets/sounds/）
const BGM_SRC = 'assets/sounds/bgm-game.mp3'

/** 局内循环 BGM 单例，离开局内调用 stopGameBgm() 释放 */
let gameBgmCtx: wx.IInnerAudioContext | null = null

function destroyCtx(c: wx.IInnerAudioContext) {
  try { c.destroy() } catch (_) {}
}

function playSfx(src: string) {
  if (!llk.soundOn) return
  const c = wx.createInnerAudioContext({ useWebAudioImplement: true })
  c.src = src
  c.onEnded(() => destroyCtx(c))
  c.onError(() => destroyCtx(c))
  c.play()
}

/** 选中图块音效 */
export function playSelectSound(): void {
  playSfx(SELECT_SRC)
}

/** 配对成功时播放 */
export function playSelectThenClear(): void {
  playSfx(SELECT_SRC)
}

/** 图块消除爆裂音效 */
export function playEliminationBurstSound(): void {
  playSfx(XIAOCHU_SRC)
}

/** 果冻破层音效 */
export function playJellyBreakSound(): void {
  playSfx(JELLY_BREAK_SRC)
}

/** 宝箱收集音效 */
export function playChestCollectSound(): void {
  playSfx(BAOXIANG_SRC)
}

/** 重力补位落地音效 */
export function playGravityLandSound(): void {
  playSfx(GRAVITY_LAND_SRC)
}

/** 局内 BGM：循环播放，尊重「音乐」开关；用非 WebAudio 实现兼容性更好 */
export function startGameBgm(): void {
  stopGameBgm()
  if (!llk.musicOn) return
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
  try { c.stop() } catch (_) {}
  destroyCtx(c)
}
