/**
 * 首页路由
 * 负责首页 UI 组件创建与所有弹窗的调起
 */
import * as PIXI from 'pixi.js'
import { stage, loader } from '~/core'
import * as homeUI from '~/ui/home'
import { ASSET_URLS } from '~/ui/home'
import * as navigator from '~/navigator'
import { llk, persistLlkSave, claimSignInReward } from '~/game/llk-save'
import {
  SHOP_PRICE_BLOOD,
  SHOP_PRICE_CAPYBARA,
  SHOP_PRICE_SOUND_PACK,
  SHOP_PRICE_TOOL,
  SHOUT_BLOOD_BONUS,
  SHOUT_DAILY_CAP
} from '~/game/economy-config'
import type { GameThemeId } from '~/game/game-hooks'

// 弹窗/界面模块
import { openSettingsModal }    from '~/ui/settings-modal'
import { openShopScreen }       from '~/ui/shop-screen'
import { openThemePanel }       from '~/ui/theme-panel'
import { openRankScreen }       from '~/ui/rank-screen'
import { openShoutModal }       from '~/ui/shout-modal'
import { openDailyRewardModal } from '~/ui/daily-reward-modal'
import { fetchWorldRank }       from '~/wx/supabase-sync'

let root: PIXI.Container | null = null

async function preload() {
  const toLoad = (ASSET_URLS as unknown as string[]).filter(url => !loader.resources[url])
  if (toLoad.length === 0) return
  await new Promise<void>(resolve => {
    toLoad.forEach(url => loader.add(url))
    loader.load(() => resolve())
  })
}

function dayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}${`${d.getMonth() + 1}`.padStart(2, '0')}${`${d.getDate()}`.padStart(2, '0')}`
}

function init() {
  root = homeUI.create(stage, {
    level: Math.max(1, llk.currentLevel),
    coins: llk.coins,
    hearts: llk.hearts,
    maxHearts: llk.maxHearts,

    // ── 开始游戏 ─────────────────────────────────
    onStart: () => {
      if (llk.hearts <= 0) {
        wx.showToast?.({ title: '血量为 0，无法开始普通关', icon: 'none' })
        return
      }
      navigator.go('game', { level: llk.currentLevel, mode: 'main' })
    },

    // ── 设置 ─────────────────────────────────────
    onSettings: () => {
      openSettingsModal(stage, {
        isInGame: false,
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
          } catch (_) {
            wx.showToast?.({ title: '请升级基础库', icon: 'none' })
          }
        }
      })
    },

    // ── 喊好友 ───────────────────────────────────
    onShout: () => {
      openShoutModal(stage, {
        bloodBonus: SHOUT_BLOOD_BONUS,
        onShare: () => {
          const dk = dayKey()
          if (SHOUT_DAILY_CAP > 0 && llk.lastShoutDayKey === dk && llk.shoutCountToday >= SHOUT_DAILY_CAP) {
            wx.showToast?.({ title: '今日喊人次数已用完', icon: 'none' })
            return
          }
          // 触发微信分享
          wx.shareAppMessage?.({
            title: '快来帮我通关！',
            imageUrl: ''
          })
          llk.hearts = Math.min(llk.maxHearts, llk.hearts + SHOUT_BLOOD_BONUS)
          if (llk.lastShoutDayKey !== dk) {
            llk.shoutCountToday = 0
            llk.lastShoutDayKey = dk
          }
          llk.shoutCountToday += 1
          persistLlkSave()
          wx.showToast?.({ title: `+${SHOUT_BLOOD_BONUS} 血`, icon: 'none' })
          refreshHome()
        }
      })
    },

    // ── 每日奖励（签到日历）──────────────────────
    onReward: () => {
      const alreadyClaimed = llk.lastSignInDayKey === dayKey()
      openDailyRewardModal(stage, {
        streakDay: llk.streakDay,
        alreadyClaimed,
        onClaim: () => {
          const r = claimSignInReward()
          if (!r) {
            wx.showToast?.({ title: '今日已签到', icon: 'none' })
            return
          }
          wx.showToast?.({ title: `连续第${r.streak}天 +${r.coins} 金币`, icon: 'none' })
          refreshHome()
        }
      })
    },

    // ── 每日挑战 ──────────────────────────────────
    onDailyChallenge: () => {
      navigator.go('game', { mode: 'daily' })
    },

    // ── 商店（全屏） ──────────────────────────────
    onShop: () => {
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
          refreshHome()
        },
        onBuyRefresh: () => {
          if (llk.coins < SHOP_PRICE_TOOL) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
          llk.coins -= SHOP_PRICE_TOOL
          llk.inventory.refresh += 1
          persistLlkSave()
          wx.showToast?.({ title: '刷新道具 +1', icon: 'none' })
          refreshHome()
        },
        onBuyEliminate: () => {
          if (llk.coins < SHOP_PRICE_TOOL) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
          llk.coins -= SHOP_PRICE_TOOL
          llk.inventory.eliminate += 1
          persistLlkSave()
          wx.showToast?.({ title: '消除道具 +1', icon: 'none' })
          refreshHome()
        },
        onBuyBlood: () => {
          if (llk.coins < SHOP_PRICE_BLOOD) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
          llk.coins -= SHOP_PRICE_BLOOD
          llk.hearts = Math.min(llk.maxHearts, llk.hearts + 1)
          persistLlkSave()
          wx.showToast?.({ title: '+1 血', icon: 'none' })
          refreshHome()
        },
        onBuyCapybara: () => {
          if (llk.purchasedCapybara) { wx.showToast?.({ title: '已拥有', icon: 'none' }); return }
          if (llk.coins < SHOP_PRICE_CAPYBARA) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
          llk.coins -= SHOP_PRICE_CAPYBARA
          llk.purchasedCapybara = true
          persistLlkSave()
          wx.showToast?.({ title: '已购买形象', icon: 'none' })
          refreshHome()
        },
        onBuySoundPack: () => {
          if (llk.purchasedSoundPack) { wx.showToast?.({ title: '已拥有', icon: 'none' }); return }
          if (llk.coins < SHOP_PRICE_SOUND_PACK) { wx.showToast?.({ title: '金币不足', icon: 'none' }); return }
          llk.coins -= SHOP_PRICE_SOUND_PACK
          llk.purchasedSoundPack = true
          persistLlkSave()
          wx.showToast?.({ title: '已购买音效包', icon: 'none' })
          refreshHome()
        }
      })
    },

    // ── 主题（网格选择弹窗） ──────────────────────
    onTheme: () => {
      openThemePanel(stage, {
        unlockedThemes: [...llk.unlockedThemes] as GameThemeId[],
        selectedTheme: llk.selectedTheme as GameThemeId,
        onSelect: (themeId) => {
          llk.selectedTheme = themeId
          persistLlkSave()
          refreshHome()
        }
      })
    },

    // ── 排行榜（全屏） ────────────────────────────
    onRank: async () => {
      // 拉取世界榜数据（异步，显示时可能已有缓存）
      const worldRows = await fetchWorldRank(50).catch(() => [])
      openRankScreen(stage, { worldRows })
    }
  })
}

export async function show() {
  await preload()
  if (!root) init()
  if (root && !stage.children.includes(root)) {
    stage.addChild(root)
  }
}

function refreshHome() {
  if (root && stage.children.includes(root)) {
    stage.removeChild(root)
    root.destroy({ children: true })
  }
  root = null
  init()
  if (root) stage.addChild(root)
}

export function hide() {
  if (root && stage.children.includes(root)) {
    stage.removeChild(root)
  }
}
