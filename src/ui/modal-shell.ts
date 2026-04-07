/**
 * 全局弹窗壳：卡皮巴拉 IP 风格 — 云朵白圆角卡片 + bounce 入场
 * 样式遵循设计图 春日草地彩铅水彩风 全局设计语言：
 *   - 背景遮罩：深森绿 #2A5A14 @ 45%
 *   - 面板：云朵白 #FFFEF2，radius 28px，深森绿 4px 描边
 *   - 标题：深森绿粗体 34px
 *   - 正文：深森绿 26px
 *   - 主按钮：珊瑚橙果冻感（顶部高光 + 底部深绿投影）
 *   - 次按钮：灰色圆角
 *   - 右上角关闭按钮：深森绿圆形 ×
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'

// 设计色板（春日草地彩铅水彩风）
const C_OUTLINE  = 0x2a5a14  // 深森林绿描边
const C_PANEL    = 0xfffef2  // 云朵白面板
const C_OVERLAY  = 0x2a5a14  // 遮罩底色
const C_ORANGE   = 0xff7a45  // 主按钮珊瑚橙
const C_ORANGE_H = 0xffaa7a  // 高光浅橙
const C_ORANGE_S = 0x2a5a14  // 阴影深森绿
const C_GRAY_BTN = 0xb0b0b0  // 次按钮灰
const C_TEXT     = 0x2a5a14  // 主文字深森绿
const C_CLOSE_BG = 0x2a5a14  // 关闭按钮底色

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

  // 半透明深棕遮罩
  const dim = new PIXI.Graphics()
  dim.beginFill(C_OVERLAY, 0.5)
  dim.drawRect(0, 0, sw, sh)
  dim.endFill()
  ;(dim as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  dim.on('pointerdown', () => {})
  wrap.addChild(dim)

  // 弹窗主面板容器（居中定位，以设计坐标绘制后再 scale）
  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  // 面板尺寸（设计坐标）
  const panelW = 580
  const panelH = hasTwoBtns(opts) ? 380 : 340
  const panelR = 32
  const px = -panelW / 2
  const py = -panelH / 2

  // 底部投影（深棕，向右下偏移 4px）
  const shadow = new PIXI.Graphics()
  shadow.beginFill(C_OUTLINE, 0.3)
  shadow.drawRoundedRect(px + 4, py + 6, panelW, panelH, panelR)
  shadow.endFill()
  root.addChild(shadow)

  // 面板主体
  const panel = new PIXI.Graphics()
  panel.lineStyle(4, C_OUTLINE, 1)
  panel.beginFill(C_PANEL, 0.98)
  panel.drawRoundedRect(px, py, panelW, panelH, panelR)
  panel.endFill()
  // 顶部弧形高光条（模拟顶光质感）
  panel.lineStyle(0)
  panel.beginFill(0xffffff, 0.18)
  panel.drawRoundedRect(px + 12, py + 6, panelW - 24, panelH * 0.28, panelR - 4)
  panel.endFill()
  ;(panel as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  root.addChild(panel)

  // 标题
  if (opts.title) {
    const titleT = new PIXI.Text(opts.title, {
      fontFamily: 'sans-serif',
      fontSize: 34,
      fill: C_TEXT,
      fontWeight: '900'
    })
    titleT.anchor.set(0.5, 0)
    titleT.position.set(0, py + 32)
    root.addChild(titleT)

    // 标题下分割线
    const divider = new PIXI.Graphics()
    divider.lineStyle(1.5, C_OUTLINE, 0.2)
    divider.moveTo(px + 40, py + 76)
    divider.lineTo(px + panelW - 40, py + 76)
    root.addChild(divider)
  }

  // 正文（支持换行）
  const bodyTop = opts.title ? py + 88 : py + 32
  const bodyT = new PIXI.Text(opts.body, {
    fontFamily: 'sans-serif',
    fontSize: 26,
    fill: C_TEXT,
    fontWeight: '600',
    wordWrap: true,
    wordWrapWidth: panelW - 64,
    lineHeight: 38,
    align: 'center'
  })
  bodyT.anchor.set(0.5, 0)
  bodyT.position.set(0, bodyTop)
  root.addChild(bodyT)

  // 按钮区
  const btnY = py + panelH - 76
  if (opts.cancelText) {
    const b1 = jellyBtn(opts.cancelText, C_GRAY_BTN, 0x8a7a6a, 0x6a5a4a, 220, 56)
    b1.position.set(-120, btnY)
    b1.on('pointerdown', () => { opts.onCancel?.(); close() })
    root.addChild(b1)
    const b2 = jellyBtn(opts.confirmText ?? '确定', C_ORANGE, C_ORANGE_H, C_ORANGE_S, 220, 56)
    b2.position.set(120, btnY)
    b2.on('pointerdown', () => { opts.onConfirm?.(); close() })
    root.addChild(b2)
  } else {
    const b2 = jellyBtn(opts.confirmText ?? '确定', C_ORANGE, C_ORANGE_H, C_ORANGE_S, 300, 56)
    b2.position.set(0, btnY)
    b2.on('pointerdown', () => { opts.onConfirm?.(); close() })
    root.addChild(b2)
  }

  // 右上角关闭按钮（圆形深棕 × ）
  const closeR = 22
  const closeG = new PIXI.Graphics()
  closeG.beginFill(C_CLOSE_BG, 1)
  closeG.drawCircle(0, 0, closeR)
  closeG.endFill()
  // 高光弧
  closeG.beginFill(0xffffff, 0.2)
  closeG.drawEllipse(0, -closeR * 0.3, closeR * 0.55, closeR * 0.35)
  closeG.endFill()
  ;(closeG as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  ;(closeG as any).buttonMode = true
  closeG.on('pointerdown', close)
  closeG.position.set(px + panelW - closeR + 4, py + closeR - 4)
  root.addChild(closeG)

  const closeX = new PIXI.Text('✕', {
    fontFamily: 'sans-serif',
    fontSize: 22,
    fill: 0xffffff,
    fontWeight: '700'
  })
  closeX.anchor.set(0.5, 0.5)
  closeG.addChild(closeX)

  // scale 统一应用 dr，并在内容之上设置
  root.scale.set(dr)

  parent.addChild(wrap)

  // bounce 入场动画（scale 0.6 → 弹性 1.05 → 1.0，约 300ms）
  root.scale.set(dr * 0.6)
  const bounceStart = performance.now()
  const bounceDur = 300
  const bounceStep = () => {
    const u = Math.min(1, (performance.now() - bounceStart) / bounceDur)
    const eased = bounceEase(u)
    root.scale.set(dr * eased)
    if (u < 1) requestAnimationFrame(bounceStep)
    else root.scale.set(dr)
  }
  requestAnimationFrame(bounceStep)

  function close() {
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}

// ═══════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════

function hasTwoBtns(opts: ModalShellOptions): boolean {
  return !!(opts.cancelText)
}

/**
 * 果冻感按钮：主体色 + 顶部高光弧 + 底部投影
 * anchor 在中心
 */
function jellyBtn(
  label: string,
  mainColor: number,
  highlightColor: number,
  shadowColor: number,
  w: number,
  h: number
): PIXI.Container {
  const c = new PIXI.Container()
  ;(c as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  ;(c as any).buttonMode = true

  const g = new PIXI.Graphics()
  const r = h / 2  // radius = pill

  // 底部投影
  g.beginFill(shadowColor, 0.7)
  g.drawRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, r)
  g.endFill()

  // 主体
  g.beginFill(mainColor, 1)
  g.drawRoundedRect(-w / 2, -h / 2, w, h, r)
  g.endFill()

  // 顶部弧形高光
  g.beginFill(0xffffff, 0.28)
  g.drawRoundedRect(-w / 2 + 8, -h / 2 + 3, w - 16, h * 0.42, r - 2)
  g.endFill()

  c.addChild(g)

  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif',
    fontSize: 28,
    fill: 0xffffff,
    fontWeight: '800'
  })
  t.anchor.set(0.5, 0.5)
  c.addChild(t)

  // 点击下压反馈
  c.on('pointerdown', () => { c.scale.set(0.95); c.y += 2 })
  c.on('pointerup', () => { c.scale.set(1); c.y -= 2 })
  c.on('pointerupoutside', () => { c.scale.set(1); c.y -= 2 })

  return c
}

/** bounce 缓动：0→1 期间先冲到 1.08 再回落 1.0 */
function bounceEase(u: number): number {
  if (u < 0.7) {
    return (u / 0.7) * 1.08
  }
  const t = (u - 0.7) / 0.3
  return 1.08 - (1.08 - 1.0) * t
}
