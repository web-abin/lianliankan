/**
 * 添加桌面弹窗
 * 引导玩家将游戏添加到手机桌面，每日进入可领 50 金币
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_ORANGE, C_TEXT, C_SKY, C_GRAY,
  makePanelBg, panelPad, makeOverlay, makeJellyBtn,
  bounceIn, bounceOut, txt
} from '~/ui/ui-kit'

export interface AddDeskOptions {
  /** 今日桌面奖励是否已领取 */
  todayReceived: boolean
  onAdd: () => void
  onClose?: () => void
}

export function openAddDeskModal(
  parent: PIXI.Container,
  opts: AddDeskOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

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
  const PANEL_H = pad.top + 290 + pad.bot
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot
  const cLeft = px + pad.lr

  // 标题
  const titleT = txt('添加到桌面', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 三步流程图
  const steps = ['① 手机首页', '② 添加桌面', '③ 每天进入领金币']
  const stepW = contentW / 3
  steps.forEach((s, i) => {
    const sx = cLeft + i * stepW

    // 步骤圆角卡
    const stepBg = new PIXI.Graphics()
    stepBg.lineStyle(1.5, C_OUTLINE, 0.25)
    stepBg.beginFill(C_SKY, 0.1)
    stepBg.drawRoundedRect(sx, cTop + 52, stepW - 8, 90, 10)
    stepBg.endFill()
    root.addChild(stepBg)

    const stepT = txt(s, i === 2 ? 18 : 20, C_OUTLINE, '700')
    stepT.anchor.set(0.5, 0.5)
    stepT.position.set(sx + (stepW - 8) / 2, cTop + 97)
    root.addChild(stepT)

    // 箭头（最后一步不画）
    if (i < 2) {
      const arrow = txt('→', 28, C_ORANGE, '700')
      arrow.anchor.set(0, 0.5)
      arrow.position.set(sx + stepW - 10, cTop + 97)
      root.addChild(arrow)
    }
  })

  // 奖励文案
  const rewardT = txt('每天从桌面进入 = +50 金币 🌿', 28, C_ORANGE, '900')
  rewardT.anchor.set(0.5, 0)
  rewardT.position.set(0, cTop + 162)
  root.addChild(rewardT)

  const subT = txt('连续 7 天，最多可领 350 金币', 22, 0x666666, '500')
  subT.anchor.set(0.5, 0)
  subT.position.set(0, cTop + 200)
  root.addChild(subT)

  // 主按钮
  if (opts.todayReceived) {
    const doneBtn = makeJellyBtn('✓ 今日已领取', contentW, 60, C_GRAY)
    doneBtn.position.set(0, cBot - 50)
    root.addChild(doneBtn)
    const tipT = txt('明日再来领奖励 🌱', 22, 0x888888, '500')
    tipT.anchor.set(0.5, 0)
    tipT.position.set(0, cBot - 10)
    root.addChild(tipT)
  } else {
    const addBtn = makeJellyBtn('🏠  添加到桌面', contentW, 60)
    addBtn.position.set(0, cBot - 30)
    addBtn.on('pointerdown', () => { close(); opts.onAdd() })
    root.addChild(addBtn)
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
