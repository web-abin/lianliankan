/**
 * 喊人弹窗
 * 邀请好友来玩，获得 +3 血量
 * 操作按钮：邀请好友（黄）— 外部按钮
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_RED, C_TEXT,
  makePanelBg, panelPad, makeOverlay, makeModalActions,
  bounceIn, bounceOut, txt, txtWrap
} from '~/ui/ui-kit'

export interface ShoutOptions {
  bloodBonus?: number
  onShare: () => void
  onClose?: () => void
}

export function openShoutModal(
  parent: PIXI.Container,
  opts: ShoutOptions
): PIXI.Container {
  const { bloodBonus = 3 } = opts
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
  // 标题(34)+说明(26)+爱心(44)+血量(32)+提示(22) + 间距 ≈ 240
  const PANEL_H = pad.top + 240 + pad.bot
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const cBot = py + PANEL_H - pad.bot

  // 标题
  const titleT = txt('喊好友来救我！', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 说明文案
  const desc1 = txt('邀请好友来玩，你将获得', 26, C_TEXT, '600')
  desc1.anchor.set(0.5, 0)
  desc1.position.set(0, cTop + 52)
  root.addChild(desc1)

  // 爱心 + 数字展示
  const heartsRow = new PIXI.Container()
  heartsRow.position.set(0, cTop + 105)
  root.addChild(heartsRow)

  for (let i = 0; i < bloodBonus; i++) {
    const h = new PIXI.Text('❤️', { fontSize: 44 })
    h.anchor.set(0.5, 0.5)
    h.position.set((i - (bloodBonus - 1) / 2) * 60, 0)
    heartsRow.addChild(h)
  }

  const bloodT = txt(`+${bloodBonus} 血量`, 32, C_RED, '900')
  bloodT.anchor.set(0.5, 0)
  bloodT.position.set(0, cTop + 150)
  root.addChild(bloodT)

  // 说明小字
  const tipT = txtWrap('好友接受邀请后，血量即刻到账', 22, contentW)
  tipT.anchor.set(0.5, 0)
  tipT.position.set(0, cBot - 22)
  root.addChild(tipT)

  // 外部按钮：邀请好友（黄）
  const { container: actionBtns } = makeModalActions([
    { label: '邀请好友', color: 'yellow', onClick: () => { close(); opts.onShare() } }
  ])
  actionBtns.y = py + PANEL_H + 20
  root.addChild(actionBtns)

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
