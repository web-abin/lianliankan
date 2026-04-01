/**
 * 连连看局内页：顶栏 + 木纹背景 + 棋盘（精灵图）+ 道具栏
 * OpenSpec：路径判定、重力、迷雾、翻牌、铺砖 bounce、机制蒙层、连线光效等
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
import { notifyPairCleared } from '~/game/game-hooks'
import { applyGravity, type GravityTile } from '~/game/link-gravity'
import { findHintPair, findPath } from '~/game/link-path'
import {
  playSelectSound,
  playSelectThenClear,
  playChestCollectSound
} from '~/game/llk-sound'
import { playEliminationEffect } from '~/ui/link-effect'

export const GAME_PRELOAD_URLS = [
  'assets/scene/game/bg-game1.png',
  'assets/scene/game/bg-game2.png',
  'assets/scene/game/chest.png',
  'assets/common/star.png',
  'assets/common/star2.png',
  'assets/button/menu.png',
  'assets/button/tool-add.png',
  'assets/button/tool1.png',
  'assets/button/tool2.png',
  'assets/button/tool3.png',
  'assets/button/tool4.png',
  'assets/spritesheet/food.png'
  // 音效勿加入此列表：Pixi Loader 在微信环境无法加载 mp3（会报 data.load is not a function），用 InnerAudioContext 直读路径即可
] as const

export type GameScreenMode = 'main' | 'daily'

export interface GameScreenOptions {
  level: number
  levelConfig: MainLineLevelEntry
  tileTextures: PIXI.Texture[]
  themeId?: GameThemeId
  mode?: GameScreenMode
  /** 布局洗牌种子（主线 n>L 与每日挑战） */
  layoutSeed?: number
  coins?: number
  hearts?: number
  maxHearts?: number
  /** 局内道具库存（与 llk 同步） */
  toolInventory?: { hint: number; refresh: number; eliminate: number }
  onToolInventoryChange?: (inv: {
    hint: number
    refresh: number
    eliminate: number
  }) => void
  onBack: () => void
  onPause?: () => void
  onTool?: (index: 0 | 1 | 2 | 3) => void
  /** 消耗类道具（0–2）返回 false 则不放行 */
  onToolBeforeUse?: (index: 0 | 1 | 2) => boolean
  /** 通关（不弹成功窗，由路由接下一关） */
  onLevelClear?: (payload: {
    level: number
    steps: number
    pairsCleared: number
  }) => void
  /** 本局步数（成功消除一对算 1 步） */
  onStep?: (steps: number) => void
}

export function createGameScreen(
  parent: PIXI.Container,
  opts: GameScreenOptions
): PIXI.Container {
  const {
    level,
    levelConfig,
    tileTextures,
    onBack,
    onPause,
    onTool,
    layoutSeed = 0x9e3779b9,
    mode = 'main'
  } = opts

  const boardCols = levelConfig.cols
  const boardRows = levelConfig.rows
  const kindCount = Math.min(tileTextures.length, levelConfig.kindCount)
  const gravity = levelConfig.gravity ?? 'none'
  const useFog = !!levelConfig.fog
  const useFlip = !!levelConfig.flip
  const hasMechanism =
    gravity !== 'none' || useFog || useFlip

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

  // 游戏界面背景
  const bgTop = new PIXI.Sprite(PIXI.Texture.from('assets/scene/game/bg-game1.png'))
  bgTop.position.set(0, 0)
  bgTop.width = sw
  bgTop.height = Math.round((351 * sw) / 800)
  wrapper.addChild(bgTop)

  // 木纹背景：与顶图同一横向缩放（参照宽 800px），避免 1:1 纹理像素导致单格超宽、左右像留白或「超出」屏宽
  const woodTex = PIXI.Texture.from('assets/scene/game/bg-game2.png')
  const woodRefW = woodTex.width > 1 ? woodTex.width : 800
  const woodTileK = sw / woodRefW
  const bgFill = new PIXI.TilingSprite(
    woodTex,
    sw,
    Math.max(sh - bgTop.height, 1)
  )
  bgFill.anchor.set(0, 0)
  bgFill.position.set(0, bgTop.height - 10)
  bgFill.tileTransform.scale.set(woodTileK, woodTileK)
  wrapper.addChild(bgFill)

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

  const mechIcon = new PIXI.Graphics()
  mechIcon.visible = false
  // 右边缘贴紧标题胶囊左边缘，留 12px 间距；图标自身宽 36，所以 x = pillLeft - 36 - 12
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

  // 宝箱下方层级：持续缓慢上浮的白色星星粒子（轻盈治愈氛围）
  const chestSparkleEmitter = new PIXI.Container()
  chestSparkleEmitter.position.set(CHEST_CX, CHEST_CY + 10)
  progressFrame.root.addChild(chestSparkleEmitter)

  type IdleSparkle = {
    spr: PIXI.Sprite
    born: number
    life: number
    vy: number
    vx: number
    baseScale: number
  }
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
      idleSparkles.push({
        spr,
        born: now,
        life: 1300 + Math.random() * 900,
        vy: -(20 + Math.random() * 16),
        vx: (Math.random() - 0.5) * 14,
        baseScale,
      })
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
      const pulse = 1 + 0.12 * Math.sin(elapsed * 0.011)
      p.spr.scale.set(p.baseScale * pulse)
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

  /** 以锚点为中心：宝箱 bounce + 宝箱音效 */
  function pulseChestCollect() {
    playChestCollectSound()
    const base = CHEST_SCALE_BASE
    const start = performance.now()
    const dur = 280
    const tickBounce = () => {
      const t = Math.min(1, (performance.now() - start) / dur)
      const s = Math.sin(t * Math.PI)
      chest.scale.set(base * (1 + 0.14 * s))
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
  // 棋盘区左右留白缩小，竖屏尽量多铺格；横向缝 1～2px、纵向略大便于光束穿过行间
  const boardW = DESIGN_W - 16
  const boardX = 8
  const boardY = boardTop

  const colPad = 2
  const rowPad = 5
  const innerW = boardW
  const innerH = boardH
  /** 砖块固定设计尺寸 80×80；格数少时在棋盘区内水平垂直居中 */
  const TILE_CELL_PX = 80
  const cellW = TILE_CELL_PX
  const cellH = TILE_CELL_PX
  const gridPixelW = boardCols * cellW + Math.max(0, boardCols - 1) * colPad
  const gridPixelH = boardRows * cellH + Math.max(0, boardRows - 1) * rowPad
  const gridOriginX = boardX + (innerW - gridPixelW) / 2
  const gridOriginY = boardY + (innerH - gridPixelH) / 2

  /** 从下往上铺砖：初始略下沉，发牌动画再归位 */
  const dealSlidePx = Math.min(16, cellH * 0.14)

  const boardLayer = new PIXI.Container()
  root.addChild(boardLayer)

  // 棋盘砖块区域背景：屏坐标 x=0 铺满 sw、与 bgFill 同纹理与同 tileScale，竖直相位对齐
  const bgFillTopY = bgTop.height - 1
  const boardScreenY = root.y + boardY * dr
  const boardScreenH = Math.max(1, Math.round(boardH * dr))
  const boardBacking = new PIXI.TilingSprite(woodTex, sw, boardScreenH)
  boardBacking.anchor.set(0, 0)
  boardBacking.position.set(0, boardScreenY)
  boardBacking.tileTransform.scale.set(woodTileK, woodTileK)
  boardBacking.tilePosition.set(0, (bgFillTopY - boardScreenY) / woodTileK)
  wrapper.addChildAt(boardBacking, 2)
  const fxLayer = new PIXI.Container()
  root.addChild(fxLayer)
  const overlayLayer = new PIXI.Container()
  root.addChild(overlayLayer)

  type Tile = GravityTile & {
    bg: PIXI.Graphics
    icon: PIXI.Sprite
    back: PIXI.Graphics
    faceUp: boolean
    fogged: boolean
    fogG: PIXI.Graphics
  }

  const tiles: Tile[][] = []
  const fogged: boolean[][] = []
  const ids = buildPairs(boardRows * boardCols, kindCount, layoutSeed)
  let idx = 0
  let selected: { r: number; c: number } | null = null
  let removedCount = 0
  const totalCount = boardRows * boardCols

  for (let r = 0; r < boardRows; r++) {
    const row: boolean[] = []
    fogged.push(row)
    for (let c = 0; c < boardCols; c++) {
      row.push(useFog)
    }
  }

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

      // 底层：投影层（深褐实心块，向右下偏移，不用 filter 阴影）
      const shadowG = new PIXI.Graphics()
      drawTileDropShadow(shadowG, cellW, cellH)
      shadowG.position.set(4, 5)
      box.addChild(shadowG)

      // 中层：米白圆角卡 + 褐描边 + 顶缘高光
      const bgCell = new PIXI.Graphics()
      drawTileBase(bgCell, cellW, cellH, false)
      box.addChild(bgCell)

      const icon = new PIXI.Sprite(tileTextures[type] ?? PIXI.Texture.EMPTY)
      icon.anchor.set(0.5, 0.5)
      icon.position.set(cellW / 2, cellH / 2)
      const maxIcon = Math.min(cellW, cellH) * 0.72
      const tw0 = icon.texture.width || 1
      const th0 = icon.texture.height || 1
      const s0 = maxIcon / Math.max(tw0, th0)
      icon.scale.set(s0)
      box.addChild(icon)

      const br = tileCornerRadius(cellW)
      const back = new PIXI.Graphics()
      back.beginFill(0x8b6914, 0.95)
      back.lineStyle(2, 0x5c3d1e, 1)
      back.drawRoundedRect(4, 4, cellW - 8, cellH - 8, Math.max(2, br - 3))
      back.endFill()
      back.visible = useFlip
      box.addChild(back)

      const fogG = new PIXI.Graphics()
      fogG.beginFill(0x8899aa, 0.55)
      fogG.drawRoundedRect(0, 0, cellW, cellH, br)
      fogG.endFill()
      fogG.visible = useFog
      box.addChild(fogG)

      icon.visible = !useFlip

      const tile: Tile = {
        type,
        removed: false,
        r,
        c,
        box,
        bg: bgCell,
        icon,
        back,
        faceUp: !useFlip,
        fogged: useFog,
        fogG
      }
      row.push(tile)

      const hit = new PIXI.Graphics()
      hit.beginFill(0xffffff, 0.001)
      hit.drawRoundedRect(0, 0, cellW, cellH, br)
      hit.endFill()
      ;(hit as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
      hit.on('pointerdown', () => onPick(tile.r, tile.c))
      box.addChild(hit)

      boardLayer.addChild(box)
    }
    tiles.push(row)
  }

  // 进度数值
  const progressText = new PIXI.Text('0%', {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fill: 0x000000,
    fontWeight: '800'
  })
  progressText.anchor.set(0.5, 0.5)
  progressText.position.set(PROGRESS_W / 2, 10)
  progressFrame.root.addChild(progressText)

  const dockY = DESIGN_H - toolBarH
  const dock = new PIXI.Container()
  dock.position.set(0, dockY)
  root.addChild(dock)

  const sidePad = 24
  const gap = (DESIGN_W - sidePad * 2 - 5 * TOOL_BTN) / 4

  const menuSlotCx = sidePad + TOOL_BTN / 2
  const menuSlotCy = TOOL_BTN / 2 + 6
  const menuBtn = new PIXI.Sprite(PIXI.Texture.from('assets/button/menu.png'))
  menuBtn.anchor.set(0.5, 0.5)
  menuBtn.position.set(menuSlotCx, menuSlotCy)
  fitSpriteInSquare(menuBtn, TOOL_BTN * 0.92)
  dock.addChild(menuBtn)
  const menuHit = new PIXI.Graphics()
  menuHit.beginFill(0xffffff, 0.001)
  menuHit.drawRect(
    menuSlotCx - TOOL_BTN / 2,
    menuSlotCy - TOOL_BTN / 2,
    TOOL_BTN,
    TOOL_BTN
  )
  menuHit.endFill()
  ;(menuHit as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  menuHit.on('pointerdown', () => onPause?.())
  dock.addChild(menuHit)

  for (let i = 0; i < 4; i++) {
    const slotCx =
      sidePad + TOOL_BTN / 2 + (i + 1) * (TOOL_BTN + gap)
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
      if (i === 3) {
        onTool?.(3)
        return
      }
      if (opts.onToolBeforeUse && !opts.onToolBeforeUse(i as 0 | 1 | 2)) {
        return
      }
      onTool?.(i as 0 | 1 | 2 | 3)
      runTool(i as 0 | 1 | 2 | 3)
    })
    g.addChild(hitZone)
  }

  function clearFogAround(rr: number, cc: number) {
    const dirs = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
    for (const [dr, dc] of dirs) {
      const r = rr + dr
      const c = cc + dc
      if (r < 0 || c < 0 || r >= boardRows || c >= boardCols) continue
      if (!fogged[r][c]) continue
      fogged[r][c] = false
      const t = tiles[r][c]
      t.fogged = false
      t.fogG.visible = false
    }
  }

  function syncFoggedArray() {
    for (let r = 0; r < boardRows; r++) {
      for (let c = 0; c < boardCols; c++) {
        fogged[r][c] = !tiles[r][c].removed && tiles[r][c].fogged
      }
    }
  }

  function pathTilesForFind(): { removed: boolean }[][] {
    return tiles.map(row =>
      row.map(t => ({
        removed: t.removed || (useFlip && !t.faceUp)
      }))
    )
  }

  function hintTilesForFind(): Array<Array<{ type: number; removed: boolean }>> {
    return tiles.map(row =>
      row.map(t => ({
        type: t.type,
        removed: t.removed || (useFlip && !t.faceUp)
      }))
    )
  }

  function setSelected(pos: { r: number; c: number } | null) {
    if (selected) {
      const t = tiles[selected.r][selected.c]
      if (!t.removed) {
        drawTileBase(t.bg, cellW, cellH, false)
      }
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

  function flipBackIfNeeded(a: { r: number; c: number }, b: { r: number; c: number }) {
    if (!useFlip) return
    const ta = tiles[a.r][a.c]
    const tb = tiles[b.r][b.c]
    if (!ta.removed) {
      ta.faceUp = false
      ta.icon.visible = false
      ta.back.visible = true
    }
    if (!tb.removed) {
      tb.faceUp = false
      tb.icon.visible = false
      tb.back.visible = true
    }
  }

  function onPick(r: number, c: number) {
    if (inputBlocked) return
    const cur = tiles[r][c]
    if (cur.removed) return

    if (useFog && cur.fogged) {
      clearFogAround(r, c)
    }

    if (useFlip && !cur.faceUp) {
      cur.faceUp = true
      cur.icon.visible = true
      cur.back.visible = false
    }

    if (!selected) {
      setSelected({ r, c })
      playSelectSound()
      return
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null)
      if (useFlip) flipBackIfNeeded({ r, c }, { r, c })
      return
    }

    const first = tiles[selected.r][selected.c]
    if (!first.faceUp || !cur.faceUp) {
      setSelected({ r, c })
      return
    }

    if (first.type !== cur.type) {
      playSelectSound()
      flashWrong(first)
      flashWrong(cur)
      if (useFlip) {
        const ta = tiles[selected.r][selected.c]
        if (!ta.removed) {
          ta.faceUp = false
          ta.icon.visible = false
          ta.back.visible = true
        }
      }
      setSelected({ r, c })
      return
    }

    const path = findPath(pathTilesForFind(), selected, { r, c })
    if (!path) {
      playSelectSound()
      flashWrong(first)
      flashWrong(cur)
      if (useFlip) {
        const ta = tiles[selected.r][selected.c]
        if (!ta.removed) {
          ta.faceUp = false
          ta.icon.visible = false
          ta.back.visible = true
        }
      }
      setSelected({ r, c })
      return
    }

    const sr = selected.r
    const sc = selected.c
    // 合法消除：保持首块橙框，第二块同样高亮；双砖轻微抖动（不经过 setSelected 以免清掉首块描边）
    selected = null
    drawTileBase(tiles[r][c].bg, cellW, cellH, true)
    subtleShake(tiles[sr][sc].box)
    subtleShake(tiles[r][c].box)

    playSelectThenClear()

    const maxIcon = Math.min(cellW, cellH) * 0.72
    const resetIconScale = (t: (typeof tiles)[0][0]) => {
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
      posA: {
        x: gridOriginX + sc * (cellW + colPad) + cellW / 2,
        y: gridOriginY + sr * (cellH + rowPad) + cellH / 2,
      },
      posB: {
        x: gridOriginX + c * (cellW + colPad) + cellW / 2,
        y: gridOriginY + r * (cellH + rowPad) + cellH / 2,
      },
      cellW,
      cellH,
      gridOriginX,
      gridOriginY,
      colPad,
      rowPad,
      boardRows,
      boardCols,
      progressBarTarget: chest,
      onProgressPulse: () => {
        pulseChestCollect()
      },
    })

    inputBlocked = true
    const removalDelayMs = 450
    setTimeout(() => {
      removeAt(sr, sc)
      removeAt(r, c)
      clearFogAround(sr, sc)
      clearFogAround(r, c)

      if (gravity !== 'none') {
        applyGravity(
          tiles,
          gravity,
          gridOriginX,
          gridOriginY,
          cellW,
          cellH,
          colPad,
          rowPad
        )
        syncFoggedArray()
      }

      removedCount += 2
      pairsClearedSession += 1
      stepCount += 1
      opts.onStep?.(stepCount)
      notifyPairCleared({ deltaPairs: 1 })
      updateProgress()
      if (removedCount < totalCount) inputBlocked = false
    }, removalDelayMs)
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
      opts.onLevelClear?.({
        level,
        steps: stepCount,
        pairsCleared: pairsClearedSession
      })
    }
  }

  function runTool(i: 0 | 1 | 2 | 3) {
    if (inputBlocked) return
    if (i === 0) {
      const pair = findHintPair(hintTilesForFind())
      if (!pair) {
        wx.showToast?.({ title: '暂无可消除', icon: 'none' })
        return
      }
      clearFogAround(pair.a.r, pair.a.c)
      clearFogAround(pair.b.r, pair.b.c)
      pulseTile(tiles[pair.a.r][pair.a.c].box)
      pulseTile(tiles[pair.b.r][pair.b.c].box)
      return
    }
    if (i === 1) {
      shuffleLeft(tiles, tileTextures, cellW, cellH, useFlip, useFog, fogged)
      return
    }
    if (i === 2) {
      const pair = findHintPair(hintTilesForFind())
      if (!pair) return
      removeAt(pair.a.r, pair.a.c)
      removeAt(pair.b.r, pair.b.c)
      if (gravity !== 'none') {
        applyGravity(
          tiles,
          gravity,
          gridOriginX,
          gridOriginY,
          cellW,
          cellH,
          colPad,
          rowPad
        )
        syncFoggedArray()
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

  function dealAnimate() {
    const ROW_MS = 52
    const ROW_DUR = 260
    const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3)

    for (let r = boardRows - 1; r >= 0; r--) {
      const rowFromBottom = boardRows - 1 - r
      const rowDelay = rowFromBottom * ROW_MS
      for (let c = 0; c < boardCols; c++) {
        const t = tiles[r][c]
        const baseX = gridOriginX + c * (cellW + colPad)
        const baseY = gridOriginY + r * (cellH + rowPad)
        const fromY = baseY + dealSlidePx

        setTimeout(() => {
          const start = Date.now()
          const tick = () => {
            const u = Math.min(1, (Date.now() - start) / ROW_DUR)
            const e = easeOutCubic(u)
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
      if (!hasMechanism) return
      showMechanismOverlay()
    }, maxDelay)
  }

  function showMechanismOverlay() {
    const g = new PIXI.Graphics()
    g.beginFill(0x000000, 0.55)
    g.drawRect(0, 0, DESIGN_W, DESIGN_H)
    g.endFill()
    overlayLayer.addChild(g)
    const lines: string[] = []
    if (gravity !== 'none') lines.push(`重力：${gravityLabel(gravity)}阶梯填补`)
    if (useFog) lines.push('迷雾：点击或消除邻近可暂时驱散')
    if (useFlip) lines.push('翻牌：未配对会盖回')
    const tx = new PIXI.Text(lines.join('\n'), {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      fill: 0xffffff,
      align: 'center',
      fontWeight: '700',
      lineHeight: 36
    })
    tx.anchor.set(0.5, 0.5)
    tx.position.set(DESIGN_W / 2, DESIGN_H / 2)
    overlayLayer.addChild(tx)
    setTimeout(() => {
      overlayLayer.removeChild(g)
      overlayLayer.removeChild(tx)
      g.destroy()
      tx.destroy()
      drawMechIcon()
    }, 2000)
  }

  function drawMechIcon() {
    if (!hasMechanism) return
    mechIcon.clear()
    mechIcon.beginFill(0xffe066, 1)
    mechIcon.drawRoundedRect(0, -18, 36, 36, 8)
    mechIcon.endFill()
    ;(mechIcon as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
    mechIcon.on('pointerdown', () => {
      wx.showToast?.({
        title:
          gravity !== 'none'
            ? `本关重力：${gravityLabel(gravity)}`
            : useFog
              ? '本关含迷雾'
              : '本关含翻牌',
        icon: 'none',
        duration: 2500
      })
    })
    mechIcon.visible = true
  }

  parent.addChild(wrapper)
  dealAnimate()
  return wrapper
}

function gravityLabel(g: string): string {
  const m: Record<string, string> = {
    left: '向左',
    right: '向右',
    up: '向上',
    down: '向下',
    none: '无'
  }
  return m[g] ?? g
}


function fitSpriteInSquare(spr: PIXI.Sprite, maxSide: number) {
  const tw = spr.texture.width || 1
  const th = spr.texture.height || 1
  const s = maxSide / Math.max(tw, th)
  spr.scale.set(s)
}

function makePillLabel(text: string, w: number, h: number): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.beginFill(0xf9f0df, 0.96)
  g.lineStyle(2, 0x8e6435, 0.95)
  g.drawRoundedRect(0, 0, w, h, h)
  g.endFill()
  c.addChild(g)
  const t = new PIXI.Text(text, {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fill: 0x5c3d1e,
    fontWeight: '800'
  })
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

// 进度条内部填充
function drawProgressFill(
  g: PIXI.Graphics,
  maxW: number,
  frameH: number,
  percent: number
) {
  const innerH = frameH - 12
  const w = Math.max(0, (maxW * percent) / 100)
  g.clear()
  g.beginFill(0xe8b896, 0.98)
  g.drawRoundedRect(6, 6, w, innerH, innerH / 2)
  g.endFill()
}

/** 砖块圆角：约 10%～12% 边长，与参考图一致 */
function tileCornerRadius(w: number): number {
  return Math.max(3, Math.min(14, w * 0.12))
}

/** 底层投影：深褐实心圆角块（与卡面同形，由父容器偏移实现右下厚度感） */
function drawTileDropShadow(g: PIXI.Graphics, w: number, h: number) {
  g.clear()
  const rad = tileCornerRadius(w)
  g.beginFill(0x3d2814, 1)
  g.drawRoundedRect(0, 0, w, h, rad)
  g.endFill()
}

/** 中层卡面：米白底 + 褐细描边 + 顶缘亮线；选中时橙色底 + 橙框 */
function drawTileBase(g: PIXI.Graphics, w: number, h: number, selected: boolean) {
  g.clear()
  const rad = tileCornerRadius(w)
  const cream = 0xfdf6ea
  const inset = Math.max(2.5, rad * 0.22)

  if (selected) {
    const orangeFill = 0xffc078
    g.lineStyle(2.5, 0xff8c1a, 1)
    g.beginFill(orangeFill, 1)
    g.drawRoundedRect(0, 0, w, h, rad)
    g.endFill()
    g.lineStyle(2, 0xffe0b8, 0.9)
    g.drawRoundedRect(2, 2, w - 4, h - 4, Math.max(2, rad - 3))
  } else {
    g.lineStyle(1.5, 0x6b4e2d, 1)
    g.beginFill(cream, 1)
    g.drawRoundedRect(0, 0, w, h, rad)
    g.endFill()
  }

  // 顶缘高光（模拟顶光）
  g.lineStyle(1.1, 0xffffff, selected ? 0.5 : 0.48)
  g.moveTo(inset, 2.8)
  g.lineTo(w - inset, 2.8)
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
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

function lerpColor(a: number, b: number, u: number): number {
  const ar = (a >> 16) & 0xff
  const ag = (a >> 8) & 0xff
  const ab = a & 0xff
  const br = (b >> 16) & 0xff
  const bg = (b >> 8) & 0xff
  const bb = b & 0xff
  const rr = Math.round(ar + (br - ar) * u)
  const rg = Math.round(ag + (bg - ag) * u)
  const rb = Math.round(ab + (bb - ab) * u)
  return (rr << 16) | (rg << 8) | rb
}

function easeOutCubicRemove(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function animateMatchedRemoval(tile: {
  box: PIXI.Container
  icon: PIXI.Sprite
}) {
  const { box, icon } = tile
  const start = Date.now()
  const tick = () => {
    const elapsed = Date.now() - start
    if (elapsed >= 450) {
      box.scale.set(0)
      box.alpha = 0
      return
    }
    if (elapsed < 100) {
      const u = elapsed / 100
      icon.tint = lerpColor(0xffffff, 0xfff5e6, u)
    } else if (elapsed < 400) {
      const u = (elapsed - 100) / 300
      const s = 1 - easeOutCubicRemove(u)
      box.scale.set(s)
      box.alpha = s
    } else {
      box.scale.set(0)
      box.alpha = 0
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function flashWrong(tile: { icon: PIXI.Sprite }) {
  tile.icon.tint = 0xffcaca
  setTimeout(() => {
    tile.icon.tint = 0xffffff
  }, 120)
}

function bounceTile(tile: PIXI.Container, peak: number) {
  const base = tile.scale.x || 1
  tile.scale.set(base * peak)
  setTimeout(() => tile.scale.set(base), 160)
}

/** 整块砖轻微抖动（选中 / 即将消除反馈） */
function subtleShake(container: PIXI.Container) {
  const ox = container.x
  const oy = container.y
  let f = 0
  const total = 12
  const maxAmp = 2.6
  const step = () => {
    if (f >= total) {
      container.position.set(ox, oy)
      return
    }
    const damp = 1 - f / total
    const ang = f * 2.4
    container.position.set(
      ox + Math.cos(ang) * maxAmp * damp,
      oy + Math.sin(ang * 1.35) * maxAmp * damp
    )
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

function shuffleLeft(
  tiles: TileShuffleRow[][],
  tileTextures: PIXI.Texture[],
  cellW: number,
  cellH: number,
  useFlip: boolean,
  useFog: boolean,
  fogged: boolean[][]
) {
  const left: number[] = []
  for (let r = 0; r < tiles.length; r++) {
    for (let c = 0; c < tiles[0].length; c++) {
      const t = tiles[r][c]
      if (!t.removed) left.push(t.type)
    }
  }
  for (let i = left.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const x = left[i]
    left[i] = left[j]
    left[j] = x
  }
  let idx = 0
  const maxIcon = Math.min(cellW, cellH) * 0.72
  for (let r = 0; r < tiles.length; r++) {
    for (let c = 0; c < tiles[0].length; c++) {
      const t = tiles[r][c]
      if (!t.removed) {
        t.type = left[idx++]
        const tex = tileTextures[t.type]
        if (tex) {
          t.icon.texture = tex
          const tw = tex.width || 1
          const th = tex.height || 1
          const s = maxIcon / Math.max(tw, th)
          t.icon.scale.set(s)
        }
        if (useFlip) {
          t.faceUp = false
          t.icon.visible = false
          t.back.visible = true
        }
        if (useFog) {
          fogged[r][c] = true
          t.fogged = true
          t.fogG.visible = true
        }
      }
    }
  }
}

type TileShuffleRow = {
  type: number
  removed: boolean
  icon: PIXI.Sprite
  faceUp: boolean
  back: PIXI.Graphics
  fogG: PIXI.Graphics
  fogged: boolean
}

