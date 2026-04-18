/**
 * 主题选择弹窗
 * 2 列网格；状态：使用中 / 已解锁 / 成就锁定
 * 设计语言：春日草地彩铅水彩风
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_SKY, C_TEXT, C_BG, C_GRAY,
  makePanelBg, panelPad, makeOverlay, makeJellyBtn,
  bounceIn, bounceOut, txt
} from '~/ui/ui-kit'
import { BETA_UNLOCK_ALL } from '~/game/game-hooks'
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

// 第一版上线 3 个主题
const THEMES: ThemeDef[] = [
  {
    id: 'fruit',
    name: '水果主题',
    emoji: '🍊',
    icons: ['🍊', '🍓', '🍉', '🍇'],
    unlockHint: '默认解锁'
  },
  {
    id: 'music',
    name: '森林音乐会',
    emoji: '🎵',
    icons: ['🎵', '🎸', '🔔', '🐦'],
    unlockHint: '完成 5 次每日挑战解锁'
  },
  {
    id: 'animal',
    name: '动物主题',
    emoji: '🐊',
    icons: ['🐊', '🦅', '🐢', '🐒'],
    unlockHint: '主线通关 40 关解锁'
  }
]

export function openThemePanel(
  parent: PIXI.Container,
  opts: ThemePanelOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.5)
  wrap.addChild(root)

  const PANEL_W = 620
  const pad = panelPad(PANEL_W)
  const contentW = PANEL_W - 2 * pad.lr
  const rows = Math.ceil(THEMES.length / 2)
  const PANEL_H = pad.top + 36 + 16 + rows * 206 + 16 + 52 + pad.bot
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2
  const cLeft = px + pad.lr

  // 面板
  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot

  // 标题
  const titleT = txt('选择主题', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 主题卡片网格（2列）
  const CARD_GAP = 16
  const CARD_W = (contentW - CARD_GAP) / 2
  const CARD_H = 190
  const GRID_TOP = cTop + 52

  THEMES.forEach((theme, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = cLeft + col * (CARD_W + CARD_GAP)
    const cy = GRID_TOP + row * (CARD_H + CARD_GAP)

    // 内测模式下所有主题视为已解锁
    const isUnlocked = BETA_UNLOCK_ALL || opts.unlockedThemes.includes(theme.id)
    const isActive = theme.id === opts.selectedTheme

    // 卡片背景
    const card = new PIXI.Graphics()
    if (!isUnlocked) {
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
      const lockT = new PIXI.Text('🔒', { fontSize: 30 })
      lockT.anchor.set(0.5, 0)
      lockT.position.set(cx + CARD_W / 2, cy + CARD_H - 64)
      root.addChild(lockT)

      const hintT = txt(theme.unlockHint, 18, C_GRAY, '600')
      hintT.anchor.set(0.5, 0)
      hintT.position.set(cx + CARD_W / 2, cy + CARD_H - 32)
      root.addChild(hintT)
    } else if (isActive) {
      const badge = makeBadge('当前使用', C_ORANGE)
      badge.position.set(cx + CARD_W / 2, cy + CARD_H - 24)
      root.addChild(badge)
    } else {
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
  closeBtn.position.set(0, cBot - 26)
  closeBtn.on('pointerdown', close)
  root.addChild(closeBtn)

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
