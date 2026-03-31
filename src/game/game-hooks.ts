/**
 * 局内与产品层对接的占位：主题图集、成就进度（OpenSpec llk-achievements-themes / gameplay）
 */

export type GameThemeId = 'food' | 'fruit' | 'kitchen' | 'forest'

export interface ThemeAtlasPaths {
  imageUrl: string
  jsonUrl: string
}

/** 当前仅美食图集在首包；其余主题可改为分包 URL */
export function resolveThemeAtlasPaths(themeId: GameThemeId): ThemeAtlasPaths {
  // 首包仅含美食图集；水果季等解锁后若有独立分包再改路径
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
  /** 本局新增消除对数（由局内上报，持久化层再累加） */
  deltaPairs?: number
  /** 累计消除对数（若 store 已汇总可直接传） */
  totalPairsCleared?: number
  /** 普通关累计通关数 */
  mainLevelsCleared?: number
  /** 每日挑战成功次数 */
  dailyChallengeClears?: number
}

export type AchievementRewardKind = 'theme' | 'coins' | 'sound'

export interface AchievementDef {
  id: string
  rewardKind: AchievementRewardKind
  /** 主题解锁时与 GameThemeId 对应 */
  themeId?: GameThemeId
}

/** 占位：上报消除一对（可写入 store / 云端） */
export function notifyPairCleared(snapshot: Partial<AchievementSnapshot> = {}): void {
  void snapshot
  // TODO: store.mem.achievements + 云端同步
}

/** 占位：关卡通关（累计通关数等） */
export function notifyMainLevelComplete(_levelNumber: number): void {
  // TODO: store + 成就服务
}
