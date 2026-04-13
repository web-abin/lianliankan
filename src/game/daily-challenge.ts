/**
 * 每日挑战：日级种子，机制固定为"重力（方向随机）+ 果冻"
 */
import type { MainLineLevelEntry } from '~/constants/link-level-types'
import { loadMainLineManifest } from '~/game/link-level'

const GRAVITIES = ['left', 'right', 'up', 'down'] as const
export type GravityDir = (typeof GRAVITIES)[number]

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 返回 YYYYMMDD（本地时区） */
export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}${m}${day}`
}

/** 从 manifest 中取最大棋盘；若为空默认 8×14 */
export async function maxBoardFromManifest(): Promise<{ cols: number; rows: number }> {
  const m = await loadMainLineManifest()
  if (m.levels.length === 0) return { cols: 8, rows: 14 }
  let maxArea = 0
  let entry = m.levels[m.levels.length - 1]
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
 * 生成当日挑战关卡参数
 * 机制固定：重力（方向由种子决定）+ 果冻
 */
export async function buildDailyLevelConfig(
  dayKey: string,
  openIdSalt = ''
): Promise<{ entry: MainLineLevelEntry; gravity: GravityDir; seed: number }> {
  const { cols, rows } = await maxBoardFromManifest()
  const seed =
    (Number(dayKey.replace(/\D/g, '').slice(0, 8)) * 1000003 +
      hashStr(openIdSalt)) >>>
    0
  const rnd = mulberry32(seed)

  // 重力方向随机，果冻固定开启
  const gravity = GRAVITIES[Math.floor(rnd() * GRAVITIES.length)]

  const entry: MainLineLevelEntry = {
    id: `daily-${dayKey}`,
    cols,
    rows,
    kindCount: 15,
    gravity,
    jelly: true
  }

  return { entry, gravity, seed }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
