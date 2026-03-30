import * as PIXI from 'pixi.js'
import { stage, loader, screen } from '~/core'
import { ASSET_URLS, ROLE_SHEET_URL } from '~/ui/home'
import * as navigator from '~/navigator'

let root: PIXI.Container | null = null

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
  imgSpr.height = IMG_W  // 先占位，加载后修正为真实比例
  imgSpr.position.set(W / 2, H * 0.38)
  root.addChild(imgSpr)

  // 纹理加载完成后修正高度
  const setSize = () => {
    const t = imgSpr.texture
    if (t.width > 0) {
      imgSpr.width = IMG_W
      imgSpr.height = Math.round(IMG_W * t.height / t.width)
    }
  }
  if (imgSpr.texture.valid) {
    setSize()
  } else {
    imgSpr.texture.baseTexture.once('loaded', setSize)
  }

  // 底部区域 Y 基准
  const BOTTOM_Y = H * 0.84

  // "loading..." 文字
  const label = new PIXI.Text('loading...', {
    fontFamily: 'sans-serif',
    fontSize: 26,
    fontWeight: '400',
    fill: 0x8b5e38
  })
  label.anchor.set(0.5, 1)
  label.position.set(W / 2, BOTTOM_Y - 14)
  root.addChild(label)

  // 进度条轨道
  const barW = Math.round(W * 0.65)
  const barH = 14
  const barR = barH / 2
  const track = new PIXI.Graphics()
  track.beginFill(0xc9a87a, 0.35)
  track.drawRoundedRect(-barW / 2, 0, barW, barH, barR)
  track.endFill()
  track.position.set(W / 2, BOTTOM_Y)
  root.addChild(track)

  // 进度条填充
  const fill = new PIXI.Graphics()
  fill.position.copyFrom(track.position)
  root.addChild(fill)

  const drawFill = (p: number) => {
    fill.clear()
    if (p <= 0) return
    fill.beginFill(0xc87941, 1)
    fill.drawRoundedRect(-barW / 2, 0, Math.round(barW * p), barH, barR)
    fill.endFill()
  }
  drawFill(0)

  stage.addChild(root)

  const allUrls = [...(ASSET_URLS as unknown as string[]), ROLE_SHEET_URL]
  const toLoad = allUrls.filter(url => !loader.resources[url])

  const onProgress = (l: any) => {
    drawFill(Math.max(0, Math.min(1, l.progress / 100)))
  }

  if (toLoad.length > 0) {
    const binding = (loader.onProgress as any).add(onProgress as any)
    toLoad.forEach(u => loader.add(u))
    await new Promise<void>(resolve => loader.load(() => resolve()))
    ;(loader.onProgress as any)?.detach?.(binding)
  } else {
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
  if (!root) return
  root.destroy({ children: true })
  root = null
}
