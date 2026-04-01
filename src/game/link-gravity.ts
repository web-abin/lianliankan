import * as PIXI from 'pixi.js'
import type { GravityDir } from '~/constants/link-level-types'

/** 可重力移动、带 removed 与 box 的格子 */
export type GravityTile = {
  type: number
  removed: boolean
  box: PIXI.Container
  /** 当前在 tiles[][] 中的行坐标，重力移动后会同步更新 */
  r: number
  /** 当前在 tiles[][] 中的列坐标，重力移动后会同步更新 */
  c: number
}

/**
 * 消除后按单方向阶梯填补；更新 tiles[r][c] 引用与 box 位置。
 */
export function applyGravity(
  tiles: GravityTile[][],
  dir: GravityDir,
  gridOriginX: number,
  gridOriginY: number,
  cellW: number,
  cellH: number,
  colPad: number,
  rowPad: number
): void {
  if (dir === 'none') return
  const R = tiles.length
  const C = tiles[0].length

  const setPos = (t: GravityTile, r: number, c: number) => {
    t.box.position.set(
      gridOriginX + c * (cellW + colPad),
      gridOriginY + r * (cellH + rowPad)
    )
  }

  if (dir === 'down') {
    for (let c = 0; c < C; c++) {
      const alive: GravityTile[] = []
      for (let r = R - 1; r >= 0; r--) {
        if (!tiles[r][c].removed) alive.push(tiles[r][c])
      }
      const dead: GravityTile[] = []
      for (let r = 0; r < R; r++) {
        const t = tiles[r][c]
        if (t.removed) dead.push(t)
      }
      const merged = [...alive, ...dead]
      for (let i = 0; i < R; i++) {
        const r = R - 1 - i
        const t = merged[i]
        tiles[r][c] = t
        t.r = r
        t.c = c
        const isAlive = i < alive.length
        t.removed = !isAlive
        t.box.visible = isAlive
        setPos(t, r, c)
      }
    }
    return
  }

  if (dir === 'up') {
    for (let c = 0; c < C; c++) {
      const alive: GravityTile[] = []
      for (let r = 0; r < R; r++) {
        if (!tiles[r][c].removed) alive.push(tiles[r][c])
      }
      const dead: GravityTile[] = []
      for (let r = 0; r < R; r++) {
        const t = tiles[r][c]
        if (t.removed) dead.push(t)
      }
      const merged = [...alive, ...dead]
      for (let i = 0; i < R; i++) {
        const r = i
        const t = merged[i]
        tiles[r][c] = t
        t.r = r
        t.c = c
        const isAlive = i < alive.length
        t.removed = !isAlive
        t.box.visible = isAlive
        setPos(t, r, c)
      }
    }
    return
  }

  if (dir === 'left') {
    for (let r = 0; r < R; r++) {
      const alive: GravityTile[] = []
      for (let c = 0; c < C; c++) {
        if (!tiles[r][c].removed) alive.push(tiles[r][c])
      }
      const dead: GravityTile[] = []
      for (let c = 0; c < C; c++) {
        const t = tiles[r][c]
        if (t.removed) dead.push(t)
      }
      const merged = [...alive, ...dead]
      for (let i = 0; i < C; i++) {
        const c = i
        const t = merged[i]
        tiles[r][c] = t
        t.r = r
        t.c = c
        const isAlive = i < alive.length
        t.removed = !isAlive
        t.box.visible = isAlive
        setPos(t, r, c)
      }
    }
    return
  }

  if (dir === 'right') {
    for (let r = 0; r < R; r++) {
      const alive: GravityTile[] = []
      for (let c = C - 1; c >= 0; c--) {
        if (!tiles[r][c].removed) alive.push(tiles[r][c])
      }
      const dead: GravityTile[] = []
      for (let c = 0; c < C; c++) {
        const t = tiles[r][c]
        if (t.removed) dead.push(t)
      }
      const merged = [...alive, ...dead]
      for (let i = 0; i < C; i++) {
        const c = C - 1 - i
        const t = merged[i]
        tiles[r][c] = t
        t.r = r
        t.c = c
        const isAlive = i < alive.length
        t.removed = !isAlive
        t.box.visible = isAlive
        setPos(t, r, c)
      }
    }
  }
}
