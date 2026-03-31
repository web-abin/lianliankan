import type { MainLineLevelEntry, MainLineManifest } from '~/constants/link-level-types'
import { readFile } from '~/util'

const MANIFEST_URL = 'assets/levels/main-line.json'

let cachedManifest: MainLineManifest | null = null

export async function loadMainLineManifest(): Promise<MainLineManifest> {
  if (cachedManifest) return cachedManifest
  const raw = (await readFile({ filePath: MANIFEST_URL, encoding: 'utf-8' })) as string
  cachedManifest = JSON.parse(raw) as MainLineManifest
  return cachedManifest
}

/**
 * 关卡序号 n：1…L 用对应条目；n > L 时复用第 L 条难度参数（OpenSpec 平台期规则）
 */
export function resolveMainLineLevel(
  levelNumber: number,
  manifest: MainLineManifest
): MainLineLevelEntry {
  const L = manifest.levels.length
  if (L === 0) throw new Error('main-line.json: levels 为空')
  const idx = Math.min(Math.max(levelNumber, 1), L) - 1
  return manifest.levels[idx]
}
