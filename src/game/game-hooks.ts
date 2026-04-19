/**
 * 主题图集路径、主题解锁成就检查
 */
import { action } from 'mobx'
import { llk, persistLlkSave } from '~/game/llk-save'

/** 内测开关：打开后所有主题可直接切换，无需解锁 */
export const BETA_UNLOCK_ALL = true

/** 第一版上线的 3 个主题 ID */
export type GameThemeId = 'fruit' | 'music' | 'animal'

export interface ThemeAtlasPaths {
  imageUrl: string
  jsonUrl: string
}

export interface ThemeBackgroundSpec {
  imageUrl: string
  fallbackColor: number
}

/** 各主题精灵图集路径 */
export function resolveThemeAtlasPaths(themeId: GameThemeId): ThemeAtlasPaths {
  switch (themeId) {
    case 'music':
      return {
        imageUrl: 'assets/theme/music/spritesheet.png',
        jsonUrl: 'assets/theme/music/spritesheet.json'
      }
    case 'animal':
      return {
        imageUrl: 'assets/theme/animal/spritesheet.png',
        jsonUrl: 'assets/theme/animal/spritesheet.json'
      }
    case 'fruit':
    default:
      return {
        imageUrl: 'assets/theme/default/spritesheet.png',
        jsonUrl: 'assets/theme/default/spritesheet.json'
      }
  }
}

/**
 * 局内背景图资源
 * 音乐/动物主题暂无独立游戏背景，复用默认背景
 */
export function resolveThemeGameBackground(
  themeId: GameThemeId
): ThemeBackgroundSpec {
  switch (themeId) {
    case 'music':
      return {
        imageUrl: 'assets/theme/music/game-bg.png',
        fallbackColor: 0xb8df7a
      }
    case 'animal':
      return {
        imageUrl: 'assets/theme/animal/game-bg.png',
        fallbackColor: 0xb8df7a
      }
    default:
      return {
        imageUrl: 'assets/theme/default/game-bg.jpg',
        fallbackColor: 0xb8df7a
      }
  }
}

/**
 * 首页背景图路径（按主题区分）
 */
export function resolveThemeHomeBg(themeId: GameThemeId): string {
  switch (themeId) {
    case 'music':
      return 'assets/theme/music/home-bg.png'
    case 'animal':
      return 'assets/theme/animal/home-bg.png'
    default:
      return 'assets/theme/default/home-bg.jpg'
  }
}

/**
 * 首页中心角色图路径（按主题区分）
 */
export function resolveThemeHomeRole(themeId: GameThemeId): string {
  switch (themeId) {
    case 'music':
      return 'assets/theme/music/home-role.png'
    case 'animal':
      return 'assets/theme/animal/home-role.png'
    default:
      return 'assets/theme/default/home-role.png'
  }
}

// ── 主题解锁条件 ──────────────────────────────────────
// 森林音乐会主题：累计完成 5 次每日挑战
const THRESHOLD_FOREST_MUSIC_DAILY = 5
// 动物主题：主线累计通关 40 关
const THRESHOLD_ANIMAL_MAIN = 40

function ensureUnlocked(theme: GameThemeId) {
  if (llk.unlockedThemes.includes(theme)) return
  llk.unlockedThemes.push(theme)
}

/** 检查主题解锁成就，并持久化 */
export const checkThemeAchievements = action(function checkThemeAchievements() {
  if (llk.dailyChallengeClears >= THRESHOLD_FOREST_MUSIC_DAILY)
    ensureUnlocked('music')
  if (llk.mainLevelsCleared >= THRESHOLD_ANIMAL_MAIN) ensureUnlocked('animal')
  persistLlkSave()
})

export function notifyPairCleared(
  snapshot: { deltaPairs?: number } = {}
): void {
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
