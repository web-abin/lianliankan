import * as PIXI from 'pixi.js'
import { stage, loader, screen, tick } from '~/core'
import { ASSET_URLS, ROLE_SHEET_URL } from '~/ui/home'
import { GAME_PRELOAD_URLS } from '~/ui/game-screen'
import * as navigator from '~/navigator'

let root: PIXI.Container | null = null

type SignalBinding = { detach: () => boolean }

function detachBindings(list: SignalBinding[]) {
  for (const b of list) {
    try {
      b.detach()
    } catch (_) {}
  }
  list.length = 0
}

export async function show() {
  if (root) return
  root = new PIXI.Container()
  const W = screen.width
  const H = screen.height

  // 背景
  const bg = new PIXI.Graphics()
  bg.beginFill(0xf5ead8, 1)
  bg.drawRect(0, 0, W, H)
  bg.endFill()
  root.addChild(bg)

  // 顶部图片：loading2.png，宽 200px，垂直居中偏上
  const IMG_W = 200
  const imgSpr = PIXI.Sprite.from('assets/common/loading2.png')
  imgSpr.anchor.set(0.5, 0.5)
  imgSpr.width = IMG_W
  imgSpr.height = IMG_W // 先占位，加载后修正为真实比例
  imgSpr.position.set(W / 2, H * 0.38)
  root.addChild(imgSpr)

  const setSize = () => {
    const t = imgSpr.texture
    if (t.width > 0) {
      imgSpr.width = IMG_W
      imgSpr.height = Math.round((IMG_W * t.height) / t.width)
    }
  }
  if (imgSpr.texture.valid) {
    setSize()
  } else {
    imgSpr.texture.baseTexture.once('loaded', setSize)
  }

  const BOTTOM_Y = H * 0.84

  const label = new PIXI.Text('loading...', {
    fontFamily: 'sans-serif',
    fontSize: 26,
    fontWeight: '400',
    fill: 0x8b5e38
  })
  label.anchor.set(0.5, 1)
  label.position.set(W / 2, BOTTOM_Y - 18)
  root.addChild(label)

  const barW = Math.round(W * 0.68)
  const barH = 22
  const barR = barH / 2

  const barRoot = new PIXI.Container()
  barRoot.position.set(W / 2, BOTTOM_Y)
  root.addChild(barRoot)

  // 轨道底部轻阴影
  const trackShadow = new PIXI.Graphics()
  trackShadow.beginFill(0x3d2918, 0.12)
  trackShadow.drawRoundedRect(-barW / 2 + 1, 3, barW - 2, barH, barR)
  trackShadow.endFill()
  barRoot.addChild(trackShadow)

  const track = new PIXI.Graphics()
  track.beginFill(0xeae2d6, 1)
  track.drawRoundedRect(-barW / 2, 0, barW, barH, barR)
  track.endFill()
  track.lineStyle(1.5, 0xffffff, 0.55)
  track.drawRoundedRect(-barW / 2, 0, barW, barH, barR)
  track.lineStyle(1, 0xc4b5a2, 0.9)
  track.drawRoundedRect(-barW / 2 + 0.5, 0.5, barW - 1, barH - 1, barR - 0.5)
  barRoot.addChild(track)

  const fill = new PIXI.Graphics()
  barRoot.addChild(fill)

  const orange = PIXI.Sprite.from('assets/common/orange.png')
  orange.anchor.set(0.5, 0.5)
  const ORANGE_TARGET = Math.round(barH * 1.55)
  const applyOrangeScale = () => {
    const t = orange.texture
    const tw = t.orig?.width || t.width
    if (tw > 0) orange.scale.set(ORANGE_TARGET / tw)
  }
  if (orange.texture.valid) applyOrangeScale()
  else orange.texture.baseTexture.once('loaded', applyOrangeScale)
  barRoot.addChild(orange)

  const bindings: SignalBinding[] = []

  const drawFill = (p: number) => {
    const t = Math.max(0, Math.min(1, p))
    const headX = -barW / 2 + barW * t
    orange.position.set(headX, barH / 2)

    fill.clear()
    if (t <= 0) return

    const pw = Math.max(Math.round(barW * t), barR)

    fill.beginFill(0xd45f22, 1)
    fill.drawRoundedRect(-barW / 2, 0, pw, barH, barR)
    fill.endFill()

    fill.beginFill(0xff9a4a, 0.85)
    fill.drawRoundedRect(-barW / 2, 0, pw, barH * 0.52, barR)
    fill.endFill()

    const glossH = Math.min(9, barH * 0.38)
    fill.beginFill(0xffffff, 0.22)
    fill.drawRoundedRect(-barW / 2 + 3, 2, Math.max(0, pw - 6), glossH, Math.max(2, barR - 4))
    fill.endFill()
  }

  drawFill(0)

  stage.addChild(root)
  try {
    wx.hideLoading?.()
  } catch (_) {}

  const allUrls = [
    ...(ASSET_URLS as unknown as string[]),
    ROLE_SHEET_URL,
    ...(GAME_PRELOAD_URLS as unknown as string[])
  ]
  const toLoad = allUrls.filter(url => !loader.resources[url])

  const perFile = new Map<string, number>()
  for (const u of toLoad) perFile.set(u, 0)

  const applyAggregated = () => {
    if (toLoad.length === 0) {
      drawFill(1)
      return
    }
    let sum = 0
    for (const u of toLoad) sum += perFile.get(u) ?? 0
    const fine = sum / toLoad.length
    drawFill(fine)
  }

  if (toLoad.length > 0) {
    // 仅用各资源的字节/完成进度；不要用 Loader.progress 参与显示（共享 Loader 可能仍保留上次 load 结束时的 100，会与 Math.max 叠出「一上来就不是 0」）
    bindings.push(
      loader.onStart.add(() => {
        for (const u of toLoad) perFile.set(u, 0)
        drawFill(0)
      })
    )

    for (const u of toLoad) {
      loader.add(u)
      const res = loader.resources[u]
      bindings.push(
        res.onProgress.add((_: unknown, pct: number) => {
          const prev = perFile.get(u) ?? 0
          perFile.set(u, Math.max(prev, pct))
          applyAggregated()
        })
      )
      bindings.push(
        res.onComplete.add(() => {
          perFile.set(u, 1)
          applyAggregated()
        })
      )
    }

    await new Promise<void>(resolve => {
      loader.load(() => {
        for (const u of toLoad) perFile.set(u, 1)
        drawFill(1)
        detachBindings(bindings)
        resolve()
      })
    })
  } else {
    // 资源已在缓存：先至少渲染一帧 0，再拉满，避免「从没见过空条」
    await tick()
    drawFill(1)
  }

  const roleBase = PIXI.BaseTexture.from(ROLE_SHEET_URL)
  if (!roleBase.valid) {
    await new Promise<void>(resolve => {
      const done = () => resolve()
      roleBase.once('loaded', done)
      roleBase.once('error', done)
    })
  }

  navigator.go('home')
}

export function hide() {
  try {
    wx.hideLoading?.()
  } catch (_) {}
  if (!root) return
  root.destroy({ children: true })
  root = null
}
