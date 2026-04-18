/**
 * 放弃挑战挽回弹窗
 * 展示当前进度，鼓励玩家继续，提供"再试试"与"放弃回首页"
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_ORANGE, C_SKY, C_TEXT,
  makePanelBg, panelPad, makeOverlay, makeJellyBtn,
  bounceIn, bounceOut, drawProgressBar, txt, txtWrap
} from '~/ui/ui-kit'

export interface GiveUpOptions {
  levelNum?: number
  /** 已消除对数 */
  cleared?: number
  /** 总对数 */
  total?: number
  onRetry?: () => void
  onGiveUp?: () => void
}

export function openGiveUpModal(
  parent: PIXI.Container,
  opts: GiveUpOptions = {}
): PIXI.Container {
  const { levelNum = 1, cleared = 0, total = 1, onRetry, onGiveUp } = opts
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)
  const pct = total > 0 ? Math.min(1, cleared / total) : 0

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 560
  const pad = panelPad(PANEL_W)
  const contentW = PANEL_W - 2 * pad.lr
  const PANEL_H = pad.top + 340 + pad.bot
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot
  const cLeft = px + pad.lr

  // 进度信息卡
  const cardG = new PIXI.Graphics()
  const cardH = 110
  cardG.lineStyle(2, C_OUTLINE, 0.3)
  cardG.beginFill(C_SKY, 0.12)
  cardG.drawRoundedRect(cLeft, cTop, contentW, cardH, 14)
  cardG.endFill()
  root.addChild(cardG)

  // 关卡标题
  const levelT = txt(`第 ${levelNum} 关进度`, 24, C_OUTLINE, '600')
  levelT.anchor.set(0.5, 0)
  levelT.position.set(0, cTop + 10)
  root.addChild(levelT)

  // 进度条
  const barG = new PIXI.Graphics()
  drawProgressBar(barG, cLeft + 16, cTop + 42, contentW - 32, 20, pct)
  root.addChild(barG)

  // 进度数字
  const progT = txt(`已消除 ${cleared} / ${total} 对`, 22, C_OUTLINE, '600')
  progT.anchor.set(0.5, 0)
  progT.position.set(0, cTop + 72)
  root.addChild(progT)

  // 鼓励文案
  const pctInt = Math.round(pct * 100)
  const encT = txt('再努力一下就要过关了！', 32, C_ORANGE, '900')
  encT.anchor.set(0.5, 0)
  encT.position.set(0, cTop + 130)
  root.addChild(encT)

  const subT = txtWrap(
    `已完成 ${pctInt}% · 还有 ${total - cleared} 对等你消除～`,
    24, contentW, C_OUTLINE, '600'
  )
  subT.anchor.set(0.5, 0)
  subT.position.set(0, cTop + 174)
  root.addChild(subT)

  // 主按钮：再试试
  const retryBtn = makeJellyBtn('再试试！💪', contentW, 60)
  retryBtn.position.set(0, cBot - 76)
  retryBtn.on('pointerdown', () => { close(); onRetry?.() })
  root.addChild(retryBtn)

  // 次要链接：放弃挑战
  const giveUpT = txt('放弃挑战（回到首页）', 24, 0x999999, '500')
  giveUpT.anchor.set(0.5, 0.5)
  giveUpT.position.set(0, cBot - 16)
  ;(giveUpT as any).interactive = true
  ;(giveUpT as any).buttonMode = true
  giveUpT.on('pointerdown', () => { close(); onGiveUp?.() })
  root.addChild(giveUpT)

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  let closing = false
  function close() {
    if (closing) return
    closing = true
    bounceOut(root, dr, dim, () => {
      parent.removeChild(wrap)
      wrap.destroy({ children: true })
    })
  }

  return wrap
}
