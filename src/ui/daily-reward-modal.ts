/**
 * 每日奖励弹窗（7 天签到日历）
 * 已签到格：蒲公英黄金属光泽 + 勾
 * 今日可签格：珊瑚橙脉冲边框
 * 未来格：灰化半透明
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_ORANGE, C_YELLOW, C_TEXT, C_GRAY,
  makePanelBg, panelPad, makeOverlay, makeModalActions,
  bounceIn, bounceOut, txt
} from '~/ui/ui-kit'

export interface DailyRewardOptions {
  /** 当前连续签到天数（1~7，0=未签过） */
  streakDay: number
  /** 今日已签到 */
  alreadyClaimed: boolean
  onClaim: () => void
  onClose?: () => void
}

// 7 天奖励金币数
const REWARD_COINS = [5, 10, 15, 20, 30, 40, 50]

export function openDailyRewardModal(
  parent: PIXI.Container,
  opts: DailyRewardOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.48)
  wrap.addChild(root)

  const PANEL_W = 620
  const pad = panelPad(PANEL_W)
  // 标题(36) + 副标题(22) + 7 格日历(2 行 × 114 + 间距) + 边距 ≈ 320
  const PANEL_H = pad.top + 320 + pad.bot
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top

  // 标题
  const titleT = txt('每日奖励', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  const subT = txt('连续签到越多，奖励越丰厚！', 22, C_OUTLINE, '600')
  subT.anchor.set(0.5, 0)
  subT.position.set(0, cTop + pad.contentTop)
  root.addChild(subT)

  // 7 格日历（第1行 Day1~4，第2行 Day5~7 居中）
  const CELL_W = 116, CELL_H = 104, CELL_GAP = 10
  const ROW1_Y = cTop + pad.contentTop + 40

  for (let i = 0; i < 7; i++) {
    const row = i < 4 ? 0 : 1
    const col = i < 4 ? i : i - 4
    const totalCols = row === 0 ? 4 : 3
    const rowW = totalCols * CELL_W + (totalCols - 1) * CELL_GAP
    const cx = -rowW / 2 + col * (CELL_W + CELL_GAP)
    const cy = ROW1_Y + row * (CELL_H + CELL_GAP)

    // 状态：已领 / 今日可领 / 未来
    const dayNum = i + 1
    const hasClaimed = opts.alreadyClaimed
      ? dayNum <= opts.streakDay
      : dayNum < opts.streakDay
    const isToday = opts.alreadyClaimed
      ? false
      : dayNum === opts.streakDay + 1 || (opts.streakDay === 0 && dayNum === 1)
    const isFuture = !hasClaimed && !isToday

    // 格子背景
    const cell = new PIXI.Graphics()
    if (hasClaimed) {
      cell.beginFill(C_YELLOW, 0.85)
      cell.lineStyle(2.5, 0xd4a500, 1)
    } else if (isToday) {
      cell.beginFill(C_ORANGE, 0.12)
      cell.lineStyle(2.5, C_ORANGE, 1)
    } else {
      cell.beginFill(0xeeeeee, 0.5)
      cell.lineStyle(1.5, C_GRAY, 0.5)
    }
    cell.drawRoundedRect(cx, cy, CELL_W, CELL_H, 12)
    cell.endFill()
    root.addChild(cell)

    // "Day X" 标签
    const dayT = txt(`Day ${dayNum}`, 18, isFuture ? C_GRAY : C_OUTLINE, '700')
    dayT.anchor.set(0.5, 0)
    dayT.position.set(cx + CELL_W / 2, cy + 8)
    root.addChild(dayT)

    // 硬币图标
    const coinT = new PIXI.Text('🪙', { fontSize: isFuture ? 28 : 32 })
    coinT.anchor.set(0.5, 0.5)
    coinT.alpha = isFuture ? 0.4 : 1
    coinT.position.set(cx + CELL_W / 2, cy + CELL_H * 0.52)
    root.addChild(coinT)

    // 金币数字
    const coinsT = txt(`${REWARD_COINS[i]}`, isFuture ? 20 : 24,
      isFuture ? C_GRAY : C_OUTLINE, '800')
    coinsT.anchor.set(0.5, 0)
    coinsT.position.set(cx + CELL_W / 2, cy + CELL_H - 28)
    root.addChild(coinsT)

    // 已领取：大勾覆盖
    if (hasClaimed) {
      const check = new PIXI.Text('✓', { fontSize: 44, fill: 0x4caf50, fontWeight: '900' } as any)
      check.anchor.set(0.5, 0.5)
      check.alpha = 0.7
      check.position.set(cx + CELL_W / 2, cy + CELL_H / 2 + 4)
      root.addChild(check)
    }
  }

  // 外部按钮：立即签到（蓝），已签到则不显示按钮
  if (!opts.alreadyClaimed) {
    const { container: actionBtns } = makeModalActions([
      { label: '立即签到', color: 'blue', onClick: () => { close(); opts.onClaim() } }
    ])
    actionBtns.y = py + PANEL_H + 20
    root.addChild(actionBtns)
  }

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  let closing = false
  function close() {
    if (closing) return
    closing = true
    opts.onClose?.()
    bounceOut(root, dr, dim, () => {
      parent.removeChild(wrap)
      wrap.destroy({ children: true })
    })
  }

  return wrap
}
