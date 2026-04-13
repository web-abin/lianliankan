/**
 * 道具不足弹窗
 * 当玩家道具数量为 0 时提示，提供分享获得 / 商店购买两条路径
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_TEXT, C_SKY, C_YELLOW, C_GREEN_WX, C_RED,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt, txtWrap
} from '~/ui/ui-kit'

export type ToolType = 'hint' | 'refresh' | 'eliminate'

const TOOL_INFO: Record<ToolType, { name: string; emoji: string; desc: string; color: number }> = {
  hint:      { name: '提示道具',   emoji: '💡', desc: '显示一对可消除的砖块', color: C_YELLOW },
  refresh:   { name: '刷新道具',   emoji: '🔄', desc: '重新洗牌所有砖块位置',  color: C_SKY },
  eliminate: { name: '消除道具',   emoji: '✨', desc: '直接消除一对选中砖块',  color: C_ORANGE }
}

export interface ToolModalOptions {
  toolType: ToolType
  /** 今日剩余分享补给次数 */
  remainingShare: number
  /** 每日最大补给次数（用于显示格式如 "1/3"） */
  maxShare: number
  onShare: () => void
  onShop: () => void
  onClose?: () => void
}

export function openToolModal(
  parent: PIXI.Container,
  opts: ToolModalOptions
): PIXI.Container {
  const tool = TOOL_INFO[opts.toolType]
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 520
  const PANEL_H = 480
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（捧着空袋子委屈状）
  // TODO: 替换为真实"拿空袋子委屈泪眼"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 道具图标（大号圆形背景）
  const iconBg = new PIXI.Graphics()
  iconBg.beginFill(tool.color, 0.2)
  iconBg.drawCircle(0, 0, 44)
  iconBg.endFill()
  iconBg.lineStyle(2.5, C_OUTLINE, 0.3)
  iconBg.drawCircle(0, 0, 44)
  iconBg.position.set(0, py + 52)
  root.addChild(iconBg)

  const emojiT = new PIXI.Text(tool.emoji, { fontSize: 50 })
  emojiT.anchor.set(0.5, 0.5)
  emojiT.position.set(0, py + 52)
  root.addChild(emojiT)

  // 道具名称
  const nameT = txt(tool.name, 30, C_TEXT, '900')
  nameT.anchor.set(0.5, 0)
  nameT.position.set(0, py + 110)
  root.addChild(nameT)

  // 功能说明
  const descT = txt(tool.desc, 24, 0x666666, '500')
  descT.anchor.set(0.5, 0)
  descT.position.set(0, py + 152)
  root.addChild(descT)

  // 库存：×0
  const stockBg = new PIXI.Graphics()
  stockBg.beginFill(0xeeeeee)
  stockBg.drawRoundedRect(-54, -20, 108, 40, 20)
  stockBg.endFill()
  stockBg.position.set(0, py + 210)
  root.addChild(stockBg)

  const stockT = txt('当前 ×0', 26, C_RED, '900')
  stockT.anchor.set(0.5, 0.5)
  stockT.position.set(0, py + 210)
  root.addChild(stockT)

  // 每日剩余补给次数提示（如 "补给次数：1/3"）
  const shareCountStr = `补给次数：${opts.remainingShare}/${opts.maxShare}`
  const shareCountT = txt(shareCountStr, 22, opts.remainingShare > 0 ? 0x2e7d32 : 0xb71c1c, '700')
  shareCountT.anchor.set(0.5, 0)
  shareCountT.position.set(0, py + 250)
  root.addChild(shareCountT)

  // 两个并排按钮
  const BTN_W = (PANEL_W - 80 - 16) / 2
  const BTN_Y = py + PANEL_H - 108

  // 分享获得（若补给次数为 0 则置灰）
  const shareDisabled = opts.remainingShare <= 0
  const shareBtnColor = shareDisabled ? 0x9e9e9e : C_GREEN_WX
  const shareBtn = makeJellyBtn('💬 分享好友获得', BTN_W, 58, shareBtnColor, 0xffffff, 22)
  shareBtn.position.set(-BTN_W / 2 - 8, BTN_Y)
  shareBtn.on('pointerdown', () => {
    if (shareDisabled) {
      wx.showToast?.({ title: '今日补给次数已用完', icon: 'none' })
      return
    }
    close()
    opts.onShare()
  })
  root.addChild(shareBtn)

  // 商店购买（单个道具 100 金币）
  const shopBtn = makeJellyBtn('🏪 商店 100🪙', BTN_W, 58, C_ORANGE, 0xffffff, 22)
  shopBtn.position.set(BTN_W / 2 + 8, BTN_Y)
  shopBtn.on('pointerdown', () => { close(); opts.onShop() })
  root.addChild(shopBtn)

  const closeBtn = makeCloseBtn(close)
  closeBtn.position.set(px + PANEL_W - 24, py + 24)
  root.addChild(closeBtn)

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  function close() {
    opts.onClose?.()
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}
