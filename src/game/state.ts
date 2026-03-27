/**
 * 游戏状态：主菜单 / 进行中 / 结算
 */
export type GamePhase = 'mainmenu' | 'playing' | 'gameover'

export interface GameState {
  phase: GamePhase
  score: number
  highScore: number
  /** 本局最大合成到的水果等级 */
  maxFruitLevel: number
  /** 当前待投放的水果等级（1-based） */
  nextFruitLevel: number
  /** 是否新纪录 */
  isNewRecord: boolean
  /** 本局连续合成次数（用于成就） */
  comboCount: number
}

const KEY_HIGH_SCORE = 'durian_high_score'

export function getInitialState(): GameState {
  return {
    phase: 'mainmenu',
    score: 0,
    highScore: loadHighScore(),
    maxFruitLevel: 0,
    nextFruitLevel: 1,
    isNewRecord: false,
    comboCount: 0,
  }
}

export function loadHighScore(): number {
  try {
    const w = wx as unknown as { getStorageSync?: (key: string) => unknown }
    const v = w.getStorageSync?.(KEY_HIGH_SCORE)
    return typeof v === 'number' ? v : 0
  } catch {
    return 0
  }
}

export function saveHighScore(score: number): void {
  try {
    const w = wx as unknown as { setStorageSync?: (key: string, data: number) => void }
    w.setStorageSync?.(KEY_HIGH_SCORE, score)
  } catch (_) {}
}
