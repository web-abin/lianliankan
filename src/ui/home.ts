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
  'assets/live2d/role/body1.png',
  'assets/live2d/role/ear-left.png',
  'assets/live2d/role/ear-right.png',
  'assets/live2d/role/eye-left.png',
  'assets/live2d/role/eye-left-close.png',
  'assets/live2d/role/eye-right.png',
  'assets/live2d/role/eye-right-close.png',
  'assets/live2d/role/eyebrow-left.png',
  'assets/live2d/role/eyebrow-right.png',
  'assets/live2d/role/head.png',
  'assets/live2d/role/leg-left.png',
  'assets/live2d/role/leg-left-behind.png',
  'assets/live2d/role/leg-right.png',
  'assets/live2d/role/leg-right-behind.png',
  'assets/live2d/role/mouth-close.png',
  'assets/live2d/role/mouth-open.png',
  'assets/live2d/role/water.png',
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

  // 茶几 + Live2D 卡皮巴拉：脚底落在茶几顶面，组合外接矩形中心在设计稿 (DESIGN_W/2, DESIGN_H/2)
  const TABLE_W = 400
  const tableSpr = S('assets/scene/home/home-table.png')
  tableSpr.width = TABLE_W
  tableSpr.height = Math.round((TABLE_W / 360) * 115)
  const th = tableSpr.height
  const CAP_H = 354  // live2d 卡皮巴拉近似视觉高度（耳顶到脚底）
  const bottomY = th / 4 + CAP_H / 2
  const heroGroup = new PIXI.Container()
  heroGroup.position.set(DESIGN_W / 2, DESIGN_H / 2 + safeAreaTopPx + 40)
  tableSpr.anchor.set(0.5, 1)
  tableSpr.position.set(0, bottomY)
  heroGroup.addChild(tableSpr)
  // Live2D 卡皮巴拉（cap 原点 = 脚底，向上为负）
  const { capContainer, capTick } = buildCapybara()
  capContainer.position.set(0, bottomY - Math.round((th * 2) / 3))
  heroGroup.addChild(capContainer)
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
  startBg.width = 545
  startBg.height = START_BTN_H
  startBg.anchor.set(0.5, 0.5)
  startGroup.addChild(startBg)

  // "开始游戏" 文字
  const startL1 = new PIXI.Text('开始游戏', {
    fontFamily: 'sans-serif',
    fontSize: 50,
    fill: 0x5c2200,
    fontWeight: '900',
    letterSpacing: 12
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
    ticker.add(capTick)
  }
  const onWrapRemoved = () => {
    ticker.remove(breathe)
    ticker.remove(capTick)
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

/**
 * 构建 Live2D 风格卡皮巴拉动画
 *
 * 坐标系：cap 容器原点 = 脚底中心，向上为负 Y
 * 层级（后→前）：后腿 → 身体 → 前腿 → 头部组（耳→头→眉→眼→嘴）→ 水滴
 *
 * 动画：
 *  1. 身体呼吸（±3px 上下，3.2s 周期）
 *  2. 头部微摇摆（±1.3°，4.8s 周期）+ 随呼吸同步微移
 *  3. 眨眼（随机间隔 3-7s，0.18s 完成）
 *  4. 耳朵随机抖动（随机间隔 2.5-5.5s，0.22s 完成）
 *  5. 水滴从头顶上方落下（ease-in 加速，落地时拉伸 → 扁平消散）
 *  6. 水滴落地：头部下沉 + 弹回，嘴巴张开 0.55s
 */
function buildCapybara(): { capContainer: PIXI.Container; capTick: () => void } {
  const SC = 0.58  // 所有部件统一缩放比例

  // 缩放后各部件尺寸（px）
  const LH = Math.round(160 * SC)   // 腿高 ≈ 93
  const BH = Math.round(247 * SC)   // 身体高 ≈ 143
  const BW = Math.round(298 * SC)   // 身体宽 ≈ 173
  const HH = Math.round(194 * SC)   // 头高 ≈ 113
  const EAR_H = Math.round(62 * SC) // 耳高 ≈ 36

  // Y 基准（cap 原点 = 脚底，向上为负）
  const bodyBaseY = -(LH + Math.round(BH / 2) - 22)
  const headBaseY = -(LH + BH - 22 + Math.round(HH / 2))

  const cap = new PIXI.Container()

  // 工厂：创建缩放 + 锚点设置好的 Sprite
  function mk(url: string, ax = 0.5, ay = 0.5): PIXI.Sprite {
    const spr = PIXI.Sprite.from(url)
    spr.scale.set(SC)
    spr.anchor.set(ax, ay)
    return spr
  }

  // ── 后腿（在身体之下渲染）────────────────────────────────
  const legRightBehind = mk('assets/live2d/role/leg-right-behind.png', 0.5, 0)
  legRightBehind.position.set(Math.round(BW * 0.38), -LH)
  const legLeftBehind = mk('assets/live2d/role/leg-left-behind.png', 0.5, 0)
  legLeftBehind.position.set(-Math.round(BW * 0.36), -LH)

  // ── 身体 ─────────────────────────────────────────────────
  const body = mk('assets/live2d/role/body1.png')
  body.position.set(0, bodyBaseY)

  // ── 前腿（在身体之上渲染）────────────────────────────────
  const legRight = mk('assets/live2d/role/leg-right.png', 0.5, 0)
  legRight.position.set(Math.round(BW * 0.24), -LH + 10)
  const legLeft = mk('assets/live2d/role/leg-left.png', 0.5, 0)
  legLeft.position.set(-Math.round(BW * 0.21), -LH + 10)

  // ── 头部组（用于整体偏移动画）────────────────────────────
  const headGroup = new PIXI.Container()
  headGroup.position.set(8, headBaseY)

  // 耳朵：anchor 在底部（耳根），绕耳根旋转
  const earLeft = mk('assets/live2d/role/ear-left.png', 0.5, 1)
  earLeft.position.set(-Math.round(HH * 0.31), -Math.round(HH * 0.47))
  const earRight = mk('assets/live2d/role/ear-right.png', 0.5, 1)
  earRight.position.set(Math.round(HH * 0.37), -Math.round(HH * 0.47))

  const head = mk('assets/live2d/role/head.png')

  // 眼睛（open/close 叠放，close 默认隐藏）
  const eyeLeft = mk('assets/live2d/role/eye-left.png')
  eyeLeft.position.set(-Math.round(HH * 0.17), -Math.round(HH * 0.1))
  const eyeLeftClose = mk('assets/live2d/role/eye-left-close.png')
  eyeLeftClose.position.set(-Math.round(HH * 0.17), -Math.round(HH * 0.1))
  eyeLeftClose.visible = false

  const eyeRight = mk('assets/live2d/role/eye-right.png')
  eyeRight.position.set(Math.round(HH * 0.22), -Math.round(HH * 0.1))
  const eyeRightClose = mk('assets/live2d/role/eye-right-close.png')
  eyeRightClose.position.set(Math.round(HH * 0.22), -Math.round(HH * 0.1))
  eyeRightClose.visible = false

  // 眉毛
  const eyebrowLeft = mk('assets/live2d/role/eyebrow-left.png')
  eyebrowLeft.position.set(-Math.round(HH * 0.17), -Math.round(HH * 0.32))
  const eyebrowRight = mk('assets/live2d/role/eyebrow-right.png')
  eyebrowRight.position.set(Math.round(HH * 0.22), -Math.round(HH * 0.32))

  // 嘴巴（open/close 叠放）
  const mouthClose = mk('assets/live2d/role/mouth-close.png')
  mouthClose.position.set(Math.round(HH * 0.04), Math.round(HH * 0.2))
  const mouthOpen = mk('assets/live2d/role/mouth-open.png')
  mouthOpen.position.set(Math.round(HH * 0.04), Math.round(HH * 0.2))
  mouthOpen.visible = false

  // headGroup 层级：耳（后）→ 头 → 眉 → 眼 → 嘴（前）
  headGroup.addChild(earLeft)
  headGroup.addChild(earRight)
  headGroup.addChild(head)
  headGroup.addChild(eyebrowLeft)
  headGroup.addChild(eyebrowRight)
  headGroup.addChild(eyeLeft)
  headGroup.addChild(eyeLeftClose)
  headGroup.addChild(eyeRight)
  headGroup.addChild(eyeRightClose)
  headGroup.addChild(mouthClose)
  headGroup.addChild(mouthOpen)

  // cap 层级：后腿 → 身体 → 前腿 → 头部组
  cap.addChild(legRightBehind)
  cap.addChild(legLeftBehind)
  cap.addChild(body)
  cap.addChild(legRight)
  cap.addChild(legLeft)
  cap.addChild(headGroup)

  // ── 水滴（anchor 在顶部，落下方向） ──────────────────────
  const water = PIXI.Sprite.from('assets/live2d/role/water.png')
  water.scale.set(SC * 0.9)
  water.anchor.set(0.5, 0)
  // 水滴 X 对齐头部中心（headGroup 的 x 偏移）
  const WX = 8
  // 起始位置：头顶上方约 120px；落点：耳朵顶部附近
  const WY0 = headBaseY - Math.round(HH / 2) - EAR_H - 120
  const WY1 = headBaseY - Math.round(HH / 2) - EAR_H + 8
  water.position.set(WX, WY0)
  water.alpha = 0
  cap.addChild(water)

  // ── 动画状态 ─────────────────────────────────────────────
  let elapsed = 0

  // 眨眼
  let blinkCD = 2.5 + Math.random() * 2.5  // 倒计时（s）
  let blinkP = -1                            // -1=未眨眼，0~1=眨眼进度

  // 耳朵抖动
  let earCD = 1 + Math.random() * 2
  let earP = -1
  let earAmp = 0    // 含方向的幅度

  // 水滴
  type WPhase = 'wait' | 'fall' | 'impact'
  let wPhase: WPhase = 'wait'
  let wTimer = 0.5 + Math.random() * 0.5   // 首次水滴延迟
  let wT = 0                                // 当前阶段进度 0~1

  // 头部撞击下沉
  let headBobP = -1   // -1=未激活
  let mouthTimer = 0  // 张嘴剩余秒数

  const capTick = () => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt

    // 1. 身体呼吸（±3px，周期 3.2s）
    body.position.y = bodyBaseY + Math.sin(elapsed * (Math.PI * 2 / 3.2)) * 3

    // 2. 头部摇摆（±1.3°，4.8s 周期）+ 随呼吸同步微移
    const breatheShift = Math.sin(elapsed * (Math.PI * 2 / 3.2)) * 1.5
    const swayRot = Math.sin(elapsed * (Math.PI * 2 / 4.8)) * 0.023

    // 3. 眨眼
    blinkCD -= dt
    if (blinkCD <= 0 && blinkP < 0) blinkP = 0
    if (blinkP >= 0) {
      blinkP = Math.min(blinkP + dt * 5.5, 1)
      const closed = blinkP < 0.5
      eyeLeft.visible = !closed
      eyeRight.visible = !closed
      eyeLeftClose.visible = closed
      eyeRightClose.visible = closed
      if (blinkP >= 1) {
        blinkP = -1
        eyeLeft.visible = true
        eyeRight.visible = true
        eyeLeftClose.visible = false
        eyeRightClose.visible = false
        blinkCD = 3 + Math.random() * 4
      }
    }

    // 4. 耳朵抖动
    earCD -= dt
    if (earCD <= 0 && earP < 0) {
      earP = 0
      earAmp = (Math.random() > 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.1)
    }
    if (earP >= 0) {
      earP = Math.min(earP + dt * 4.5, 1)
      const w = earAmp * Math.sin(earP * Math.PI)
      earLeft.rotation = w * 0.65
      earRight.rotation = -w
      if (earP >= 1) {
        earP = -1
        earLeft.rotation = 0
        earRight.rotation = 0
        earCD = 2.5 + Math.random() * 3
      }
    }

    // 5. 水滴动画
    if (wPhase === 'wait') {
      wTimer -= dt
      if (wTimer <= 0) {
        wPhase = 'fall'
        wT = 0
        water.alpha = 1
        water.scale.set(SC * 0.9)
        water.position.set(WX, WY0)
      }
    } else if (wPhase === 'fall') {
      wT = Math.min(wT + dt * 1.15, 1)
      const ease = wT * wT  // ease-in 加速
      water.position.y = WY0 + (WY1 - WY0) * ease
      // 下落时纵向拉伸、横向微收
      water.scale.set(SC * 0.78, SC * (0.9 + wT * 0.12))
      if (wT >= 1) {
        wPhase = 'impact'
        wT = 0
        water.position.y = WY1
        // 触发头部下沉
        headBobP = 0
        // 触发张嘴
        mouthClose.visible = false
        mouthOpen.visible = true
        mouthTimer = 0.55
      }
    } else {  // impact
      wT = Math.min(wT + dt * 7, 1)
      // 扁平横向扩散 + 淡出
      water.scale.set(SC * 0.9 * (1 + wT * 2.5), SC * 0.9 * (1 - wT) * 0.3)
      water.alpha = 1 - wT
      if (wT >= 1) {
        wPhase = 'wait'
        wTimer = 1.8 + Math.random() * 1.6
        water.alpha = 0
      }
    }

    // 6. 头部撞击下沉 + 弹回
    let headBobOffset = 0
    if (headBobP >= 0) {
      headBobP = Math.min(headBobP + dt * 4.5, 1)
      // 正弦波：先下沉后弹回
      headBobOffset = 11 * Math.sin(headBobP * Math.PI) * (1 - headBobP * 0.35)
      if (headBobP >= 1) headBobP = -1
    }

    // 综合更新头部位置和旋转
    headGroup.position.y = headBaseY + breatheShift + headBobOffset
    headGroup.rotation = swayRot

    // 7. 还原嘴巴
    if (mouthTimer > 0) {
      mouthTimer -= dt
      if (mouthTimer <= 0) {
        mouthClose.visible = true
        mouthOpen.visible = false
      }
    }
  }

  return { capContainer: cap, capTick }
}

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
