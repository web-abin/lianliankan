/**
 * 《合成大榴莲》主场景：主菜单 / 游戏中 / 结算
 * 使用 Pixi 渲染 + Matter 物理，水果合成与死亡线判定
 */
import * as PIXI from 'pixi.js'
import Matter from 'matter-js'
import { stage, screen, ticker, store } from '~/core'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  DEATH_LINE_Y,
  WALL_MARGIN,
  GROUND_Y,
  INITIAL_MAX_LEVEL,
  MAX_FRUITS,
  getFruitByLevel,
  getNextFruit,
  type FruitDef,
} from '~/game/config'
import {
  createEngine,
  createFruitBody,
  removeFruitBody,
  onCollisionStart,
  updateEngine,
  resetFruitBodies,
  getFruitCount,
  isAnyFruitAboveDeathLine,
  type FruitBody,
} from '~/game/physics'
import {
  getInitialState,
  saveHighScore,
  loadHighScore,
  type GameState,
} from '~/game/state'
import * as mainMenu from '~/ui/main-menu'
import * as hud from '~/ui/hud'
import * as resultDialog from '~/ui/result-dialog'
import * as achievementPanel from '~/ui/achievement-panel'
import { shareWithScore } from '~/wx/share'
import { reportScore, requestRank } from '~/wx/leaderboard'
import { checkAndUnlock } from '~/game/achievements'

type PointerEvent = { global?: { x: number; y: number }; data?: { global: { x: number; y: number } } }
function getGlobal(e: PointerEvent): { x: number; y: number } {
  return e.global ?? e.data?.global ?? { x: 0, y: 0 }
}

let root: PIXI.Container
let worldContainer: PIXI.Container
let gameState: GameState
let menuRoot: PIXI.Container | null = null
let hudRoot: ReturnType<typeof hud.create> | null = null
let resultRoot: PIXI.Container | null = null
let achievementPanelRoot: PIXI.Container | null = null

const bodyToSprite = new Map<Matter.Body, PIXI.Graphics>()
let nextFruitSprite: PIXI.Graphics | null = null
let nextFruitLevel = 1
let dropX = WORLD_WIDTH / 2
let deathLineFrames = 0
const DEATH_LINE_FRAMES_THRESHOLD = 30
let unsubCollision: (() => void) | null = null
let gameLoop: (() => void) | null = null
let pointerHandlers: { move: (e: PointerEvent) => void; down: (e: PointerEvent) => void; up: () => void } | null = null

function getScale(): number {
  return store.mem?.screen?.dr ?? Math.min(screen.width / WORLD_WIDTH, screen.height / WORLD_HEIGHT)
}

function toWorld(p: { x: number; y: number }): { x: number; y: number } {
  const s = getScale()
  const ox = screen.width / 2 - (WORLD_WIDTH / 2) * s
  const oy = screen.height / 2 - (WORLD_HEIGHT / 2) * s
  return { x: (p.x - ox) / s, y: (p.y - oy) / s }
}

function createFruitSprite(def: FruitDef): PIXI.Graphics {
  const g = new PIXI.Graphics()
  g.beginFill(def.color)
  g.drawCircle(0, 0, def.radius)
  g.endFill()
  return g
}

function spawnNextFruitVisual() {
  const def = getFruitByLevel(nextFruitLevel)
  if (!def) return
  if (nextFruitSprite) worldContainer.removeChild(nextFruitSprite)
  nextFruitSprite = createFruitSprite(def)
  nextFruitSprite.position.set(dropX, 180)
  worldContainer.addChild(nextFruitSprite)
}

function dropFruit() {
  const def = getFruitByLevel(nextFruitLevel)
  if (!def || getFruitCount() >= MAX_FRUITS) return
  const x = Math.max(WALL_MARGIN + def.radius, Math.min(WORLD_WIDTH - WALL_MARGIN - def.radius, dropX))
  const fb = createFruitBody(x, 200, def)
  const sprite = createFruitSprite(def)
  sprite.position.set(fb.body.position.x, fb.body.position.y)
  worldContainer.addChild(sprite)
  bodyToSprite.set(fb.body, sprite)
  if (nextFruitSprite) {
    worldContainer.removeChild(nextFruitSprite)
    nextFruitSprite.destroy()
    nextFruitSprite = null
  }
  gameState.comboCount = 0
  nextFruitLevel = 1 + Math.floor(Math.random() * Math.min(INITIAL_MAX_LEVEL, 3))
  spawnNextFruitVisual()
}

function doMerge(fa: FruitBody, fb: FruitBody) {
  const nextDef = getNextFruit(getFruitByLevel(fa.level)!)
  if (!nextDef) return
  const midX = (fa.body.position.x + fb.body.position.x) / 2
  const midY = (fa.body.position.y + fb.body.position.y) / 2
  removeFruitBody(fa)
  removeFruitBody(fb)
  const sA = bodyToSprite.get(fa.body)
  const sB = bodyToSprite.get(fb.body)
  if (sA) { worldContainer.removeChild(sA); sA.destroy(); bodyToSprite.delete(fa.body) }
  if (sB) { worldContainer.removeChild(sB); sB.destroy(); bodyToSprite.delete(fb.body) }
  gameState.score += nextDef.score
  gameState.comboCount += 1
  if (nextDef.level > gameState.maxFruitLevel) gameState.maxFruitLevel = nextDef.level
  if (hudRoot) hudRoot.setScore(gameState.score)
  const newFb = createFruitBody(midX, midY, nextDef)
  const newSprite = createFruitSprite(nextDef)
  newSprite.position.set(midX, midY)
  worldContainer.addChild(newSprite)
  bodyToSprite.set(newFb.body, newSprite)
}

function enterPlaying() {
  gameState.phase = 'playing'
  gameState.score = 0
  gameState.maxFruitLevel = 0
  gameState.isNewRecord = false
  gameState.comboCount = 0
  nextFruitLevel = 1 + Math.floor(Math.random() * Math.min(INITIAL_MAX_LEVEL, 3))
  deathLineFrames = 0
  if (menuRoot) {
    root.removeChild(menuRoot)
    menuRoot.destroy({ children: true })
    menuRoot = null
  }
  createEngine()
  unsubCollision = onCollisionStart((fa, fb, merge) => {
    merge()
    doMerge(fa, fb)
  })
  hudRoot = hud.create(root, {
    score: 0,
    highScore: gameState.highScore,
  })
  worldContainer.visible = true
  spawnNextFruitVisual()
  dropX = WORLD_WIDTH / 2
  gameLoop = () => {
    updateEngine(1 / 60)
    for (const [body, sprite] of bodyToSprite) {
      sprite.position.set(body.position.x, body.position.y)
      sprite.rotation = body.angle
    }
    if (isAnyFruitAboveDeathLine()) {
      deathLineFrames++
      if (deathLineFrames >= DEATH_LINE_FRAMES_THRESHOLD) {
        endGame()
        return
      }
    } else {
      deathLineFrames = 0
    }
  }
  ticker.add(gameLoop)
}

function endGame() {
  if (gameLoop) ticker.remove(gameLoop)
  gameLoop = null
  unsubCollision?.()
  unsubCollision = null
  gameState.phase = 'gameover'
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score
    gameState.isNewRecord = true
    saveHighScore(gameState.score)
  }
  reportScore(gameState.score, gameState.maxFruitLevel)
  const newAchieve = checkAndUnlock({
    maxFruitLevel: gameState.maxFruitLevel,
    score: gameState.score,
    comboCount: gameState.comboCount,
  })
  if (newAchieve) {
    wx.showToast?.({ title: `成就：${newAchieve.name}`, icon: 'none', duration: 2500 })
  }
  if (hudRoot) {
    root.removeChild(hudRoot.root)
    hudRoot.root.destroy({ children: true })
    hudRoot = null
  }
  worldContainer.visible = false
  resetFruitBodies()
  bodyToSprite.forEach((s) => s.destroy())
  bodyToSprite.clear()
  if (nextFruitSprite) {
    nextFruitSprite.destroy()
    nextFruitSprite = null
  }
  resultRoot = resultDialog.create(root, {
    score: gameState.score,
    highScore: gameState.highScore,
    isNewRecord: gameState.isNewRecord,
    maxFruitLevel: gameState.maxFruitLevel,
    onAgain: () => {
      if (resultRoot) { root.removeChild(resultRoot); resultRoot.destroy({ children: true }); resultRoot = null }
      enterPlaying()
    },
    onShare: () => shareGame(),
    onRank: () => showRank(),
  })
}

function shareGame() {
  shareWithScore(gameState.score)
}

function showRank() {
  requestRank()
  wx.showToast?.({ title: '请查看排行榜', icon: 'none' })
}

function init() {
  gameState = getInitialState()
  gameState.highScore = loadHighScore()
  root = new PIXI.Container()
  const s = getScale()
  worldContainer = new PIXI.Container()
  worldContainer.scale.set(s)
  worldContainer.position.set(screen.width / 2 - (WORLD_WIDTH / 2) * s, screen.height / 2 - (WORLD_HEIGHT / 2) * s)
  root.addChild(worldContainer)
  const bg = new PIXI.Graphics()
  bg.beginFill(0x1a472a)
  bg.drawRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  bg.endFill()
  worldContainer.addChild(bg)
  const deathLine = new PIXI.Graphics()
  deathLine.lineStyle(3, 0xe74c3c, 0.8)
  deathLine.moveTo(0, DEATH_LINE_Y)
  deathLine.lineTo(WORLD_WIDTH, DEATH_LINE_Y)
  worldContainer.addChild(deathLine)
  const ground = new PIXI.Graphics()
  ground.beginFill(0x2d5a27)
  ground.drawRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y)
  ground.endFill()
  worldContainer.addChild(ground)
  worldContainer.visible = false
  menuRoot = new PIXI.Container()
  mainMenu.create(menuRoot, {
    onStart: enterPlaying,
    onRank: showRank,
    onAchieve: () => {
      if (achievementPanelRoot) return
      achievementPanelRoot = achievementPanel.create(root, () => {
        if (achievementPanelRoot) {
          root.removeChild(achievementPanelRoot)
          achievementPanelRoot.destroy({ children: true })
          achievementPanelRoot = null
        }
      })
    },
    onSoundToggle: () => {
      const u = store.mem.user
      u.settings.music = !u.settings.music
    },
    soundOn: store.mem.user.settings.music,
  })
  root.addChild(menuRoot)
  // 不把 stage 设为可点击，否则会拦截主菜单按钮；让 root 参与命中，主菜单按钮才能收到点击
  ;(root as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactive = true
  ;(root as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactiveChildren = true
  ;(worldContainer as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactive = true
  ;(worldContainer as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactiveChildren = true
  stage.interactive = false
  let pointerDown = false
  const onPointerMove = (e: PointerEvent) => {
    if (gameState.phase !== 'playing' || !nextFruitSprite) return
    const p = toWorld(getGlobal(e))
    dropX = Math.max(WALL_MARGIN + 30, Math.min(WORLD_WIDTH - WALL_MARGIN - 30, p.x))
    nextFruitSprite.position.x = dropX
  }
  const onPointerDown = (e: PointerEvent) => {
    if (gameState.phase !== 'playing') return
    pointerDown = true
    const p = toWorld(getGlobal(e))
    dropX = Math.max(WALL_MARGIN + 30, Math.min(WORLD_WIDTH - WALL_MARGIN - 30, p.x))
    if (nextFruitSprite) nextFruitSprite.position.x = dropX
  }
  const onPointerUp = () => {
    if (gameState.phase !== 'playing' || !pointerDown) return
    pointerDown = false
    dropFruit()
  }
  pointerHandlers = { move: onPointerMove, down: onPointerDown, up: onPointerUp }
  root.on('pointermove', onPointerMove)
  root.on('pointerdown', onPointerDown)
  root.on('pointerup', onPointerUp)
}

export function show() {
  if (!root) init()
  stage.addChild(root)
}

export function hide() {
  if (gameLoop) ticker.remove(gameLoop)
  unsubCollision?.()
  if (root && achievementPanelRoot) {
    root.removeChild(achievementPanelRoot)
    achievementPanelRoot.destroy({ children: true })
    achievementPanelRoot = null
  }
  if (root && pointerHandlers) {
    root.off('pointermove', pointerHandlers.move)
    root.off('pointerdown', pointerHandlers.down)
    root.off('pointerup', pointerHandlers.up)
    pointerHandlers = null
  }
  if (root && stage.children.includes(root)) stage.removeChild(root)
  resetFruitBodies()
  bodyToSprite.forEach((s) => s.destroy())
  bodyToSprite.clear()
  nextFruitSprite = null
  menuRoot = null
  hudRoot = null
  resultRoot = null
}
