/**
 * 设置弹窗
 * 局内/局外共用：音效、震动、音乐开关 + 问题反馈
 * 局内：底部追加 3 个外部按钮 — 返回主页（黄）/ 重新开始（绿）/ 继续游戏（蓝）
 * 局外：仅通过右上角关闭按钮关闭
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_TEXT,
  makePanelBg, panelPad, makeOverlay,
  makeToggle, makeModalActions, ModalAction,
  bounceIn, bounceOut, txt
} from '~/ui/ui-kit'

export interface SettingsOptions {
  /** 是否在局内（显示外部 3 按钮） */
  isInGame?: boolean
  soundOn: boolean
  vibrationOn: boolean
  musicOn: boolean
  onSoundToggle: (v: boolean) => void
  onVibrationToggle: (v: boolean) => void
  onMusicToggle: (v: boolean) => void
  onFeedback: () => void
  /** 局内：重新开始当前关 */
  onReplay?: () => void
  /** 局内：返回主页（放弃当前关） */
  onGiveUp?: () => void
  onClose?: () => void
}

export function openSettingsModal(
  parent: PIXI.Container,
  opts: SettingsOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const dr = Math.min(sw / DESIGN_REF_W, sh / designLayoutH)

  // 包裹层
  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true

  // 遮罩
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  // 弹窗内容容器（设计坐标绘制，居中）
  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  // 面板尺寸（无内置按钮，仅设置项）
  const PANEL_W = 580
  const pad = panelPad(PANEL_W)
  const ROW_H = 80
  const rowCount = 3
  // 标题(36) + 行区间距 + 3 行设置项 + 底部信息一行 + 底部缓冲
  const PANEL_H = pad.top + 38 + rowCount * ROW_H + ROW_H + pad.bot
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  // 面板
  const panel = makePanelBg(PANEL_W, PANEL_H, close)
  panel.position.set(px, py)
  root.addChild(panel)

  const cTop = py + pad.top
  const bodyTop = cTop + pad.contentTop
  const cLeft = px + pad.lr
  const cRight = px + PANEL_W - pad.lr

  // 标题
  const titleT = txt('设置', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, cTop)
  root.addChild(titleT)

  // 设置项配置（使用图片图标）
  const rows = [
    { iconPath: 'assets/scene/setting/yinxiao.png', label: '音效', value: opts.soundOn, onChange: opts.onSoundToggle },
    { iconPath: 'assets/scene/setting/yinyue.png', label: '音乐', value: opts.musicOn, onChange: opts.onMusicToggle },
    { iconPath: 'assets/scene/setting/zhendong.png', label: '震动', value: opts.vibrationOn, onChange: opts.onVibrationToggle },
  ]

  const rowsStartY = bodyTop

  rows.forEach((row, i) => {
    const rowY = rowsStartY + i * ROW_H

    // 左侧图标
    const icon = new PIXI.Sprite(PIXI.Texture.from(row.iconPath))
    icon.anchor.set(0.5)
    icon.position.set(cLeft + 24, rowY + ROW_H / 2)
    const iconSize = 52
    icon.width = iconSize
    icon.height = iconSize
    root.addChild(icon)

    // 标签文字
    const labelT = txt(row.label, 28, C_TEXT, '700')
    labelT.anchor.set(0, 0.5)
    labelT.position.set(cLeft + 64, rowY + ROW_H / 2)
    root.addChild(labelT)

    const toggle = makeToggle(row.value, row.onChange)
    toggle.position.set(cRight - 140, rowY + ROW_H / 2 - 22)
    root.addChild(toggle)
  })

  // 设置项下方信息行：问题反馈 + 版本号
  const infoRowY = rowsStartY + rowCount * ROW_H + ROW_H / 2

  // 问题反馈（文字按钮）
  const feedbackT = txt('问题反馈', 24, C_TEXT, '700')
  feedbackT.anchor.set(0.5)
  feedbackT.position.set(-110, infoRowY)
  ;(feedbackT as any).interactive = true
  ;(feedbackT as any).buttonMode = true
  feedbackT.on('pointerdown', () => { opts.onFeedback() })
  root.addChild(feedbackT)

  // 版本号（同一行）
  let versionStr = ''
  try {
    const info = (wx as any).getAccountInfoSync?.()
    versionStr = info?.miniProgram?.version || ''
  } catch (_) {}
  const versionLabel = versionStr ? `v${versionStr}` : '版本号'
  const versionT = txt(versionLabel, 18, 0x8f8f8f, '500')
  versionT.anchor.set(0.5)
  versionT.position.set(110, infoRowY + 1)
  root.addChild(versionT)

  // 局内：弹窗下方追加 3 个外部按钮
  if (opts.isInGame) {
    const actions: ModalAction[] = [
      { label: '返回主页', color: 'yellow', onClick: () => { close(); opts.onGiveUp?.() } },
      { label: '重新开始', color: 'green',  onClick: () => { opts.onReplay?.(); close() } },
    ]
    const { container: actionBtns } = makeModalActions(actions)
    actionBtns.y = py + PANEL_H + 20
    root.addChild(actionBtns)
  }

  // scale 适配屏幕
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
