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
import { openSettingsModal } from '~/ui/settings-modal'
import { openGiveUpModal }   from '~/ui/give-up-modal'
import { openToolModal }     from '~/ui/tool-modal'
import { openShopScreen }    from '~/ui/shop-screen'
import {
  SHOP_PRICE_BLOOD, SHOP_PRICE_CAPYBARA, SHOP_PRICE_SOUND_PACK, SHOP_PRICE_TOOL_PACK
} from '~/game/economy-config'
import { reportProgressToCloud } from '~/wx/supabase-sync'
import { startGameBgm, stopGameBgm } from '~/game/llk-sound'

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
      const toolTypes = ['hint', 'refresh', 'eliminate'] as const
      const toolType = toolTypes[i]
      if (!toolType) return true // 第 3 格是分享，直接放行

      const stockKey = toolType === 'hint' ? 'hint' : toolType === 'refresh' ? 'refresh' : 'eliminate'
      if (llk.inventory[stockKey] <= 0) {
        // 显示道具不足弹窗，提供分享/商店两条路径
        openToolModal(stage, {
          toolType,
          onShare: () => {
            const anyWx = wx as typeof wx & {
              shareAppMessage?: (o: { title: string; query: string; success?: () => void }) => void
            }
            anyWx.shareAppMessage?.({
              title: '卡皮巴拉连连看',
              query: '',
              success: () => {
                llk.inventory.hint += SHARE_BONUS_HINT
                llk.inventory.refresh += SHARE_BONUS_REFRESH
                llk.inventory.eliminate += SHARE_BONUS_ELIMINATE
                persistLlkSave()
                wx.showToast?.({ title: `提示+${SHARE_BONUS_HINT} 刷新+${SHARE_BONUS_REFRESH} 消除+${SHARE_BONUS_ELIMINATE}`, icon: 'none' })
              }
            })
          },
          onShop: () => {
            openShopScreen(stage, {
              coins: llk.coins,
              inventory: { ...llk.inventory },
              purchasedCapybara: llk.purchasedCapybara,
              purchasedSoundPack: llk.purchasedSoundPack,
              onBuyToolPack: () => {
                if (llk.coins < SHOP_PRICE_TOOL_PACK) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
                llk.coins -= SHOP_PRICE_TOOL_PACK
                llk.inventory.hint += 3
                llk.inventory.refresh += 1
                llk.inventory.eliminate += 1
                persistLlkSave()
                wx.showToast?.({ title: '道具已入库存', icon: 'none' })
              },
              onBuyBlood: () => {
                if (llk.coins < SHOP_PRICE_BLOOD) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
                llk.coins -= SHOP_PRICE_BLOOD
                llk.hearts = Math.min(llk.maxHearts, llk.hearts + 1)
                persistLlkSave()
              },
              onBuyCapybara: () => {
                if (llk.coins < SHOP_PRICE_CAPYBARA) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
                llk.coins -= SHOP_PRICE_CAPYBARA
                llk.purchasedCapybara = true
                persistLlkSave()
              },
              onBuySoundPack: () => {
                if (llk.coins < SHOP_PRICE_SOUND_PACK) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
                llk.coins -= SHOP_PRICE_SOUND_PACK
                llk.purchasedSoundPack = true
                persistLlkSave()
              }
            })
          }
        })
        return false
      }

      llk.inventory[stockKey] -= 1
      persistLlkSave()
      return true
    },
    onBack: () => navigator.back(),
    onPause: () => {
      // 暂停/设置弹窗（局内模式）
      openSettingsModal(stage, {
        isInGame: true,
        soundOn: llk.soundOn,
        vibrationOn: llk.vibrationOn,
        musicOn: llk.musicOn,
        onSoundToggle: (v) => { llk.soundOn = v; persistLlkSave() },
        onVibrationToggle: (v) => { llk.vibrationOn = v; persistLlkSave() },
        onMusicToggle: (v) => { llk.musicOn = v; persistLlkSave() },
        onFeedback: () => {
          try {
            const w = wx as typeof wx & { openCustomerServiceConversation?: (o: object) => void }
            w.openCustomerServiceConversation?.({})
          } catch (_) { wx.showToast?.({ title: '请升级基础库', icon: 'none' }) }
        },
        onReplay: () => {
          // 重玩：重新进入当前关
          navigator.redirect('game', { level, mode })
        },
        onGiveUp: () => {
          // 先弹挽回弹窗，让玩家确认
          openGiveUpModal(stage, {
            levelNum: level,
            cleared: 0,   // TODO: 从 game-screen 获取实时进度
            total: (levelConfig.cols ?? 8) * (levelConfig.rows ?? 8) / 2,
            onRetry: () => { /* 玩家选择再试，啥都不做，弹窗已关闭 */ },
            onGiveUp: () => {
              if (mode === 'main') {
                llk.hearts = Math.max(0, llk.hearts - 1)
                persistLlkSave()
              }
              navigator.back()
            }
          })
        }
      })
    },
    onTool: i => {
      if (i !== 3) return
      if (FEATURE_REWARDED_VIDEO) {
        wx.showToast?.({ title: '激励视频占位', icon: 'none' })
        return
      }
      const anyWx = wx as typeof wx & {
        shareAppMessage?: (o: { title: string; query: string; success?: () => void }) => void
      }
      anyWx.shareAppMessage?.({
        title: '卡皮巴拉连连看',
        query: '',
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
  startGameBgm()
}

export function hide() {
  stopGameBgm()
  if (root && stage.children.includes(root)) {
    stage.removeChild(root)
    root.destroy({ children: true })
  }
  root = null
}
