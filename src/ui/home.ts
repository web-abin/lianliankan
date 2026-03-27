/**
 * 卡皮巴拉连连看 — 首页 UI
 * 布局坐标：宽 750（DESIGN_REF_W），高为与屏同比例的 designLayoutH；sw/sh 见 core 的 windowWidth/windowHeight
 *
 * 布局层次（上→下）
 *   顶部状态栏  (贴屏顶，下移安全区 +10px，见 STATUS_Y)
 *   左侧功能入口 圈子好礼 / 添加桌面
 *   中央标题   卡皮巴拉连连看（水平居中）
 *   右侧功能入口 喊人 / 每日奖励
 *   场景区     挂画 / 植物 / 卡皮巴拉+茶几（组合居逻辑屏正中）/ 每日挑战
 *   开始游戏按钮
 *   底部导航栏  商店 / 主题 / 主页 / 排行榜
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

/** 标题图宽度占设计稿宽的比例 */
const TITLE_WIDTH_W_RATIO = 420 / DESIGN_REF_W

// 所有图片路径（统一在此定义，方便路由预加载）
export const ASSET_URLS = [
  'assets/scene/home/bg-home.jpg',
  'assets/scene/home/status-bg.png',
  'assets/scene/home/painting.png',
  'assets/scene/home/home-table.png',
  'assets/scene/home/home-footer.png',
  'assets/scene/home/flower1.png',
  'assets/scene/home/flower2.png',
  'assets/scene/common/role.png',
  'assets/text/ka-pi-ba-la.png',
  'assets/button/setting.png',
  'assets/button/circle.png',
  'assets/button/desk.png',
  'assets/button/invite.png',
  'assets/button/daily.png',
  'assets/button/challenge.png',
  'assets/button/start.png',
  'assets/icon/gold.png',
  'assets/icon/love.png',
  'assets/icon/plus.png',
  'assets/icon/shop.png',
  'assets/icon/theme.png',
  'assets/icon/home.png',
  'assets/icon/range.png'
] as const

export interface HomeOptions {
  level?: number
  coins?: number
  hearts?: number
  maxHearts?: number
  onStart?: () => void
  onSettings?: () => void
  onGift?: () => void
  onShout?: () => void
  onDesk?: () => void
  onReward?: () => void
  onDailyChallenge?: () => void
  onShop?: () => void
  onTheme?: () => void
  onHome?: () => void
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
    onGift = noop,
    onShout = noop,
    onDesk = noop,
    onReward = noop,
    onDailyChallenge = noop,
    onShop = noop,
    onTheme = noop,
    onHome = noop,
    onRank = noop
  } = opts

  const sw = windowWidth
  const sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH

  // ── wrapper：无 transform，背景用真实屏幕像素铺满 ────────
  const wrapper = new PIXI.Container()

  // ── 背景图（cover 全屏）──────────────────────────────────
  const BG_W = 1080,
    BG_H = 1936
  const bgSpr = S('assets/scene/home/bg-home.jpg')
  const bgScale = Math.max(sw / BG_W, sh / BG_H)
  bgSpr.scale.set(bgScale)
  bgSpr.position.set((sw - BG_W * bgScale) / 2, (sh - BG_H * bgScale) / 2)
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
  //    左：设置按钮   右：status-bg（金币槽 + 爱心槽）
  // ════════════════════════════════════════════════════════

  // status-bg.png (500×124) → 显示 610×152，右端对齐 x=734
  const STATUS_W = 610
  const STATUS_X = DESIGN_W - STATUS_W - 10 // x ≈ 124
  const STATUS_H = Math.round((STATUS_W / 500) * 124) // ≈ 151
  /** 设计坐标系内：顶边 = 屏上「安全区顶 + 10px」对应到 root 内 y */
  const STATUS_Y = (safeAreaTopPx + 40) / dr
  const STATUS_CY = STATUS_Y + STATUS_H / 2

  // 状态栏背景
  const statusBg = S('assets/scene/home/status-bg.png')
  statusBg.width = STATUS_W
  statusBg.height = STATUS_H
  statusBg.position.set(STATUS_X, STATUS_Y)
  root.addChild(statusBg)

  // 设置按钮（setting.png 160×152 → 80×76）
  // 垂直与状态栏居中对齐
  const settingBtn = S('assets/button/setting.png')
  settingBtn.width = 84
  settingBtn.height = 84
  settingBtn.position.set(18, Math.round(STATUS_CY - 38))
  click(settingBtn, onSettings)
  root.addChild(settingBtn)

  // 状态栏内部：status-bg 有左右两个槽
  // 根据图片结构：左槽占 35%，间隔 11%，右槽占 35%，两端各 ~7%
  const SLOT_W = Math.round(STATUS_W * 0.35) // ≈ 213
  const SLOT1_X = STATUS_X + Math.round(STATUS_W * 0.07) // 左槽起点
  const SLOT2_X = SLOT1_X + SLOT_W + Math.round(STATUS_W * 0.11) // 右槽起点

  // 金币槽 — 金币图标 + 数值 + 加号
  const goldIcon = S('assets/icon/gold.png')
  goldIcon.width = 50
  goldIcon.height = 50
  goldIcon.position.set(SLOT1_X + 38, Math.round(STATUS_CY - 24))
  root.addChild(goldIcon)

  const goldText = T(String(coins), 28, 0x5a2800, '700')
  goldText.anchor.set(0, 0.5)
  goldText.position.set(SLOT1_X + 100, STATUS_CY)
  root.addChild(goldText)

  const goldPlus = S('assets/icon/plus.png')
  goldPlus.width = 44
  goldPlus.height = 44
  goldPlus.position.set(SLOT1_X + SLOT_W + 4, Math.round(STATUS_CY - 24))
  root.addChild(goldPlus)

  // 爱心槽 — 爱心图标 + 数值 + 加号
  const heartIcon = S('assets/icon/love.png')
  heartIcon.width = 50
  heartIcon.height = 46
  heartIcon.position.set(SLOT2_X + 30, Math.round(STATUS_CY - 24))
  root.addChild(heartIcon)

  const heartText = T(`${hearts}/${maxHearts}`, 28, 0x5a2800, '700')
  heartText.anchor.set(0, 0.5)
  heartText.position.set(SLOT2_X + 100, STATUS_CY)
  root.addChild(heartText)

  const heartPlus = S('assets/icon/plus.png')
  heartPlus.width = 44
  heartPlus.height = 44
  heartPlus.position.set(SLOT2_X + SLOT_W + 4, Math.round(STATUS_CY - 24))
  root.addChild(heartPlus)

  // ════════════════════════════════════════════════════════
  // 2. 左侧功能入口：圈子好礼 / 添加桌面
  // ════════════════════════════════════════════════════════

  // 圈子好礼（circle.png 160×149 → 110×102）
  const LENTRY_X = 10
  const circleBtn = sideEntry(root, {
    url: 'assets/button/circle.png',
    label: '圈子好礼',
    x: LENTRY_X,
    y: safeAreaTopPx + 320,
    w: 110,
    onClick: onGift
  })
  void circleBtn

  // 添加桌面（desk.png 160×136 → 110×94）
  sideEntry(root, {
    url: 'assets/button/desk.png',
    label: '添加桌面',
    x: LENTRY_X,
    y: safeAreaTopPx + 480,
    w: 110,
    onClick: onDesk
  })

  // ════════════════════════════════════════════════════════
  // 3. 标题：卡皮巴拉连连看（水平居中）
  // ════════════════════════════════════════════════════════

  // ka-pi-ba-la.png 源 700×376，宽度按逻辑屏宽比例缩放
  const titleW = Math.round(DESIGN_W * TITLE_WIDTH_W_RATIO)
  const titleSpr = S('assets/text/ka-pi-ba-la.png')
  titleSpr.width = titleW
  titleSpr.height = Math.round((titleW / 700) * 376)
  titleSpr.anchor.set(0.5, 0)
  titleSpr.position.set(DESIGN_W / 2, safeAreaTopPx + 320)
  root.addChild(titleSpr)

  // ════════════════════════════════════════════════════════
  // 4. 右侧功能入口：喊人 / 每日奖励
  // ════════════════════════════════════════════════════════

  const RENTRY_X = DESIGN_W - 120

  // 喊人（invite.png 160×139 → 100×87）
  sideEntry(root, {
    url: 'assets/button/invite.png',
    label: '喊人',
    x: RENTRY_X,
    y: safeAreaTopPx + 320,
    w: 100,
    onClick: onShout
  })

  // 每日奖励（daily.png 160×152 → 100×95）
  sideEntry(root, {
    url: 'assets/button/daily.png',
    label: '每日奖励',
    x: RENTRY_X,
    y: safeAreaTopPx + 480,
    w: 100,
    onClick: onReward
  })

  // ════════════════════════════════════════════════════════
  // 5. 场景区
  // ════════════════════════════════════════════════════════

  // 挂画（painting.png 200×262 → 宽 82）
  const paintingSpr = S('assets/scene/home/painting.png')
  paintingSpr.width = 82
  paintingSpr.height = Math.round((82 / 200) * 262) // ≈ 107
  paintingSpr.position.set(130, (DESIGN_H * 2) / 5)
  root.addChild(paintingSpr)

  // 花盆1 左侧小盆（flower2.png 120×150 → 宽 90）
  const flower2Spr = S('assets/scene/home/flower2.png')
  flower2Spr.width = 90
  flower2Spr.height = Math.round((90 / 120) * 150) // ≈ 113
  flower2Spr.position.set(-8, (DESIGN_H * 4) / 7 - 20)
  root.addChild(flower2Spr)

  // 花盆2 右侧大盆（flower1.png 200×365 → 宽 125）
  const flower1Spr = S('assets/scene/home/flower1.png')
  flower1Spr.width = 125
  flower1Spr.height = Math.round((125 / 200) * 365) // ≈ 228
  flower1Spr.position.set(DESIGN_W - 140, (DESIGN_H * 4) / 7)
  root.addChild(flower1Spr)

  // 茶几 + 卡皮巴拉：脚底落在茶几顶面，组合外接矩形中心在设计稿 (DESIGN_W/2, DESIGN_H/2)
  const TABLE_W = 400
  const tableSpr = S('assets/scene/home/home-table.png')
  tableSpr.width = TABLE_W
  tableSpr.height = Math.round((TABLE_W / 360) * 115)
  const roleSpr = S('assets/scene/common/role.png')
  roleSpr.width = 265
  roleSpr.height = Math.round((265 / 800) * 1089)
  const th = tableSpr.height
  const rh = roleSpr.height
  // 脚底相对茶几顶下移 th/2，像坐在茶几上；外接矩形中心仍落在组原点
  const bottomY = th / 4 + rh / 2
  const heroGroup = new PIXI.Container()
  heroGroup.position.set(DESIGN_W / 2, DESIGN_H / 2 + safeAreaTopPx + 40)
  tableSpr.anchor.set(0.5, 1)
  tableSpr.position.set(0, bottomY)
  roleSpr.anchor.set(0.5, 1)
  roleSpr.position.set(0, bottomY - (th * 2) / 3)
  heroGroup.addChild(tableSpr)
  heroGroup.addChild(roleSpr)
  root.addChild(heroGroup)

  // 每日挑战按钮（challenge.png 180×205 → 宽 112）
  const challengeGroup = new PIXI.Container()
  click(challengeGroup, onDailyChallenge)
  challengeGroup.position.set(DESIGN_W - 120, DESIGN_H /2 - 60)
  root.addChild(challengeGroup)

  const challengeSpr = S('assets/button/challenge.png')
  challengeSpr.width = 112
  challengeSpr.height = Math.round((112 / 180) * 205) // ≈ 128
  challengeGroup.addChild(challengeSpr)

  const challengeLabel = T('每日挑战', 22, 0x5a2d0c, '700')
  challengeLabel.anchor.set(0.5, 0)
  challengeLabel.position.set(36, 132)
  challengeGroup.addChild(challengeLabel)

  // ════════════════════════════════════════════════════════
  // 6. 开始游戏按钮（底边与菜单栏顶相距 80px，见下方 NAV_TOP）
  // ════════════════════════════════════════════════════════

  // 底部：木板条紧贴菜单栏上方，菜单栏铺满至设计稿底边 y=DESIGN_H
  const FOOTER_H = Math.round((DESIGN_W / 600) * 75)
  const NAV_H = 140
  const NAV_TOP = DESIGN_H - NAV_H
  const START_BTN_H = Math.round((545 / 600) * 184) // start.png 高度 ≈ 167

  const startGroup = new PIXI.Container()
  click(startGroup, onStart)
  // 按钮 anchor 0.5,0.5 → 底边 y = centerY + START_BTN_H/2；与菜单栏顶间隔 80
  startGroup.position.set(
    DESIGN_W / 2,
    NAV_TOP - 80 - Math.round(START_BTN_H / 2)
  )
  root.addChild(startGroup)

  // 按钮底图（start.png 600×184 → 宽 545）
  const startBg = S('assets/button/start.png')
  startBg.width = 480
  startBg.height = START_BTN_H
  startBg.anchor.set(0.5, 0.5)
  startGroup.addChild(startBg)

  // "开始游戏" 文字
  const startL1 = new PIXI.Text('开始游戏', {
    fontFamily: 'sans-serif',
    fontSize: 50,
    fill: 0x5c2200,
    fontWeight: '900',
    letterSpacing: 24
  })
  startL1.anchor.set(0.5, 1)
  startL1.position.set(0, -4)
  startGroup.addChild(startL1)

  // "第 x 关" 文字
  const startL2 = T(`第 ${level} 关`, 30, 0x7a3000, '700')
  startL2.anchor.set(0.5, 0)
  startL2.position.set(0, 6)
  startGroup.addChild(startL2)

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

  // ════════════════════════════════════════════════════════
  // 7. 底部导航栏（木板为最底层背景，半透明色叠在木板上，图标与文字最上层）
  // ════════════════════════════════════════════════════════

  const BOTTOM_BG_H = NAV_H
  // 木板铺满底部整条（原装饰条 + 导航区），先加入 root 保证在菜单内容之下
  const footerSpr = S('assets/scene/home/home-footer.png')
  footerSpr.width = DESIGN_W
  footerSpr.height = BOTTOM_BG_H
  footerSpr.position.set(0, DESIGN_H - BOTTOM_BG_H)
  root.addChild(footerSpr)

  // 半透明暖色叠在木板上，不盖住木纹
  const navBg = new PIXI.Graphics()
  navBg.beginFill(0xc8924a, 0.42)
  navBg.drawRect(0, NAV_TOP, DESIGN_W, NAV_H)
  navBg.endFill()
  root.addChild(navBg)

  // 4 个导航项
  const NAV_ITEMS = [
    {
      url: 'assets/icon/shop.png',
      label: '商店',
      active: false,
      onClick: onShop
    },
    {
      url: 'assets/icon/theme.png',
      label: '主题',
      active: false,
      onClick: onTheme
    },
    {
      url: 'assets/icon/home.png',
      label: '主页',
      active: true,
      onClick: onHome
    },
    {
      url: 'assets/icon/range.png',
      label: '排行榜',
      active: false,
      onClick: onRank
    }
  ]
  const CELL_W = DESIGN_W / NAV_ITEMS.length // 187.5

  NAV_ITEMS.forEach((item, i) => {
    const cx = Math.round(CELL_W * i + CELL_W / 2)
    const cell = new PIXI.Container()
    click(cell, item.onClick)
    cell.position.set(cx, NAV_TOP + 14)
    root.addChild(cell)

    // 导航图标（各图标约 80×70 → 显示 72px 宽）
    const iconSpr = S(item.url)
    iconSpr.width = 72
    iconSpr.height = Math.round((72 / 80) * 72) // ≈ 65（近似，各图标高度略不同）
    iconSpr.anchor.set(0.5, 0)
    cell.addChild(iconSpr)

    // 主页图标激活高亮背景
    if (item.active) {
      const hl = new PIXI.Graphics()
      hl.beginFill(0xe8a030, 0.35)
      hl.drawRoundedRect(-44, -6, 88, 88, 16)
      hl.endFill()
      cell.addChildAt(hl, 0)
    }

    // 导航文字标签
    const lbl = T(
      item.label,
      24,
      item.active ? 0xc85000 : 0x7a5533,
      item.active ? '700' : '400'
    )
    lbl.anchor.set(0.5, 0)
    lbl.position.set(0, 72)
    cell.addChild(lbl)
  })

  parent.addChild(wrapper)
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

/** 创建 Text */
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

/** 让任意 DisplayObject 可点击 */
function click<T extends PIXI.DisplayObject>(obj: T, fn: () => void): T {
  ;(obj as any).interactive = true
  ;(obj as any).buttonMode = true
  obj.on('pointerdown', fn)
  return obj
}

/** 侧边功能入口（图标 + 文字标签） */
function sideEntry(
  root: PIXI.Container,
  opts: {
    url: string
    label: string
    x: number
    y: number
    w: number
    onClick: () => void
  }
) {
  const { url, label, x, y, w, onClick } = opts

  const group = new PIXI.Container()
  click(group, onClick)
  group.position.set(x, y)
  root.addChild(group)

  const iconSpr = S(url)
  // 等比缩放到目标宽度（纹理已预加载，width 有效）
  const texW = iconSpr.texture.width || w
  const texH = iconSpr.texture.height || w
  iconSpr.width = w
  iconSpr.height = Math.round((w / texW) * texH)
  group.addChild(iconSpr)

  const lbl = T(label, 22, 0x5a2d0c, '700')
  lbl.anchor.set(0.5, 0)
  lbl.position.set(w / 2, iconSpr.height + 4)
  group.addChild(lbl)

  return group
}
