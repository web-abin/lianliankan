/**
 * 主题选择全屏页
 * 2 列网格（左右 32、列间距 24）；卡片圆角；背景区占满卡片，首页图宽度铺满、高度按比例并垂直居中；底部三格为局内同款砖块贴齐
 * 状态：使用中 / 已解锁 / 成就锁定（打开/关闭无过渡动画）
 */
import * as PIXI from 'pixi.js'
import { FONT_FAMILY } from '~/constants/design-tokens'
import { windowWidth, windowHeight, DESIGN_REF_W, designLayoutH, safeAreaTopPx } from '~/core'
import { makeOverlay, txt } from '~/ui/ui-kit'
import { BETA_UNLOCK_ALL } from '~/game/game-hooks'
import type { GameThemeId } from '~/game/game-hooks'
import { resolveThemeHomeBg } from '~/game/game-hooks'
import { loadThemeTextureMap, texturesForKinds } from '~/game/food-atlas'

/** 主题卡片选中态主色（边框 / 标签底 / 强调） */
const C_THEME_ACTIVE = 0x2bb653

export interface ThemePanelOptions {
  unlockedThemes: GameThemeId[]
  selectedTheme: GameThemeId
  onSelect: (theme: GameThemeId) => void
  onClose?: () => void
}

interface ThemeDef {
  id: GameThemeId
  name: string
  unlockHint: string
}

// 主题列表
const THEMES: ThemeDef[] = [
  { id: 'fruit', name: '春日草原', unlockHint: '默认解锁' },
  { id: 'music', name: '森林音乐会', unlockHint: '完成 5 次每日挑战解锁' },
  { id: 'animal', name: '动物朋友', unlockHint: '主线通关 40 关解锁' }
]

/** 与局内棋盘一致的砖块圆角（主题预览条复用） */
function themePreviewTileCornerRadius(w: number): number {
  return Math.max(3, Math.min(14, w * 0.12))
}

function drawThemeTileDropShadow(g: PIXI.Graphics, w: number, h: number) {
  g.clear()
  g.beginFill(0x3d2814, 1)
  g.drawRoundedRect(0, 0, w, h, themePreviewTileCornerRadius(w))
  g.endFill()
}

function drawThemeTileBase(g: PIXI.Graphics, w: number, h: number) {
  g.clear()
  const rad = themePreviewTileCornerRadius(w)
  const inset = Math.max(2.5, rad * 0.22)
  g.lineStyle(1.5, 0x6b4e2d, 1)
  g.beginFill(0xfdf6ea, 1)
  g.drawRoundedRect(0, 0, w, h, rad)
  g.endFill()
  g.lineStyle(1.1, 0xffffff, 0.48)
  g.moveTo(inset, 2.8)
  g.lineTo(w - inset, 2.8)
}

export function openThemePanel(
  parent: PIXI.Container,
  opts: ThemePanelOptions
): PIXI.Container {
  const sw = windowWidth, sh = windowHeight
  const DESIGN_W = DESIGN_REF_W
  const DESIGN_H = designLayoutH
  const dr = Math.min(sw / DESIGN_W, sh / DESIGN_H)

  const wrap = new PIXI.Container()
  ;(wrap as any).interactive = true

  // 暗色蒙层
  const dim = makeOverlay(sw, sh)
  wrap.addChild(dim)

  // 主内容容器（设计坐标）
  const root = new PIXI.Container()
  root.scale.set(dr)
  wrap.addChild(root)

  // 安全区顶部偏移（设计坐标）
  const SAFE_TOP = (safeAreaTopPx + 10) / dr

  // ── 顶部栏 ──────────────────────────────────────────────
  // 返回按钮（使用 back.png）
  const backTex = PIXI.Texture.from('assets/button/back.png')
  const backBtn = new PIXI.Sprite(backTex)
  backBtn.anchor.set(0, 0)
  const BACK_SIZE = 80
  backBtn.width = BACK_SIZE
  backBtn.height = BACK_SIZE
  backBtn.position.set(24, SAFE_TOP)
  ;(backBtn as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
  backBtn.on('pointerdown', close)
  root.addChild(backBtn)

  // 标题
  const titleT = txt('主题', 50, 0xffffff, '900')
  titleT.anchor.set(0.5, 0.5)
  titleT.position.set(DESIGN_W / 2, SAFE_TOP + BACK_SIZE / 2)
  root.addChild(titleT)

  // ── 卡片网格（2 列）：左右 32、列间距 24 ───────────────────
  const GRID_PAD_LR = 64
  const CARD_GAP = 48
  const CARD_W = (DESIGN_W - GRID_PAD_LR * 2 - CARD_GAP) / 2
  const CARD_H = Math.round(CARD_W * (200 / 150))
  const GRID_TOP = SAFE_TOP + BACK_SIZE + 100
  /** 主题名胶囊高度（标签中心在卡片上沿之上 TAG_H/2，行距需留出「探出」部分避免叠在一起） */
  const TAG_H = 60
  const ROW_STEP = CARD_H + CARD_GAP + Math.ceil(TAG_H / 2)

  THEMES.forEach((theme, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = GRID_PAD_LR + col * (CARD_W + CARD_GAP)
    const cy = GRID_TOP + row * ROW_STEP

    const isUnlocked = BETA_UNLOCK_ALL || opts.unlockedThemes.includes(theme.id)
    const isActive = theme.id === opts.selectedTheme

    // 卡片容器
    const card = new PIXI.Container()
    card.position.set(cx, cy)
    root.addChild(card)

    // ── 卡片背景圆角裁切 ──
    const CORNER = 40
    const cardMask = new PIXI.Graphics()
    cardMask.beginFill(0xffffff)
    cardMask.drawRoundedRect(0, 0, CARD_W, CARD_H, CORNER)
    cardMask.endFill()
    card.addChild(cardMask)

    // 卡片背景色
    const bgColor = new PIXI.Graphics()
    bgColor.beginFill(isUnlocked ? 0xd4edda : 0xe8e8e8)
    bgColor.drawRoundedRect(0, 0, CARD_W, CARD_H, CORNER)
    bgColor.endFill()
    card.addChild(bgColor)

    // 主题首页背景图：区域占满卡片，图片宽度 100%、高度按比例，垂直居中（不拉伸变形）
    const homeBgPath = resolveThemeHomeBg(theme.id)
    const bgTex = PIXI.Texture.from(homeBgPath)
    const bgSprite = new PIXI.Sprite(bgTex)
    bgSprite.anchor.set(0.5, 0.5)
    bgSprite.position.set(CARD_W / 2, CARD_H / 2)
    bgSprite.mask = cardMask
    const applyHomeBgLayout = () => {
      const tex = bgSprite.texture
      const texW = (tex as any).orig?.width || tex.width
      const texH = (tex as any).orig?.height || tex.height
      if (texW <= 0 || texH <= 0) return
      const scale = CARD_W / texW
      bgSprite.width = CARD_W
      bgSprite.height = texH * scale
    }
    if (bgSprite.texture.valid) applyHomeBgLayout()
    else bgSprite.texture.baseTexture.once('loaded', applyHomeBgLayout)
    card.addChild(bgSprite)

    // ── 状态覆盖层 ──
    if (isActive) {
      // 使用中：半透明绿色遮罩 + 勾选图标 + "使用中"文字
      const overlay = new PIXI.Graphics()
      overlay.beginFill(C_THEME_ACTIVE, 0.35)
      overlay.drawRoundedRect(0, CARD_H * 0.2, CARD_W, CARD_H * 0.4, 0)
      overlay.endFill()
      overlay.mask = cardMask
      card.addChild(overlay)

      const checkT = new PIXI.Text('✓', {
        fontFamily: FONT_FAMILY,
        fontSize: 52,
        fill: C_THEME_ACTIVE,
        fontWeight: '900',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4
      })
      checkT.anchor.set(0.5, 0.5)
      checkT.position.set(CARD_W / 2, CARD_H * 0.33)
      card.addChild(checkT)

      const activeT = new PIXI.Text('使用中', {
        fontFamily: FONT_FAMILY,
        fontSize: 36,
        fill: C_THEME_ACTIVE,
        fontWeight: '800',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4
      })
      activeT.anchor.set(0.5, 0.5)
      activeT.position.set(CARD_W / 2, CARD_H * 0.5)
      card.addChild(activeT)
    } else if (!isUnlocked) {
      // 锁定：暗色遮罩 + 锁图标 + 解锁提示
      const overlay = new PIXI.Graphics()
      overlay.beginFill(0x000000, 0.45)
      overlay.drawRoundedRect(0, 0, CARD_W, CARD_H, CORNER)
      overlay.endFill()
      overlay.mask = cardMask
      card.addChild(overlay)

      const lockT = txt('🔒', 40, 0xffffff, '400')
      lockT.anchor.set(0.5, 0.5)
      lockT.position.set(CARD_W / 2, CARD_H * 0.35)
      card.addChild(lockT)

      // 解锁条件标签
      const hintBg = new PIXI.Graphics()
      const HINT_W = CARD_W * 0.75, HINT_H = 32
      hintBg.beginFill(0x000000, 0.65)
      hintBg.drawRoundedRect(-HINT_W / 2, -HINT_H / 2, HINT_W, HINT_H, HINT_H / 2)
      hintBg.endFill()
      hintBg.position.set(CARD_W / 2, CARD_H * 0.52)
      card.addChild(hintBg)

      const hintT = txt(theme.unlockHint, 16, 0xffffff, '600')
      hintT.anchor.set(0.5, 0.5)
      hintT.position.set(CARD_W / 2, CARD_H * 0.52)
      card.addChild(hintT)
    }

    // ── 底部元素预览区：局内同款投影 + 卡面，三列等分横向贴齐（无列间距） ──
    const PREVIEW_AREA_H = Math.max(56, Math.round(CARD_H * 0.24))
    const PREVIEW_Y = CARD_H - PREVIEW_AREA_H
    const CELL_W = CARD_W / 3
    const maxIcon = Math.min(CELL_W, PREVIEW_AREA_H) * 0.72

    const previewRow = new PIXI.Container()
    previewRow.position.set(0, PREVIEW_Y)
    previewRow.mask = cardMask
    card.addChild(previewRow)

    const elemSprites: PIXI.Sprite[] = []
    for (let e = 0; e < 3; e++) {
      const x0 = e * CELL_W
      const box = new PIXI.Container()
      box.position.set(x0, 0)

      const shadowG = new PIXI.Graphics()
      drawThemeTileDropShadow(shadowG, CELL_W, PREVIEW_AREA_H)
      shadowG.position.set(4, 5)
      box.addChild(shadowG)

      const tileFace = new PIXI.Graphics()
      drawThemeTileBase(tileFace, CELL_W, PREVIEW_AREA_H)
      box.addChild(tileFace)

      const sp = new PIXI.Sprite(PIXI.Texture.EMPTY)
      sp.anchor.set(0.5, 0.5)
      sp.position.set(CELL_W / 2, PREVIEW_AREA_H / 2)
      box.addChild(sp)
      elemSprites.push(sp)

      previewRow.addChild(box)
    }

    // 异步加载主题图集并填充预览元素
    loadThemeTextureMap(theme.id).then(texMap => {
      const texArr = texturesForKinds(texMap, Math.min(3, Object.keys(texMap).length))
      for (let e = 0; e < Math.min(3, texArr.length); e++) {
        elemSprites[e].texture = texArr[e]
        const tw = texArr[e].width || 1
        const th = texArr[e].height || 1
        const s = maxIcon / Math.max(tw, th)
        elemSprites[e].scale.set(s)
        if (!isUnlocked) elemSprites[e].alpha = 0.5
      }
    }).catch(() => { /* 加载失败静默 */ })

    // ── 卡片边框（默认 1px 白边；选中 #2bb653，略加粗以突出） ──
    const border = new PIXI.Graphics()
    if (isActive) {
      border.lineStyle(8, C_THEME_ACTIVE, 1)
    } else {
      border.lineStyle(8, 0xffffff, 1)
    }
    border.drawRoundedRect(0, 0, CARD_W, CARD_H, CORNER)
    card.addChild(border)

    // ── 点击交互（放在胶囊之前，避免半透明命中层盖住标签） ──
    if (isUnlocked && !isActive) {
      const hitArea = new PIXI.Graphics()
      hitArea.beginFill(0xffffff, 0.001)
      hitArea.drawRoundedRect(0, 0, CARD_W, CARD_H, CORNER)
      hitArea.endFill()
      ;(hitArea as PIXI.DisplayObject & { interactive?: boolean }).interactive = true
      hitArea.on('pointerdown', () => {
        opts.onSelect(theme.id)
        close()
        wx.showToast?.({ title: `已切换至${theme.name}！`, icon: 'none' })
      })
      card.addChild(hitArea)
    }

    // ── 主题名胶囊（中心在上沿之上 TAG_H/2，黑描边；最上层绘制，不被命中层遮挡） ──
    const nameTag = new PIXI.Container()
    let textColor = 0x000000
    if (isActive) {
       textColor = 0xffffff
    }else{
       textColor = 0x000000
    }
    const nameTxt = txt(theme.name, 32,textColor, '400')
    nameTxt.anchor.set(0.5, 0.5)
    const TAG_W = Math.max(nameTxt.width + 68, 120)
    const tagFill = isActive ? C_THEME_ACTIVE : 0xffffff
    const tagBg = new PIXI.Graphics()
    tagBg.beginFill(tagFill)
    tagBg.lineStyle(2, 0x000000, 1)
    tagBg.drawRoundedRect(-TAG_W / 2, -TAG_H / 2, TAG_W, TAG_H, TAG_H / 2)
    tagBg.endFill()
    nameTag.addChild(tagBg)
    nameTag.addChild(nameTxt)
    nameTag.position.set(CARD_W / 2, 0)
    card.addChild(nameTag)
  })

  parent.addChild(wrap)

  let closing = false
  function close() {
    if (closing) return
    closing = true
    opts.onClose?.()
    parent.removeChild(wrap)
    wrap.destroy({ children: true })
  }

  return wrap
}
