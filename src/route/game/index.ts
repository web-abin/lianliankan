/**
 * 连连看 — 局内场景
 */
import * as PIXI from 'pixi.js'
import { stage, loader, store } from '~/core'
import * as navigator from '~/navigator'
import { createGameScreen, GAME_PRELOAD_URLS } from '~/ui/game-screen'
import { loadMainLineManifest, resolveMainLineLevel } from '~/game/link-level'
import { loadThemeTextureMap, texturesForKinds } from '~/game/food-atlas'
import type { GameThemeId } from '~/game/game-hooks'

let root: PIXI.Container | null = null

async function preload() {
  const toLoad = (GAME_PRELOAD_URLS as unknown as string[]).filter(
    url => !loader.resources[url]
  )
  if (toLoad.length === 0) return
  await new Promise<void>(resolve => {
    toLoad.forEach(url => loader.add(url))
    loader.load(() => resolve())
  })
}

export async function show(opts?: { level?: number }) {
  await preload()
  const level = opts?.level ?? Math.max(1, store.mem.user.level || 1)
  const coins = 9999
  const hearts = 10
  const maxHearts = 10

  const manifest = await loadMainLineManifest()
  const levelConfig = resolveMainLineLevel(level, manifest)
  const themeId: GameThemeId = 'food'
  const texMap = await loadThemeTextureMap(themeId)
  const maxKinds = Math.max(1, Object.keys(texMap).length)
  const tileTextures = texturesForKinds(
    texMap,
    Math.min(levelConfig.kindCount, maxKinds)
  )

  if (root) hide()

  root = new PIXI.Container()
  ;(root as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  ;(root as PIXI.DisplayObject & { interactiveChildren?: boolean }).interactiveChildren = true

  createGameScreen(root, {
    level,
    levelConfig,
    tileTextures,
    themeId,
    coins,
    hearts,
    maxHearts,
    onBack: () => navigator.back(),
    onPause: () => {
      wx.showActionSheet?.({
        itemList: ['放弃挑战', '继续游戏'],
        success: (res: { tapIndex: number }) => {
          if (res.tapIndex === 0) navigator.back()
        }
      })
    },
    onTool: i => {
      const names = ['提示', '刷新', '消除', '分享'] as const
      wx.showToast?.({ title: `${names[i]} 待接入`, icon: 'none' })
    }
  })

  stage.addChild(root)
}

export function hide() {
  if (root && stage.children.includes(root)) {
    stage.removeChild(root)
    root.destroy({ children: true })
  }
  root = null
}
