/** 连连看路径：扩展网格外空白、最多两拐、不可穿牌 */

export interface PathCell {
  removed: boolean
}

export function findPath(
  tiles: PathCell[][],
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
    const sameLine =
      (a.r === b.r && b.r === c.r) || (a.c === b.c && b.c === c.c)
    if (!sameLine) out.push(b)
  }
  return out
}

export function findHintPair(
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
