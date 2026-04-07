/**
 * 喊人弹窗
 * 邀请好友来玩，获得 +3 血量
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_RED, C_TEXT, C_GREEN_WX,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  bounceIn, txt, txtWrap
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
  wrap.addChild(makeOverlay(sw, sh))

  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  const PANEL_W = 560
  const PANEL_H = 480
  const px = -PANEL_W / 2, py = -PANEL_H / 2

  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（双手圆筒呼唤好友）
  // TODO: 替换为真实"喊人"卡皮巴拉切图
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('喊好友来救我！', 34, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 32)
  root.addChild(titleT)

  // 说明文案
  const desc1 = txt('邀请好友来玩，你将获得', 26, C_TEXT, '600')
  desc1.anchor.set(0.5, 0)
  desc1.position.set(0, py + 92)
  root.addChild(desc1)

  // 爱心 + 数字展示
  const heartsRow = new PIXI.Container()
  heartsRow.position.set(0, py + 145)
  root.addChild(heartsRow)

  for (let i = 0; i < bloodBonus; i++) {
    const h = new PIXI.Text('❤️', { fontSize: 44 })
    h.anchor.set(0.5, 0.5)
    h.position.set((i - (bloodBonus - 1) / 2) * 60, 0)
    heartsRow.addChild(h)
  }

  const bloodT = txt(`+${bloodBonus} 血量`, 32, C_RED, '900')
  bloodT.anchor.set(0.5, 0)
  bloodT.position.set(0, py + 198)
  root.addChild(bloodT)

  // 微信分享按钮
  const shareBtn = makeJellyBtn('💬  去邀请好友', PANEL_W - 80, 60, C_GREEN_WX)
  shareBtn.position.set(0, py + 278)
  shareBtn.on('pointerdown', () => { close(); opts.onShare() })
  root.addChild(shareBtn)

  // 说明小字
  const tipT = txtWrap('好友接受邀请后，血量即刻到账', 22, PANEL_W - 80)
  tipT.anchor.set(0.5, 0)
  tipT.position.set(0, py + 358)
  root.addChild(tipT)

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
