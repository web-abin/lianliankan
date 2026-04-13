/**
 * 主题图集路径、主题解锁成就检查
 */
import { action } from 'mobx'
import { llk, persistLlkSave } from '~/game/llk-save'

/** 5 个主题 ID，与需求文档一一对应 */
export type GameThemeId = 'fruit' | 'emotion' | 'forest-music' | 'plant' | 'animal'

export interface ThemeAtlasPaths {
  imageUrl: string
  jsonUrl: string
}

/**
 * 各主题图集路径
 * 当前均指向同一套占位图集，待美术切图后按主题替换
 */
export function resolveThemeAtlasPaths(themeId: GameThemeId): ThemeAtlasPaths {
  switch (themeId) {
    case 'emotion':
      return { imageUrl: 'assets/spritesheet/emotion.png', jsonUrl: 'assets/spritesheet/emotion.json' }
    case 'forest-music':
      return { imageUrl: 'assets/spritesheet/forest-music.png', jsonUrl: 'assets/spritesheet/forest-music.json' }
    case 'plant':
      return { imageUrl: 'assets/spritesheet/plant.png', jsonUrl: 'assets/spritesheet/plant.json' }
    case 'animal':
      return { imageUrl: 'assets/spritesheet/animal.png', jsonUrl: 'assets/spritesheet/animal.json' }
    case 'fruit':
    default:
      return { imageUrl: 'assets/spritesheet/food.png', jsonUrl: 'assets/spritesheet/food.json' }
  }
}

// ── 主题解锁条件（与需求文档一致）──────────────────────
// 情绪主题：主线累计通关 15 关
const THRESHOLD_EMOTION_MAIN = 15
// 森林音乐会主题：累计完成 5 次每日挑战
const THRESHOLD_FOREST_MUSIC_DAILY = 5
// 植物主题：累计消除 200 对
const THRESHOLD_PLANT_PAIRS = 200
// 动物主题：主线累计通关 40 关
const THRESHOLD_ANIMAL_MAIN = 40

function ensureUnlocked(theme: GameThemeId) {
  if (llk.unlockedThemes.includes(theme)) return
  llk.unlockedThemes.push(theme)
}

/** 检查主题解锁成就，并持久化 */
export const checkThemeAchievements = action(function checkThemeAchievements() {
  if (llk.mainLevelsCleared >= THRESHOLD_EMOTION_MAIN) ensureUnlocked('emotion')
  if (llk.dailyChallengeClears >= THRESHOLD_FOREST_MUSIC_DAILY) ensureUnlocked('forest-music')
  if (llk.pairClearsTotal >= THRESHOLD_PLANT_PAIRS) ensureUnlocked('plant')
  if (llk.mainLevelsCleared >= THRESHOLD_ANIMAL_MAIN) ensureUnlocked('animal')
  persistLlkSave()
})

export function notifyPairCleared(snapshot: { deltaPairs?: number } = {}): void {
  const d = snapshot.deltaPairs ?? 0
  if (d > 0) {
    llk.pairClearsTotal += d
    checkThemeAchievements()
  }
}

export function notifyMainLevelComplete(_levelNumber: number): void {
  checkThemeAchievements()
  persistLlkSave()
}

export function notifyDailyChallengeSuccess(): void {
  llk.dailyChallengeClears += 1
  checkThemeAchievements()
  persistLlkSave()
}
