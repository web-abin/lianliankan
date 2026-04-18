/**
 * 圈子好礼弹窗
 * 加入游戏圈可获得一次性 100 金币奖励
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_ORANGE, C_TEXT, C_GREEN_WX, C_YELLOW,
  makePanelBg, panelPad, makeOverlay, makeJellyBtn,
  bounceIn, bounceOut, txt
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
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 540
  const pad = panelPad(PANEL_W)
  const contentW = PANEL_W - 2 * pad.lr
  const PANEL_H = pad.top + 280 + pad.bot
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot

  // 标题
  const titleT = txt('圈子好礼 🎁', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 奖励展示卡
  const rewardCard = new PIXI.Graphics()
  rewardCard.lineStyle(2.5, C_YELLOW, 1)
  rewardCard.beginFill(C_YELLOW, 0.12)
  rewardCard.drawRoundedRect(-contentW / 2, 0, contentW, 140, 16)
  rewardCard.endFill()
  rewardCard.position.set(0, cTop + 52)
  root.addChild(rewardCard)

  const coinBig = new PIXI.Text('🪙', { fontSize: 60 })
  coinBig.anchor.set(0.5, 0.5)
  coinBig.position.set(0, cTop + 104)
  root.addChild(coinBig)

  const amountT = txt(`＋${coinReward} 金币`, 38, C_ORANGE, '900')
  amountT.anchor.set(0.5, 0)
  amountT.position.set(0, cTop + 144)
  root.addChild(amountT)

  const noteT = txt('一次性奖励，仅限首次加入', 22, 0x666666, '500')
  noteT.anchor.set(0.5, 0)
  noteT.position.set(0, cTop + 196)
  root.addChild(noteT)

  // 操作按钮
  if (alreadyClaimed) {
    const doneBtn = makeJellyBtn('✓ 已领取 100 金币', contentW, 58, 0x9e9e9e)
    doneBtn.position.set(0, cBot - 29)
    root.addChild(doneBtn)
  } else {
    const joinBtn = makeJellyBtn('💬  加入游戏圈', contentW, 58, C_GREEN_WX)
    joinBtn.position.set(0, cBot - 29)
    joinBtn.on('pointerdown', () => { close(); opts.onJoin() })
    root.addChild(joinBtn)
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
