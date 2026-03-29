import * as PIXI from 'pixi.js'
import {autorun, reaction, runInAction} from 'mobx'
import {animate, easeInOut} from 'popmotion'
import {loader, stage, store, screen, sound} from '~/core'
import {delay, download, error, ok, readFile, sync, toast} from '~/util'
import * as navigator from '~/navigator'
 

let root: PIXI.Container
let acts = [] as Array<{stop: Function}>

async function init() {
  root = new PIXI.Container()

  const bg = new PIXI.Graphics()
  const W = screen.width
  const H = screen.height
  const steps = 24
  for (let i = 0; i < steps; i++) {
    const t1 = i / steps
    const t2 = (i + 1) / steps
    const c = mixColor(0xffe6c7, 0xf7c59e, (t1 + t2) / 2)
    const y = Math.round(H * t1)
    const h = Math.round(H * (t2 - t1))
    bg.beginFill(c, 1)
    bg.drawRect(0, y, W, h)
    bg.endFill()
  }
  root.addChild(bg)

  const panel = new PIXI.Container()
  panel.position.set(W / 2, H * 2 / 5)
  root.addChild(panel)

  const cardW = Math.round(Math.min(W, H) * 0.2)
  const cardH = cardW
  const card = new PIXI.Graphics()
  card.beginFill(0xfff0d8, 1)
  card.drawRect(-cardW / 2, -cardH / 2, cardW, cardH)
  card.endFill()
  panel.addChild(card)

  const pixi = PIXI.Sprite.from('assets/common/loading.png')
  pixi.anchor.set(.5)
  const setIcon = () => {
    const w = (pixi.texture as any)?.orig?.width || pixi.texture.width || cardW
    const s = (cardW * 0.8) / w
    pixi.scale.set(s)
    pixi.position.set(0, 4)
  }
  const base = (pixi.texture as any)?.baseTexture
  if (base?.valid) setIcon()
  else base?.once?.('loaded', setIcon)
  panel.addChild(pixi)

  const title = new PIXI.Text('卡皮巴拉连连看', {
    fontFamily: 'sans-serif',
    fontSize: Math.round(cardW * 0.24),
    fontWeight: '900',
    fill: 0x111111
  })
  title.anchor.set(.5, 0)
  title.position.set(0, cardH / 2 + 20)
  panel.addChild(title)

  const subtitle = new PIXI.Text('愿你像水豚一样，永远从容又柔软✨', {
    fontFamily: 'sans-serif',
    fontSize: Math.round(cardW * 0.18),
    fontWeight: '700',
    fill: 0x666666
  })
  subtitle.anchor.set(.5, 0)
  subtitle.position.set(0, title.y + title.height + 10)
  panel.addChild(subtitle)

  const dots = new PIXI.Graphics()
  dots.beginFill(0xffd24a, 1)
  const m = 18
  const r = 6
  dots.drawCircle(m, m, r)
  dots.drawCircle(W - m, m, r)
  dots.drawCircle(m, H - m, r)
  dots.drawCircle(W - m, H - m, r)
  dots.endFill()
  root.addChild(dots)

  const safeLine = new PIXI.Graphics()
  safeLine.beginFill(0x000000, 0.12)
  safeLine.drawRect(0, H - 2, W, 2)
  safeLine.endFill()
  root.addChild(safeLine)

  stage.addChild(root)

  acts.push(animate({
    from: 1,
    to: .85,
    ease: easeInOut,
    duration: 2e3,
    repeat: Infinity,
    repeatType: 'mirror',
    onUpdate: v => pixi.alpha = v
  }))


  await new Promise<any>(resolve => {
    loader
      .add('misc.json')
      .load(resolve)
  })

  // 模拟一些延时操作
  await Promise.all([
    delay(3),
  ])

  navigator
}

export async function show() {
  await init()
}

export function hide() {
  acts.forEach(act => act.stop())
  acts = []

  // 加载页不会再用到
  root.destroy({children: true})
}

function mixColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}
