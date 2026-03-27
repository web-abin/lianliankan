/**
 * 轻量成就：本地存储，解锁时弹窗
 */
const STORAGE_KEY = 'durian_achievements'

export interface AchievementDef {
  id: string
  name: string
  desc: string
  /** 未解锁时的占位颜色 */
  color: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_durian', name: '榴莲初成', desc: '首次合成出大榴莲', color: 0x7d3c98 },
  { id: 'score_500', name: '小有成就', desc: '单局得分超过 500', color: 0xf1c40f },
  { id: 'score_1000', name: '高分玩家', desc: '单局得分超过 1000', color: 0xe74c3c },
  { id: 'combo_5', name: '连合成王', desc: '单局连续合成 5 次', color: 0x27ae60 },
]

function loadUnlocked(): Set<string> {
  try {
    const w = wx as unknown as { getStorageSync?: (key: string) => unknown }
    const raw = w.getStorageSync?.(STORAGE_KEY)
    if (Array.isArray(raw)) return new Set(raw as string[])
    if (typeof raw === 'string') return new Set(raw.split(',').filter(Boolean))
  } catch (_) {}
  return new Set()
}

let unlocked = loadUnlocked()

function saveUnlocked(): void {
  try {
    const w = wx as unknown as { setStorageSync?: (key: string, data: string) => void }
    w.setStorageSync?.(STORAGE_KEY, Array.from(unlocked).join(','))
  } catch (_) {}
}

export function isUnlocked(id: string): boolean {
  return unlocked.has(id)
}

export function unlock(id: string): boolean {
  if (unlocked.has(id)) return false
  unlocked.add(id)
  saveUnlocked()
  return true
}

/** 检查并解锁成就，返回新解锁的成就 def（用于弹窗） */
export function checkAndUnlock(opts: {
  maxFruitLevel: number
  score: number
  comboCount: number
}): AchievementDef | null {
  if (opts.maxFruitLevel >= 10) {
    const def = ACHIEVEMENTS.find(a => a.id === 'first_durian')
    if (def && unlock(def.id)) return def
  }
  if (opts.score >= 1000) {
    const def = ACHIEVEMENTS.find(a => a.id === 'score_1000')
    if (def && unlock(def.id)) return def
  }
  if (opts.score >= 500) {
    const def = ACHIEVEMENTS.find(a => a.id === 'score_500')
    if (def && unlock(def.id)) return def
  }
  if (opts.comboCount >= 5) {
    const def = ACHIEVEMENTS.find(a => a.id === 'combo_5')
    if (def && unlock(def.id)) return def
  }
  return null
}
