/**
 * 设置弹窗
 * 局内/局外共用：音效、震动、音乐开关 + 问题反馈
 * 局内额外：重玩本关、放弃挑战
 */
import * as PIXI from 'pixi.js'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH } from '~/core'
import {
  C_OUTLINE, C_PANEL, C_ORANGE, C_RED, C_TEXT, C_SKY, C_YELLOW,
  drawPanel, makeOverlay, makeJellyBtn, makeCloseBtn, makeIpDeco,
  makeToggle, makeTextLink, bounceIn, txt
} from '~/ui/ui-kit'

export interface SettingsOptions {
  /** 是否在局内（显示重玩/放弃按钮） */
  isInGame?: boolean
  soundOn: boolean
  vibrationOn: boolean
  musicOn: boolean
  onSoundToggle: (v: boolean) => void
  onVibrationToggle: (v: boolean) => void
  onMusicToggle: (v: boolean) => void
  onFeedback: () => void
  /** 局内：重玩本关 */
  onReplay?: () => void
  /** 局内：触发放弃挑战流程 */
  onGiveUp?: () => void
  onClose?: () => void
}

export function openSettingsModal(
  parent: PIXI.Container,
  opts: SettingsOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  // 包裹层
  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true

  // 遮罩
  wrap.addChild(makeOverlay(sw, sh))

  // 弹窗内容容器（设计坐标绘制，居中）
  const root = new PIXI.Container()
  root.position.set(sw / 2, sh * 0.46)
  wrap.addChild(root)

  // 面板尺寸
  const PANEL_W = 580
  const ROW_H = 80
  const inGame = !!opts.isInGame
  const rowCount = 4 + (inGame ? 2 : 0)
  const PANEL_H = 90 + rowCount * ROW_H + 80
  const px = -PANEL_W / 2
  const py = -PANEL_H / 2

  // 面板
  const panel = new PIXI.Graphics()
  drawPanel(panel, PANEL_W, PANEL_H, 28)
  panel.position.set(px, py)
  root.addChild(panel)

  // IP 装饰（卡皮巴拉探出顶边）
  // TODO: 替换为真实卡皮巴拉切图精灵
  const ip = makeIpDeco(86)
  ip.position.set(0, py + 2)
  root.addChild(ip)

  // 标题
  const titleT = txt('设置', 36, C_TEXT, '900')
  titleT.anchor.set(0.5, 0)
  titleT.position.set(0, py + 32)
  root.addChild(titleT)

  // 分割线
  const divider = new PIXI.Graphics()
  divider.lineStyle(1.5, C_OUTLINE, 0.2)
  divider.moveTo(px + 40, py + 78)
  divider.lineTo(px + PANEL_W - 40, py + 78)
  root.addChild(divider)

  // 行配置
  const rows = [
    { icon: '🔊', label: '音效', type: 'toggle', value: opts.soundOn, onChange: opts.onSoundToggle },
    { icon: '📳', label: '震动', type: 'toggle', value: opts.vibrationOn, onChange: opts.onVibrationToggle },
    { icon: '🎵', label: '音乐', type: 'toggle', value: opts.musicOn, onChange: opts.onMusicToggle },
    { icon: '❓', label: '问题反馈', type: 'arrow', onClick: opts.onFeedback }
  ]

  rows.forEach((row, i) => {
    const rowY = py + 90 + i * ROW_H

    // 图标背景圆
    const iconBg = new PIXI.Graphics()
    const iconColors = [C_ORANGE, C_SKY, C_YELLOW, C_SKY]
    iconBg.beginFill(iconColors[i] ?? C_SKY, 0.3)
    iconBg.drawCircle(0, 0, 22)
    iconBg.endFill()
    iconBg.position.set(px + 50, rowY + ROW_H / 2)
    root.addChild(iconBg)

    const iconT = new PIXI.Text(row.icon, { fontSize: 28 })
    iconT.anchor.set(0.5, 0.5)
    iconT.position.set(px + 50, rowY + ROW_H / 2)
    root.addChild(iconT)

    // 标签文字
    const labelT = txt(row.label, 28, C_TEXT, '700')
    labelT.anchor.set(0, 0.5)
    labelT.position.set(px + 88, rowY + ROW_H / 2)
    root.addChild(labelT)

    if (row.type === 'toggle' && row.onChange) {
      // 拨动开关
      const toggle = makeToggle(row.value ?? true, row.onChange)
      toggle.position.set(px + PANEL_W - 110, rowY + ROW_H / 2 - 22)
      root.addChild(toggle)
    } else if (row.type === 'arrow') {
      // ">" 箭头
      const arrow = txt('›', 36, C_OUTLINE, '700')
      arrow.anchor.set(1, 0.5)
      arrow.position.set(px + PANEL_W - 36, rowY + ROW_H / 2)
      ;(arrow as any).interactive = true
      ;(arrow as any).buttonMode = true
      arrow.on('pointerdown', () => { row.onClick?.() })
      root.addChild(arrow)
      // 整行可点
      const hitArea = new PIXI.Graphics()
      hitArea.beginFill(0, 0)
      hitArea.drawRect(px, rowY, PANEL_W, ROW_H)
      hitArea.endFill()
      ;(hitArea as any).interactive = true
      ;(hitArea as any).buttonMode = true
      hitArea.on('pointerdown', () => { row.onClick?.() })
      root.addChild(hitArea)
    }

    // 行分割线
    if (i < rows.length - 1) {
      const sep = new PIXI.Graphics()
      sep.lineStyle(1, C_OUTLINE, 0.1)
      sep.moveTo(px + 36, rowY + ROW_H)
      sep.lineTo(px + PANEL_W - 36, rowY + ROW_H)
      root.addChild(sep)
    }
  })

  // 局内额外操作
  if (inGame) {
    const extraBaseY = py + 90 + rows.length * ROW_H + 8

    // 分割线
    const sep = new PIXI.Graphics()
    sep.lineStyle(1.5, C_OUTLINE, 0.15)
    sep.moveTo(px + 36, extraBaseY)
    sep.lineTo(px + PANEL_W - 36, extraBaseY)
    root.addChild(sep)

    // 重玩本关
    const replayT = txt('🔁  重玩本关', 28, C_ORANGE, '700')
    replayT.anchor.set(0.5, 0)
    replayT.position.set(0, extraBaseY + 10)
    ;(replayT as any).interactive = true
    ;(replayT as any).buttonMode = true
    replayT.on('pointerdown', () => { opts.onReplay?.(); close() })
    root.addChild(replayT)

    // 放弃挑战
    const giveUpT = txt('🚪  放弃挑战', 28, C_RED, '700')
    giveUpT.anchor.set(0.5, 0)
    giveUpT.position.set(0, extraBaseY + ROW_H)
    ;(giveUpT as any).interactive = true
    ;(giveUpT as any).buttonMode = true
    giveUpT.on('pointerdown', () => { close(); opts.onGiveUp?.() })
    root.addChild(giveUpT)
  }

  // 确定按钮
  const confirmBtn = makeJellyBtn('确定', 300, 56)
  confirmBtn.position.set(0, py + PANEL_H - 52)
  confirmBtn.on('pointerdown', close)
  root.addChild(confirmBtn)

  // 关闭按钮
  const closeBtn = makeCloseBtn(close)
  closeBtn.position.set(px + PANEL_W - 24, py + 24)
  root.addChild(closeBtn)

  // scale 适配屏幕
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
