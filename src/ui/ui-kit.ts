/**
 * 春日草地设计语言 — 公共 UI 工具库
 * 颜色体系、绘制函数、动画工具，所有弹窗/界面统一使用
 */
import * as PIXI from 'pixi.js'

// ═══════════════════════════════════════════════════════
// 颜色常量（春日草地彩铅水彩风）
// ═══════════════════════════════════════════════════════
export const C_BG       = 0xaadc3c  // 嫩草绿（主背景）
export const C_BG_LIGHT = 0xc8e850  // 浅草黄绿
export const C_SKY      = 0x5bc8e8  // 天空蓝
export const C_ORANGE   = 0xff7a45  // 暖珊瑚橙（主按钮）
export const C_YELLOW   = 0xf5d840  // 蒲公英黄
export const C_OUTLINE  = 0x2a5a14  // 深森林绿（描边 / 文字）
export const C_RED      = 0xe8553a  // 暖红（血量 / 危险）
export const C_PANEL    = 0xfffef2  // 云朵白（弹窗底板）
export const C_BROWN    = 0x8b6040  // 卡皮巴拉暖棕
export const C_TEXT     = 0x2a5a14  // 深森绿正文
export const C_GRAY     = 0xb0b0b0  // 灰色（禁用）
export const C_GREEN_WX = 0x07c160  // 微信绿
export const C_OVERLAY  = 0x000000  // 遮罩蒙层底色

// ═══════════════════════════════════════════════════════
// 动画工具
// ═══════════════════════════════════════════════════════

/** bounce 缓动：先冲到 1.08 再回落 1.0 */
export function bounceEase(u: number): number {
  if (u < 0.7) return (u / 0.7) * 1.08
  return 1.08 - 0.08 * ((u - 0.7) / 0.3)
}

/** 执行 bounce 入场动画（~300ms），内部 scale 从 0.6 弹入 */
export function bounceIn(target: PIXI.Container, finalScale: number) {
  target.scale.set(finalScale * 0.6)
  const start = performance.now()
  const step = () => {
    const u = Math.min(1, (performance.now() - start) / 300)
    target.scale.set(finalScale * bounceEase(u))
    if (u < 1) requestAnimationFrame(step)
    else target.scale.set(finalScale)
  }
  requestAnimationFrame(step)
}

/**
 * 执行 bounce 退场动画（~220ms）：轻微上弹 → 快速缩小回收 + 遮罩淡出
 * 完成后调用 onDone（通常用于销毁 wrap）
 */
export function bounceOut(
  target: PIXI.Container,
  finalScale: number,
  overlay: PIXI.DisplayObject | null,
  onDone: () => void
) {
  const start = performance.now()
  const dur = 220
  const baseY = target.y
  const startOverlayAlpha = overlay?.alpha ?? 0
  const step = () => {
    const u = Math.min(1, (performance.now() - start) / dur)
    let scale: number, offsetY: number
    if (u < 0.25) {
      const t = u / 0.25
      scale = 1 + 0.08 * t
      offsetY = -10 * t
    } else {
      const t = (u - 0.25) / 0.75
      scale = 1.08 * (1 - t)
      offsetY = -10 + 28 * t
    }
    target.scale.set(finalScale * scale)
    target.y = baseY + offsetY
    if (overlay) overlay.alpha = startOverlayAlpha * (1 - u)
    if (u < 1) requestAnimationFrame(step)
    else onDone()
  }
  requestAnimationFrame(step)
}

// ═══════════════════════════════════════════════════════
// 全屏遮罩蒙层
// ═══════════════════════════════════════════════════════

/** 深森绿半透明全屏遮罩，吞掉穿透点击 */
export function makeOverlay(sw: number, sh: number): PIXI.Graphics {
  const g = new PIXI.Graphics()
  g.beginFill(C_OVERLAY, 0.75)
  g.drawRect(0, 0, sw, sh)
  g.endFill()
  ;(g as any).interactive = true
  g.on('pointerdown', () => {})
  return g
}

// ═══════════════════════════════════════════════════════
// 面板绘制
// ═══════════════════════════════════════════════════════

/**
 * 绘制标准弹窗面板到 Graphics g
 * 坐标原点在面板左上角
 * 内含：投影 → 云朵白主体 → 深森绿描边 → 顶部高光条
 */
export function drawPanel(g: PIXI.Graphics, w: number, h: number, r = 28) {
  // 底部投影（深绿偏移右下 5/7px）
  g.lineStyle(0)
  g.beginFill(C_OUTLINE, 0.22)
  g.drawRoundedRect(5, 7, w, h, r)
  g.endFill()
  // 主体：云朵白 + 深森绿描边
  g.lineStyle(4, C_OUTLINE, 1)
  g.beginFill(C_PANEL, 0.98)
  g.drawRoundedRect(0, 0, w, h, r)
  g.endFill()
  // 顶部弧形高光（模拟顶光质感）
  g.lineStyle(0)
  g.beginFill(0xffffff, 0.18)
  g.drawRoundedRect(10, 6, w - 20, h * 0.25, r - 4)
  g.endFill()
}

/** 弹窗标准内边距（基于弹窗宽度百分比） */
export function panelPad(w: number) {
  return {
    top: Math.round(w * 0.19),
    lr:  Math.round(w * 0.17),
    bot: Math.round(w * 0.205),
    // 内容与弹窗标题的距离
    contentTop: Math.round(w * 0.2),
  }
}

/**
 * 使用 bg-popup.png 创建纵向三段式自适应弹窗背景
 * 头 25% 固定 · 尾 25% 固定 · 中间 50% 拉伸填充
 * 宽度水平铺满，头尾按等比缩放不变形
 * 传入 onClose 时自动挂载统一的关闭按钮（close.png，40×40，右 2%、顶 20% 弹窗宽）
 */
export function makePanelBg(w: number, h: number, onClose?: () => void): PIXI.Container {
  const tex = PIXI.Texture.from('assets/common/bg-popup.png')
  const base = tex.baseTexture
  const origW = tex.width
  const origH = tex.height

  // 原图三段高度
  const topH = Math.round(origH * 0.25)
  const botH = Math.round(origH * 0.25)
  const midH = origH - topH - botH

  // 水平缩放比（宽度铺满）
  const sx = w / origW

  // 头尾等比缩放后的实际高度
  const topRendered = topH * sx
  const botRendered = botH * sx

  // 中间拉伸后高度 = 总高 - 头 - 尾
  const midRendered = Math.max(0, h - topRendered - botRendered)

  // 切三段纹理
  const topTex = new PIXI.Texture(base, new PIXI.Rectangle(0, 0, origW, topH))
  const midTex = new PIXI.Texture(base, new PIXI.Rectangle(0, topH, origW, midH))
  const botTex = new PIXI.Texture(base, new PIXI.Rectangle(0, topH + midH, origW, botH))

  const c = new PIXI.Container()

  const topSpr = new PIXI.Sprite(topTex)
  topSpr.width = w
  topSpr.height = topRendered
  c.addChild(topSpr)

  const midSpr = new PIXI.Sprite(midTex)
  midSpr.width = w
  midSpr.height = midRendered
  midSpr.y = topRendered
  c.addChild(midSpr)

  const botSpr = new PIXI.Sprite(botTex)
  botSpr.width = w
  botSpr.height = botRendered
  botSpr.y = topRendered + midRendered
  c.addChild(botSpr)

  // 统一关闭按钮（40×40，右 2% 弹窗宽、顶 20% 弹窗宽）
  if (onClose) {
    const closeBtn = new PIXI.Sprite(PIXI.Texture.from('assets/button/close.png'))
    closeBtn.width = 74
    closeBtn.height = 74
    closeBtn.anchor.set(1, 0)
    closeBtn.x = w - w * 0.02
    closeBtn.y = w * 0.20
    ;(closeBtn as any).interactive = true
    ;(closeBtn as any).buttonMode = true
    closeBtn.on('pointerdown', onClose)
    c.addChild(closeBtn)
  }

  return c
}

/** 绘制暗夜草地背景面板（排行榜用） */
export function drawDarkPanel(g: PIXI.Graphics, w: number, h: number, r = 28) {
  g.lineStyle(0)
  g.beginFill(0x0a3520)
  g.drawRoundedRect(0, 0, w, h, r)
  g.endFill()
  // 顶部渐变感光晕
  g.beginFill(0x1a6040, 0.4)
  g.drawRoundedRect(0, 0, w, h * 0.35, r)
  g.endFill()
}

// ═══════════════════════════════════════════════════════
// 按钮
// ═══════════════════════════════════════════════════════

/**
 * 彩铅厚块 3D 果冻按钮（anchor 居中）
 * mainColor 默认珊瑚橙，labelColor 默认白色
 */
export function makeJellyBtn(
  label: string,
  w: number,
  h: number,
  mainColor = C_ORANGE,
  labelColor = 0xffffff,
  fontSize = 30
): PIXI.Container {
  const c = new PIXI.Container()
  ;(c as any).interactive = true
  ;(c as any).buttonMode = true
  const r = h / 2
  const g = new PIXI.Graphics()
  // 深森绿底部投影
  g.beginFill(C_OUTLINE, 0.4)
  g.drawRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, r)
  g.endFill()
  // 主体
  g.beginFill(mainColor)
  g.drawRoundedRect(-w / 2, -h / 2, w, h, r)
  g.endFill()
  // 顶部弧形高光
  g.beginFill(0xffffff, 0.25)
  g.drawRoundedRect(-w / 2 + 8, -h / 2 + 3, w - 16, h * 0.42, r - 3)
  g.endFill()
  c.addChild(g)

  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif', fontSize, fill: labelColor, fontWeight: '800'
  })
  t.anchor.set(0.5, 0.5)
  c.addChild(t)

  // 点击下压 + 反弹
  c.on('pointerdown', () => { c.scale.set(0.96); c.y += 2 })
  c.on('pointerup', () => { c.scale.set(1.0); c.y -= 2 })
  c.on('pointerupoutside', () => { c.scale.set(1.0); c.y -= 2 })
  return c
}

// ═══════════════════════════════════════════════════════
// 模态外部按钮（图片背景，三色主题）
// ═══════════════════════════════════════════════════════

export type ModalBtnColor = 'yellow' | 'green' | 'blue'

/** 各色按钮文字描边色（深一档，与按钮主体形成对比） */
const MODAL_BTN_STROKE: Record<ModalBtnColor, number> = {
  yellow: 0xd97e1e,
  green:  0x2d8e2d,
  blue:   0x1e7ec4,
}

/** 通用图片按钮：白字 + 主题色描边，按图片等比缩放至 width */
export function makeImageBtn(
  label: string,
  color: ModalBtnColor,
  onClick: () => void,
  width = 320,
): PIXI.Container {
  const c = new PIXI.Container()
  ;(c as any).interactive = true
  ;(c as any).buttonMode = true

  const tex = PIXI.Texture.from(`assets/button/button-${color}.png`)
  const spr = new PIXI.Sprite(tex)
  spr.anchor.set(0.5, 0.5)
  // 等比缩放至目标宽度
  const apply = () => {
    const ow = (tex as any).orig?.width || tex.width
    if (ow > 0) spr.scale.set(width / ow)
  }
  const base = (tex as any).baseTexture
  if (base?.valid) apply()
  else base?.once?.('loaded', apply)
  c.addChild(spr)

  // 文字：白字 + 主题色描边
  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif',
    fontSize: 40,
    fill: 0xffffff,
    stroke: MODAL_BTN_STROKE[color],
    strokeThickness: 5,
    fontWeight: '900',
    align: 'center',
  })
  t.anchor.set(0.5, 0.6)
  c.addChild(t)

  // 点击下压反馈
  c.on('pointerdown', () => { c.scale.set(0.95); c.y += 2 })
  c.on('pointerup', () => { c.scale.set(1); c.y -= 2; onClick() })
  c.on('pointerupoutside', () => { c.scale.set(1); c.y -= 2 })
  return c
}

export interface ModalAction {
  label: string
  color: ModalBtnColor
  onClick: () => void
}

/** 按钮图片宽高比（≈2.22:1），用于布局计算 */
const MODAL_BTN_W = 280
const MODAL_BTN_H = 74
const MODAL_BTN_GAP = 20

/**
 * 弹窗外部按钮组：纵向堆叠，宽 164、间距 20，水平居中
 * 容器原点 = 第一个按钮的顶边，X 居中
 * 返回 { container, height } —— height 含全部按钮 + 间距
 */
export function makeModalActions(actions: ModalAction[]): {
  container: PIXI.Container
  height: number
} {
  const c = new PIXI.Container()
  actions.forEach((a, i) => {
    const btn = makeImageBtn(a.label, a.color, a.onClick, MODAL_BTN_W)
    btn.y = i * (MODAL_BTN_H + MODAL_BTN_GAP) + MODAL_BTN_H / 2
    c.addChild(btn)
  })
  const height = actions.length === 0
    ? 0
    : actions.length * MODAL_BTN_H + (actions.length - 1) * MODAL_BTN_GAP
  return { container: c, height }
}

/** 关闭按钮（深森绿圆形 ×，anchor 在圆心） */
export function makeCloseBtn(onClose: () => void): PIXI.Container {
  const c = new PIXI.Container()
  ;(c as any).interactive = true
  ;(c as any).buttonMode = true
  const g = new PIXI.Graphics()
  g.beginFill(C_OUTLINE)
  g.drawCircle(0, 0, 22)
  g.endFill()
  g.beginFill(0xffffff, 0.18)
  g.drawEllipse(0, -7, 11, 7)
  g.endFill()
  c.addChild(g)
  const t = new PIXI.Text('✕', {
    fontFamily: 'sans-serif', fontSize: 24, fill: 0xffffff, fontWeight: '700'
  })
  t.anchor.set(0.5, 0.5)
  c.addChild(t)
  c.on('pointerdown', onClose)
  return c
}

/** 文字链接按钮（浅灰小字，无背景） */
export function makeTextLink(
  label: string,
  color = C_OUTLINE,
  fontSize = 24
): PIXI.Text {
  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif', fontSize, fill: color, fontWeight: '600'
  })
  t.anchor.set(0.5, 0.5)
  ;(t as any).interactive = true
  ;(t as any).buttonMode = true
  return t
}

// ═══════════════════════════════════════════════════════
// 标签页切换胶囊
// ═══════════════════════════════════════════════════════

/**
 * 标签页胶囊切换控件
 * 选中 = 珊瑚橙底白字；未选 = 云朵白底深森绿字
 * 返回 container，调用 setActive(idx) 可切换高亮
 */
export function makeTabCapsule(
  labels: string[],
  activeIdx: number,
  tabW: number,
  tabH: number,
  onChange: (idx: number) => void
): PIXI.Container & { setActive: (i: number) => void } {
  const c = new PIXI.Container() as PIXI.Container & { setActive: (i: number) => void }
  const totalW = tabW * labels.length + 8

  // 背景轨道
  const track = new PIXI.Graphics()
  track.lineStyle(2.5, C_OUTLINE, 0.4)
  track.beginFill(0xffffff, 0.3)
  track.drawRoundedRect(0, 0, totalW, tabH + 8, (tabH + 8) / 2)
  track.endFill()
  c.addChild(track)

  const bgs: PIXI.Graphics[] = []
  const texts: PIXI.Text[] = []
  let current = activeIdx

  const redraw = (i: number) => {
    bgs[i].clear()
    const active = i === current
    if (active) {
      bgs[i].beginFill(C_ORANGE)
      bgs[i].drawRoundedRect(0, 0, tabW, tabH, tabH / 2)
      bgs[i].endFill()
    }
    texts[i].style.fill = active ? 0xffffff : C_TEXT
  }

  labels.forEach((label, i) => {
    const tab = new PIXI.Container()
    ;(tab as any).interactive = true
    ;(tab as any).buttonMode = true

    const bg = new PIXI.Graphics()
    bgs.push(bg)
    tab.addChild(bg)

    const t = new PIXI.Text(label, {
      fontFamily: 'sans-serif', fontSize: 26,
      fill: C_TEXT, fontWeight: '800'
    })
    t.anchor.set(0.5, 0.5)
    t.position.set(tabW / 2, tabH / 2)
    texts.push(t)
    tab.addChild(t)

    tab.position.set(i * tabW + 4, 4)
    tab.on('pointerdown', () => {
      current = i
      labels.forEach((_, j) => redraw(j))
      onChange(i)
    })
    c.addChild(tab)
    redraw(i)
  })

  c.setActive = (i: number) => {
    current = i
    labels.forEach((_, j) => redraw(j))
  }

  return c
}

// ═══════════════════════════════════════════════════════
// 拨动开关
// ═══════════════════════════════════════════════════════

/**
 * 拨动开关（参考美术：橙色底轨 + 黄色圆钮）
 * 宽 120 高 44，坐标原点在左上角
 */
export function makeToggle(
  on: boolean,
  onChange: (v: boolean) => void
): PIXI.Container & { setValue: (v: boolean) => void } {
  const W = 120, H = 44
  const c = new PIXI.Container() as PIXI.Container & { setValue: (v: boolean) => void }
  ;(c as any).interactive = true
  ;(c as any).buttonMode = true

  let state = on
  const bg = new PIXI.Graphics()
  const bgHi = new PIXI.Graphics()
  const knobShadow = new PIXI.Graphics()
  const knob = new PIXI.Graphics()

  const redraw = () => {
    bg.clear()
    bg.lineStyle(2, 0xd88449, 0.9)
    bg.beginFill(0xf2a56c)
    bg.drawRoundedRect(0, 0, W, H, H / 2)
    bg.endFill()

    bgHi.clear()
    bgHi.beginFill(0xffffff, 0.28)
    bgHi.drawRoundedRect(4, 3, W - 8, H * 0.42, (H * 0.42) / 2)
    bgHi.endFill()

    const knobX = state ? W - H / 2 + 2 : H / 2 - 2

    knobShadow.clear()
    knobShadow.beginFill(0xcc843f, 0.35)
    knobShadow.drawCircle(0, 0, H / 2 - 4)
    knobShadow.endFill()
    knobShadow.x = knobX
    knobShadow.y = H / 2 + 1

    knob.clear()
    knob.beginFill(0xf5df4b)
    knob.drawCircle(0, 0, H / 2 - 4)
    knob.endFill()
    knob.lineStyle(1.5, 0xd19b20, 0.8)
    knob.drawCircle(0, 0, H / 2 - 4)
    knob.x = knobX
    knob.y = H / 2
  }

  redraw()
  c.addChild(bg)
  c.addChild(bgHi)
  c.addChild(knobShadow)
  c.addChild(knob)

  c.on('pointerdown', () => {
    state = !state
    redraw()
    onChange(state)
  })

  c.setValue = (v: boolean) => {
    state = v
    redraw()
  }

  return c
}

// ═══════════════════════════════════════════════════════
// IP 占位装饰（卡皮巴拉探出弹窗顶边）
// ═══════════════════════════════════════════════════════

/**
 * 占位卡皮巴拉装饰（待后期替换为真实切图精灵）
 * anchor 在底部中心 (0.5, 1.0)，放在面板顶边
 * size ≈ 80
 */
export function makeIpDeco(size = 80): PIXI.Container {
  const c = new PIXI.Container()
  const s = size

  // 身体椭圆
  const body = new PIXI.Graphics()
  body.lineStyle(2.5, C_OUTLINE, 0.7)
  body.beginFill(C_BROWN)
  body.drawEllipse(0, -s * 0.18, s * 0.48, s * 0.3)
  body.endFill()
  c.addChild(body)

  // 头部大圆
  const head = new PIXI.Graphics()
  head.lineStyle(2.5, C_OUTLINE, 0.7)
  head.beginFill(C_BROWN)
  head.drawCircle(0, -s * 0.62, s * 0.35)
  head.endFill()
  c.addChild(head)

  // 月牙眼（两道弧线）
  const eyes = new PIXI.Graphics()
  eyes.lineStyle(2.5, C_OUTLINE, 1)
  eyes.arc(-s * 0.12, -s * 0.66, s * 0.065, Math.PI + 0.3, -0.3)
  eyes.arc( s * 0.12, -s * 0.66, s * 0.065, Math.PI + 0.3, -0.3)
  c.addChild(eyes)

  // U 形微笑
  const smile = new PIXI.Graphics()
  smile.lineStyle(2.5, C_OUTLINE, 1)
  smile.arc(0, -s * 0.56, s * 0.09, 0.1, Math.PI - 0.1)
  c.addChild(smile)

  // 蒲公英黄耳朵
  const ear = new PIXI.Graphics()
  ear.lineStyle(2, C_OUTLINE, 0.6)
  ear.beginFill(C_YELLOW, 0.8)
  ear.drawCircle(-s * 0.28, -s * 0.88, s * 0.1)
  ear.drawCircle( s * 0.28, -s * 0.88, s * 0.1)
  ear.endFill()
  c.addChild(ear)

  return c
}

// ═══════════════════════════════════════════════════════
// 进度条
// ═══════════════════════════════════════════════════════

/**
 * 绘制圆角进度条
 * @param g   Graphics 对象
 * @param x,y 左上角坐标
 * @param w,h 宽高
 * @param pct 进度 0~1
 */
export function drawProgressBar(
  g: PIXI.Graphics,
  x: number, y: number,
  w: number, h: number,
  pct: number
) {
  const r = h / 2
  // 底轨
  g.lineStyle(2.5, C_OUTLINE, 0.5)
  g.beginFill(0xffffff, 0.6)
  g.drawRoundedRect(x, y, w, h, r)
  g.endFill()
  // 填充
  if (pct > 0) {
    g.lineStyle(0)
    g.beginFill(C_SKY)
    g.drawRoundedRect(x, y, Math.max(h, w * pct), h, r)
    g.endFill()
  }
  // 高光
  g.beginFill(0xffffff, 0.2)
  g.drawRoundedRect(x + 4, y + 2, w - 8, h * 0.4, r - 2)
  g.endFill()
}

// ═══════════════════════════════════════════════════════
// 文字工厂
// ═══════════════════════════════════════════════════════

export function txt(
  text: string,
  fontSize: number,
  fill: number = C_TEXT,
  weight: PIXI.TextStyleFontWeight = '700',
  align: PIXI.TextStyleAlign = 'center'
): PIXI.Text {
  return new PIXI.Text(text, {
    fontFamily: 'sans-serif', fontSize, fill, fontWeight: weight,
    align
  })
}

export function txtWrap(
  text: string,
  fontSize: number,
  wrapWidth: number,
  fill: number = C_TEXT,
  weight: PIXI.TextStyleFontWeight = '600'
): PIXI.Text {
  return new PIXI.Text(text, {
    fontFamily: 'sans-serif', fontSize, fill, fontWeight: weight,
    wordWrap: true, wordWrapWidth: wrapWidth,
    lineHeight: Math.round(fontSize * 1.5),
    align: 'center'
  })
}

// ═══════════════════════════════════════════════════════
// 爱心排列（血量显示）
// ═══════════════════════════════════════════════════════

/**
 * 绘制 n 颗爱心（满=暖红，空=灰色空心）
 * anchor 在左侧中心
 */
export function drawHearts(
  g: PIXI.Graphics,
  total: number,
  filled: number,
  startX: number,
  cy: number,
  size = 32,
  gap = 8
) {
  for (let i = 0; i < total; i++) {
    const cx = startX + i * (size + gap) + size / 2
    const isFilled = i < filled
    // 简单圆形模拟爱心
    if (isFilled) {
      g.beginFill(C_RED)
    } else {
      g.lineStyle(2, C_GRAY, 1)
      g.beginFill(0, 0)
    }
    // 两个上圆 + 三角拼爱心近似
    g.drawCircle(cx - size * 0.14, cy - size * 0.05, size * 0.3)
    g.drawCircle(cx + size * 0.14, cy - size * 0.05, size * 0.3)
    g.endFill()
    g.lineStyle(0)
    if (isFilled) {
      g.beginFill(C_RED)
    } else {
      g.lineStyle(2, C_GRAY, 1)
      g.beginFill(0, 0)
    }
    // 下三角
    const pts = [
      cx - size * 0.42, cy,
      cx + size * 0.42, cy,
      cx, cy + size * 0.48
    ]
    g.drawPolygon(pts)
    g.endFill()
    g.lineStyle(0)
  }
}
