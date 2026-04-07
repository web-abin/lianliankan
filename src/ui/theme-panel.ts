/**
 * 主题选择弹窗
 * 2 列网格；状态：使用中 / 已解锁 / 成就锁定
 * 设计语言：春日草地彩铅水彩风
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_SKY, C_TEXT, C_BG, C_GRAY, C_YELLOW,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt
} from '~/ui/ui-kit'
import type { GameThemeId } from '~/game/game-hooks'

export interface ThemePanelOptions {
  unlockedThemes: GameThemeId[]
  selectedTheme: GameThemeId
  onSelect: (theme: GameThemeId) => void
  onClose?: () => void
}

interface ThemeDef {
  id: GameThemeId
  name: string
  emoji: string
  icons: string[]
  unlockHint: string
}

const THEMES: ThemeDef[] = [
  { id: 'food',    name: '美食主题 🍕', emoji: '🍕', icons: ['🍕','🍣','🍔','🍩'], unlockHint: '默认解锁' },
  { id: 'fruit',   name: '水果季 🍊',  emoji: '🍓', icons: ['🍓','🍇','🍊','🍋'], unlockHint: '通关 15 关解锁' },
  { id: 'kitchen', name: '小厨房 🍳',  emoji: '🍳', icons: ['🍳','🥘','🫕','🥗'], unlockHint: '完成 5 次每日挑战解锁' },
  { id: 'forest',  name: '森友会 🐾',  emoji: '🌿', icons: ['🌿','🍄','🐿️','🦔'], unlockHint: '累计消除 200 对解锁' }
]

export function openThemePanel(
  parent: PIXI.Container,
  opts: ThemePanelOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.5)
  wrap.addChild(root)

  const PANEL_W = 620
  const PANEL_H = 700
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  // 面板
  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（手持画板）
  // TODO: 替换为"手持彩铅画板星星眼"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('选择主题', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 28)
  root.addChild(titleT)

  // 主题卡片网格（2列）
  const CARD_W = (PANEL_W - 60) / 2
  const CARD_H = 190
  const CARD_GAP = 16
  const GRID_TOP = py + 88

  THEMES.forEach((theme, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = px + 20 + col * (CARD_W + CARD_GAP)
    const cy = GRID_TOP + row * (CARD_H + CARD_GAP)

    const isUnlocked = opts.unlockedThemes.includes(theme.id)
    const isActive = theme.id === opts.selectedTheme

    // 卡片背景
    const card = new PIXI.Graphics()
    if (!isUnlocked) {
      // 锁定：灰化
      card.beginFill(0xe0e0e0, 0.8)
    } else if (isActive) {
      card.beginFill(C_SKY, 0.18)
    } else {
      card.beginFill(C_PANEL)
    }
    card.lineStyle(isActive ? 3 : 2, isActive ? C_SKY : C_OUTLINE, isActive ? 1 : 0.4)
    card.drawRoundedRect(cx, cy, CARD_W, CARD_H, 14)
    card.endFill()
    root.addChild(card)

    // 主题名称
    const nameT = txt(theme.name, 22, isUnlocked ? C_TEXT : C_GRAY, '800')
    nameT.anchor.set(0.5, 0)
    nameT.position.set(cx + CARD_W / 2, cy + 10)
    root.addChild(nameT)

    // 2×2 图标预览
    const ICON_SIZE = 34, ICON_GAP = 6
    const gridW = ICON_SIZE * 2 + ICON_GAP
    const startX = cx + CARD_W / 2 - gridW / 2
    theme.icons.forEach((icon, j) => {
      const ic = j % 2, ir = Math.floor(j / 2)
      const iconT = new PIXI.Text(icon, { fontSize: ICON_SIZE })
      iconT.anchor.set(0.5, 0.5)
      iconT.position.set(
        startX + ic * (ICON_SIZE + ICON_GAP) + ICON_SIZE / 2,
        cy + 50 + ir * (ICON_SIZE + ICON_GAP) + ICON_SIZE / 2
      )
      if (!isUnlocked) iconT.alpha = 0.35
      root.addChild(iconT)
    })

    // 状态区
    if (!isUnlocked) {
      // 锁定：锁图标 + 解锁提示
      const lockT = new PIXI.Text('🔒', { fontSize: 30 })
      lockT.anchor.set(0.5, 0)
      lockT.position.set(cx + CARD_W / 2, cy + CARD_H - 64)
      root.addChild(lockT)

      const hintT = txt(theme.unlockHint, 18, C_GRAY, '600')
      hintT.anchor.set(0.5, 0)
      hintT.position.set(cx + CARD_W / 2, cy + CARD_H - 32)
      root.addChild(hintT)
    } else if (isActive) {
      // 使用中胶囊
      const badge = makeBadge('当前使用', C_ORANGE)
      badge.position.set(cx + CARD_W / 2, cy + CARD_H - 24)
      root.addChild(badge)
    } else {
      // 使用按钮
      const useBtn = makeJellyBtn('使用', CARD_W - 32, 40, C_SKY)
      useBtn.position.set(cx + CARD_W / 2, cy + CARD_H - 24)
      useBtn.on('pointerdown', () => {
        opts.onSelect(theme.id)
        close()
        wx.showToast?.({ title: `已切换至${theme.name}！`, icon: 'none' })
      })
      root.addChild(useBtn)
    }
  })

  // 关闭按钮
  const closeBtn = makeJellyBtn('关闭', 200, 52, C_BG, C_OUTLINE)
  closeBtn.position.set(0, py + PANEL_H - 38)
  closeBtn.on('pointerdown', close)
  root.addChild(closeBtn)

  const xBtn = makeCloseBtn(close)
  xBtn.position.set(px + PANEL_W - 24, py + 24)
  root.addChild(xBtn)

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

function makeBadge(label: string, color: number): PIXI.Container {
  const c = new PIXI.Container()
  const t = new PIXI.Text(label, {
    fontFamily: 'sans-serif', fontSize: 20, fill: 0xffffff, fontWeight: '700'
  })
  t.anchor.set(0.5, 0.5)
  const W = t.width + 20, H = 30
  const bg = new PIXI.Graphics()
  bg.beginFill(color)
  bg.drawRoundedRect(-W / 2, -H / 2, W, H, H / 2)
  bg.endFill()
  c.addChild(bg)
  c.addChild(t)
  return c
}
