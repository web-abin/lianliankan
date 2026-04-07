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
export const C_OVERLAY  = 0x2a5a14  // 遮罩底色

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

// ═══════════════════════════════════════════════════════
// 全屏遮罩
// ═══════════════════════════════════════════════════════

/** 深森绿半透明全屏遮罩，吞掉穿透点击 */
export function makeOverlay(sw: number, sh: number): PIXI.Graphics {
  const g = new PIXI.Graphics()
  g.beginFill(C_OVERLAY, 0.45)
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
 * 拨动开关（ON=天空蓝，OFF=灰色）
 * 宽 80 高 44，坐标原点在左上角
 */
export function makeToggle(
  on: boolean,
  onChange: (v: boolean) => void
): PIXI.Container & { setValue: (v: boolean) => void } {
  const W = 80, H = 44
  const c = new PIXI.Container() as PIXI.Container & { setValue: (v: boolean) => void }
  ;(c as any).interactive = true
  ;(c as any).buttonMode = true

  let state = on
  const bg = new PIXI.Graphics()
  const knob = new PIXI.Graphics()

  const redraw = () => {
    bg.clear()
    bg.lineStyle(2, C_OUTLINE, 0.5)
    bg.beginFill(state ? C_SKY : C_GRAY)
    bg.drawRoundedRect(0, 0, W, H, H / 2)
    bg.endFill()

    knob.clear()
    knob.beginFill(0xffffff)
    knob.drawCircle(0, 0, H / 2 - 4)
    knob.endFill()
    knob.lineStyle(1.5, C_OUTLINE, 0.25)
    knob.drawCircle(0, 0, H / 2 - 4)
    knob.x = state ? W - H / 2 + 2 : H / 2 - 2
    knob.y = H / 2
  }

  redraw()
  c.addChild(bg)
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
