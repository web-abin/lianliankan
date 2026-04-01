/**
 * 主题图集、成就进度（OpenSpec llk-achievements-themes）
 */
import { action } from 'mobx'
import { llk, persistLlkSave } from '~/game/llk-save'

export type GameThemeId = 'food' | 'fruit' | 'kitchen' | 'forest'

export interface ThemeAtlasPaths {
  imageUrl: string
  jsonUrl: string
}

/** 首包仅美食图集；其余主题解锁后同路径直至分包就绪 */
export function resolveThemeAtlasPaths(themeId: GameThemeId): ThemeAtlasPaths {
  switch (themeId) {
    case 'fruit':
    case 'kitchen':
    case 'forest':
    case 'food':
    default:
      return {
        imageUrl: 'assets/spritesheet/food.png',
        jsonUrl: 'assets/spritesheet/food.json'
      }
  }
}

export interface AchievementSnapshot {
  deltaPairs?: number
  totalPairsCleared?: number
  mainLevelsCleared?: number
  dailyChallengeClears?: number
}

export type AchievementRewardKind = 'theme' | 'coins' | 'sound'

export interface AchievementDef {
  id: string
  rewardKind: AchievementRewardKind
  themeId?: GameThemeId
}

const THRESHOLD_FRUIT = 15
const THRESHOLD_KITCHEN = 5
const THRESHOLD_FOREST = 200

function ensureUnlocked(theme: GameThemeId) {
  if (llk.unlockedThemes.includes(theme)) return
  llk.unlockedThemes.push(theme)
}

/** 检查主题解锁成就 */
export const checkThemeAchievements = action(function checkThemeAchievements() {
  if (llk.mainLevelsCleared >= THRESHOLD_FRUIT) ensureUnlocked('fruit')
  if (llk.dailyChallengeClears >= THRESHOLD_KITCHEN) ensureUnlocked('kitchen')
  if (llk.pairClearsTotal >= THRESHOLD_FOREST) ensureUnlocked('forest')
  persistLlkSave()
})

export function notifyPairCleared(snapshot: Partial<AchievementSnapshot> = {}): void {
  const d = snapshot.deltaPairs ?? 0
  if (d > 0) {
    llk.pairClearsTotal += d
    checkThemeAchievements()
  }
}

/** 由路由在写入 mainLevelsCleared 等后调用，仅刷新主题解锁判定 */
export function notifyMainLevelComplete(_levelNumber: number): void {
  checkThemeAchievements()
  persistLlkSave()
}

export function notifyDailyChallengeSuccess(): void {
  llk.dailyChallengeClears += 1
  checkThemeAchievements()
  persistLlkSave()
}
