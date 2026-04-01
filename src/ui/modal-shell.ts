/**
 * 全局弹窗壳：异形底板 + bounce 入场（OpenSpec llk-wechat-shell）
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight } from '~/core'
import { FONT_FAMILY } from '~/constants/design-tokens'

export interface ModalShellOptions {
  title?: string
  body: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export function openModalShell(
  parent: PIXI.Container,
  opts: ModalShellOptions
): PIXI.Container {
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const sw = windowWidth
  const sh = windowHeight
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrap = new PIXI.Container()
  ;(wrap as PIXI.DisplayObject & { interactive?: boolean }).interactive = true

  const dim = new PIXI.Graphics()
  dim.beginFill(0x000000, 0.5)
  dim.drawRect(0, 0, sw, sh)
  dim.endFill()
  dim.on('pointerdown', () => {})
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.scale.set(0.88)
  root.position.set(sw / 2, sh / 2)
  wrap.addChild(root)

  const panel = new PIXI.Graphics()
  panel.beginFill(0xfff5e8, 0.98)
  panel.lineStyle(3, 0xc48a4a, 1)
  panel.moveTo(-20, 40)
  panel.lineTo(520, 20)
  panel.lineTo(540, 280)
  panel.lineTo(0, 300)
  panel.closePath()
  panel.endFill()
  root.addChild(panel)

  const title = new PIXI.Text(opts.title ?? '', {
    fontFamily: FONT_FAMILY,
    fontSize: 30,
    fill: 0x5c2d0a,
    fontWeight: '800'
  })
  title.position.set(24, 36)
  root.addChild(title)

  const body = new PIXI.Text(opts.body, {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fill: 0x4a3020,
    fontWeight: '600',
    wordWrap: true,
    wordWrapWidth: 480,
    lineHeight: 34
  })
  body.position.set(24, 90)
  root.addChild(body)

  const btnY = 220
  const cx = opts.cancelText ? 150 : 260
  if (opts.cancelText) {
    const b1 = pillBtn(opts.cancelText, 0x8a8a8a)
    b1.position.set(80, btnY)
    b1.on('pointerdown', () => {
      opts.onCancel?.()
      close()
    })
    root.addChild(b1)
  }
  const b2 = pillBtn(opts.confirmText ?? '确定', 0xd4783a)
  b2.position.set(cx + 120, btnY)
  b2.on('pointerdown', () => {
    opts.onConfirm?.()
    close()
  })
  root.addChild(b2)

  parent.addChild(wrap)

  let phase = 0
  const bounce = () => {
    phase += 0.18
    const s = 0.88 + 0.06 * Math.sin(phase)
    root.scale.set(Math.min(1, s))
    if (phase < Math.PI) requestAnimationFrame(bounce)
    else root.scale.set(1)
  }
  requestAnimationFrame(bounce)

  function close() {
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}

function pillBtn(label: string, color: number): PIXI.Container {
  const c = new PIXI.Container()
  ;(c as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  const g = new PIXI.Graphics()
  g.beginFill(color, 0.95)
  g.drawRoundedRect(0, 0, 200, 56, 28)
  g.endFill()
  c.addChild(g)
  const t = new PIXI.Text(label, {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fill: 0xffffff,
    fontWeight: '700'
  })
  t.anchor.set(0.5, 0.5)
  t.position.set(100, 28)
  c.addChild(t)
  return c
}
