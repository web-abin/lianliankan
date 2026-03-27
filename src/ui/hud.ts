/**
 * 游戏内 HUD：当前分数、最高分、暂停
 */
import * as PIXI from 'pixi.js'
import { screen, store } from '~/core'
import { FONT_FAMILY } from '~/constants/design-tokens'

const WORLD_W = 750

export function create(parent: PIXI.Container, opts: {
  score: number
  highScore: number
  onPause?: () => void
}): { root: PIXI.Container; setScore: (n: number) => void; setHighScore: (n: number) => void } {
  const root = new PIXI.Container()
  const dr = store.mem.screen.dr ?? Math.min(screen.width / WORLD_W, screen.height / 1334)
  root.scale.set(dr)
  root.position.set(screen.width / 2 - (WORLD_W / 2) * dr, 0)

  const scoreText = new PIXI.Text(String(opts.score), {
    fontFamily: FONT_FAMILY,
    fontSize: 36,
    fill: 0xffffff,
    fontWeight: '700',
  })
  scoreText.position.set(40, 50)
  root.addChild(scoreText)

  const highLabel = new PIXI.Text('最高 ', {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fill: 0xbdc3c7,
  })
  highLabel.position.set(WORLD_W - 180, 54)
  root.addChild(highLabel)
  const highText = new PIXI.Text(String(opts.highScore), {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fill: 0xf1c40f,
    fontWeight: '600',
  })
  highText.position.set(WORLD_W - 130, 50)
  root.addChild(highText)

  if (opts.onPause) {
    const pauseBtn = new PIXI.Graphics()
    pauseBtn.beginFill(0x7f8c8d, 0.8)
    pauseBtn.drawRoundedRect(WORLD_W - 80, 44, 56, 44, 8)
    pauseBtn.endFill()
    pauseBtn.eventMode = 'static'
    pauseBtn.cursor = 'pointer'
    pauseBtn.on('pointerdown', opts.onPause)
    const pauseT = new PIXI.Text('暂停', { fontFamily: FONT_FAMILY, fontSize: 22, fill: 0xffffff })
    pauseT.anchor.set(0.5, 0.5)
    pauseT.position.set(WORLD_W - 52, 66)
    pauseBtn.addChild(pauseT)
    root.addChild(pauseBtn)
  }

  parent.addChild(root)
  return {
    root,
    setScore: (n: number) => { scoreText.text = String(n) },
    setHighScore: (n: number) => { highText.text = String(n) },
  }
}
