/**
 * 连连看局内页：顶栏 + 木纹背景 + 棋盘（精灵图）+ 道具栏
 * 关卡参数来自 assets/levels/main-line.json；牌面来自当前主题图集（默认美食 food）
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
import { notifyMainLevelComplete, notifyPairCleared } from '~/game/game-hooks'

export const GAME_PRELOAD_URLS = [
  'assets/scene/game/bg-game1.png',
  'assets/scene/game/bg-game2.png',
  'assets/scene/game/chest.png',
  'assets/button/menu.png',
  'assets/button/tool-add.png',
  'assets/button/tool1.png',
  'assets/button/tool2.png',
  'assets/button/tool3.png',
  'assets/button/tool4.png',
  'assets/spritesheet/food.png'
] as const

export interface GameScreenOptions {
  level: number
  /** 已由 resolveMainLineLevel 解析（含 n>L 复用第 L 条） */
  levelConfig: MainLineLevelEntry
  /** 与 kindCount 等长的纹理表，下标即 type */
  tileTextures: PIXI.Texture[]
  themeId?: GameThemeId
  /** 预留 HUD */
  coins?: number
  hearts?: number
  maxHearts?: number
  onBack: () => void
  onPause?: () => void
  onTool?: (index: 0 | 1 | 2 | 3) => void
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
    onTool
  } = opts

  const boardCols = levelConfig.cols
  const boardRows = levelConfig.rows
  const kindCount = Math.min(tileTextures.length, levelConfig.kindCount)

  const sw = windowWidth
  const sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrapper = new PIXI.Container()
  ;(wrapper as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  ;(wrapper as PIXI.DisplayObject & { interactiveChildren?: boolean }).interactiveChildren = true

  const bgTop = new PIXI.Sprite(PIXI.Texture.from('assets/scene/game/bg-game1.png'))
  bgTop.position.set(0, 0)
  bgTop.width = sw
  bgTop.height = Math.round((351 * sw) / 800)
  wrapper.addChild(bgTop)

  const bgFill = new PIXI.TilingSprite(
    PIXI.Texture.from('assets/scene/game/bg-game2.png'),
    sw,
    Math.max(sh - bgTop.height, 1)
  )
  bgFill.position.set(0, bgTop.height - 1)
  wrapper.addChild(bgFill)

  const root = new PIXI.Container()
  root.scale.set(dr)
  root.position.set(sw / 2 - (DESIGN_W / 2) * dr, sh - DESIGN_H * dr)
  wrapper.addChild(root)

  const STATUS_Y = (safeAreaTopPx + 8) / dr

  const topBar = new PIXI.Container()
  topBar.position.set(0, STATUS_Y)
  root.addChild(topBar)

  const titlePill = makePillLabel(`主线 · 第${level}关`, 270, 50)
  titlePill.position.set(DESIGN_W / 2 - titlePill.width / 2, 8)
  topBar.addChild(titlePill)

  const PROGRESS_W = 560
  const progressFrame = makeProgressFrame(PROGRESS_W, 46)
  progressFrame.root.position.set((DESIGN_W - PROGRESS_W) / 2, 64)
  topBar.addChild(progressFrame.root)

  const chest = new PIXI.Sprite(PIXI.Texture.from('assets/scene/game/chest.png'))
  chest.anchor.set(0.5, 0.5)
  chest.position.set(PROGRESS_W, 23)
  chest.scale.set(0.46)
  progressFrame.root.addChild(chest)

  const TOOL_BTN = 120
  const toolBarPadBottom = 16
  const toolBarH = TOOL_BTN + toolBarPadBottom + 12

  const boardTop = STATUS_Y + 130
  const boardBottom = DESIGN_H - toolBarH - 8
  const boardH = Math.max(520, boardBottom - boardTop)
  const boardW = DESIGN_W - 54
  const boardX = 24
  const boardY = boardTop

  const panel = new PIXI.Graphics()
  panel.beginFill(0xffffff, 0.55)
  panel.lineStyle(2, 0xc4a574, 0.95)
  panel.drawRoundedRect(boardX, boardY, boardW, boardH, 18)
  panel.endFill()
  panel.beginFill(0x000000, 0.04)
  panel.drawRoundedRect(boardX + 4, boardY + 6, boardW - 8, boardH - 10, 14)
  panel.endFill()
  root.addChild(panel)

  const cellPad = 4
  const innerW = boardW - 24
  const innerH = boardH - 24
  const cellW = (innerW - cellPad * (boardCols - 1)) / boardCols
  const cellH = (innerH - cellPad * (boardRows - 1)) / boardRows
  const gridOriginX = boardX + 12
  const gridOriginY = boardY + 12

  const boardLayer = new PIXI.Container()
  root.addChild(boardLayer)
  const fxLayer = new PIXI.Container()
  root.addChild(fxLayer)

  type Tile = {
    type: number
    removed: boolean
    box: PIXI.Container
    bg: PIXI.Graphics
    icon: PIXI.Sprite
  }

  const tiles: Tile[][] = []
  const ids = buildPairs(boardRows * boardCols, kindCount)
  let idx = 0
  let selected: { r: number; c: number } | null = null
  let removedCount = 0
  const totalCount = boardRows * boardCols

  for (let r = 0; r < boardRows; r++) {
    const row: Tile[] = []
    for (let c = 0; c < boardCols; c++) {
      const type = ids[idx++]
      const box = new PIXI.Container()
      box.position.set(
        gridOriginX + c * (cellW + cellPad),
        gridOriginY + r * (cellH + cellPad)
      )

      const bgCell = new PIXI.Graphics()
      drawTileCell(bgCell, cellW, cellH, false)
      box.addChild(bgCell)

      const icon = new PIXI.Sprite(tileTextures[type] ?? PIXI.Texture.EMPTY)
      icon.anchor.set(0.5, 0.5)
      icon.position.set(cellW / 2, cellH / 2)
      const maxIcon = Math.min(cellW, cellH) * 0.72
      const tw = icon.texture.width || 1
      const th = icon.texture.height || 1
      const s = maxIcon / Math.max(tw, th)
      icon.scale.set(s)
      box.addChild(icon)

      const hit = new PIXI.Graphics()
      hit.beginFill(0xffffff, 0.001)
      hit.drawRoundedRect(0, 0, cellW, cellH, 8)
      hit.endFill()
      ;(hit as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
      hit.on('pointerdown', () => onPick(r, c))
      box.addChild(hit)

      boardLayer.addChild(box)
      row.push({ type, removed: false, box, bg: bgCell, icon })
    }
    tiles.push(row)
  }

  const progressText = new PIXI.Text('0%', {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fill: 0xffffff,
    fontWeight: '800'
  })
  progressText.anchor.set(0.5, 0.5)
  progressText.position.set(PROGRESS_W / 2, 23)
  progressFrame.root.addChild(progressText)

  // ── 底部道具栏（无整栏背景；菜单与四道具同尺寸） ─────────────────
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

  const toolCount = 4
  for (let i = 0; i < toolCount; i++) {
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
      onTool?.(i as 0 | 1 | 2 | 3)
      runTool(i as 0 | 1 | 2 | 3)
    })
    g.addChild(hitZone)
  }

  function setSelected(pos: { r: number; c: number } | null) {
    if (selected) {
      const t = tiles[selected.r][selected.c]
      if (!t.removed) drawTileCell(t.bg, cellW, cellH, false)
    }
    selected = pos
    if (selected) {
      const t = tiles[selected.r][selected.c]
      if (!t.removed) drawTileCell(t.bg, cellW, cellH, true)
    }
  }

  function onPick(r: number, c: number) {
    const cur = tiles[r][c]
    if (cur.removed) return
    if (!selected) {
      setSelected({ r, c })
      return
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null)
      return
    }
    const first = tiles[selected.r][selected.c]
    if (first.type !== cur.type) {
      flashWrong(first.bg)
      flashWrong(cur.bg)
      setSelected(null)
      return
    }
    const path = findPath(tiles, selected, { r, c })
    if (!path) {
      flashWrong(first.bg)
      flashWrong(cur.bg)
      setSelected(null)
      return
    }
    drawLinkPath(fxLayer, gridOriginX, gridOriginY, cellW, cellH, cellPad, path)
    removeAt(selected.r, selected.c)
    removeAt(r, c)
    setSelected(null)
    removedCount += 2
    pairsClearedSession += 1
    notifyPairCleared({ deltaPairs: 1 })
    updateProgress()
  }

  function removeAt(r: number, c: number) {
    const t = tiles[r][c]
    t.removed = true
    t.box.visible = false
  }

  function updateProgress() {
    const percent = Math.min(100, Math.floor((removedCount / totalCount) * 100))
    progressText.text = `${percent}%`
    drawProgressFill(progressFrame.fill, progressFrame.maxW, 46, percent)
    if (percent >= 100) {
      wx.showToast?.({ title: '通关成功', icon: 'none' })
      notifyMainLevelComplete(level)
      onBack()
    }
  }

  function runTool(i: 0 | 1 | 2 | 3) {
    if (i === 0) {
      const pair = findHintPair(tiles)
      if (!pair) {
        wx.showToast?.({ title: '暂无可消除', icon: 'none' })
        return
      }
      pulseTile(tiles[pair.a.r][pair.a.c].box)
      pulseTile(tiles[pair.b.r][pair.b.c].box)
      return
    }
    if (i === 1) {
      shuffleLeft(tiles, tileTextures, cellW, cellH)
      return
    }
    if (i === 2) {
      const pair = findHintPair(tiles)
      if (!pair) return
      removeAt(pair.a.r, pair.a.c)
      removeAt(pair.b.r, pair.b.c)
      removedCount += 2
      pairsClearedSession += 1
      notifyPairCleared({ deltaPairs: 1 })
      updateProgress()
      return
    }
    const pair = findHintPair(tiles)
    if (!pair) return
    removeAt(pair.a.r, pair.a.c)
    removeAt(pair.b.r, pair.b.c)
    removedCount += 2
    pairsClearedSession += 1
    notifyPairCleared({ deltaPairs: 1 })
    updateProgress()
  }

  parent.addChild(wrapper)
  return wrapper
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
  g.drawRoundedRect(0, 0, w, h, h / 2)
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
  bg.drawRoundedRect(0, 0, w, h, h / 2)
  bg.endFill()
  root.addChild(bg)
  const fill = new PIXI.Graphics()
  const maxW = w - 12
  drawProgressFill(fill, maxW, h, 0)
  root.addChild(fill)
  return { root, fill, maxW }
}

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

function drawTileCell(g: PIXI.Graphics, w: number, h: number, selected: boolean) {
  g.clear()
  g.beginFill(selected ? 0xfff2be : 0xfff9f0, 0.98)
  g.lineStyle(1.5, selected ? 0xe7a83f : 0xd4b896, 0.9)
  g.drawRoundedRect(0, 0, w, h, 8)
  g.endFill()
}

function buildPairs(total: number, kinds: number) {
  const arr: number[] = []
  for (let i = 0; i < total / 2; i++) {
    const v = i % kinds
    arr.push(v, v)
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

function flashWrong(cell: PIXI.Graphics) {
  cell.tint = 0xffcaca
  setTimeout(() => {
    cell.tint = 0xffffff
  }, 120)
}

function pulseTile(tile: PIXI.Container) {
  const s = tile.scale.x
  tile.scale.set(s * 1.08)
  setTimeout(() => tile.scale.set(s), 140)
}

function shuffleLeft(
  tiles: Array<
    Array<{ type: number; removed: boolean; icon: PIXI.Sprite }>
  >,
  tileTextures: PIXI.Texture[],
  cellW: number,
  cellH: number
) {
  const left: number[] = []
  for (const row of tiles) {
    for (const t of row) {
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
  for (const row of tiles) {
    for (const t of row) {
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
      }
    }
  }
}

function findHintPair(
  tiles: Array<Array<{ type: number; removed: boolean }>>
): { a: { r: number; c: number }; b: { r: number; c: number } } | null {
  for (let r1 = 0; r1 < tiles.length; r1++) {
    for (let c1 = 0; c1 < tiles[0].length; c1++) {
      if (tiles[r1][c1].removed) continue
      for (let r2 = r1; r2 < tiles.length; r2++) {
        for (let c2 = 0; c2 < tiles[0].length; c2++) {
          if (r1 === r2 && c2 <= c1) continue
          if (tiles[r2][c2].removed) continue
          if (tiles[r1][c1].type !== tiles[r2][c2].type) continue
          if (findPath(tiles, { r: r1, c: c1 }, { r: r2, c: c2 })) {
            return { a: { r: r1, c: c1 }, b: { r: r2, c: c2 } }
          }
        }
      }
    }
  }
  return null
}

function drawLinkPath(
  layer: PIXI.Container,
  x0: number,
  y0: number,
  cellW: number,
  cellH: number,
  pad: number,
  path: Array<{ r: number; c: number }>
) {
  const g = new PIXI.Graphics()
  g.lineStyle(4, 0xffd25e, 0.95)
  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    const x = x0 + p.c * (cellW + pad) + cellW / 2
    const y = y0 + p.r * (cellH + pad) + cellH / 2
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  layer.addChild(g)
  setTimeout(() => {
    if (g.parent) g.parent.removeChild(g)
    g.destroy()
  }, 180)
}

function findPath(
  tiles: Array<Array<{ removed: boolean }>>,
  start: { r: number; c: number },
  end: { r: number; c: number }
): Array<{ r: number; c: number }> | null {
  const rows = tiles.length
  const cols = tiles[0].length
  const exRows = rows + 2
  const exCols = cols + 2
  const blocked: number[][] = []
  for (let r = 0; r < exRows; r++) {
    blocked[r] = []
    for (let c = 0; c < exCols; c++) blocked[r][c] = 0
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      blocked[r + 1][c + 1] = tiles[r][c].removed ? 0 : 1
    }
  }
  const sr = start.r + 1
  const sc = start.c + 1
  const tr = end.r + 1
  const tc = end.c + 1
  blocked[sr][sc] = 0
  blocked[tr][tc] = 0
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
  type Node = {
    r: number
    c: number
    d: number
    turns: number
    path: Array<{ r: number; c: number }>
  }
  const q: Node[] = []
  const best: number[][][] = []
  for (let r = 0; r < exRows; r++) {
    best[r] = []
    for (let c = 0; c < exCols; c++) best[r][c] = [99, 99, 99, 99]
  }
  for (let d = 0; d < 4; d++) {
    best[sr][sc][d] = 0
    q.push({ r: sr, c: sc, d, turns: 0, path: [{ r: start.r, c: start.c }] })
  }
  while (q.length > 0) {
    const cur = q.shift() as Node
    const step = dirs[cur.d]
    const nr = cur.r + step.dr
    const nc = cur.c + step.dc
    if (nr < 0 || nr >= exRows || nc < 0 || nc >= exCols) continue
    if (blocked[nr][nc]) continue
    const logical = { r: nr - 1, c: nc - 1 }
    const nPath = cur.path.concat([logical])
    if (nr === tr && nc === tc) return trimPath(nPath)
    if (cur.turns <= best[nr][nc][cur.d]) {
      best[nr][nc][cur.d] = cur.turns
      q.push({ r: nr, c: nc, d: cur.d, turns: cur.turns, path: nPath })
    }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === cur.d) continue
      const nt = cur.turns + 1
      if (nt > 2) continue
      if (nt < best[nr][nc][nd]) {
        best[nr][nc][nd] = nt
        q.push({ r: nr, c: nc, d: nd, turns: nt, path: nPath })
      }
    }
  }
  return null
}

function trimPath(path: Array<{ r: number; c: number }>) {
  const out: Array<{ r: number; c: number }> = []
  for (let i = 0; i < path.length; i++) {
    if (i === 0 || i === path.length - 1) {
      out.push(path[i])
      continue
    }
    const a = path[i - 1]
    const b = path[i]
    const c = path[i + 1]
    const sameLine = (a.r === b.r && b.r === c.r) || (a.c === b.c && b.c === c.c)
    if (!sameLine) out.push(b)
  }
  return out
}
