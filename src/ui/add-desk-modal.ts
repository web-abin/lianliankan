/**
 * 添加桌面弹窗
 * 引导玩家将游戏添加到手机桌面，每日进入可领 50 金币
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_TEXT, C_SKY, C_GRAY,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt
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
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 560
  const PANEL_H = 500
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（指向手机引导）
  // TODO: 替换为真实"指手机微笑"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('添加到桌面', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 30)
  root.addChild(titleT)

  // 三步流程图
  const steps = ['① 手机首页', '② 添加桌面', '③ 每天进入领金币']
  const stepW = (PANEL_W - 60) / 3
  steps.forEach((s, i) => {
    const sx = px + 20 + i * stepW

    // 步骤圆角卡
    const stepBg = new PIXI.Graphics()
    stepBg.lineStyle(1.5, C_OUTLINE, 0.25)
    stepBg.beginFill(C_SKY, 0.1)
    stepBg.drawRoundedRect(sx, py + 90, stepW - 8, 90, 10)
    stepBg.endFill()
    root.addChild(stepBg)

    const stepT = txt(s, i === 2 ? 18 : 20, C_OUTLINE, '700')
    stepT.anchor.set(0.5, 0.5)
    stepT.position.set(sx + (stepW - 8) / 2, py + 135)
    root.addChild(stepT)

    // 箭头（最后一步不画）
    if (i < 2) {
      const arrow = txt('→', 28, C_ORANGE, '700')
      arrow.anchor.set(0, 0.5)
      arrow.position.set(sx + stepW - 10, py + 135)
      root.addChild(arrow)
    }
  })

  // 奖励文案
  const rewardT = txt('每天从桌面进入 = +50 金币 🌿', 28, C_ORANGE, '900')
  rewardT.anchor.set(0.5, 0)
  rewardT.position.set(0, py + 202)
  root.addChild(rewardT)

  const subT = txt('连续 7 天，最多可领 350 金币', 22, 0x666666, '500')
  subT.anchor.set(0.5, 0)
  subT.position.set(0, py + 244)
  root.addChild(subT)

  // 主按钮
  if (opts.todayReceived) {
    const doneBtn = makeJellyBtn('✓ 今日已领取', PANEL_W - 80, 60, C_GRAY)
    doneBtn.position.set(0, py + PANEL_H - 82)
    root.addChild(doneBtn)
    const tipT = txt('明日再来领奖励 🌱', 22, 0x888888, '500')
    tipT.anchor.set(0.5, 0)
    tipT.position.set(0, py + PANEL_H - 36)
    root.addChild(tipT)
  } else {
    const addBtn = makeJellyBtn('🏠  添加到桌面', PANEL_W - 80, 60)
    addBtn.position.set(0, py + PANEL_H - 58)
    addBtn.on('pointerdown', () => { close(); opts.onAdd() })
    root.addChild(addBtn)
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
