/**
 * 商店全屏弹窗
 * 三标签页：形象 / 道具 / 音效
 * 设计语言：春日草地彩铅水彩风
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_SKY, C_YELLOW, C_TEXT, C_GRAY, C_BG,
  makePanelBg, panelPad, makeOverlay, makeJellyBtn, makeTabCapsule,
  bounceIn, bounceOut, txt
} from '~/ui/ui-kit'
import type { LlkInventory } from '~/game/llk-save'

export interface ShopOptions {
  coins: number
  inventory: LlkInventory
  purchasedCapybara: boolean
  purchasedSoundPack: boolean
  /** 购买单个道具（各 100 金币） */
  onBuyHint: () => void
  onBuyRefresh: () => void
  onBuyEliminate: () => void
  /** 购买 1 点血量（50 金币） */
  onBuyBlood: () => void
  onBuyCapybara: () => void
  onBuySoundPack: () => void
  onClose?: () => void
}

export function openShopScreen(
  parent: PIXI.Container,
  opts: ShopOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh / 2)
  wrap.addChild(root)

  // 全屏面板尺寸
  const PANEL_W = DESIGN_W - 40
  const pad = panelPad(PANEL_W)
  const contentW = PANEL_W - 2 * pad.lr
  const PANEL_H = DESIGN_H - 120
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2
  const cLeft = px + pad.lr
  const cRight = px + PANEL_W - pad.lr

  // 面板
  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot

  // ── 顶部标题区 ──────────────────────────────────
  const titleT = txt('🏪  商店', 38, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 金币显示胶囊
  const coinCap = new PIXI.Graphics()
  coinCap.beginFill(C_YELLOW)
  coinCap.drawRoundedRect(-80, -18, 160, 36, 18)
  coinCap.endFill()
  coinCap.lineStyle(2, C_OUTLINE, 0.6)
  coinCap.drawRoundedRect(-80, -18, 160, 36, 18)
  coinCap.position.set(cRight - 80, cTop + 18)
  root.addChild(coinCap)

  const coinT = txt(`🪙 ${opts.coins}`, 24, C_OUTLINE, '800')
  coinT.anchor.set(0.5, 0.5)
  coinT.position.set(cRight - 80, cTop + 18)
  root.addChild(coinT)

  // ── 标签页 ──────────────────────────────────────
  const TAB_W = 150, TAB_H = 44
  const tabs = makeTabCapsule(
    ['形象', '道具', '音效'],
    0, TAB_W, TAB_H,
    (i) => showTab(i)
  )
  tabs.position.set(-(TAB_W * 3 + 8) / 2, cTop + 50)
  root.addChild(tabs)

  // ── 内容区容器 ──────────────────────────────────
  const CONTENT_Y = cTop + 110

  let currentTabContainers: PIXI.Container[] = []

  const showTab = (tabIdx: number) => {
    currentTabContainers.forEach(c => c.parent?.removeChild(c))
    currentTabContainers = []
    tabs.setActive(tabIdx)

    if (tabIdx === 0) buildImageTab()
    else if (tabIdx === 1) buildToolTab()
    else buildSoundTab()
  }

  // ── 形象标签 ──────────────────────────────────
  const buildImageTab = () => {
    const c = new PIXI.Container()
    root.addChild(c)
    currentTabContainers.push(c)

    const skins = [
      { name: '草地打滚款', emoji: '🐾', price: 0, owned: true, active: !opts.purchasedCapybara },
      { name: '卡皮巴拉形象', emoji: '🎩', price: 400, owned: opts.purchasedCapybara, active: opts.purchasedCapybara },
      { name: '水果冠款', emoji: '🍓', price: 600, owned: false, active: false },
      { name: '冬日围巾款', emoji: '🧣', price: 600, owned: false, active: false }
    ]

    const CARD_GAP = 20
    const CARD_W = (contentW - CARD_GAP) / 2
    const CARD_H = 200

    skins.forEach((skin, i) => {
      const col = i % 2, row = Math.floor(i / 2)
      const cx = cLeft + col * (CARD_W + CARD_GAP)
      const cy = CONTENT_Y + row * (CARD_H + 16)

      const card = new PIXI.Graphics()
      card.lineStyle(2.5, C_OUTLINE, skin.active ? 1 : 0.4)
      card.beginFill(C_PANEL)
      card.drawRoundedRect(cx, cy, CARD_W, CARD_H, 14)
      card.endFill()
      if (skin.active) {
        card.lineStyle(3, C_SKY, 1)
        card.drawRoundedRect(cx, cy, CARD_W, CARD_H, 14)
      }
      c.addChild(card)

      // 预览图占位
      const preview = new PIXI.Graphics()
      preview.beginFill(C_BG, 0.3)
      preview.drawRoundedRect(cx + CARD_W / 2 - 44, cy + 14, 88, 88, 12)
      preview.endFill()
      c.addChild(preview)

      const emojiT = new PIXI.Text(skin.emoji, { fontSize: 56 })
      emojiT.anchor.set(0.5, 0.5)
      emojiT.position.set(cx + CARD_W / 2, cy + 58)
      c.addChild(emojiT)

      // 皮肤名
      const nameT = txt(skin.name, 22, C_TEXT, '700')
      nameT.anchor.set(0.5, 0)
      nameT.position.set(cx + CARD_W / 2, cy + 110)
      c.addChild(nameT)

      // 状态标签
      if (skin.active) {
        const badge = makeBadge('使用中', C_ORANGE)
        badge.position.set(cx + CARD_W / 2, cy + CARD_H - 30)
        c.addChild(badge)
      } else if (skin.owned) {
        const useBtn = makeJellyBtn('使用', CARD_W - 32, 40, C_SKY)
        useBtn.position.set(cx + CARD_W / 2, cy + CARD_H - 28)
        c.addChild(useBtn)
      } else if (skin.price > 0) {
        const buyBtn = makeJellyBtn(`🪙 ${skin.price}`, CARD_W - 32, 40, C_ORANGE)
        buyBtn.position.set(cx + CARD_W / 2, cy + CARD_H - 28)
        buyBtn.on('pointerdown', opts.onBuyCapybara)
        c.addChild(buyBtn)
      } else {
        const badge = makeBadge('默认', 0x888888)
        badge.position.set(cx + CARD_W / 2, cy + CARD_H - 30)
        c.addChild(badge)
      }
    })
  }

  // ── 道具标签 ──────────────────────────────────
  const buildToolTab = () => {
    const c = new PIXI.Container()
    root.addChild(c)
    currentTabContainers.push(c)

    const tools = [
      { name: '提示道具', desc: '自动高亮一对可消除图块', emoji: '💡', stock: `库存：×${opts.inventory.hint}`, price: 100, onBuy: opts.onBuyHint },
      { name: '刷新道具', desc: '将所有未消除图块重新洗牌', emoji: '🔀', stock: `库存：×${opts.inventory.refresh}`, price: 100, onBuy: opts.onBuyRefresh },
      { name: '消除道具', desc: '自动直接消除一对可消除图块', emoji: '✨', stock: `库存：×${opts.inventory.eliminate}`, price: 100, onBuy: opts.onBuyEliminate },
      { name: '血量', desc: '补充 1 点血量', emoji: '❤️', stock: '', price: 50, onBuy: opts.onBuyBlood }
    ]

    const CARD_H = 110

    tools.forEach((tool, i) => {
      const cy = CONTENT_Y + i * (CARD_H + 12)

      const card = new PIXI.Graphics()
      card.lineStyle(2, C_OUTLINE, 0.3)
      card.beginFill(C_PANEL)
      card.drawRoundedRect(cLeft, cy, contentW, CARD_H, 14)
      card.endFill()
      c.addChild(card)

      // 图标
      const iconBg = new PIXI.Graphics()
      iconBg.beginFill(C_SKY, 0.25)
      iconBg.drawCircle(cLeft + 46, cy + CARD_H / 2, 34)
      iconBg.endFill()
      c.addChild(iconBg)
      const eT = new PIXI.Text(tool.emoji, { fontSize: 36 })
      eT.anchor.set(0.5, 0.5)
      eT.position.set(cLeft + 46, cy + CARD_H / 2)
      c.addChild(eT)

      // 名称 + 描述 + 库存
      const nameT = txt(tool.name, 26, C_TEXT, '800')
      nameT.anchor.set(0, 0)
      nameT.position.set(cLeft + 92, cy + 12)
      c.addChild(nameT)

      const descT = txt(tool.desc, 20, C_OUTLINE, '500')
      descT.anchor.set(0, 0)
      descT.position.set(cLeft + 92, cy + 46)
      c.addChild(descT)

      if (tool.stock) {
        const stockT = txt(tool.stock, 19, C_GRAY, '600')
        stockT.anchor.set(0, 0)
        stockT.position.set(cLeft + 92, cy + 74)
        c.addChild(stockT)
      }

      // 购买按钮
      const buyBtn = makeJellyBtn(`🪙 ${tool.price}`, 130, 42)
      buyBtn.position.set(cLeft + contentW - 82, cy + CARD_H / 2)
      buyBtn.on('pointerdown', tool.onBuy)
      c.addChild(buyBtn)
    })
  }

  // ── 音效标签 ──────────────────────────────────
  const buildSoundTab = () => {
    const c = new PIXI.Container()
    root.addChild(c)
    currentTabContainers.push(c)

    const packs = [
      { name: '默认音效包', desc: '春日自然音效', emoji: '🔊', owned: true },
      { name: '卡通音效包', emoji: '🎮', desc: '活泼卡通风格', owned: opts.purchasedSoundPack, price: 400, onBuy: opts.onBuySoundPack }
    ]

    packs.forEach((pack, i) => {
      const cy = CONTENT_Y + i * 110

      const card = new PIXI.Graphics()
      card.lineStyle(2, C_OUTLINE, 0.3)
      card.beginFill(C_PANEL)
      card.drawRoundedRect(cLeft, cy, contentW, 96, 14)
      card.endFill()
      c.addChild(card)

      const eT = new PIXI.Text(pack.emoji, { fontSize: 38 })
      eT.anchor.set(0.5, 0.5)
      eT.position.set(cLeft + 44, cy + 48)
      c.addChild(eT)

      const nameT = txt(pack.name, 28, C_TEXT, '800')
      nameT.anchor.set(0, 0.5)
      nameT.position.set(cLeft + 86, cy + 28)
      c.addChild(nameT)

      const descT = txt(pack.desc, 22, C_OUTLINE, '500')
      descT.anchor.set(0, 0.5)
      descT.position.set(cLeft + 86, cy + 64)
      c.addChild(descT)

      // 试听或购买
      if (pack.owned) {
        const badge = makeBadge('✓ 已拥有', 0x4caf50)
        badge.position.set(cRight - 60, cy + 48)
        c.addChild(badge)
      } else if (pack.price) {
        const buyBtn = makeJellyBtn(`🪙 ${pack.price}`, 140, 44)
        buyBtn.position.set(cRight - 60, cy + 48)
        buyBtn.on('pointerdown', pack.onBuy!)
        c.addChild(buyBtn)
      }
    })
  }

  // 初始展示形象
  showTab(0)

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  let closing = false
  function close() {
    if (closing) return
    closing = true
    opts.onClose?.()
    bounceOut(root, dr, dim, () => {
      parent.removeChild(wrap)
      wrap.destroy({ children: true })
    })
  }

  return wrap
}

// ── 状态胶囊标签（内部辅助）
function makeBadge(label: string, color: number): PIXI.Container {
  const c = new PIXI.Container()
  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif', fontSize: 22, fill: 0xffffff, fontWeight: '700'
  })
  t.anchor.set(0.5, 0.5)
  const W = t.width + 24, H = 34
  const bg = new PIXI.Graphics()
  bg.beginFill(color)
  bg.drawRoundedRect(-W / 2, -H / 2, W, H, H / 2)
  bg.endFill()
  c.addChild(bg)
  c.addChild(t)
  return c
}
