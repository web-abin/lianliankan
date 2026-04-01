/**
 * 连连看 — 局内场景
 */
import * as PIXI from 'pixi.js'
import { stage, loader } from '~/core'
import * as navigator from '~/navigator'
import { createGameScreen, GAME_PRELOAD_URLS } from '~/ui/game-screen'
import {
  loadMainLineManifest,
  resolveMainLineLevel,
  layoutSeedForMainLevel
} from '~/game/link-level'
import { loadThemeTextureMap, texturesForKinds } from '~/game/food-atlas'
import type { GameThemeId } from '~/game/game-hooks'
import { notifyMainLevelComplete, notifyDailyChallengeSuccess } from '~/game/game-hooks'
import { llk, persistLlkSave } from '~/game/llk-save'
import {
  COINS_MAIN_CLEAR_PER_LEVEL,
  FEATURE_REWARDED_VIDEO,
  SHARE_BONUS_ELIMINATE,
  SHARE_BONUS_HINT,
  SHARE_BONUS_REFRESH
} from '~/game/economy-config'
import { buildDailyLevelConfig, todayKey } from '~/game/daily-challenge'
import { openModalShell } from '~/ui/modal-shell'
import { reportProgressToCloud } from '~/wx/supabase-sync'

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

export async function show(opts?: {
  level?: number
  mode?: 'main' | 'daily'
}) {
  await preload()
  const mode = opts?.mode ?? 'main'
  const level =
    opts?.level ??
    (mode === 'main' ? Math.max(1, llk.currentLevel) : 1)

  if (mode === 'main' && llk.hearts <= 0) {
    wx.showToast?.({
      title: '血量不足，可去商店购买或喊人',
      icon: 'none'
    })
    navigator.back()
    return
  }

  const manifest = await loadMainLineManifest()
  let levelConfig = resolveMainLineLevel(level, manifest)
  let layoutSeed = layoutSeedForMainLevel(level, manifest)

  if (mode === 'daily') {
    const day = todayKey()
    const built = await buildDailyLevelConfig(day)
    levelConfig = built.entry
    layoutSeed = (built.seed ^ Number(day.slice(0, 8))) >>> 0
    if (!llk.dailyChallenge || llk.dailyChallenge.dayKey !== day) {
      llk.dailyChallenge = {
        dayKey: day,
        seed: built.seed,
        cleared: false,
        comboId: `${built.combo.dimA}+${built.combo.dimB}`
      }
      persistLlkSave()
    }
  }

  const themeId: GameThemeId = llk.selectedTheme
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
    mode,
    layoutSeed,
    coins: llk.coins,
    hearts: llk.hearts,
    maxHearts: llk.maxHearts,
    onToolBeforeUse: i => {
      if (i === 0) {
        if (llk.inventory.hint <= 0) {
          wx.showToast?.({ title: '提示道具不足', icon: 'none' })
          return false
        }
        llk.inventory.hint -= 1
        persistLlkSave()
        return true
      }
      if (i === 1) {
        if (llk.inventory.refresh <= 0) {
          wx.showToast?.({ title: '刷新道具不足', icon: 'none' })
          return false
        }
        llk.inventory.refresh -= 1
        persistLlkSave()
        return true
      }
      if (llk.inventory.eliminate <= 0) {
        wx.showToast?.({ title: '消除道具不足', icon: 'none' })
        return false
      }
      llk.inventory.eliminate -= 1
      persistLlkSave()
      return true
    },
    onBack: () => navigator.back(),
    onPause: () => {
      openModalShell(stage, {
        title: '放弃挑战？',
        body: `当前进度：第 ${level} 关\n再努力一下就要过关了`,
        cancelText: '再试试',
        confirmText: '回首页',
        onCancel: () => {},
        onConfirm: () => {
          if (mode === 'main') {
            llk.hearts = Math.max(0, llk.hearts - 1)
            persistLlkSave()
          }
          navigator.back()
        }
      })
    },
    onTool: i => {
      if (i !== 3) return
      if (FEATURE_REWARDED_VIDEO) {
        wx.showToast?.({ title: '激励视频占位', icon: 'none' })
        return
      }
      const msg: Parameters<typeof wx.shareAppMessage>[0] = {
        title: '卡皮巴拉连连看',
        query: ''
      }
      const anyWx = wx as typeof wx & {
        shareAppMessage?: (o: typeof msg & {
          success?: () => void
        }) => void
      }
      anyWx.shareAppMessage?.({
        ...msg,
        success: () => {
          llk.inventory.hint += SHARE_BONUS_HINT
          llk.inventory.refresh += SHARE_BONUS_REFRESH
          llk.inventory.eliminate += SHARE_BONUS_ELIMINATE
          persistLlkSave()
          wx.showToast?.({
            title: `提示+${SHARE_BONUS_HINT} 刷新+${SHARE_BONUS_REFRESH} 消除+${SHARE_BONUS_ELIMINATE}`,
            icon: 'none'
          })
        }
      })
    },
    onLevelClear: async payload => {
      if (mode === 'main') {
        const clearedAt = Date.now()
        llk.coins += COINS_MAIN_CLEAR_PER_LEVEL
        llk.mainLevelsCleared += 1
        llk.currentLevel = level + 1
        llk.bestLevelSteps = payload.steps
        llk.bestLevelClearedAt = clearedAt
        notifyMainLevelComplete(level)
        persistLlkSave()
        await reportProgressToCloud({
          level: llk.currentLevel - 1,
          steps: payload.steps,
          clearedAt
        })
        navigator.redirect('game', { level: level + 1, mode: 'main' })
        return
      }
      if (llk.dailyChallenge) {
        llk.dailyChallenge.cleared = true
      }
      notifyDailyChallengeSuccess()
      persistLlkSave()
      wx.showToast?.({ title: '今日挑战完成', icon: 'none' })
      navigator.back()
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
