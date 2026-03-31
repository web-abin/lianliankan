/**
 * 卡皮巴拉连连看 — 首页 UI
 * 布局坐标：宽 750（DESIGN_REF_W），高为与屏同比例的 designLayoutH；sw/sh 见 core 的 windowWidth/windowHeight
 *
 * 布局层次（上→下）
 *   顶部状态栏  (贴屏顶，下移安全区 +10px，见 STATUS_Y)
 *   左侧功能入口 圈子好礼 / 添加桌面 / 商店 / 主题
 *   中央标题   卡皮巴拉连连看（水平居中）
 *   右侧功能入口 喊人 / 每日奖励 / 排行榜 / 每日挑战
 *   场景区     挂画 / 卡皮巴拉（组合居逻辑屏正中）
 *   开始游戏按钮
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

// 所有图片路径（统一在此定义，方便路由预加载）
export const ASSET_URLS = [
  'assets/scene/home/bg-home.jpg',
  'assets/scene/home/painting.png',
  'assets/scene/home/flower1.png',
  'assets/scene/home/flower2.png',
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
  'assets/icon/range.png'
] as const

/** 首页卡皮巴拉序列帧大图（启动 loading 页会预加载至 GPU 就绪） */
export const ROLE_SHEET_URL =
  'http://tcp690219.hn-bkt.clouddn.com/role.webp'

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
  //    左：设置按钮   设置按钮右侧 18px：金币槽 + 爱心槽（各自独立 pill 背景）
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
  // root.position.y = sh - DESIGN_H * dr，所以 designY = (physY - rootTopY) / dr
  const STATUS_CY = (menuCY - (sh - DESIGN_H * dr)) / dr

  const SETTING_SIZE = 84
  const SLOT_H = 58                          // 槽高
  const SLOT_W = 200                         // 槽宽
  const SLOT_GAP = 14                        // 两槽间距
  const SLOT_R = SLOT_H / 2                  // 圆角 → pill 形
  const SLOT1_X = 18 + SETTING_SIZE + 18    // = 120
  const SLOT2_X = SLOT1_X + SLOT_W + SLOT_GAP

  // 设置按钮 & 槽均以 STATUS_CY 为中心
  const SETTING_Y = STATUS_CY - SETTING_SIZE / 2
  const SLOT_Y = STATUS_CY - SLOT_H / 2

  // 设置按钮
  const settingBtn = S('assets/button/setting.png')
  settingBtn.width = SETTING_SIZE
  settingBtn.height = SETTING_SIZE
  settingBtn.position.set(18, SETTING_Y)
  click(settingBtn, onSettings)
  root.addChild(settingBtn)

  // 画 pill 背景（圆角矩形，暖米色填充 + 棕色描边）
  function slotBg(x: number): PIXI.Graphics {
    const g = new PIXI.Graphics()
    g.lineStyle(2.5, 0x9a5e28, 1)
    g.beginFill(0xfaecd0, 0.92)
    g.drawRoundedRect(x, SLOT_Y, SLOT_W, SLOT_H, SLOT_R)
    g.endFill()
    return g
  }
  root.addChild(slotBg(SLOT1_X))
  root.addChild(slotBg(SLOT2_X))

  // 金币槽 — 金币图标 + 数值 + 加号
  const goldIcon = S('assets/icon/gold.png')
  goldIcon.width = 44
  goldIcon.height = 44
  goldIcon.position.set(SLOT1_X + 10, SLOT_Y + 7)
  root.addChild(goldIcon)

  const goldText = T(String(coins), 28, 0x5a2800, '700')
  goldText.anchor.set(0, 0.5)
  goldText.position.set(SLOT1_X + 60, STATUS_CY)
  root.addChild(goldText)

  const goldPlus = S('assets/icon/plus.png')
  goldPlus.width = 38
  goldPlus.height = 38
  goldPlus.position.set(SLOT1_X + SLOT_W - 46, SLOT_Y + 10)
  root.addChild(goldPlus)

  // 爱心槽 — 爱心图标 + 数值 + 加号
  const heartIcon = S('assets/icon/love.png')
  heartIcon.width = 44
  heartIcon.height = 40
  heartIcon.position.set(SLOT2_X + 10, SLOT_Y + 9)
  root.addChild(heartIcon)

  const heartText = T(`${hearts}/${maxHearts}`, 28, 0x5a2800, '700')
  heartText.anchor.set(0, 0.5)
  heartText.position.set(SLOT2_X + 60, STATUS_CY)
  root.addChild(heartText)

  const heartPlus = S('assets/icon/plus.png')
  heartPlus.width = 38
  heartPlus.height = 38
  heartPlus.position.set(SLOT2_X + SLOT_W - 46, SLOT_Y + 10)
  root.addChild(heartPlus)

  // ════════════════════════════════════════════════════════
  // 2. 左侧功能入口：圈子好礼 / 添加桌面
  // ════════════════════════════════════════════════════════

  const baseY = DESIGN_H / 2 - 440
  const gap = 160
  /** 左右侧入口统一按图标高度缩放，保证同一行左右图标顶/底对齐 */
  const ICON_ENTRY_W = 90

  const LENTRY_X = 20
  const circleBtn = sideEntry(root, {
    url: 'assets/button/circle.png',
    label: '圈子好礼',
    x: LENTRY_X,
    y: baseY,
    w: ICON_ENTRY_W,
    onClick: onGift
  })
  void circleBtn

  sideEntry(root, {
    url: 'assets/button/desk.png',
    label: '添加桌面',
    x: LENTRY_X,
    y: baseY + gap,
    w: ICON_ENTRY_W,
    onClick: onDesk
  })

  sideEntry(root, {
    url: 'assets/icon/shop.png',
    label: '商店',
    x: LENTRY_X,
    y: baseY + 2 * gap,
    w: ICON_ENTRY_W,
    onClick: onShop
  })
  sideEntry(root, {
    url: 'assets/icon/theme.png',
    label: '主题',
    x: LENTRY_X,
    y: baseY + 3 * gap,
    w: ICON_ENTRY_W,  
    onClick: onTheme
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
  titleSpr.position.set(DESIGN_W / 2, baseY)
  root.addChild(titleSpr)

  // ════════════════════════════════════════════════════════
  // 4. 右侧功能入口：喊人 / 每日奖励
  // ════════════════════════════════════════════════════════

  /** 右侧图标右缘对齐到设计稿右缘内边距（宽度随资源变化） */
  const RENTRY_ICON_RIGHT = DESIGN_W - LENTRY_X

  sideEntry(root, {
    url: 'assets/button/invite.png',
    label: '喊人',
    x: RENTRY_ICON_RIGHT,
    y: baseY,
    w: ICON_ENTRY_W,
    anchor: 'right',
    onClick: onShout
  })

  sideEntry(root, {
    url: 'assets/button/daily.png',
    label: '每日奖励',
    x: RENTRY_ICON_RIGHT,
    y: baseY + gap,
    w: ICON_ENTRY_W,  
    anchor: 'right',
    onClick: onReward
  })

  sideEntry(root, {
    url: 'assets/icon/range.png',
    label: '排行榜',
    x: RENTRY_ICON_RIGHT,
    y: baseY + 2 * gap,
    w: ICON_ENTRY_W,
    anchor: 'right',
    onClick: onRank
  })
  sideEntry(root, {
    url: 'assets/button/challenge.png',
    label: '每日挑战',
    x: RENTRY_ICON_RIGHT,
    y: baseY + 3 * gap,
    w: ICON_ENTRY_W,  
    anchor: 'right',
    onClick: onDailyChallenge
  })

  // ════════════════════════════════════════════════════════
  // 5. 场景区
  // ════════════════════════════════════════════════════════

  // 挂画（painting.png 200×262 → 宽 82）
  // const paintingSpr = S('assets/scene/home/painting.png')
  // paintingSpr.width = 82
  // paintingSpr.height = Math.round((82 / 200) * 262) // ≈ 107
  // paintingSpr.position.set(130, (DESIGN_H * 2) / 5)
  // root.addChild(paintingSpr)

  // 花盆1 左侧小盆（flower2.png 120×150 → 宽 90）
  // const flower2Spr = S('assets/scene/home/flower2.png')
  // flower2Spr.width = 90
  // flower2Spr.height = Math.round((90 / 120) * 150) // ≈ 113
  // flower2Spr.position.set(DESIGN_W - 140, (DESIGN_H * 4.5) / 7)
  // root.addChild(flower2Spr)

  // 花盆2 右侧大盆（flower1.png 200×365 → 宽 125）
  // const flower1Spr = S('assets/scene/home/flower1.png')
  // flower1Spr.width = 125
  // flower1Spr.height = Math.round((125 / 200) * 365) // ≈ 228
  // flower1Spr.position.set(DESIGN_W - 140, (DESIGN_H * 4) / 7)
  // root.addChild(flower1Spr)

  // 卡皮巴拉待机动画
  const heroGroup = new PIXI.Container()
  heroGroup.position.set(DESIGN_W / 2, Math.round(DESIGN_H / 2))
  const jsonUrl = 'assets/animate/spritesheet/spritesheet.json'
  const base = PIXI.BaseTexture.from(ROLE_SHEET_URL)
  const build = async () => {
    const frames: PIXI.Texture[] = []
    let json: any = null
    try {
      const txt = (await readFile({ filePath: jsonUrl, encoding: 'utf-8' })) as string
      json = JSON.parse(txt)
    } catch (_) {}
    if (Array.isArray(json?.frames)) {
      for (const f of json.frames) {
        const { x, y, w, h } = f.frame
        frames.push(new PIXI.Texture(base, new PIXI.Rectangle(x, y, w, h)))
      }
    } else if (json?.frames && typeof json.frames === 'object') {
      const keys = Object.keys(json.frames).sort((a, b) => {
        const na = Number(a.match(/(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER)
        const nb = Number(b.match(/(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER)
        return na - nb || a.localeCompare(b)
      })
      for (const k of keys) {
        const f = json.frames[k]
        const { x, y, w, h } = f.frame
        frames.push(new PIXI.Texture(base, new PIXI.Rectangle(x, y, w, h)))
      }
    }
    if (frames.length === 0) {
      const w = base.width
      const h = base.height
      const total = 118
      const factors = [
        [11, 11],
        [11, 10],
        [10, 11],
        [10, 12],
        [12, 10],
        [8, 15],
        [15, 8],
        [6, 20],
        [20, 6],
        [5, 24],
        [24, 5],
        [4, 30],
        [30, 4]
      ]
      let cols = 10
      let rows = 12
      for (const [c, r] of factors) {
        if (w % c === 0 && h % r === 0) {
          cols = c
          rows = r
          break
        }
      }
      const tileW = Math.floor(w / cols)
      const tileH = Math.floor(h / rows)
      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / cols)
        const c = i % cols
        const rect = new PIXI.Rectangle(c * tileW, r * tileH, tileW, tileH)
        frames.push(new PIXI.Texture(base, rect))
      }
    }
    const roleAnim = new PIXI.AnimatedSprite(frames)
    roleAnim.anchor.set(0.5, 0.5)
    const targetW = Math.round((DESIGN_W * 2) / 3)
    const fw =
      (Array.isArray(json?.frames)
        ? (json?.frames?.[0]?.frame?.w as number)
        : (() => {
            try {
              const firstKey = json?.frames ? Object.keys(json.frames).sort((a, b) => {
                const na = Number(a.match(/(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER)
                const nb = Number(b.match(/(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER)
                return na - nb || a.localeCompare(b)
              })[0] : undefined
              return firstKey ? (json.frames[firstKey]?.frame?.w as number) : undefined
            } catch {
              return undefined
            }
          })()) ||
      (frames[0] as any)?.orig?.width ||
      frames[0].width ||
      1
    roleAnim.scale.set(targetW / fw)
    roleAnim.loop = true
    roleAnim.animationSpeed = 0.4
    roleAnim.play()
    heroGroup.addChild(roleAnim)
  }
  if (base.valid) build()
  else base.once('loaded', build)
  root.addChild(heroGroup)
  // ════════════════════════════════════════════════════════
  // 6. 开始游戏按钮（距设计稿底边留白，与原先底栏+间距等效）
  // ════════════════════════════════════════════════════════

  const START_BTN_H = Math.round((545 / 600) * 184) // start.png 高度 ≈ 167
  const START_ABOVE_DESIGN_BOTTOM = 220 // 原底栏 140 + 与底栏间距 80

  const startGroup = new PIXI.Container()
  click(startGroup, onStart)
  startGroup.position.set(
    DESIGN_W / 2,
    DESIGN_H - START_ABOVE_DESIGN_BOTTOM - Math.round(START_BTN_H / 2)
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

/** 侧边功能入口（图标 + 文字标签）；`w`/`h` 二选一；`anchor` 为 right 时 `x` 为图标右缘 */
function sideEntry(
  root: PIXI.Container,
  opts: {
    url: string
    label: string
    x: number
    y: number
    onClick: () => void
    anchor?: 'left' | 'right'
  } & ({ w: number; h?: never } | { w?: never; h: number })
) {
  const { url, label, x, y, onClick } = opts
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
  group.addChild(iconSpr)

  const lbl = T(label, 22, 0x5a2d0c, '700')
  lbl.anchor.set(0.5, 0)
  lbl.position.set(iconSpr.width / 2, iconSpr.height + 4)
  group.addChild(lbl)

  return group
}
