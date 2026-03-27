/**
 * 结算弹窗：本局得分、最高分、新纪录、再来一局、炫耀一下、排行榜
 */
import * as PIXI from 'pixi.js'
import { screen, store } from '~/core'
import { FONT_FAMILY } from '~/constants/design-tokens'
import { getFruitByLevel } from '~/game/config'

const WORLD_W = 750
const WORLD_H = 1334
const PANEL_W = 520
const PANEL_H = 520

export function create(parent: PIXI.Container, opts: {
  score: number
  highScore: number
  isNewRecord: boolean
  maxFruitLevel: number
  onAgain: () => void
  onShare: () => void
  onRank: () => void
}): PIXI.Container {
  const root = new PIXI.Container()
  const dr = store.mem.screen.dr ?? Math.min(screen.width / WORLD_W, screen.height / WORLD_H)
  root.scale.set(dr)
  root.position.set(screen.width / 2 - (WORLD_W / 2) * dr, screen.height / 2 - (WORLD_H / 2) * dr)

  const mask = new PIXI.Graphics()
  mask.eventMode = 'static'
  mask.beginFill(0x000000, 0.5)
  mask.drawRect(0, 0, WORLD_W, WORLD_H)
  mask.endFill()
  root.addChild(mask)

  const panel = new PIXI.Graphics()
  panel.beginFill(0x2c3e50)
  panel.drawRoundedRect(0, 0, PANEL_W, PANEL_H, 24)
  panel.endFill()
  panel.position.set((WORLD_W - PANEL_W) / 2, (WORLD_H - PANEL_H) / 2 - 40)
  root.addChild(panel)

  const title = new PIXI.Text('游戏结束', {
    fontFamily: FONT_FAMILY,
    fontSize: 40,
    fill: 0xffffff,
    fontWeight: '700',
  })
  title.anchor.set(0.5, 0)
  title.position.set(WORLD_W / 2, panel.y + 36)
  root.addChild(title)

  const scoreLabel = new PIXI.Text('本局得分', { fontFamily: FONT_FAMILY, fontSize: 26, fill: 0xbdc3c7 })
  scoreLabel.anchor.set(0.5, 0)
  scoreLabel.position.set(WORLD_W / 2, panel.y + 100)
  root.addChild(scoreLabel)
  const scoreVal = new PIXI.Text(String(opts.score), {
    fontFamily: FONT_FAMILY,
    fontSize: 56,
    fill: 0xf1c40f,
    fontWeight: '700',
  })
  scoreVal.anchor.set(0.5, 0)
  scoreVal.position.set(WORLD_W / 2, panel.y + 132)
  root.addChild(scoreVal)

  if (opts.isNewRecord) {
    const newRec = new PIXI.Text('新纪录！', {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      fill: 0xe74c3c,
      fontWeight: '700',
    })
    newRec.anchor.set(0.5, 0)
    newRec.position.set(WORLD_W / 2, panel.y + 200)
    root.addChild(newRec)
  }

  const highVal = new PIXI.Text(`最高 ${opts.highScore}`, {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fill: 0x95a5a6,
  })
  highVal.anchor.set(0.5, 0)
  highVal.position.set(WORLD_W / 2, panel.y + (opts.isNewRecord ? 242 : 200))
  root.addChild(highVal)

  if (opts.maxFruitLevel > 0) {
    const def = getFruitByLevel(opts.maxFruitLevel)
    const fruitIcon = new PIXI.Graphics()
    fruitIcon.beginFill(def?.color ?? 0x7d3c98)
    fruitIcon.drawCircle(WORLD_W / 2, panel.y + 300, 44)
    fruitIcon.endFill()
    root.addChild(fruitIcon)
    const fruitName = new PIXI.Text(def?.name ?? '大榴莲', {
      fontFamily: FONT_FAMILY,
      fontSize: 22,
      fill: 0xecf0f1,
    })
    fruitName.anchor.set(0.5, 0)
    fruitName.position.set(WORLD_W / 2, panel.y + 358)
    root.addChild(fruitName)
  }

  const btn = (text: string, y: number, onClick: () => void, primary = false) => {
    const g = new PIXI.Graphics()
    g.beginFill(primary ? 0x27ae60 : 0x34495e)
    g.drawRoundedRect(WORLD_W / 2 - 160, y, 320, 64, 12)
    g.endFill()
    g.eventMode = 'static'
    g.cursor = 'pointer'
    g.on('pointerdown', onClick)
    const t = new PIXI.Text(text, {
      fontFamily: FONT_FAMILY,
      fontSize: 30,
      fill: 0xffffff,
      fontWeight: '600',
    })
    t.anchor.set(0.5, 0.5)
    t.position.set(WORLD_W / 2, y + 32)
    g.addChild(t)
    return g
  }

  const baseY = panel.y + PANEL_H - 180
  root.addChild(btn('再来一局', baseY, opts.onAgain, true))
  root.addChild(btn('炫耀一下', baseY + 78, opts.onShare))
  root.addChild(btn('排行榜', baseY + 156, opts.onRank))

  parent.addChild(root)
  return root
}
