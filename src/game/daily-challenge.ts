/**
 * 每日挑战：独立生成器、日级种子、固定重力 + 随机第二机制
 */
import type { MainLineLevelEntry } from '~/constants/link-level-types'
import { loadMainLineManifest } from '~/game/link-level'

export type DailyDim = 'fog' | 'gravity' | 'flip'

export interface DailyCombo {
  dimA: DailyDim
  dimB: DailyDim
  gravity: 'left' | 'right' | 'up' | 'down'
}

const GRAVITIES = ['left', 'right', 'up', 'down'] as const

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** YYYYMMDD 本地 */
export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * 从主线第 L 关取最大棋盘尺寸；若 manifest 为空则默认 8×14
 */
export async function maxBoardFromManifest(): Promise<{ cols: number; rows: number }> {
  const m = await loadMainLineManifest()
  const L = m.levels.length
  if (L === 0) return { cols: 8, rows: 14 }
  let maxArea = 0
  let entry = m.levels[L - 1]
  for (const e of m.levels) {
    const a = e.cols * e.rows
    if (a >= maxArea) {
      maxArea = a
      entry = e
    }
  }
  return { cols: entry.cols, rows: entry.rows }
}

/**
 * 生成当日挑战关卡参数（与主线 JSON 行结构兼容）
 */
export async function buildDailyLevelConfig(
  dayKey: string,
  openIdSalt = ''
): Promise<{ entry: MainLineLevelEntry; combo: DailyCombo; seed: number }> {
  const { cols, rows } = await maxBoardFromManifest()
  const seed =
    (Number(dayKey.replace(/\D/g, '').slice(0, 8)) * 1000003 +
      hashStr(openIdSalt)) >>>
    0
  const rnd = mulberry32(seed)

  const dimA: DailyDim = 'gravity'
  const dimB: DailyDim = rnd() < 0.5 ? 'fog' : 'flip'

  const gdir = GRAVITIES[Math.floor(rnd() * GRAVITIES.length)]

  const entry: MainLineLevelEntry = {
    id: `daily-${dayKey}`,
    cols,
    rows,
    kindCount: 15,
    gravity: 'none',
    fog: false,
    flip: false
  }

  const combo: DailyCombo = { dimA, dimB, gravity: gdir }

  if (dimA === 'gravity' || dimB === 'gravity') entry.gravity = gdir
  if (dimA === 'fog' || dimB === 'fog') entry.fog = true
  if (dimA === 'flip' || dimB === 'flip') entry.flip = true

  return { entry, combo, seed }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
