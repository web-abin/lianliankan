/**
 * 首页路由
 */
import * as PIXI from 'pixi.js'
import { stage, loader } from '~/core'
import * as homeUI from '~/ui/home'
import { ASSET_URLS } from '~/ui/home'
import * as navigator from '~/navigator'
import { llk, persistLlkSave, grantDeskDailyIfNeeded, claimSignInReward } from '~/game/llk-save'
import {
  SHOP_PRICE_BLOOD,
  SHOP_PRICE_CAPYBARA,
  SHOP_PRICE_SOUND_PACK,
  SHOP_PRICE_TOOL_PACK,
  COINS_CIRCLE_ONCE,
  SHOUT_BLOOD_BONUS,
  SHOUT_DAILY_CAP
} from '~/game/economy-config'
import type { GameThemeId } from '~/game/game-hooks'
import { openModalShell } from '~/ui/modal-shell'
import { fetchWorldRank } from '~/wx/supabase-sync'

let root: PIXI.Container | null = null

async function preload() {
  const toLoad: string[] = (ASSET_URLS as unknown as string[]).filter(
    url => !loader.resources[url]
  )
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
    onStart: () => {
      if (llk.hearts <= 0) {
        wx.showToast?.({
          title: '血量为 0，无法开始普通关（可挑战每日或去商店）',
          icon: 'none'
        })
        return
      }
      navigator.go('game', { level: llk.currentLevel, mode: 'main' })
    },
    onSettings: () => {
      openModalShell(stage, {
        title: '设置',
        body: '音效 / 震动 / 音乐 等可在后续版本细化',
        cancelText: '关闭',
        confirmText: '问题反馈',
        onCancel: () => {},
        onConfirm: () => {
          try {
            const w = wx as typeof wx & {
              openCustomerServiceConversation?: (opts: object) => void
            }
            w.openCustomerServiceConversation?.({})
          } catch (_) {
            wx.showToast?.({ title: '请升级基础库', icon: 'none' })
          }
        }
      })
    },
    onGift: () => {
      if (llk.circleRewarded) {
        wx.showToast?.({ title: '已领取过圈子好礼', icon: 'none' })
        return
      }
      llk.coins += COINS_CIRCLE_ONCE
      llk.circleRewarded = true
      persistLlkSave()
      wx.showToast?.({ title: `+${COINS_CIRCLE_ONCE} 金币`, icon: 'none' })
      refreshHome()
    },
    onShout: () => {
      const dk = dayKey()
      if (SHOUT_DAILY_CAP > 0 && llk.lastShoutDayKey === dk && llk.shoutCountToday >= SHOUT_DAILY_CAP) {
        wx.showToast?.({ title: '今日喊人次数已用完', icon: 'none' })
        return
      }
      llk.hearts = Math.min(llk.maxHearts, llk.hearts + SHOUT_BLOOD_BONUS)
      if (llk.lastShoutDayKey !== dk) {
        llk.shoutCountToday = 0
        llk.lastShoutDayKey = dk
      }
      llk.shoutCountToday += 1
      persistLlkSave()
      wx.showToast?.({ title: `+${SHOUT_BLOOD_BONUS} 血`, icon: 'none' })
      refreshHome()
    },
    onDesk: () => {
      if (grantDeskDailyIfNeeded()) {
        wx.showToast?.({ title: '桌面进入 +50 金币', icon: 'none' })
        refreshHome()
      } else {
        wx.showToast?.({ title: '今日已领过桌面奖励', icon: 'none' })
      }
    },
    onReward: () => {
      const r = claimSignInReward()
      if (!r) {
        wx.showToast?.({ title: '今日已签到', icon: 'none' })
        return
      }
      wx.showToast?.({
        title: `连续第${r.streak}天 +${r.coins} 金币`,
        icon: 'none'
      })
      refreshHome()
    },
    onDailyChallenge: () => {
      navigator.go('game', { mode: 'daily' })
    },
    onShop: () => {
      wx.showActionSheet?.({
        itemList: [
          `道具包 ×1（${SHOP_PRICE_TOOL_PACK} 金）`,
          `买血 1 滴（${SHOP_PRICE_BLOOD} 金）`,
          `卡皮巴拉形象（${SHOP_PRICE_CAPYBARA} 金）`,
          `音效包（${SHOP_PRICE_SOUND_PACK} 金）`
        ],
        success: (res: { tapIndex: number }) => {
          const i = res.tapIndex
          if (i === 0) {
            if (llk.coins < SHOP_PRICE_TOOL_PACK) {
              wx.showToast?.({ title: '金币不足', icon: 'none' })
              return
            }
            llk.coins -= SHOP_PRICE_TOOL_PACK
            llk.inventory.hint += 3
            llk.inventory.refresh += 3
            llk.inventory.eliminate += 3
            persistLlkSave()
            wx.showToast?.({ title: '道具已入库存', icon: 'none' })
            refreshHome()
            return
          }
          if (i === 1) {
            if (llk.coins < SHOP_PRICE_BLOOD) {
              wx.showToast?.({ title: '金币不足', icon: 'none' })
              return
            }
            llk.coins -= SHOP_PRICE_BLOOD
            llk.hearts = Math.min(llk.maxHearts, llk.hearts + 1)
            persistLlkSave()
            wx.showToast?.({ title: '+1 血', icon: 'none' })
            refreshHome()
            return
          }
          if (i === 2) {
            if (llk.purchasedCapybara) {
              wx.showToast?.({ title: '已拥有', icon: 'none' })
              return
            }
            if (llk.coins < SHOP_PRICE_CAPYBARA) {
              wx.showToast?.({ title: '金币不足', icon: 'none' })
              return
            }
            llk.coins -= SHOP_PRICE_CAPYBARA
            llk.purchasedCapybara = true
            persistLlkSave()
            wx.showToast?.({ title: '已购买形象', icon: 'none' })
            refreshHome()
            return
          }
          if (i === 3) {
            if (llk.purchasedSoundPack) {
              wx.showToast?.({ title: '已拥有', icon: 'none' })
              return
            }
            if (llk.coins < SHOP_PRICE_SOUND_PACK) {
              wx.showToast?.({ title: '金币不足', icon: 'none' })
              return
            }
            llk.coins -= SHOP_PRICE_SOUND_PACK
            llk.purchasedSoundPack = true
            persistLlkSave()
            wx.showToast?.({ title: '已购买音效包', icon: 'none' })
            refreshHome()
          }
        }
      })
    },
    onTheme: () => {
      const names: Record<GameThemeId, string> = {
        food: '美食（默认）',
        fruit: '水果季',
        kitchen: '小厨房',
        forest: '森友会'
      }
      const lines = (['food', 'fruit', 'kitchen', 'forest'] as GameThemeId[])
        .filter(t => llk.unlockedThemes.includes(t))
        .map(t => `${names[t]}${t === llk.selectedTheme ? ' ✓' : ''}`)
      openModalShell(stage, {
        title: '主题',
        body: lines.join('\n') + '\n\n点确定循环切换已解锁主题',
        cancelText: '关闭',
        confirmText: '切换',
        onCancel: () => {},
        onConfirm: () => {
          const order: GameThemeId[] = ['food', 'fruit', 'kitchen', 'forest']
          const avail = order.filter(t => llk.unlockedThemes.includes(t))
          const i = Math.max(0, avail.indexOf(llk.selectedTheme))
          llk.selectedTheme = avail[(i + 1) % avail.length]
          persistLlkSave()
          wx.showToast?.({ title: `已选 ${names[llk.selectedTheme]}`, icon: 'none' })
          refreshHome()
        }
      })
    },
    onRank: async () => {
      const rows = await fetchWorldRank(50)
      if (rows.length === 0) {
        try {
          wx.getOpenDataContext?.().postMessage?.({ type: 'rank' })
        } catch (_) {}
        wx.showToast?.({
          title: '世界榜待云端联调；已请求好友榜数据域',
          icon: 'none'
        })
        return
      }
      wx.showModal?.({
        title: '世界榜（占位）',
        content: rows.slice(0, 5).map(r => `${r.rank}. L${r.level}`).join('\n'),
        showCancel: false
      })
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
