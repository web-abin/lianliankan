/**
 * 每日奖励弹窗（7 天签到日历）
 * 已签到格：蒲公英黄金属光泽 + 勾
 * 今日可签格：珊瑚橙脉冲边框
 * 未来格：灰化半透明
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_YELLOW, C_TEXT, C_GRAY,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt, txtWrap
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
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.48)
  wrap.addChild(root)

  const PANEL_W = 620
  const PANEL_H = 580
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（双手高举欢呼）
  // TODO: 替换为真实"欢呼星星眼"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('每日奖励', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 28)
  root.addChild(titleT)

  const subT = txt('连续签到越多，奖励越丰厚！', 22, C_OUTLINE, '600')
  subT.anchor.set(0.5, 0)
  subT.position.set(0, py + 72)
  root.addChild(subT)

  // 7 格日历（第1行 Day1~4，第2行 Day5~7 居中）
  const CELL_W = 116, CELL_H = 104, CELL_GAP = 10
  const ROW1_Y = py + 108

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

  // 领取按钮
  const BTN_Y = py + PANEL_H - 88
  if (opts.alreadyClaimed) {
    const doneBtn = makeJellyBtn(`今日已签到  第${opts.streakDay}天 ✓`, PANEL_W - 80, 60, C_GRAY)
    doneBtn.position.set(0, BTN_Y)
    root.addChild(doneBtn)
  } else {
    const claimBtn = makeJellyBtn('立即签到！🎁', PANEL_W - 80, 60)
    claimBtn.position.set(0, BTN_Y)
    claimBtn.on('pointerdown', () => { close(); opts.onClaim() })
    root.addChild(claimBtn)
  }

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
