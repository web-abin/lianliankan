/**
 * 首页精灵图帧定义
 * 图片: home-res.png (2048 × 3672)
 *
 * 坐标格式: [x, y, width, height]
 */
import * as PIXI from 'pixi.js'

export const SHEET_URL = 'home-res.png'

export type FrameDef = [number, number, number, number]

export const FRAMES = {
  // ── 背景 ───────────────────────────────────────────
  bgRoom:      [0,    2735, 1075, 885]  as FrameDef, // 房间完整背景(墙+地板)

  // ── 顶部 UI ────────────────────────────────────────
  gearBtn:     [425,  0,    135,  130]  as FrameDef, // 设置齿轮按钮
  coinBar:     [557,  0,    383,  130]  as FrameDef, // 金币计数栏
  heartBar:    [557,  140,  383,  130]  as FrameDef, // 血量/爱心计数栏

  // ── 标题 ───────────────────────────────────────────
  title:       [440,  510,  650,  220]  as FrameDef, // 卡皮巴拉连连看 艺术字

  // ── 开始游戏按钮 ───────────────────────────────────
  btnStart:    [0,    1248, 398,  144]  as FrameDef, // 橙色开始游戏/第x关按钮

  // ── 左侧功能入口图标 ───────────────────────────────
  iconGift:    [1455, 383,  240,  277]  as FrameDef, // 图子好礼
  iconShout:   [1700, 383,  268,  277]  as FrameDef, // 喊人
  iconDesk:    [1455, 670,  240,  280]  as FrameDef, // 添加桌面
  iconReward:  [1700, 670,  268,  280]  as FrameDef, // 每日奖励

  // ── 底部导航 ───────────────────────────────────────
  navShopOff:     [1440, 970,  210, 210] as FrameDef, // 商店(未选中)
  navPaletteOff:  [1650, 970,  210, 210] as FrameDef, // 主题(未选中)
  navHomeOff:     [1440, 1390, 210, 215] as FrameDef, // 主页(未选中)
  navHomeOn:      [1650, 1390, 210, 215] as FrameDef, // 主页(选中,橙色背景)
  navTrophy:      [1860, 1390, 180, 215] as FrameDef, // 排行战

  // ── 卡皮巴拉角色 ────────────────────────────────────
  capiSleeping:  [516, 1638, 430, 430]  as FrameDef, // 睡觉姿势(戴帽子围巾)

  // ── 场景道具 ────────────────────────────────────────
  table:       [10,  2135, 440,  195]  as FrameDef,  // 木质茶几/小桌
  devil:       [450, 2150, 260,  280]  as FrameDef,  // 恶魔小怪兽
  trophy:      [700, 2170, 195,  260]  as FrameDef,  // 金色奖杯
  photoFrame:  [895, 2115, 240,  310]  as FrameDef,  // 卡皮巴拉相框照片

  // ── 植物装饰 ────────────────────────────────────────
  plantA:      [0,   2445, 270,  285]  as FrameDef,  // 大叶植物A(左侧)
  plantB:      [1900,2145, 148,  555]  as FrameDef,  // 大棵阔叶植物B(右侧)
  plantSmall:  [257, 2515, 198,  215]  as FrameDef,  // 小圆盆植物
} as const

let _baseTexture: PIXI.BaseTexture | null = null

export function getBaseTexture(): PIXI.BaseTexture {
  if (!_baseTexture) {
    _baseTexture = PIXI.BaseTexture.from(SHEET_URL)
  }
  return _baseTexture
}

export function frame(def: FrameDef): PIXI.Texture {
  const [x, y, w, h] = def
  return new PIXI.Texture(getBaseTexture(), new PIXI.Rectangle(x, y, w, h))
}

export function sprite(def: FrameDef): PIXI.Sprite {
  return new PIXI.Sprite(frame(def))
}
