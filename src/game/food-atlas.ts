import * as PIXI from 'pixi.js'
import { readFile } from '~/util'
import type { GameThemeId } from '~/game/game-hooks'
import { resolveThemeAtlasPaths } from '~/game/game-hooks'

type FrameJson = {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>
}

const cache = new Map<string, Record<string, PIXI.Texture>>()

/**
 * 按主题加载图集纹理表（帧名 food-01 …，与 assets/spritesheet/food.json 一致）
 */
export async function loadThemeTextureMap(
  themeId: GameThemeId
): Promise<Record<string, PIXI.Texture>> {
  const paths = resolveThemeAtlasPaths(themeId)
  const cacheKey = `${paths.imageUrl}|${paths.jsonUrl}`
  const hit = cache.get(cacheKey)
  if (hit) return hit

  const raw = (await readFile({ filePath: paths.jsonUrl, encoding: 'utf-8' })) as string
  const json = JSON.parse(raw) as FrameJson
  const base = PIXI.BaseTexture.from(paths.imageUrl)
  if (base.valid) {
    // ok
  } else {
    await new Promise<void>(resolve => {
      base.once('loaded', () => resolve())
      base.once('error', () => resolve())
    })
  }

  const out: Record<string, PIXI.Texture> = {}
  const frames = json.frames
  if (frames && typeof frames === 'object') {
    const keys = Object.keys(frames).sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] ?? 0)
      const nb = Number(b.match(/(\d+)/)?.[1] ?? 0)
      return na - nb || a.localeCompare(b)
    })
    for (const k of keys) {
      const f = frames[k].frame
      out[k] = new PIXI.Texture(base, new PIXI.Rectangle(f.x, f.y, f.w, f.h))
    }
  }
  cache.set(cacheKey, out)
  return out
}

/** 按帧名排序后取前 kindCount 张（类型 0…kindCount-1） */
export function texturesForKinds(
  map: Record<string, PIXI.Texture>,
  kindCount: number
): PIXI.Texture[] {
  const keys = Object.keys(map).sort((a, b) => {
    const na = Number(a.match(/(\d+)/)?.[1] ?? 0)
    const nb = Number(b.match(/(\d+)/)?.[1] ?? 0)
    return na - nb || a.localeCompare(b)
  })
  return keys.slice(0, kindCount).map(k => map[k])
}
