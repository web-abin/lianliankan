/**
 * 排行榜全屏弹窗
 * 两标签：好友榜（开放数据域）/ 世界榜（Supabase）
 * 暗夜草地配色风格
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_ORANGE, C_SKY, C_YELLOW,
  makeOverlay, makeJellyBtn, makeCloseBtn, makeTabCapsule,
  drawDarkPanel, bounceIn, txt
} from '~/ui/ui-kit'
import type { WorldRankRow } from '~/wx/supabase-sync'

export interface RankScreenOptions {
  /** 世界榜数据（已排序） */
  worldRows: WorldRankRow[]
  /** 当前玩家 userId（高亮自己） */
  myUserId?: string
  onClose?: () => void
}

export function openRankScreen(
  parent: PIXI.Container,
  opts: RankScreenOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh / 2)
  wrap.addChild(root)

  const PANEL_W = DESIGN_W - 40
  const PANEL_H = DESIGN_H - 100
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  // 暗夜草地面板
  const panel = new PIXI.Graphics()
  drawDarkPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // 星星装饰（随机分布）
  const stars = new PIXI.Graphics()
  const rng = (n: number) => (Math.floor(Math.random() * n * 10000) % n)
  for (let i = 0; i < 14; i++) {
    const sx = px + (rng(PANEL_W - 20) + 10)
    const sy = py + (rng(80) + 10)
    const sr = 1.5 + rng(3)
    stars.beginFill(0xf5d840, 0.7)
    stars.drawCircle(sx, sy, sr)
    stars.endFill()
  }
  root.addChild(stars)

  // 卡皮巴拉举奖杯占位
  // TODO: 替换为真实"举起金杯超兴奋"卡皮巴拉切图
  const ipBg = new PIXI.Graphics()
  ipBg.beginFill(0xffd700, 0.15)
  ipBg.drawCircle(0, py + 56, 48)
  ipBg.endFill()
  root.addChild(ipBg)
  const ipT = new PIXI.Text('🏆', { fontSize: 56 })
  ipT.anchor.set(0.5, 0.5)
  ipT.position.set(0, py + 56)
  root.addChild(ipT)

  // 标题
  const titleT = txt('排行榜', 38, 0xffffff, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 96)
  root.addChild(titleT)

  // 标签页
  const TAB_W = 160, TAB_H = 44
  const tabs = makeTabCapsule(
    ['好友榜', '世界榜'], 0, TAB_W, TAB_H,
    (i) => showTab(i)
  )
  tabs.position.set(-(TAB_W * 2 + 8) / 2, py + 146)
  root.addChild(tabs)

  // 列表区
  const LIST_Y = py + 208
  const LIST_H = PANEL_H - 230
  const LIST_W = PANEL_W - 40
  let contentContainers: PIXI.Container[] = []

  const showTab = (tabIdx: number) => {
    contentContainers.forEach(c => c.parent?.removeChild(c))
    contentContainers = []
    tabs.setActive(tabIdx)

    if (tabIdx === 0) buildFriendTab()
    else buildWorldTab()
  }

  // ── 好友榜（开放数据域占位提示）──────────────────
  const buildFriendTab = () => {
    const c = new PIXI.Container()
    root.addChild(c)
    contentContainers.push(c)

    const tipBg = new PIXI.Graphics()
    tipBg.beginFill(0xffffff, 0.06)
    tipBg.drawRoundedRect(px + 20, LIST_Y, LIST_W, 160, 16)
    tipBg.endFill()
    c.addChild(tipBg)

    const t1 = txt('好友榜由微信开放数据域提供', 24, 0xb0ffb0, '600')
    t1.anchor.set(0.5, 0)
    t1.position.set(0, LIST_Y + 28)
    c.addChild(t1)

    const t2 = txt('真实好友数据需开放数据域联调后显示', 22, 0x88bb88, '500')
    t2.anchor.set(0.5, 0)
    t2.position.set(0, LIST_Y + 68)
    c.addChild(t2)

    const reqBtn = makeJellyBtn('请求好友数据', 300, 50, 0x1a6040)
    reqBtn.position.set(0, LIST_Y + 130)
    reqBtn.on('pointerdown', () => {
      try { wx.getOpenDataContext?.().postMessage?.({ type: 'rank' }) } catch (_) {}
      wx.showToast?.({ title: '已请求好友榜数据', icon: 'none' })
    })
    c.addChild(reqBtn)
  }

  // ── 世界榜 ──────────────────────────────────────
  const buildWorldTab = () => {
    const c = new PIXI.Container()
    root.addChild(c)
    contentContainers.push(c)

    if (opts.worldRows.length === 0) {
      const t = txt('暂无数据，请检查网络后重试', 26, 0x88bb88, '600')
      t.anchor.set(0.5, 0)
      t.position.set(0, LIST_Y + 60)
      c.addChild(t)
      return
    }

    // 滚动容器
    const listContainer = new PIXI.Container()
    const maskG = new PIXI.Graphics()
    maskG.beginFill(0xffffff)
    maskG.drawRect(px + 20, LIST_Y, LIST_W, LIST_H)
    maskG.endFill()
    listContainer.mask = maskG
    c.addChild(maskG)
    c.addChild(listContainer)

    const ROW_H = 72
    opts.worldRows.forEach((row, i) => {
      const rowY = LIST_Y + i * ROW_H
      const isMe = row.userId === opts.myUserId

      // 行背景
      const rowBg = new PIXI.Graphics()
      if (i < 3) {
        const tints = [0xffd700, 0xc0c0c0, 0xcd7f32]
        rowBg.beginFill(tints[i], 0.15)
      } else if (isMe) {
        rowBg.beginFill(C_SKY, 0.2)
        rowBg.lineStyle(2, C_SKY, 0.7)
      } else {
        rowBg.beginFill(0xffffff, 0.04)
      }
      rowBg.drawRoundedRect(px + 20, rowY + 4, LIST_W, ROW_H - 8, 10)
      rowBg.endFill()
      listContainer.addChild(rowBg)

      // 名次徽章
      const RANK_COLORS = [0xffd700, 0xc0c0c0, 0xcd7f32]
      if (i < 3) {
        const badge = new PIXI.Graphics()
        badge.beginFill(RANK_COLORS[i])
        badge.drawCircle(0, 0, 22)
        badge.endFill()
        badge.position.set(px + 48, rowY + ROW_H / 2)
        listContainer.addChild(badge)
        const rankT = txt(`${i + 1}`, 22, 0xffffff, '900')
        rankT.anchor.set(0.5, 0.5)
        rankT.position.set(px + 48, rowY + ROW_H / 2)
        listContainer.addChild(rankT)
      } else {
        const rankT = txt(`${i + 1}`, 22, 0x888888, '600')
        rankT.anchor.set(0.5, 0.5)
        rankT.position.set(px + 48, rowY + ROW_H / 2)
        listContainer.addChild(rankT)
      }

      // 头像占位圆
      const avatar = new PIXI.Graphics()
      avatar.lineStyle(2, C_SKY, 0.5)
      avatar.beginFill(0x1a6040)
      avatar.drawCircle(0, 0, 22)
      avatar.endFill()
      avatar.position.set(px + 88, rowY + ROW_H / 2)
      listContainer.addChild(avatar)
      const avatarT = new PIXI.Text('🐾', { fontSize: 24 })
      avatarT.anchor.set(0.5, 0.5)
      avatarT.position.set(px + 88, rowY + ROW_H / 2)
      listContainer.addChild(avatarT)

      // 昵称（使用 WorldRankRow 的 name 字段）
      const displayName = row.name || `玩家${i + 1}`
      const nameT = txt(displayName.slice(0, 8), 24, 0xeeffee, '600')
      nameT.anchor.set(0, 0.5)
      nameT.position.set(px + 122, rowY + ROW_H / 2 - 10)
      listContainer.addChild(nameT)

      // 关卡 + 步数（使用 WorldRankRow 的 steps 字段）
      const levelT = txt(`第${row.level}关`, 26, C_ORANGE, '800')
      levelT.anchor.set(1, 0.5)
      levelT.position.set(px + LIST_W - 10, rowY + ROW_H / 2 - 10)
      listContainer.addChild(levelT)

      if (row.steps > 0) {
        const stepsT = txt(`${row.steps}步`, 20, 0x88cc88, '500')
        stepsT.anchor.set(1, 0.5)
        stepsT.position.set(px + LIST_W - 10, rowY + ROW_H / 2 + 14)
        listContainer.addChild(stepsT)
      }
    })

    // 简单触摸滚动
    const totalH = opts.worldRows.length * ROW_H
    const maxScroll = -(totalH - LIST_H)
    let startY = 0, startContY = 0
    ;(listContainer as any).interactive = true
    listContainer.on('pointerdown', (e: PIXI.InteractionEvent) => {
      startY = e.data.global.y / dr
      startContY = listContainer.y
    })
    listContainer.on('pointermove', (e: PIXI.InteractionEvent) => {
      if (!(e.data.originalEvent as MouseEvent).buttons) return
      const dy = e.data.global.y / dr - startY
      listContainer.y = Math.max(maxScroll, Math.min(0, startContY + dy))
    })
  }

  showTab(0)

  // 关闭
  const closeBtn = makeCloseBtn(close)
  closeBtn.position.set(px + PANEL_W - 24, py + 24)
  root.addChild(closeBtn)

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  function close() {
    opts.onClose?.()
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}
