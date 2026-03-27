/**
 * 主界面：LOGO、开始游戏、排行榜、成就、音效
 */
import * as PIXI from 'pixi.js'
import { screen, store } from '~/core'
import { FONT_FAMILY, COLOR_UI_BG, hexToNumber } from '~/constants/design-tokens'

const TITLE = '合成大榴莲'
const WORLD_W = 750
const WORLD_H = 1334

export function create(parent: PIXI.Container, opts: {
  onStart: () => void
  onRank: () => void
  onAchieve: () => void
  onSoundToggle: () => void
  soundOn: boolean
}): PIXI.Container {
  const root = new PIXI.Container()
  ;(root as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactive = true
  ;(root as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactiveChildren = true
  const dr = store.mem.screen.dr ?? Math.min(screen.width / WORLD_W, screen.height / WORLD_H) ?? Math.min(screen.width / WORLD_W, screen.height / WORLD_H)
  root.scale.set(dr)
  root.position.set(screen.width / 2 - (WORLD_W / 2) * dr, screen.height / 2 - (WORLD_H / 2) * dr)

  const bg = new PIXI.Graphics()
  bg.beginFill(hexToNumber(COLOR_UI_BG))
  bg.drawRect(0, 0, WORLD_W, WORLD_H)
  bg.endFill()
  root.addChild(bg)

  const title = new PIXI.Text(TITLE, {
    fontFamily: FONT_FAMILY,
    fontSize: 52,
    fill: 0xffffff,
    fontWeight: '700',
  })
  title.anchor.set(0.5, 0)
  title.position.set(WORLD_W / 2, 180)
  root.addChild(title)

  const logo = new PIXI.Graphics()
  logo.beginFill(0x7d3c98)
  logo.drawCircle(WORLD_W / 2, 420, 80)
  logo.endFill()
  logo.beginFill(0x9b59b6)
  logo.drawCircle(WORLD_W / 2, 420, 60)
  logo.endFill()
  root.addChild(logo)

  const btn = (text: string, y: number, onClick: () => void) => {
    const g = new PIXI.Graphics()
    g.beginFill(0x27ae60)
    g.drawRoundedRect(WORLD_W / 2 - 140, y, 280, 72, 14)
    g.endFill()
    g.interactive = true
    g.buttonMode = true
    g.on('pointerdown', onClick)
    const t = new PIXI.Text(text, { fontFamily: FONT_FAMILY, fontSize: 32, fill: 0xffffff, fontWeight: '600' })
    t.anchor.set(0.5, 0.5)
    t.position.set(WORLD_W / 2, y + 36)
    g.addChild(t)
    return g
  }

  root.addChild(btn('开始游戏', 560, opts.onStart))
  root.addChild(btn('排行榜', 660, opts.onRank))
  root.addChild(btn('成就', 760, opts.onAchieve))

  const soundBtn = new PIXI.Graphics()
  soundBtn.beginFill(opts.soundOn ? 0x2ecc71 : 0x95a5a6)
  soundBtn.drawCircle(WORLD_W - 70, 120, 36)
  soundBtn.endFill()
  soundBtn.interactive = true
  soundBtn.buttonMode = true
  soundBtn.on('pointerdown', opts.onSoundToggle)
  const soundLabel = new PIXI.Text(opts.soundOn ? '音' : '静', {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fill: 0xffffff,
  })
  soundLabel.anchor.set(0.5, 0.5)
  soundLabel.position.set(WORLD_W - 70, 120)
  soundBtn.addChild(soundLabel)
  root.addChild(soundBtn)

  const version = new PIXI.Text('v1.0 · 合成大榴莲', {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fill: 0x7f8c8d,
  })
  version.anchor.set(0.5, 0)
  version.position.set(WORLD_W / 2, WORLD_H - 50)
  root.addChild(version)

  parent.addChild(root)
  return root
}
