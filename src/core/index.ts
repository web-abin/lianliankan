import './env'
import {vert, frag} from './shader'
import * as PIXI from 'pixi.js'
import {runInAction} from 'mobx'

import * as store from './store'
export * as sound from './sound'

const sys = wx.getSystemInfoSync()
const {
  devicePixelRatio,
  windowWidth,
  windowHeight,
} = sys
/** 顶部安全区：刘海/状态栏等，单位 px（与 window 坐标一致） */
const safeAreaTopPx = sys.safeArea?.top ?? sys.statusBarHeight ?? 0

/** 与屏幕等比例的逻辑高度（宽仍用 750 设计基准），用于全屏页铺满不留上下黑边 */
export const DESIGN_REF_W = 750
export const designLayoutH = Math.round(DESIGN_REF_W * windowHeight / windowWidth)

const ticker = PIXI.Ticker.shared
const loader = PIXI.Loader.shared
const stage = new PIXI.Container()
const pixelRatio = devicePixelRatio

const renderer = new PIXI.Renderer({
  width: windowWidth,
  height: windowHeight,
  view: canvas,
  antialias: true,
  resolution: pixelRatio,
  backgroundColor: 0xf5ead8,
  powerPreference: 'high-performance',
})


// link: https://github.com/pixijs/pixijs/pull/10443
renderer.plugins.tilingSprite.shader = PIXI.Shader.from(vert, frag, {globals: renderer.globalUniforms})

runInAction(() => {
  const {screen: {width: w, height: h}} = renderer

  store.mem.screen.dr = Math.min(w / 750, h / 1334)
  store.mem.screen.w = w
  store.mem.screen.h = h
  store.mem.screen.rw = windowWidth
  store.mem.screen.rh = windowHeight
  store.mem.screen.rdr = Math.min(windowWidth / 750, windowHeight / 1334)

  store.mem.menuBtn = wx.getMenuButtonBoundingClientRect()
})

renderer.plugins.accessibility.destroy()
renderer.plugins.interaction.mapPositionToPoint = (point: PIXI.Point, x: number, y: number) => {
  point.set(x, y)
}

ticker.add(() => renderer.render(stage))
const screen = renderer.screen

export {
  stage,
  renderer,
  store,
  screen,
  ticker,
  loader,
  pixelRatio,
  windowWidth,
  windowHeight,
  safeAreaTopPx,
}

export async function tick() {
  return new Promise(resolve => {
    renderer.once('postrender', resolve)
  })
}
