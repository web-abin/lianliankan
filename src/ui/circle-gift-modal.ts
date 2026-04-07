/**
 * 圈子好礼弹窗
 * 加入游戏圈可获得一次性 100 金币奖励
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_TEXT, C_GREEN_WX, C_YELLOW,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt
} from '~/ui/ui-kit'

export interface CircleGiftOptions {
  coinReward?: number
  alreadyClaimed: boolean
  onJoin: () => void
  onClose?: () => void
}

export function openCircleGiftModal(
  parent: PIXI.Container,
  opts: CircleGiftOptions
): PIXI.Container {
  const { coinReward = 100, alreadyClaimed } = opts
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 540
  const PANEL_H = 440
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（双臂张开大拥抱）
  // TODO: 替换为真实"大拥抱礼物掉落"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('圈子好礼 🎁', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 30)
  root.addChild(titleT)

  // 奖励展示卡
  const rewardCard = new PIXI.Graphics()
  const CARD_W = PANEL_W - 80
  rewardCard.lineStyle(2.5, C_YELLOW, 1)
  rewardCard.beginFill(C_YELLOW, 0.12)
  rewardCard.drawRoundedRect(-CARD_W / 2, 0, CARD_W, 140, 16)
  rewardCard.endFill()
  rewardCard.position.set(0, py + 90)
  root.addChild(rewardCard)

  const coinBig = new PIXI.Text('🪙', { fontSize: 60 })
  coinBig.anchor.set(0.5, 0.5)
  coinBig.position.set(0, py + 142)
  root.addChild(coinBig)

  const amountT = txt(`＋${coinReward} 金币`, 38, C_ORANGE, '900')
  amountT.anchor.set(0.5, 0)
  amountT.position.set(0, py + 182)
  root.addChild(amountT)

  const noteT = txt('一次性奖励，仅限首次加入', 22, 0x666666, '500')
  noteT.anchor.set(0.5, 0)
  noteT.position.set(0, py + 228)
  root.addChild(noteT)

  // 操作按钮
  if (alreadyClaimed) {
    // 已领取状态
    const doneBtn = makeJellyBtn('✓ 已领取 100 金币', PANEL_W - 80, 58, 0x9e9e9e)
    doneBtn.position.set(0, py + PANEL_H - 76)
    root.addChild(doneBtn)
  } else {
    const joinBtn = makeJellyBtn('💬  加入游戏圈', PANEL_W - 80, 58, C_GREEN_WX)
    joinBtn.position.set(0, py + PANEL_H - 76)
    joinBtn.on('pointerdown', () => { close(); opts.onJoin() })
    root.addChild(joinBtn)
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
