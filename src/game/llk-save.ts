/**
 * 连连看本地进度（金币、血量、道具、成就、每日挑战等）
 * 云端字段同步在 llk-sync 层扩展
 */
import { action, observable } from 'mobx'
import { COINS_DESK_DAILY, SIGN_IN_COINS } from '~/game/economy-config'
import type { GameThemeId } from '~/game/game-hooks'

const STORAGE_KEY = 'llk_save_v1'

export interface LlkInventory {
  hint: number
  refresh: number
  eliminate: number
}

export interface DailyChallengeState {
  /** YYYYMMDD（本地时区） */
  dayKey: string
  /** 当日种子（与生成器一致） */
  seed: number
  /** 当日是否已成功 */
  cleared: boolean
  /** 维度组合 id（调试用） */
  comboId?: string
}

export interface LlkSaveV1 {
  version: 1
  coins: number
  hearts: number
  maxHearts: number
  /** 普通关累计通关数（用于成就） */
  mainLevelsCleared: number
  /** 当前可进入的关卡序号（= 已通最高关 + 1，至少 1） */
  currentLevel: number
  /** 最高关当局步数（世界榜用） */
  bestLevelSteps: number
  /** 达到 currentLevel-1 时的通关时间戳 ms */
  bestLevelClearedAt: number
  /** 累计消除对数 */
  pairClearsTotal: number
  /** 每日挑战成功次数 */
  dailyChallengeClears: number
  inventory: LlkInventory
  /** 已解锁主题（含默认 food） */
  unlockedThemes: GameThemeId[]
  selectedTheme: GameThemeId
  /** 连续签到：上次领取日、当前连签天数 1–7 */
  streakDay: number
  lastSignInDayKey: string
  circleRewarded: boolean
  /** 喊人：上次发血日 */
  lastShoutDayKey: string
  shoutCountToday: number
  purchasedCapybara: boolean
  purchasedSoundPack: boolean
  dailyChallenge: DailyChallengeState | null
  /** 设置：音效开关（默认开） */
  soundOn: boolean
  /** 设置：震动开关（默认开） */
  vibrationOn: boolean
  /** 设置：音乐开关（默认开） */
  musicOn: boolean
}

const defaultSave = (): LlkSaveV1 => ({
  version: 1,
  coins: 0,
  hearts: 10,
  maxHearts: 10,
  mainLevelsCleared: 0,
  currentLevel: 1,
  bestLevelSteps: 0,
  bestLevelClearedAt: 0,
  pairClearsTotal: 0,
  dailyChallengeClears: 0,
  inventory: { hint: 3, refresh: 3, eliminate: 3 },
  unlockedThemes: ['food'],
  selectedTheme: 'food',
  streakDay: 0,
  lastSignInDayKey: '',
  circleRewarded: false,
  lastShoutDayKey: '',
  shoutCountToday: 0,
  purchasedCapybara: false,
  purchasedSoundPack: false,
  dailyChallenge: null,
  soundOn: true,
  vibrationOn: true,
  musicOn: true
})

function dayKeyNow(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}${m}${day}`
}

export const llk = observable<LlkSaveV1>(defaultSave())

export function loadLlkSave(): void {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY) as string | undefined
    if (!raw) {
      Object.assign(llk, defaultSave())
      return
    }
    const p = JSON.parse(raw) as Partial<LlkSaveV1>
    const base = defaultSave()
    Object.assign(llk, base, p, {
      inventory: { ...base.inventory, ...p.inventory },
      unlockedThemes: Array.isArray(p.unlockedThemes)
        ? (p.unlockedThemes as GameThemeId[])
        : base.unlockedThemes
    })
    if (!llk.unlockedThemes.includes('food')) {
      llk.unlockedThemes.push('food')
    }
  } catch (_) {
    Object.assign(llk, defaultSave())
  }
}

export function persistLlkSave(): void {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify({ ...llk }))
  } catch (_) {}
}

export const persist = action(function persist() {
  persistLlkSave()
})

/** 桌面奖励：每日一次 */
export function grantDeskDailyIfNeeded(): boolean {
  const key = `llk_desk_${dayKeyNow()}`
  try {
    if (wx.getStorageSync(key)) return false
    wx.setStorageSync(key, '1')
  } catch (_) {
    return false
  }
  llk.coins += COINS_DESK_DAILY
  persistLlkSave()
  return true
}

/** 连续签到：领取当日奖励 */
export function claimSignInReward(): { coins: number; streak: number } | null {
  const today = dayKeyNow()
  if (llk.lastSignInDayKey === today) return null

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yk = `${yesterday.getFullYear()}${`${yesterday.getMonth() + 1}`.padStart(2, '0')}${`${yesterday.getDate()}`.padStart(2, '0')}`

  let streak = 1
  if (llk.lastSignInDayKey === yk) {
    streak = Math.min(7, llk.streakDay + 1)
  }
  const coins = SIGN_IN_COINS[Math.min(6, streak - 1)]
  llk.streakDay = streak
  llk.lastSignInDayKey = today
  llk.coins += coins
  persistLlkSave()
  return { coins, streak }
}
