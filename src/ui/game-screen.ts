/**
 * 连连看局内页：顶栏 + 背景 + 棋盘 + 道具栏
 * 支持机制：重力（上/下/左/右）、果冻层（首次破层、二次消除）
 */
import * as PIXI from 'pixi.js'
import {
  DESIGN_REF_W,
  designLayoutH,
  safeAreaTopPx,
  windowWidth,
  windowHeight
} from '~/core'
import { FONT_FAMILY } from '~/constants/design-tokens'
import type { MainLineLevelEntry } from '~/constants/link-level-types'
import type { GameThemeId } from '~/game/game-hooks'
import { notifyPairCleared, resolveThemeGameBackground } from '~/game/game-hooks'
import { applyGravity, type GravityTile } from '~/game/link-gravity'
import { findHintPair, findPath } from '~/game/link-path'
import {
  playSelectSound,
  playSelectThenClear,
  playJellyBreakSound,
  playChestCollectSound
} from '~/game/llk-sound'
import { playEliminationEffect } from '~/ui/link-effect'

export const GAME_PRELOAD_URLS = [
  'assets/theme/bg-fruit.jpg',
  'assets/theme/bg-qingxu.webp',
  'assets/scene/game/chest.png',
  'assets/common/star.png',
  'assets/common/star2.png',
  'assets/button/menu.png',
  'assets/button/tool-add.png',
  'assets/button/tool1.png',
  'assets/button/tool2.png',
  'assets/button/tool3.png',
  'assets/spritesheet/food.png'
  // 音效勿加入此列表：Pixi Loader 在微信环境无法加载 mp3
] as const

export type GameScreenMode = 'main' | 'daily'

export interface GameScreenOptions {
  level: number
  levelConfig: MainLineLevelEntry
  tileTextures: PIXI.Texture[]
  themeId?: GameThemeId
  mode?: GameScreenMode
  /** 布局洗牌种子 */
  layoutSeed?: number
  coins?: number
  hearts?: number
  maxHearts?: number
  /** 局内道具库存 */
  toolInventory?: { hint: number; refresh: number; eliminate: number }
  onToolInventoryChange?: (inv: { hint: number; refresh: number; eliminate: number }) => void
  onBack: () => void
  onPause?: () => void
  onTool?: (index: 0 | 1 | 2) => void
  /** 消耗类道具（0–2）返回 false 则不放行 */
  onToolBeforeUse?: (index: 0 | 1 | 2) => boolean
  /** 通关回调 */
  onLevelClear?: (payload: { level: number; steps: number; pairsCleared: number }) => void
  onStep?: (steps: number) => void
}

// ── 果冻层状态 ────────────────────────────────────────────────────────────────
type JellyState = 'intact' | 'broken' | 'none'

export function createGameScreen(
  parent: PIXI.Container,
  opts: GameScreenOptions
): PIXI.Container {
  const {
    level,
    levelConfig,
    tileTextures,
    themeId = 'fruit',
    onBack: _onBack,
    onPause,
    onTool,
    layoutSeed = 0x9e3779b9,
    mode = 'main'
  } = opts

  const boardCols = levelConfig.cols
  const boardRows = levelConfig.rows
  const kindCount = Math.min(tileTextures.length, levelConfig.kindCount)
  const gravity = levelConfig.gravity ?? 'none'
  const useJelly = !!levelConfig.jelly
  const hasMechanism = gravity !== 'none' || useJelly

  const sw = windowWidth
  const sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  let pairsClearedSession = 0
  let stepCount = 0
  let inputBlocked = true

  const wrapper = new PIXI.Container()
  ;(wrapper as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  ;(wrapper as PIXI.DisplayObject & { interactiveChildren?: boolean }).interactiveChildren = true

  // 游戏界面背景：按主题切换，宽度铺满屏幕，高度等比缩放并垂直居中
  const themeBackground = resolveThemeGameBackground(themeId)
  const bgFill = new PIXI.Graphics()
  bgFill.beginFill(themeBackground.fallbackColor)
  bgFill.drawRect(0, 0, sw, sh)
  bgFill.endFill()
  wrapper.addChild(bgFill)

  const bgSprite = new PIXI.Sprite(PIXI.Texture.from(themeBackground.imageUrl))
  bgSprite.anchor.set(0.5, 0.5)
  bgSprite.position.set(sw / 2, sh / 2)
  wrapper.addChild(bgSprite)

  const applyBackgroundLayout = () => {
    const tex = bgSprite.texture
    const texW = (tex as any).orig?.width || tex.width
    const texH = (tex as any).orig?.height || tex.height
    if (texW <= 0 || texH <= 0) return
    const scale = sw / texW
    bgSprite.width = sw
    bgSprite.height = texH * scale
  }
  if (bgSprite.texture.valid) {
    applyBackgroundLayout()
  } else {
    bgSprite.texture.baseTexture.once('loaded', applyBackgroundLayout)
  }

  const root = new PIXI.Container()
  root.scale.set(dr)
  root.position.set(sw / 2 - (DESIGN_W / 2) * dr, sh - DESIGN_H * dr)
  wrapper.addChild(root)

  const STATUS_Y = (safeAreaTopPx + 8) / dr

  // 顶部状态栏
  const topBar = new PIXI.Container()
  topBar.position.set(0, STATUS_Y)
  root.addChild(topBar)

  const titlePill = makePillLabel(
    mode === 'daily' ? '每日挑战' : `主线 · 第${level}关`,
    240,
    50
  )
  titlePill.position.set(DESIGN_W / 2 - titlePill.width / 2, 8)
  topBar.addChild(titlePill)

  // 机制图标（点击可查看说明）
  const mechIcon = new PIXI.Graphics()
  mechIcon.visible = false
  mechIcon.position.set(DESIGN_W / 2 - titlePill.width / 2 - 36 - 12, 8 + 25)
  topBar.addChild(mechIcon)

  // 进度条
  const PROGRESS_W = 300
  const PROGRESS_H = 20
  const progressFrame = makeProgressFrame(PROGRESS_W, PROGRESS_H)
  progressFrame.root.position.set((DESIGN_W - PROGRESS_W) / 2, 64)
  topBar.addChild(progressFrame.root)

  const CHEST_CX = PROGRESS_W
  const CHEST_CY = PROGRESS_H - 20
  const CHEST_SCALE_BASE = 0.46

  // 宝箱上方漂浮星星粒子（治愈氛围）
  const chestSparkleEmitter = new PIXI.Container()
  chestSparkleEmitter.position.set(CHEST_CX, CHEST_CY + 10)
  progressFrame.root.addChild(chestSparkleEmitter)

  type IdleSparkle = { spr: PIXI.Sprite; born: number; life: number; vy: number; vx: number; baseScale: number }
  const idleSparkles: IdleSparkle[] = []
  let nextChestSparkleAt = 0

  const tickChestIdleSparkles = () => {
    const pr = progressFrame.root
    if ((pr as PIXI.DisplayObject & { destroyed?: boolean }).destroyed) {
      PIXI.Ticker.shared.remove(tickChestIdleSparkles)
      return
    }
    const now = performance.now()
    const dt = PIXI.Ticker.shared.deltaMS / 1000
    if (now >= nextChestSparkleAt) {
      nextChestSparkleAt = now + 160 + Math.random() * 260
      const starTex = PIXI.Texture.from('assets/common/star.png')
      const spr = new PIXI.Sprite(starTex)
      spr.anchor.set(0.5, 0.5)
      spr.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 6)
      spr.tint = 0xffffff
      spr.blendMode = PIXI.BLEND_MODES.ADD
      const tw = starTex.width || 24
      const baseScale = (10 + Math.random() * 8) / tw
      spr.scale.set(baseScale)
      spr.alpha = 0
      chestSparkleEmitter.addChild(spr)
      idleSparkles.push({ spr, born: now, life: 1300 + Math.random() * 900, vy: -(20 + Math.random() * 16), vx: (Math.random() - 0.5) * 14, baseScale })
    }
    for (let i = idleSparkles.length - 1; i >= 0; i--) {
      const p = idleSparkles[i]
      const elapsed = now - p.born
      const u = elapsed / p.life
      if (u >= 1) {
        chestSparkleEmitter.removeChild(p.spr)
        p.spr.destroy()
        idleSparkles.splice(i, 1)
        continue
      }
      p.spr.alpha = Math.sin(Math.PI * u)
      p.spr.scale.set(p.baseScale * (1 + 0.12 * Math.sin(elapsed * 0.011)))
      p.spr.y += p.vy * dt
      p.spr.x += p.vx * dt
    }
  }
  PIXI.Ticker.shared.add(tickChestIdleSparkles)

  const chest = new PIXI.Sprite(PIXI.Texture.from('assets/scene/game/chest.png'))
  chest.anchor.set(0.5, 0.5)
  chest.position.set(CHEST_CX, CHEST_CY)
  chest.scale.set(CHEST_SCALE_BASE)
  progressFrame.root.addChild(chest)

  function pulseChestCollect() {
    playChestCollectSound()
    const base = CHEST_SCALE_BASE
    const start = performance.now()
    const dur = 280
    const tickBounce = () => {
      const t = Math.min(1, (performance.now() - start) / dur)
      chest.scale.set(base * (1 + 0.14 * Math.sin(t * Math.PI)))
      if (t < 1) requestAnimationFrame(tickBounce)
      else chest.scale.set(base)
    }
    requestAnimationFrame(tickBounce)
  }

  const TOOL_BTN = 120
  const toolBarPadBottom = 16
  const toolBarH = TOOL_BTN + toolBarPadBottom + 12

  const boardTop = STATUS_Y + 130
  const boardBottom = DESIGN_H - toolBarH - 8
  const boardH = Math.max(520, boardBottom - boardTop)
  const boardW = DESIGN_W - 16
  const boardX = 8
  const boardY = boardTop

  const colPad = 2
  const rowPad = 5
  const TILE_CELL_PX = 80
  const cellW = TILE_CELL_PX
  const cellH = TILE_CELL_PX
  const gridPixelW = boardCols * cellW + Math.max(0, boardCols - 1) * colPad
  const gridPixelH = boardRows * cellH + Math.max(0, boardRows - 1) * rowPad
  const gridOriginX = boardX + (boardW - gridPixelW) / 2
  const gridOriginY = boardY + (boardH - gridPixelH) / 2
  const dealSlidePx = Math.min(16, cellH * 0.14)

  const boardLayer = new PIXI.Container()
  root.addChild(boardLayer)

  const boardScreenY = root.y + boardY * dr

  const fxLayer = new PIXI.Container()
  root.addChild(fxLayer)
  const overlayLayer = new PIXI.Container()
  root.addChild(overlayLayer)

  // 砖块类型定义（带果冻状态）
  type Tile = GravityTile & {
    bg: PIXI.Graphics
    icon: PIXI.Sprite
    jellyState: JellyState
    jellyG: PIXI.Graphics | null
  }

  const tiles: Tile[][] = []
  const ids = buildPairs(boardRows * boardCols, kindCount, layoutSeed)
  let idx = 0
  let selected: { r: number; c: number } | null = null
  let removedCount = 0
  const totalCount = boardRows * boardCols

  // 铺设砖块
  for (let r = 0; r < boardRows; r++) {
    const row: Tile[] = []
    for (let c = 0; c < boardCols; c++) {
      const type = ids[idx++]
      const box = new PIXI.Container()
      box.position.set(
        gridOriginX + c * (cellW + colPad),
        gridOriginY + r * (cellH + rowPad) + dealSlidePx
      )
      box.alpha = 0

      // 投影层
      const shadowG = new PIXI.Graphics()
      drawTileDropShadow(shadowG, cellW, cellH)
      shadowG.position.set(4, 5)
      box.addChild(shadowG)

      // 卡面底色
      const bgCell = new PIXI.Graphics()
      drawTileBase(bgCell, cellW, cellH, false)
      box.addChild(bgCell)

      const icon = new PIXI.Sprite(tileTextures[type] ?? PIXI.Texture.EMPTY)
      icon.anchor.set(0.5, 0.5)
      icon.position.set(cellW / 2, cellH / 2)
      const maxIcon = Math.min(cellW, cellH) * 0.72
      const tw0 = icon.texture.width || 1
      const th0 = icon.texture.height || 1
      icon.scale.set(maxIcon / Math.max(tw0, th0))
      box.addChild(icon)

      // 果冻层覆盖（仅在 useJelly 时绘制）
      let jellyG: PIXI.Graphics | null = null
      if (useJelly) {
        jellyG = new PIXI.Graphics()
        drawJellyOverlay(jellyG, cellW, cellH, true)
        box.addChild(jellyG)
      }

      const br = tileCornerRadius(cellW)
      const hit = new PIXI.Graphics()
      hit.beginFill(0xffffff, 0.001)
      hit.drawRoundedRect(0, 0, cellW, cellH, br)
      hit.endFill()
      ;(hit as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
      hit.on('pointerdown', () => onPick(tile.r, tile.c))
      box.addChild(hit)

      const tile: Tile = {
        type,
        removed: false,
        r,
        c,
        box,
        bg: bgCell,
        icon,
        jellyState: useJelly ? 'intact' : 'none',
        jellyG
      }
      row.push(tile)
      boardLayer.addChild(box)
    }
    tiles.push(row)
  }

  // 进度文本
  const progressText = new PIXI.Text('0%', {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fill: 0x000000,
    fontWeight: '800'
  })
  progressText.anchor.set(0.5, 0.5)
  progressText.position.set(PROGRESS_W / 2, 10)
  progressFrame.root.addChild(progressText)

  // 底部道具栏（3 个道具位 + 1 个菜单按钮）
  const dockY = DESIGN_H - toolBarH
  const dock = new PIXI.Container()
  dock.position.set(0, dockY)
  root.addChild(dock)

  const sidePad = 24
  const gap = (DESIGN_W - sidePad * 2 - 4 * TOOL_BTN) / 3

  // 菜单按钮
  const menuSlotCx = sidePad + TOOL_BTN / 2
  const menuSlotCy = TOOL_BTN / 2 + 6
  const menuBtn = new PIXI.Sprite(PIXI.Texture.from('assets/button/menu.png'))
  menuBtn.anchor.set(0.5, 0.5)
  menuBtn.position.set(menuSlotCx, menuSlotCy)
  fitSpriteInSquare(menuBtn, TOOL_BTN * 0.92)
  dock.addChild(menuBtn)

  const menuHit = new PIXI.Graphics()
  menuHit.beginFill(0xffffff, 0.001)
  menuHit.drawRect(menuSlotCx - TOOL_BTN / 2, menuSlotCy - TOOL_BTN / 2, TOOL_BTN, TOOL_BTN)
  menuHit.endFill()
  ;(menuHit as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  menuHit.on('pointerdown', () => onPause?.())
  dock.addChild(menuHit)

  // 3 个道具按钮（提示/刷新/消除）
  for (let i = 0; i < 3; i++) {
    const slotCx = sidePad + TOOL_BTN / 2 + (i + 1) * (TOOL_BTN + gap)
    const slotCy = menuSlotCy

    const g = new PIXI.Container()
    g.position.set(slotCx, slotCy)
    dock.addChild(g)

    const tex = PIXI.Texture.from(`assets/button/tool${i + 1}.png`)
    const spr = new PIXI.Sprite(tex)
    spr.anchor.set(0.5, 0.5)
    fitSpriteInSquare(spr, TOOL_BTN * 0.92)
    g.addChild(spr)

    const add = new PIXI.Sprite(PIXI.Texture.from('assets/button/tool-add.png'))
    add.anchor.set(0.5, 0.5)
    add.position.set(TOOL_BTN / 2 - 10, -TOOL_BTN / 2 + 10)
    add.scale.set(0.24)
    g.addChild(add)

    const hitZone = new PIXI.Graphics()
    hitZone.beginFill(0xffffff, 0.001)
    hitZone.drawRect(-TOOL_BTN / 2, -TOOL_BTN / 2, TOOL_BTN, TOOL_BTN)
    hitZone.endFill()
    ;(hitZone as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
    hitZone.on('pointerdown', () => {
      if (opts.onToolBeforeUse && !opts.onToolBeforeUse(i as 0 | 1 | 2)) return
      onTool?.(i as 0 | 1 | 2)
      runTool(i as 0 | 1 | 2)
    })
    g.addChild(hitZone)
  }

  // ── 果冻破层 ──────────────────────────────────────────────────────────────
  function breakJellyLayer(tile: Tile) {
    tile.jellyState = 'broken'
    if (tile.jellyG) {
      drawJellyOverlay(tile.jellyG, cellW, cellH, false)
    }
  }

  // ── 选牌路径查询 ──────────────────────────────────────────────────────────
  function pathTilesForFind(): { removed: boolean }[][] {
    return tiles.map(row => row.map(t => ({ removed: t.removed })))
  }

  function hintTilesForFind(): Array<Array<{ type: number; removed: boolean }>> {
    return tiles.map(row => row.map(t => ({ type: t.type, removed: t.removed })))
  }

  // ── 选中状态 ──────────────────────────────────────────────────────────────
  function setSelected(pos: { r: number; c: number } | null) {
    if (selected) {
      const t = tiles[selected.r][selected.c]
      if (!t.removed) drawTileBase(t.bg, cellW, cellH, false)
    }
    selected = pos
    if (selected) {
      const t = tiles[selected.r][selected.c]
      if (!t.removed) {
        drawTileBase(t.bg, cellW, cellH, true)
        bounceTile(t.icon, 1.18)
        subtleShake(t.box)
      }
    }
  }

  // ── 点击选牌 ──────────────────────────────────────────────────────────────
  function onPick(r: number, c: number) {
    if (inputBlocked) return
    const cur = tiles[r][c]
    if (cur.removed) return

    if (!selected) {
      setSelected({ r, c })
      playSelectSound()
      return
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null)
      return
    }

    const first = tiles[selected.r][selected.c]

    // 类型不同：失败反馈
    if (first.type !== cur.type) {
      playSelectSound()
      flashWrong(first)
      flashWrong(cur)
      setSelected({ r, c })
      return
    }

    // 路径不通：失败反馈
    const path = findPath(pathTilesForFind(), selected, { r, c })
    if (!path) {
      playSelectSound()
      flashWrong(first)
      flashWrong(cur)
      setSelected({ r, c })
      return
    }

    // ── 成功配对处理 ────────────────────────────────────────────────────
    const sr = selected.r
    const sc = selected.c
    selected = null

    drawTileBase(tiles[r][c].bg, cellW, cellH, true)
    subtleShake(tiles[sr][sc].box)
    subtleShake(tiles[r][c].box)

    // 步数在每次成功配对后更新（包括仅破层的情况）
    stepCount += 1
    opts.onStep?.(stepCount)

    // 检查果冻层
    const aJelly = tiles[sr][sc].jellyState === 'intact'
    const bJelly = tiles[r][c].jellyState === 'intact'

    if (aJelly || bJelly) {
      // 仅破层，不消除图块
      playJellyBreakSound()
      if (aJelly) breakJellyLayer(tiles[sr][sc])
      if (bJelly) breakJellyLayer(tiles[r][c])
      // 播放果冻破裂连线特效
      playEliminationEffect({
        fxLayer,
        path,
        posA: { x: gridOriginX + sc * (cellW + colPad) + cellW / 2, y: gridOriginY + sr * (cellH + rowPad) + cellH / 2 },
        posB: { x: gridOriginX + c * (cellW + colPad) + cellW / 2, y: gridOriginY + r * (cellH + rowPad) + cellH / 2 },
        cellW, cellH, gridOriginX, gridOriginY, colPad, rowPad, boardRows, boardCols,
        progressBarTarget: chest,
        onProgressPulse: () => {}
      })
      inputBlocked = false
      return
    }

    // 两块均无果冻层 → 正式消除
    playSelectThenClear()

    const maxIcon = Math.min(cellW, cellH) * 0.72
    const resetIconScale = (t: typeof tiles[0][0]) => {
      const tw = t.icon.texture.width || 1
      const th = t.icon.texture.height || 1
      t.icon.scale.set(maxIcon / Math.max(tw, th))
    }
    resetIconScale(tiles[sr][sc])
    resetIconScale(tiles[r][c])
    animateMatchedRemoval(tiles[sr][sc])
    animateMatchedRemoval(tiles[r][c])

    playEliminationEffect({
      fxLayer,
      path,
      posA: { x: gridOriginX + sc * (cellW + colPad) + cellW / 2, y: gridOriginY + sr * (cellH + rowPad) + cellH / 2 },
      posB: { x: gridOriginX + c * (cellW + colPad) + cellW / 2, y: gridOriginY + r * (cellH + rowPad) + cellH / 2 },
      cellW, cellH, gridOriginX, gridOriginY, colPad, rowPad, boardRows, boardCols,
      progressBarTarget: chest,
      onProgressPulse: pulseChestCollect
    })

    inputBlocked = true
    setTimeout(() => {
      removeAt(sr, sc)
      removeAt(r, c)

      if (gravity !== 'none') {
        applyGravity(tiles, gravity, gridOriginX, gridOriginY, cellW, cellH, colPad, rowPad)
      }

      removedCount += 2
      pairsClearedSession += 1
      notifyPairCleared({ deltaPairs: 1 })
      updateProgress()
      if (removedCount < totalCount) inputBlocked = false
    }, 450)
  }

  function removeAt(r: number, c: number) {
    const t = tiles[r][c]
    t.removed = true
    t.box.visible = false
  }

  function updateProgress() {
    const percent = Math.min(100, Math.floor((removedCount / totalCount) * 100))
    progressText.text = `${percent}%`
    drawProgressFill(progressFrame.fill, progressFrame.maxW, PROGRESS_H, percent)
    if (percent >= 100) {
      inputBlocked = true
      opts.onLevelClear?.({ level, steps: stepCount, pairsCleared: pairsClearedSession })
    }
  }

  // ── 道具逻辑 ──────────────────────────────────────────────────────────────
  function runTool(i: 0 | 1 | 2) {
    if (inputBlocked) return

    // 提示道具：高亮一对可消除图块
    if (i === 0) {
      const pair = findHintPair(hintTilesForFind())
      if (!pair) {
        wx.showToast?.({ title: '暂无可消除', icon: 'none' })
        return
      }
      pulseTile(tiles[pair.a.r][pair.a.c].box)
      pulseTile(tiles[pair.b.r][pair.b.c].box)
      return
    }

    // 刷新道具：重新洗牌，果冻层状态（intact/broken）保留
    if (i === 1) {
      shuffleBoard(tiles, tileTextures, cellW, cellH, useJelly)
      return
    }

    // 消除道具：直接找一对并消除（无视果冻层，直接移除）
    if (i === 2) {
      const pair = findHintPair(hintTilesForFind())
      if (!pair) return
      // 果冻层也直接清除
      if (tiles[pair.a.r][pair.a.c].jellyState !== 'none') {
        tiles[pair.a.r][pair.a.c].jellyState = 'broken'
        tiles[pair.a.r][pair.a.c].jellyG && drawJellyOverlay(tiles[pair.a.r][pair.a.c].jellyG!, cellW, cellH, false)
      }
      if (tiles[pair.b.r][pair.b.c].jellyState !== 'none') {
        tiles[pair.b.r][pair.b.c].jellyState = 'broken'
        tiles[pair.b.r][pair.b.c].jellyG && drawJellyOverlay(tiles[pair.b.r][pair.b.c].jellyG!, cellW, cellH, false)
      }
      removeAt(pair.a.r, pair.a.c)
      removeAt(pair.b.r, pair.b.c)
      if (gravity !== 'none') {
        applyGravity(tiles, gravity, gridOriginX, gridOriginY, cellW, cellH, colPad, rowPad)
      }
      removedCount += 2
      pairsClearedSession += 1
      stepCount += 1
      opts.onStep?.(stepCount)
      notifyPairCleared({ deltaPairs: 1 })
      updateProgress()
      return
    }
  }

  // ── 发牌动画 ──────────────────────────────────────────────────────────────
  function dealAnimate() {
    const ROW_MS = 52
    const ROW_DUR = 260
    const easeOut = (u: number) => 1 - Math.pow(1 - u, 3)

    for (let r = boardRows - 1; r >= 0; r--) {
      const rowDelay = (boardRows - 1 - r) * ROW_MS
      for (let c = 0; c < boardCols; c++) {
        const t = tiles[r][c]
        const baseX = gridOriginX + c * (cellW + colPad)
        const baseY = gridOriginY + r * (cellH + rowPad)
        const fromY = baseY + dealSlidePx
        setTimeout(() => {
          const start = Date.now()
          const tick = () => {
            const u = Math.min(1, (Date.now() - start) / ROW_DUR)
            const e = easeOut(u)
            t.box.position.set(baseX, fromY + (baseY - fromY) * e)
            t.box.alpha = e
            if (u < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, rowDelay)
      }
    }

    const maxDelay = (boardRows - 1) * ROW_MS + ROW_DUR + 80
    setTimeout(() => {
      inputBlocked = false
      if (hasMechanism) showMechanismOverlay()
    }, maxDelay)
  }

  // ── 机制说明蒙层 ──────────────────────────────────────────────────────────
  function showMechanismOverlay() {
    const g = new PIXI.Graphics()
    g.beginFill(0x000000, 0.55)
    g.drawRect(0, 0, DESIGN_W, DESIGN_H)
    g.endFill()
    overlayLayer.addChild(g)

    const lines: string[] = []
    if (gravity !== 'none') lines.push(`⬆️ 重力：${gravityLabel(gravity)}阶梯填补`)
    if (useJelly) lines.push('🟦 果冻层：首次配对破层，再次配对消除')

    const tx = new PIXI.Text(lines.join('\n'), {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      fill: 0xffffff,
      align: 'center',
      fontWeight: '700',
      lineHeight: 38
    })
    tx.anchor.set(0.5, 0.5)
    tx.position.set(DESIGN_W / 2, DESIGN_H / 2)
    overlayLayer.addChild(tx)

    // 点击可提前关闭
    ;(g as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
    g.on('pointerdown', dismissOverlay)

    function dismissOverlay() {
      overlayLayer.removeChild(g)
      overlayLayer.removeChild(tx)
      try { g.destroy(); tx.destroy() } catch (_) {}
      drawMechIcon()
    }

    setTimeout(dismissOverlay, 2000)
  }

  function drawMechIcon() {
    if (!hasMechanism) return
    mechIcon.clear()
    mechIcon.beginFill(0xffe066, 1)
    mechIcon.drawRoundedRect(0, -18, 36, 36, 8)
    mechIcon.endFill()
    ;(mechIcon as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
    mechIcon.removeAllListeners()
    mechIcon.on('pointerdown', () => {
      const parts: string[] = []
      if (gravity !== 'none') parts.push(`重力方向：${gravityLabel(gravity)}`)
      if (useJelly) parts.push('含果冻层：首次破层，再次消除')
      wx.showToast?.({ title: parts.join('；'), icon: 'none', duration: 2500 })
    })
    mechIcon.visible = true
  }

  parent.addChild(wrapper)
  dealAnimate()
  return wrapper
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function gravityLabel(g: string): string {
  const m: Record<string, string> = { left: '向左', right: '向右', up: '向上', down: '向下', none: '无' }
  return m[g] ?? g
}

function fitSpriteInSquare(spr: PIXI.Sprite, maxSide: number) {
  const tw = spr.texture.width || 1
  const th = spr.texture.height || 1
  spr.scale.set(maxSide / Math.max(tw, th))
}

function makePillLabel(text: string, w: number, h: number): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.beginFill(0xf9f0df, 0.96)
  g.lineStyle(2, 0x8e6435, 0.95)
  g.drawRoundedRect(0, 0, w, h, h)
  g.endFill()
  c.addChild(g)
  const t = new PIXI.Text(text, { fontFamily: FONT_FAMILY, fontSize: 28, fill: 0x5c3d1e, fontWeight: '800' })
  t.anchor.set(0.5, 0.5)
  t.position.set(w / 2, h / 2)
  c.addChild(t)
  return c
}

function makeProgressFrame(w: number, h: number) {
  const root = new PIXI.Container()
  const bg = new PIXI.Graphics()
  bg.beginFill(0xfff5ed, 0.96)
  bg.lineStyle(2.5, 0x7a4e2d, 0.92)
  bg.drawRoundedRect(0, 0, w, h, h)
  bg.endFill()
  root.addChild(bg)
  const fill = new PIXI.Graphics()
  const maxW = w - 12
  drawProgressFill(fill, maxW, h, 0)
  root.addChild(fill)
  return { root, fill, maxW }
}

function drawProgressFill(g: PIXI.Graphics, maxW: number, frameH: number, percent: number) {
  const innerH = frameH - 12
  const w = Math.max(0, (maxW * percent) / 100)
  g.clear()
  g.beginFill(0xe8b896, 0.98)
  g.drawRoundedRect(6, 6, w, innerH, innerH / 2)
  g.endFill()
}

function tileCornerRadius(w: number): number {
  return Math.max(3, Math.min(14, w * 0.12))
}

function drawTileDropShadow(g: PIXI.Graphics, w: number, h: number) {
  g.clear()
  g.beginFill(0x3d2814, 1)
  g.drawRoundedRect(0, 0, w, h, tileCornerRadius(w))
  g.endFill()
}

function drawTileBase(g: PIXI.Graphics, w: number, h: number, selected: boolean) {
  g.clear()
  const rad = tileCornerRadius(w)
  const inset = Math.max(2.5, rad * 0.22)
  if (selected) {
    g.lineStyle(2.5, 0xff8c1a, 1)
    g.beginFill(0xffc078, 1)
    g.drawRoundedRect(0, 0, w, h, rad)
    g.endFill()
    g.lineStyle(2, 0xffe0b8, 0.9)
    g.drawRoundedRect(2, 2, w - 4, h - 4, Math.max(2, rad - 3))
  } else {
    g.lineStyle(1.5, 0x6b4e2d, 1)
    g.beginFill(0xfdf6ea, 1)
    g.drawRoundedRect(0, 0, w, h, rad)
    g.endFill()
  }
  g.lineStyle(1.1, 0xffffff, selected ? 0.5 : 0.48)
  g.moveTo(inset, 2.8)
  g.lineTo(w - inset, 2.8)
}

/** 果冻层覆盖：intact=半透明蓝色果冻，broken=极淡残影 */
function drawJellyOverlay(g: PIXI.Graphics, w: number, h: number, intact: boolean) {
  g.clear()
  const rad = tileCornerRadius(w)
  if (intact) {
    // 半透明果冻外层
    g.lineStyle(2.5, 0x66ccff, 0.9)
    g.beginFill(0x88ddff, 0.42)
    g.drawRoundedRect(1, 1, w - 2, h - 2, rad)
    g.endFill()
    // 果冻高光
    g.lineStyle(0)
    g.beginFill(0xffffff, 0.28)
    g.drawEllipse(w * 0.32, h * 0.26, w * 0.18, h * 0.09)
    g.endFill()
  } else {
    // 破层后残影（极淡，提示已被破开）
    g.lineStyle(1.5, 0x66ccff, 0.25)
    g.beginFill(0x88ddff, 0.08)
    g.drawRoundedRect(1, 1, w - 2, h - 2, rad)
    g.endFill()
  }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildPairs(total: number, kinds: number, seed: number) {
  const rnd = mulberry32(seed >>> 0)
  const arr: number[] = []
  for (let i = 0; i < total / 2; i++) {
    const v = i % kinds
    arr.push(v, v)
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t
  }
  return arr
}

function lerpColor(a: number, b: number, u: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  return (Math.round(ar + (br - ar) * u) << 16) | (Math.round(ag + (bg - ag) * u) << 8) | Math.round(ab + (bb - ab) * u)
}

function animateMatchedRemoval(tile: { box: PIXI.Container; icon: PIXI.Sprite }) {
  const { box, icon } = tile
  const start = Date.now()
  const tick = () => {
    const elapsed = Date.now() - start
    if (elapsed >= 450) { box.scale.set(0); box.alpha = 0; return }
    if (elapsed < 100) icon.tint = lerpColor(0xffffff, 0xfff5e6, elapsed / 100)
    else if (elapsed < 400) {
      const u = (elapsed - 100) / 300
      const s = 1 - (1 - Math.pow(1 - u, 3))
      box.scale.set(s); box.alpha = s
    } else { box.scale.set(0); box.alpha = 0 }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function flashWrong(tile: { icon: PIXI.Sprite }) {
  tile.icon.tint = 0xffcaca
  setTimeout(() => { tile.icon.tint = 0xffffff }, 120)
}

function bounceTile(tile: PIXI.Container, peak: number) {
  const base = tile.scale.x || 1
  tile.scale.set(base * peak)
  setTimeout(() => tile.scale.set(base), 160)
}

function subtleShake(container: PIXI.Container) {
  const ox = container.x, oy = container.y
  let f = 0
  const total = 12, maxAmp = 2.6
  const step = () => {
    if (f >= total) { container.position.set(ox, oy); return }
    const damp = 1 - f / total, ang = f * 2.4
    container.position.set(ox + Math.cos(ang) * maxAmp * damp, oy + Math.sin(ang * 1.35) * maxAmp * damp)
    f++
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function pulseTile(tile: PIXI.Container) {
  const s = tile.scale.x
  tile.scale.set(s * 1.08)
  setTimeout(() => tile.scale.set(s), 140)
}

/** 洗牌：重新随机分配 type，果冻 intact/broken 状态保留 */
function shuffleBoard(
  tiles: Array<Array<{ type: number; removed: boolean; icon: PIXI.Sprite; jellyState: JellyState; jellyG: PIXI.Graphics | null }>>,
  tileTextures: PIXI.Texture[],
  cellW: number,
  cellH: number,
  useJelly: boolean
) {
  const left: number[] = []
  for (let r = 0; r < tiles.length; r++)
    for (let c = 0; c < tiles[0].length; c++)
      if (!tiles[r][c].removed) left.push(tiles[r][c].type)

  for (let i = left.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const x = left[i]; left[i] = left[j]; left[j] = x
  }

  let idx = 0
  const maxIcon = Math.min(cellW, cellH) * 0.72
  for (let r = 0; r < tiles.length; r++) {
    for (let c = 0; c < tiles[0].length; c++) {
      const t = tiles[r][c]
      if (t.removed) continue
      t.type = left[idx++]
      const tex = tileTextures[t.type]
      if (tex) {
        t.icon.texture = tex
        const tw = tex.width || 1, th = tex.height || 1
        t.icon.scale.set(maxIcon / Math.max(tw, th))
      }
      // 果冻层保留洗牌前的状态（intact 保持 intact，broken 保持 broken）
      if (useJelly && t.jellyG) {
        drawJellyOverlay(t.jellyG, cellW, cellH, t.jellyState === 'intact')
      }
    }
  }
}
