/**
 * 卡皮巴拉连连看 — 首页 UI
 * 布局坐标：宽 750（DESIGN_REF_W），高为与屏同比例的 designLayoutH；sw/sh 见 core 的 windowWidth/windowHeight
 *
 * 布局层次（上→下）
 *   顶部状态栏  (与胶囊垂直居中对齐：设置按钮 | 金币 pill | 血量 pill)
 *   左侧功能入口 商店 / 主题 / 排行（3 项）
 *   中央标题   游戏主标题图片（水平居中）
 *   右侧功能入口 每日奖励 / 每日挑战 / 喊好友（3 项）
 *   场景区     卡皮巴拉待机动画（水平居中）
 *   开始游戏按钮（带"第X关"挂牌）
 *
 * 配色规范（春日草地治愈风，与首页参考图对齐）
 *   天空：#BEEFFF→#DDF7FF；草地：#CBEA72；主按钮：#F28C63
 *   卡片/pill 底色：#FFF9EF；描边：#000000；文字：#3B4D25（深绿）
 */
import * as PIXI from 'pixi.js'
import {
  DESIGN_REF_W,
  designLayoutH,
  safeAreaTopPx,
  ticker,
  windowWidth,
  windowHeight
} from '~/core'
import { readFile } from '~/util'

/** 标题图宽度占设计稿宽的比例 */
const TITLE_WIDTH_W_RATIO = 420 / DESIGN_REF_W

// ── 设计 Token（统一在此修改颜色，不散落在各处）────────────
/** pill 底色：暖白 */
const C_PILL_BG = 0xFFF9EF
/** pill / 图标圆底 描边：黑色 */
const C_BORDER = 0x000000
/** 深绿字色：用于 pill 内文字、侧边标签 */
const C_TEXT_DARK = 0x3B4D25
/** 侧边图标圆底 */
const C_ICON_BG = 0xFFF9EF

// 所有图片路径（统一在此定义，方便路由预加载）
export const ASSET_URLS = [
  'assets/scene/home/bg-home.jpg',
  'assets/text/ka-pi-ba-la.png',
  'assets/button/setting.png',
  'assets/button/invite.png',
  'assets/button/daily.png',
  'assets/button/challenge.png',
  'assets/button/start.png',
  'assets/scene/home/panel-level.png',
  'assets/button/shop.png',
  'assets/button/theme.png',
  'assets/button/range.png'
] as const

/** 首页卡皮巴拉序列帧大图（待美术切图后替换为正式文件） */
export const ROLE_SHEET_URL = 'assets/role/capybara-idle.webp'

export interface HomeOptions {
  level?: number
  coins?: number
  hearts?: number
  maxHearts?: number
  onStart?: () => void
  onSettings?: () => void
  onShout?: () => void
  onReward?: () => void
  onDailyChallenge?: () => void
  onShop?: () => void
  onTheme?: () => void
  onRank?: () => void
}

export function create(
  parent: PIXI.Container,
  opts: HomeOptions = {}
): PIXI.Container {
  const {
    level = 1,
    coins = 9999,
    hearts = 10,
    maxHearts = 10,
    onStart = noop,
    onSettings = noop,
    onShout = noop,
    onReward = noop,
    onDailyChallenge = noop,
    onShop = noop,
    onTheme = noop,
    onRank = noop
  } = opts

  const sw = windowWidth
  const sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH

  // ── wrapper：无 transform，背景用真实屏幕像素布局 ────────
  const wrapper = new PIXI.Container()

  // ── 背景图：默认按屏幕宽度 100% 铺满，高度等比，垂直居中 ─────
  const bgSpr = S('assets/scene/home/bg-home.jpg')
  const bgTexW = bgSpr.texture.width || 1
  const bgTexH = bgSpr.texture.height || 1
  const bgScale = sw / bgTexW
  bgSpr.width = sw
  bgSpr.height = bgTexH * bgScale
  bgSpr.position.set(0, (sh - bgSpr.height) / 2)
  wrapper.addChild(bgSpr)

  // ── 逻辑 UI 容器（与屏幕同宽高比的设计坐标；水平居中、竖直贴底）
  const root = new PIXI.Container()
  ;(root as any).interactive = true
  ;(root as any).interactiveChildren = true
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)
  root.scale.set(dr)
  root.position.set(sw / 2 - (DESIGN_W / 2) * dr, sh - DESIGN_H * dr)
  wrapper.addChild(root)

  // ════════════════════════════════════════════════════════
  // 1. 顶部状态栏
  //    左：设置按钮（齿轮图标 + "设置"标签）
  //    右侧：金币 pill + 血量 pill（各自独立，黑色描边暖白底）
  //    垂直方向与微信胶囊按钮居中对齐
  // ════════════════════════════════════════════════════════

  // 读取微信胶囊位置，取中心 Y（物理像素）
  let menuCY: number
  try {
    const mb = wx.getMenuButtonBoundingClientRect?.()
    menuCY = mb?.top > 0 && mb.bottom > mb.top
      ? (mb.top + mb.bottom) / 2
      : safeAreaTopPx + 16
  } catch (_) {
    menuCY = safeAreaTopPx + 16
  }

  // 物理像素 → root 设计坐标中心 Y
  const STATUS_CY = (menuCY - (sh - DESIGN_H * dr)) / dr

  const SETTING_SIZE = 64
  const SLOT_H = 56                          // pill 高
  const SLOT_W = 196                         // pill 宽
  const SLOT_GAP = 12                        // 两 pill 间距
  const SLOT_R = SLOT_H / 2                  // pill 圆角
  const SLOT1_X = 18 + SETTING_SIZE + 20    // 金币 pill 起点
  const SLOT2_X = SLOT1_X + SLOT_W + SLOT_GAP

  // 设置按钮 & 槽均以 STATUS_CY 为中心
  const SETTING_Y = STATUS_CY - SETTING_SIZE / 2
  const SLOT_Y = STATUS_CY - SLOT_H / 2

  // 设置按钮（齿轮图标）
  const settingBtn = S('assets/button/setting.png')
  settingBtn.width = SETTING_SIZE
  settingBtn.height = SETTING_SIZE
  settingBtn.position.set(18, SETTING_Y)
  click(settingBtn, onSettings)
  root.addChild(settingBtn)

  // pill 背景（暖白底 + 黑色描边，与参考图一致）
  function slotBg(x: number): PIXI.Graphics {
    const g = new PIXI.Graphics()
    g.lineStyle(2, C_BORDER, 1)
    g.beginFill(C_PILL_BG, 0.95)
    g.drawRoundedRect(x, SLOT_Y, SLOT_W, SLOT_H, SLOT_R)
    g.endFill()
    return g
  }
  root.addChild(slotBg(SLOT1_X))
  root.addChild(slotBg(SLOT2_X))

  // 金币槽 — 金币图标 + "金币:" + 数值 + 加号
  const goldIcon = S('assets/icon/gold.png')
  goldIcon.width = 40
  goldIcon.height = 40
  goldIcon.position.set(SLOT1_X + 10, SLOT_Y + 8)
  root.addChild(goldIcon)

  const goldText = TStroke(`${coins}`, 24, C_TEXT_DARK, '700')
  goldText.anchor.set(0, 0.5)
  goldText.position.set(SLOT1_X + 56, STATUS_CY)
  root.addChild(goldText)

  const goldPlus = S('assets/icon/plus.png')
  goldPlus.width = 34
  goldPlus.height = 34
  goldPlus.position.set(SLOT1_X + SLOT_W - 42, SLOT_Y + 11)
  root.addChild(goldPlus)

  // 爱心槽 — 爱心图标 + "血量:" + 数值 + 加号
  const heartIcon = S('assets/icon/love.png')
  heartIcon.width = 40
  heartIcon.height = 36
  heartIcon.position.set(SLOT2_X + 10, SLOT_Y + 10)
  root.addChild(heartIcon)

  const heartText = TStroke(`${hearts}/${maxHearts}`, 24, C_TEXT_DARK, '700')
  heartText.anchor.set(0, 0.5)
  heartText.position.set(SLOT2_X + 56, STATUS_CY)
  root.addChild(heartText)

  const heartPlus = S('assets/icon/plus.png')
  heartPlus.width = 34
  heartPlus.height = 34
  heartPlus.position.set(SLOT2_X + SLOT_W - 42, SLOT_Y + 11)
  root.addChild(heartPlus)

  // ════════════════════════════════════════════════════════
  // 2. 左侧功能入口：商店 / 主题 / 排行（3 项，带圆形白底）
  //    按参考图：3 项围绕卡皮巴拉左侧，垂直均匀分布
  // ════════════════════════════════════════════════════════

  // 3 项居中于角色区域：DESIGN_H/2 附近上下各一项
  const gap = 175
  const baseY = DESIGN_H / 2 - gap - 60
  /** 图标尺寸（含圆底直径） */
  const ICON_ENTRY_W = 96

  const LENTRY_X = 18

  // 商店
  sideEntry(root, {
    url: 'assets/button/shop.png',
    label: '商店',
    x: LENTRY_X,
    y: baseY,
    w: ICON_ENTRY_W,
    withCircleBg: true,
    onClick: onShop
  })
  // 主题
  sideEntry(root, {
    url: 'assets/button/theme.png',
    label: '主题',
    x: LENTRY_X,
    y: baseY + gap,
    w: ICON_ENTRY_W,
    withCircleBg: true,
    onClick: onTheme
  })
  // 排行
  sideEntry(root, {
    url: 'assets/button/range.png',
    label: '排行',
    x: LENTRY_X,
    y: baseY + 2 * gap,
    w: ICON_ENTRY_W,
    withCircleBg: true,
    onClick: onRank
  })

  // ════════════════════════════════════════════════════════
  // 3. 标题：游戏主标题图片（水平居中）
  // ════════════════════════════════════════════════════════

  // ka-pi-ba-la.png 源 700×376，宽度按逻辑屏宽比例缩放
  const titleW = Math.round(DESIGN_W * TITLE_WIDTH_W_RATIO)
  const titleSpr = S('assets/text/ka-pi-ba-la.png')
  titleSpr.width = titleW
  titleSpr.height = Math.round((titleW / 700) * 376)
  titleSpr.anchor.set(0.5, 0)
  titleSpr.position.set(DESIGN_W / 2, safeAreaTopPx + 200)
  root.addChild(titleSpr)

  // ════════════════════════════════════════════════════════
  // 4. 右侧功能入口：每日奖励 / 每日挑战 / 喊好友（3 项）
  //    与左侧 3 项垂直对齐，使用相同 gap 和 baseY
  // ════════════════════════════════════════════════════════

  /** 右侧图标右缘对齐到设计稿右侧内边距 */
  const RENTRY_ICON_RIGHT = DESIGN_W - LENTRY_X

  // 每日奖励
  sideEntry(root, {
    url: 'assets/button/daily.png',
    label: '每日奖励',
    x: RENTRY_ICON_RIGHT,
    y: baseY,
    w: ICON_ENTRY_W,
    anchor: 'right',
    withCircleBg: true,
    onClick: onReward
  })
  // 每日挑战
  sideEntry(root, {
    url: 'assets/button/challenge.png',
    label: '每日挑战',
    x: RENTRY_ICON_RIGHT,
    y: baseY + gap,
    w: ICON_ENTRY_W,
    anchor: 'right',
    withCircleBg: true,
    onClick: onDailyChallenge
  })
  // 喊好友
  sideEntry(root, {
    url: 'assets/button/invite.png',
    label: '喊好友',
    x: RENTRY_ICON_RIGHT,
    y: baseY + 2 * gap,
    w: ICON_ENTRY_W,
    anchor: 'right',
    withCircleBg: true,
    onClick: onShout
  })


  // 卡皮巴拉角色静态图
  const heroGroup = new PIXI.Container()
  heroGroup.position.set(DESIGN_W / 2, Math.round(DESIGN_H / 2))
  const roleSpr = S('assets/role/role.png')
  roleSpr.anchor.set(0.5, 0.5)
  const targetW = Math.round((DESIGN_W * 2) / 3)
  const roleBase = (roleSpr.texture as any).baseTexture
  const applyRoleSize = () => {
    const w = roleSpr.texture.width
    if (w > 0) roleSpr.scale.set(targetW / w)
  }
  roleBase?.valid ? applyRoleSize() : roleBase?.once?.('loaded', applyRoleSize)
  heroGroup.addChild(roleSpr)
  root.addChild(heroGroup)
  // ════════════════════════════════════════════════════════
  // 6. 开始游戏按钮（距设计稿底边留白）
  //    按钮右上角挂"第X关"木牌（panel-level.png 或纯绘制兜底）
  // ════════════════════════════════════════════════════════

  const START_BTN_W = 490
  const START_BTN_H = Math.round((START_BTN_W / 600) * 184) // ≈ 150
  const START_ABOVE_DESIGN_BOTTOM = 230

  const startGroup = new PIXI.Container()
  click(startGroup, onStart)
  startGroup.position.set(
    DESIGN_W / 2,
    DESIGN_H - START_ABOVE_DESIGN_BOTTOM - Math.round(START_BTN_H / 2)
  )
  root.addChild(startGroup)

  // 按钮底图（start.png，宽 490）
  const startBg = S('assets/button/start.png')
  startBg.width = START_BTN_W
  startBg.height = START_BTN_H
  startBg.anchor.set(0.5, 0.5)
  startGroup.addChild(startBg)

  // "开始游戏" 主文字

  // "第X关" 挂牌：放在按钮右上角，用 panel-level.png，顺时针倾斜约10度
  const levelTag = new PIXI.Container()
  levelTag.position.set(START_BTN_W / 2 - 10, -START_BTN_H / 2 + 8)
  levelTag.rotation = 0.2  // ~10度顺时针倾斜，与参考设计一致
  startGroup.addChild(levelTag)

  const panelSpr = S('assets/scene/home/panel-level.png')
  const PANEL_W = 160
  panelSpr.anchor.set(0.5, 0.5)
  levelTag.addChild(panelSpr)

  // 纹理可能异步加载，需等 baseTexture valid 后再设置尺寸
  const applyPanelSize = () => {
    const tw = panelSpr.texture.width
    const th = panelSpr.texture.height
    if (tw > 0 && th > 0) {
      panelSpr.width = PANEL_W
      panelSpr.height = Math.round((PANEL_W / tw) * th)
    }
  }
  const panelBase = (panelSpr.texture as any).baseTexture
  if (panelBase?.valid) {
    applyPanelSize()
  } else {
    panelBase?.once?.('loaded', applyPanelSize)
  }

  const levelText = TStroke(`第${level}关`, 30, 0xffffff, '700')
  levelText.anchor.set(0.5, 0.5)
  levelText.position.set(-12, 10)  // 微调垂直居中（视觉中心略偏下）
  levelText.rotation = 0.1
  levelText.alpha = 0.6   // 70% 透明度
  levelTag.addChild(levelText)

  // 开始按钮呼吸动画（缩放），hide/show 时随 added/removed 启停
  let breathePhase = 0
  // 呼吸动画的强度
  const BREATHE_AMP = 0.055
  const BREATHE_PERIOD_SEC = 2.5
  const breathe = () => {
    breathePhase +=
      (ticker.deltaMS / 1000) * ((2 * Math.PI) / BREATHE_PERIOD_SEC)
    const s = 1 + BREATHE_AMP * Math.sin(breathePhase)
    startGroup.scale.set(s)
  }
  const onWrapAdded = () => {
    ticker.add(breathe)
  }
  const onWrapRemoved = () => {
    ticker.remove(breathe)
  }
  wrapper.on('added', onWrapAdded)
  wrapper.on('removed', onWrapRemoved)

  return wrapper
}

// ════════════════════════════════════════════════════════════
// 辅助函数
// ════════════════════════════════════════════════════════════

function noop() {}

/** 创建 Sprite */
function S(url: string): PIXI.Sprite {
  return PIXI.Sprite.from(url)
}

/** 创建普通 Text */
function T(
  text: string,
  size: number,
  fill: number,
  weight: PIXI.TextStyleFontWeight = '400'
): PIXI.Text {
  return new PIXI.Text(text, {
    fontFamily: 'sans-serif',
    fontSize: size,
    fill,
    fontWeight: weight
  })
}

/** 创建带黑色描边的 Text（用于叠在背景上保证可读性） */
function TStroke(
  text: string,
  size: number,
  fill: number,
  weight: PIXI.TextStyleFontWeight = '400'
): PIXI.Text {
  return new PIXI.Text(text, {
    fontFamily: 'sans-serif',
    fontSize: size,
    fill,
    fontWeight: weight,
    stroke: 0x000000,
    // 菜单文字描边
    strokeThickness: 4,
    dropShadow: true,
    dropShadowDistance: 1,
    dropShadowAlpha: 0.25,
    dropShadowAngle: Math.PI / 4
  })
}

/** 让任意 DisplayObject 可点击 */
function click<T extends PIXI.DisplayObject>(obj: T, fn: () => void): T {
  ;(obj as any).interactive = true
  ;(obj as any).buttonMode = true
  obj.on('pointerdown', fn)
  return obj
}

/**
 * 侧边功能入口（圆形白底 + 图标 + 文字标签）
 * `anchor` 为 right 时 `x` 为圆底右缘（右侧列使用）
 * `withCircleBg` 为 true 时在图标后绘制圆形白底（icon 素材无内置背景时使用）
 */
function sideEntry(
  root: PIXI.Container,
  opts: {
    url: string
    label: string
    x: number
    y: number
    onClick: () => void
    anchor?: 'left' | 'right'
    withCircleBg?: boolean
  } & ({ w: number; h?: never } | { w?: never; h: number })
) {
  const { url, label, x, y, onClick, withCircleBg = false } = opts
  const anchor = opts.anchor ?? 'left'
  const byH = 'h' in opts && opts.h != null
  const dim = byH ? opts.h! : opts.w!

  const iconSpr = S(url)
  const texW = iconSpr.texture.width || dim
  const texH = iconSpr.texture.height || dim
  if (byH) {
    iconSpr.height = dim
    iconSpr.width = Math.round((dim / texH) * texW)
  } else {
    iconSpr.width = dim
    iconSpr.height = Math.round((dim / texW) * texH)
  }

  const group = new PIXI.Container()
  click(group, onClick)
  group.position.set(anchor === 'right' ? x - iconSpr.width : x, y)
  root.addChild(group)

  // 圆形白底（仅 icon 素材本身无背景时绘制）
  if (withCircleBg) {
    const r = dim / 2
    const circ = new PIXI.Graphics()
    circ.lineStyle(2, C_BORDER, 1)
    circ.beginFill(C_ICON_BG, 0.95)
    circ.drawCircle(r, r, r)
    circ.endFill()
    group.addChild(circ)

    // 图标居中缩小放在圆底内（留边距）
    const innerSize = Math.round(dim * 0.6)
    iconSpr.width = innerSize
    iconSpr.height = Math.round((innerSize / texW) * texH)
    iconSpr.position.set(
      r - iconSpr.width / 2,
      r - iconSpr.height / 2
    )
  }

  group.addChild(iconSpr)

  // 文字标签（白色 + 黑描边，贴图标底部）
  const lbl = TStroke(label, 22, 0xFFFFFF, '700')
  lbl.anchor.set(0.5, 0)
  lbl.position.set(iconSpr.width / 2 + (withCircleBg ? (dim - iconSpr.width) / 2 : 0), dim + 4)
  group.addChild(lbl)

  return group
}
