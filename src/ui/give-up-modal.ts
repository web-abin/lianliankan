/**
 * 放弃挑战挽回弹窗
 * 展示当前进度，鼓励玩家继续，提供"再试试"与"放弃回首页"
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_SKY, C_TEXT, C_RED,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, drawProgressBar, txt, txtWrap
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
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)
  const pct = total > 0 ? Math.min(1, cleared / total) : 0

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 560
  const PANEL_H = 520
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  // 面板
  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（委屈状卡皮巴拉）
  // TODO: 替换为"眼角大水珠委屈蹲坐"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 进度信息卡
  const cardG = new PIXI.Graphics()
  const cardW = PANEL_W - 80
  const cardH = 110
  const cardX = px + 40
  const cardY = py + 44
  cardG.lineStyle(2, C_OUTLINE, 0.3)
  cardG.beginFill(C_SKY, 0.12)
  cardG.drawRoundedRect(cardX, cardY, cardW, cardH, 14)
  cardG.endFill()
  root.addChild(cardG)

  // 关卡标题
  const levelT = txt(`第 ${levelNum} 关进度`, 24, C_OUTLINE, '600')
  levelT.anchor.set(0.5, 0)
  levelT.position.set(0, cardY + 10)
  root.addChild(levelT)

  // 进度条
  const barG = new PIXI.Graphics()
  drawProgressBar(barG, cardX + 16, cardY + 42, cardW - 32, 20, pct)
  root.addChild(barG)

  // 进度数字
  const progT = txt(`已消除 ${cleared} / ${total} 对`, 22, C_OUTLINE, '600')
  progT.anchor.set(0.5, 0)
  progT.position.set(0, cardY + 72)
  root.addChild(progT)

  // 鼓励文案
  const pctInt = Math.round(pct * 100)
  const encT = txt('再努力一下就要过关了！', 32, C_ORANGE, '900')
  encT.anchor.set(0.5, 0)
  encT.position.set(0, py + 172)
  root.addChild(encT)

  const subT = txtWrap(
    `已完成 ${pctInt}% · 还有 ${total - cleared} 对等你消除～`,
    24, cardW, C_OUTLINE, '600'
  )
  subT.anchor.set(0.5, 0)
  subT.position.set(0, py + 218)
  root.addChild(subT)

  // 主按钮：再试试
  const retryBtn = makeJellyBtn('再试试！💪', PANEL_W - 80, 60)
  retryBtn.position.set(0, py + PANEL_H - 140)
  retryBtn.on('pointerdown', () => { close(); onRetry?.() })
  root.addChild(retryBtn)

  // 次要链接：放弃挑战
  const giveUpT = txt('放弃挑战（回到首页）', 24, 0x999999, '500')
  giveUpT.anchor.set(0.5, 0.5)
  giveUpT.position.set(0, py + PANEL_H - 64)
  ;(giveUpT as any).interactive = true
  ;(giveUpT as any).buttonMode = true
  giveUpT.on('pointerdown', () => { close(); onGiveUp?.() })
  root.addChild(giveUpT)

  // 关闭
  const closeBtn = makeCloseBtn(close)
  closeBtn.position.set(px + PANEL_W - 24, py + 24)
  root.addChild(closeBtn)

  root.scale.set(dr)
  parent.addChild(wrap)
  bounceIn(root, dr)

  function close() {
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}
