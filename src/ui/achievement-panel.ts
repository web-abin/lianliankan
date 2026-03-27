/**
 * 成就列表弹窗
 */
import * as PIXI from 'pixi.js'
import { screen, store } from '~/core'
import { FONT_FAMILY } from '~/constants/design-tokens'
import { ACHIEVEMENTS, isUnlocked } from '~/game/achievements'

const WORLD_W = 750
const WORLD_H = 1334
const PANEL_W = 600
const PANEL_H = 560

export function create(parent: PIXI.Container, onClose: () => void): PIXI.Container {
  const root = new PIXI.Container()
  const dr = store.mem.screen.dr ?? Math.min(screen.width / WORLD_W, screen.height / WORLD_H)
  root.scale.set(dr)
  root.position.set(screen.width / 2 - (WORLD_W / 2) * dr, screen.height / 2 - (WORLD_H / 2) * dr)

  const mask = new PIXI.Graphics()
  mask.eventMode = 'static'
  mask.beginFill(0x000000, 0.5)
  mask.drawRect(0, 0, WORLD_W, WORLD_H)
  mask.endFill()
  mask.on('pointerdown', onClose)
  root.addChild(mask)

  const panel = new PIXI.Graphics()
  panel.beginFill(0x2c3e50)
  panel.drawRoundedRect(0, 0, PANEL_W, PANEL_H, 20)
  panel.endFill()
  panel.position.set((WORLD_W - PANEL_W) / 2, (WORLD_H - PANEL_H) / 2 - 30)
  panel.eventMode = 'static'
  root.addChild(panel)

  const title = new PIXI.Text('成就', {
    fontFamily: FONT_FAMILY,
    fontSize: 36,
    fill: 0xffffff,
    fontWeight: '700',
  })
  title.anchor.set(0.5, 0)
  title.position.set(WORLD_W / 2, panel.y + 24)
  root.addChild(title)

  const itemH = 88
  ACHIEVEMENTS.forEach((a, i) => {
    const y = panel.y + 72 + i * itemH
    const unlocked = isUnlocked(a.id)
    const row = new PIXI.Graphics()
    row.beginFill(unlocked ? 0x27ae60 : 0x34495e, 0.6)
    row.drawRoundedRect(panel.x + 24, y, PANEL_W - 48, 72, 10)
    row.endFill()
    root.addChild(row)
    const icon = new PIXI.Graphics()
    icon.beginFill(unlocked ? a.color : 0x7f8c8d)
    icon.drawCircle(panel.x + 24 + 40, y + 36, 24)
    icon.endFill()
    root.addChild(icon)
    const nameText = new PIXI.Text(a.name, {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      fill: unlocked ? 0xffffff : 0x95a5a6,
      fontWeight: '600',
    })
    nameText.position.set(panel.x + 88, y + 14)
    root.addChild(nameText)
    const descText = new PIXI.Text(a.desc, {
      fontFamily: FONT_FAMILY,
      fontSize: 22,
      fill: 0xbdc3c7,
    })
    descText.position.set(panel.x + 88, y + 46)
    root.addChild(descText)
  })

  const closeBtn = new PIXI.Graphics()
  closeBtn.beginFill(0xe74c3c)
  closeBtn.drawRoundedRect(WORLD_W / 2 - 100, panel.y + PANEL_H - 56, 200, 48, 12)
  closeBtn.endFill()
  closeBtn.eventMode = 'static'
  closeBtn.cursor = 'pointer'
  closeBtn.on('pointerdown', onClose)
  const closeT = new PIXI.Text('关闭', {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fill: 0xffffff,
    fontWeight: '600',
  })
  closeT.anchor.set(0.5, 0.5)
  closeT.position.set(WORLD_W / 2, panel.y + PANEL_H - 32)
  closeBtn.addChild(closeT)
  root.addChild(closeBtn)

  parent.addChild(root)
  return root
}
