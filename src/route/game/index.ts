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
  COINS_DAILY_CHALLENGE,
  SHARE_BONUS_PER_TOOL,
  TOOL_SHARE_DAILY_CAP,
  SHOP_PRICE_BLOOD,
  SHOP_PRICE_CAPYBARA,
  SHOP_PRICE_SOUND_PACK,
  SHOP_PRICE_TOOL
} from '~/game/economy-config'
import { buildDailyLevelConfig, todayKey } from '~/game/daily-challenge'
import { openSettingsModal } from '~/ui/settings-modal'
import { openGiveUpModal } from '~/ui/give-up-modal'
import { openToolModal } from '~/ui/tool-modal'
import { openShopScreen } from '~/ui/shop-screen'
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

/** 获取当日某道具已分享次数（每日重置） */
function getToolShareCount(toolType: 'hint' | 'refresh' | 'eliminate'): number {
  const key = `llk_tool_share_${toolType}_${todayKey()}`
  try { return Number(wx.getStorageSync(key) || 0) } catch (_) { return 0 }
}

function incToolShareCount(toolType: 'hint' | 'refresh' | 'eliminate') {
  const key = `llk_tool_share_${toolType}_${todayKey()}`
  try { wx.setStorageSync(key, String(getToolShareCount(toolType) + 1)) } catch (_) {}
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
    wx.showToast?.({ title: '血量不足，可去商店购买或喊人', icon: 'none' })
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
        cleared: false
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

  // 打开商店（局内临时商店，只能买血量）
  function openInGameShop() {
    openShopScreen(stage, {
      coins: llk.coins,
      inventory: { ...llk.inventory },
      purchasedCapybara: llk.purchasedCapybara,
      purchasedSoundPack: llk.purchasedSoundPack,
      onBuyHint: () => {
        if (llk.coins < SHOP_PRICE_TOOL) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_TOOL
        llk.inventory.hint += 1
        persistLlkSave()
        wx.showToast?.({ title: '提示道具 +1', icon: 'none' })
      },
      onBuyRefresh: () => {
        if (llk.coins < SHOP_PRICE_TOOL) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_TOOL
        llk.inventory.refresh += 1
        persistLlkSave()
        wx.showToast?.({ title: '刷新道具 +1', icon: 'none' })
      },
      onBuyEliminate: () => {
        if (llk.coins < SHOP_PRICE_TOOL) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_TOOL
        llk.inventory.eliminate += 1
        persistLlkSave()
        wx.showToast?.({ title: '消除道具 +1', icon: 'none' })
      },
      onBuyBlood: () => {
        if (llk.coins < SHOP_PRICE_BLOOD) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_BLOOD
        llk.hearts = Math.min(llk.maxHearts, llk.hearts + 1)
        persistLlkSave()
      },
      onBuyCapybara: () => {
        if (llk.purchasedCapybara) return
        if (llk.coins < SHOP_PRICE_CAPYBARA) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_CAPYBARA
        llk.purchasedCapybara = true
        persistLlkSave()
      },
      onBuySoundPack: () => {
        if (llk.purchasedSoundPack) return
        if (llk.coins < SHOP_PRICE_SOUND_PACK) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
        llk.coins -= SHOP_PRICE_SOUND_PACK
        llk.purchasedSoundPack = true
        persistLlkSave()
      }
    })
  }

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
    toolInventory: { ...llk.inventory },
    onToolBeforeUse: i => {
      const toolTypes = ['hint', 'refresh', 'eliminate'] as const
      const toolType = toolTypes[i]
      if (llk.inventory[toolType] <= 0) {
        // 道具不足：弹出补给弹窗
        const sharedCount = getToolShareCount(toolType)
        const remaining = Math.max(0, TOOL_SHARE_DAILY_CAP - sharedCount)
        openToolModal(stage, {
          toolType,
          remainingShare: remaining,
          maxShare: TOOL_SHARE_DAILY_CAP,
          onShare: () => {
            if (remaining <= 0) {
              wx.showToast?.({ title: '今日补给次数已用完', icon: 'none' })
              return
            }
            const anyWx = wx as typeof wx & {
              shareAppMessage?: (o: { title: string; query: string; success?: () => void }) => void
            }
            anyWx.shareAppMessage?.({
              title: '开心点连连看，一起来玩！',
              query: '',
              success: () => {
                llk.inventory[toolType] += SHARE_BONUS_PER_TOOL
                persistLlkSave()
                incToolShareCount(toolType)
                wx.showToast?.({ title: `补给成功！${toolType === 'hint' ? '提示' : toolType === 'refresh' ? '刷新' : '消除'}+1`, icon: 'none' })
              }
            })
          },
          onShop: openInGameShop
        })
        return false
      }

      llk.inventory[toolType] -= 1
      persistLlkSave()
      return true
    },
    onBack: () => navigator.back(),
    onPause: () => {
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
          // 重玩本关：消耗 1 血（仅主线）
          if (mode === 'main') {
            llk.hearts = Math.max(0, llk.hearts - 1)
            persistLlkSave()
          }
          navigator.redirect('game', { level, mode })
        },
        onGiveUp: () => {
          openGiveUpModal(stage, {
            levelNum: level,
            cleared: 0,
            total: (levelConfig.cols ?? 8) * (levelConfig.rows ?? 8) / 2,
            onRetry: () => { /* 玩家选择再试，弹窗已关闭 */ },
            onGiveUp: () => {
              // 放弃挑战不扣血（主线和每日挑战均不扣血）
              navigator.back()
            }
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
        // 主线通关：无缝进入下一关
        navigator.redirect('game', { level: level + 1, mode: 'main' })
        return
      }
      // 每日挑战通关
      if (llk.dailyChallenge) {
        llk.dailyChallenge.cleared = true
      }
      llk.coins += COINS_DAILY_CHALLENGE
      notifyDailyChallengeSuccess()
      persistLlkSave()
      wx.showToast?.({ title: `今日挑战完成！+${COINS_DAILY_CHALLENGE}🪙`, icon: 'none' })
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
