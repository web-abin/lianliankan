import * as PIXI from 'pixi.js'
import { stage, loader, screen, tick, ticker, windowHeight } from '~/core'
import { ASSET_URLS, ROLE_SHEET_URL } from '~/ui/home'
import { GAME_PRELOAD_URLS } from '~/ui/game-screen'
import * as navigator from '~/navigator'

let root: PIXI.Container | null = null
let _bounceTick: ((delta: number) => void) | null = null

type SignalBinding = { detach: () => boolean }

function detachBindings(list: SignalBinding[]) {
  for (const b of list) {
    try {
      b.detach()
    } catch (_) {}
  }
  list.length = 0
}

export async function show() {
  if (root) return
  root = new PIXI.Container()
  const W = screen.width
  const H = screen.height

  // ── 背景图：宽度100%，高度等比缩放，垂直居中 ──
  const bgSpr = PIXI.Sprite.from('assets/scene/loading/bg.png')
  bgSpr.anchor.set(0.5)
  bgSpr.x = W / 2
  bgSpr.y = H / 2
  const applyBgSize = () => {
    const t = bgSpr.texture
    const tw = (t as any).orig?.width || t.width
    const th = (t as any).orig?.height || t.height
    if (tw > 0 && th > 0) {
      bgSpr.width = W
      bgSpr.height = Math.round((W * th) / tw)
    }
  }
  if (bgSpr.texture.valid) applyBgSize()
  else bgSpr.texture.baseTexture.once('loaded', applyBgSize)
  root.addChild(bgSpr)

  // ── 角色图：水平垂直居中于屏幕中心 ──
  const ROLE_CENTER_X = W / 2
  const ROLE_CENTER_Y = H / 2
  const ROLE_TARGET_W = Math.round(W * 0.5)

  const roleSpr = PIXI.Sprite.from('assets/scene/loading/role.png')
  roleSpr.anchor.set(0.5)
  roleSpr.x = ROLE_CENTER_X
  roleSpr.y = ROLE_CENTER_Y
  // 水平镜像
  roleSpr.scale.x = -1

  // 初始估算角色高度（用于先定位进度条，纹理就绪后更新）
  let roleH = Math.round(W * 0.5)

  // ── 进度条尺寸常量 ──
  const BAR_W = Math.round(W * 0.68)
  const BAR_H = 24
  const BAR_R = BAR_H / 2
  const BAR_GAP = 60  // 角色图底部到进度条顶部的像素间距

  // 进度条容器
  const barContainer = new PIXI.Container()
  root.addChild(barContainer)

  // 进度条轨道底色（奶白）
  const track = new PIXI.Graphics()
  barContainer.addChild(track)

  // 斜条纹填充（用 mask 裁剪到圆角矩形内）
  const fillMask = new PIXI.Graphics()
  const fill = new PIXI.Graphics()
  fill.mask = fillMask
  barContainer.addChild(fillMask)
  barContainer.addChild(fill)

  // 黑色描边（最上层，覆盖在填充上方）
  const trackBorder = new PIXI.Graphics()
  barContainer.addChild(trackBorder)

  // "正在加载静态资源" 文案：白字黑边
  const labelFontSize = Math.round(W * 0.038)
  const loadingLabel = new PIXI.Text('正在加载静态资源', {
    fontFamily: 'sans-serif',
    fontSize: labelFontSize,
    fill: 0xffffff,
    fontWeight: '600',
    stroke: 0x000000,
    strokeThickness: 3,
  })
  loadingLabel.anchor.set(0.5, 0)
  root.addChild(loadingLabel)

  // 根据角色高度更新进度条和文案的位置
  const updateLayout = () => {
    const roleBottom = ROLE_CENTER_Y + roleH / 2
    const barTop = roleBottom + BAR_GAP
    barContainer.position.set(W / 2 - BAR_W / 2, barTop)
    loadingLabel.position.set(W / 2, barTop + BAR_H + 12)

    // 重绘轨道底色
    track.clear()
    track.beginFill(0xfff5e8)
    track.drawRoundedRect(0, 0, BAR_W, BAR_H, BAR_R)
    track.endFill()

    // 重绘黑色描边
    trackBorder.clear()
    trackBorder.lineStyle(2, 0x000000, 1)
    trackBorder.drawRoundedRect(0, 0, BAR_W, BAR_H, BAR_R)
  }
  updateLayout()

  // 绘制斜杠双色条纹进度填充
  const drawFill = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress))
    fill.clear()
    fillMask.clear()
    if (p <= 0) return

    const fillW = Math.max(Math.round(BAR_W * p), BAR_R * 2)

    // mask：当前进度对应的圆角矩形
    fillMask.beginFill(0xffffff)
    fillMask.drawRoundedRect(0, 0, fillW, BAR_H, BAR_R)
    fillMask.endFill()

    // 斜杠条纹（45度平行四边形，两色交替）
    const STRIPE = 16
    const color1 = 0xff8800  // 深橙
    const color2 = 0xffb040  // 浅橙
    let xOff = -BAR_H        // 从左侧斜角位置开始，确保起始边不缺角
    let idx = 0
    while (xOff < BAR_W + BAR_H) {
      fill.beginFill(idx % 2 === 0 ? color1 : color2)
      // 向右倾斜45度的平行四边形（斜杠"/"形条纹）
      fill.drawPolygon([
        xOff,               BAR_H,
        xOff + BAR_H,       0,
        xOff + BAR_H + STRIPE, 0,
        xOff + STRIPE,      BAR_H,
      ])
      fill.endFill()
      xOff += STRIPE * 2
      idx++
    }
  }
  drawFill(0)

  // 纹理就绪后更新角色尺寸和布局（保留水平镜像）
  const applyRoleSize = () => {
    const t = roleSpr.texture
    const tw = (t as any).orig?.width || t.width
    const th = (t as any).orig?.height || t.height
    if (tw > 0 && th > 0) {
      const s = ROLE_TARGET_W / tw
      roleSpr.scale.set(-s, s)  // x 为负数保持镜像
      roleH = Math.round(th * s)
      updateLayout()
    }
  }
  if (roleSpr.texture.valid) applyRoleSize()
  else roleSpr.texture.baseTexture.once('loaded', applyRoleSize)
  root.addChild(roleSpr)

  // ── 底部健康游戏忠告 ──
  const sys = wx.getSystemInfoSync()
  const bottomSafePx = sys.safeArea ? windowHeight - sys.safeArea.bottom : 0
  const noticeBottomY = H - Math.max(bottomSafePx + 16, 24)
  const noticeFontSize = Math.round(W * 0.028)
  const noticeLineH = Math.round(noticeFontSize * 1.5)

  const notice1 = new PIXI.Text('《健康游戏忠告》', {
    fontFamily: 'sans-serif',
    fontSize: noticeFontSize,
    fill: 0x222222,
    fontWeight: '500',
    align: 'center',
  })
  notice1.anchor.set(0.5, 1)
  notice1.position.set(W / 2, noticeBottomY - noticeLineH * 2)
  root.addChild(notice1)

  const notice2 = new PIXI.Text('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。', {
    fontFamily: 'sans-serif',
    fontSize: noticeFontSize,
    fill: 0x333333,
    align: 'center',
  })
  notice2.anchor.set(0.5, 1)
  notice2.position.set(W / 2, noticeBottomY - noticeLineH)
  root.addChild(notice2)

  const notice3 = new PIXI.Text('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。', {
    fontFamily: 'sans-serif',
    fontSize: noticeFontSize,
    fill: 0x333333,
    align: 'center',
  })
  notice3.anchor.set(0.5, 1)
  notice3.position.set(W / 2, noticeBottomY)
  root.addChild(notice3)

  // ── 颠颠弹跳动效：模拟骑车颠簸（幅度适度） ──
  let elapsed = 0
  _bounceTick = (delta: number) => {
    elapsed += delta * 0.06
    // 上下颠动（正弦波，幅度减小）
    roleSpr.y = ROLE_CENTER_Y + Math.sin(elapsed * 3) * 3
    // 轻微左右倾斜（相位差，更像骑车晃动，幅度减小）
    roleSpr.rotation = Math.sin(elapsed * 3 + 0.3) * 0.015
  }
  ticker.add(_bounceTick)

  stage.addChild(root)
  try {
    wx.hideLoading?.()
  } catch (_) {}

  // ROLE_SHEET_URL（capybara-idle.webp）不放入 Pixi Loader 预加载：
  // 真机上 wechat-adapter 对 webp 的 Image 实现可能不触发 error 事件，
  // 导致 loader.load() 回调永远不调用，卡死在 loading 界面。
  const allUrls = [
    ...(ASSET_URLS as unknown as string[]),
    ...(GAME_PRELOAD_URLS as unknown as string[])
  ]
  const toLoad = allUrls.filter(url => !loader.resources[url])

  const perFile = new Map<string, number>()
  for (const u of toLoad) perFile.set(u, 0)

  const applyAggregated = () => {
    if (toLoad.length === 0) {
      drawFill(1)
      return
    }
    let sum = 0
    for (const u of toLoad) sum += perFile.get(u) ?? 0
    drawFill(sum / toLoad.length)
  }

  const bindings: SignalBinding[] = []

  if (toLoad.length > 0) {
    bindings.push(
      loader.onStart.add(() => {
        for (const u of toLoad) perFile.set(u, 0)
        drawFill(0)
      })
    )

    for (const u of toLoad) {
      loader.add(u)
      const res = loader.resources[u]
      bindings.push(
        res.onProgress.add((_: unknown, pct: number) => {
          const prev = perFile.get(u) ?? 0
          perFile.set(u, Math.max(prev, pct))
          applyAggregated()
        })
      )
      bindings.push(
        res.onComplete.add(() => {
          perFile.set(u, 1)
          applyAggregated()
        })
      )
    }

    await new Promise<void>(resolve => {
      loader.load(() => {
        for (const u of toLoad) perFile.set(u, 1)
        drawFill(1)
        detachBindings(bindings)
        resolve()
      })
    })
  } else {
    // 资源已在缓存：先至少渲染一帧 0，再拉满，避免「从没见过空条」
    await tick()
    drawFill(1)
  }

  // 触发 capybara 贴图的异步加载，但不阻塞跳首页
  PIXI.BaseTexture.from(ROLE_SHEET_URL)

  // 额外延迟时间（毫秒），让 loading 页至少展示一段时间
  const EXTRA_DELAY_MS = 30000
  await new Promise<void>(resolve => setTimeout(resolve, EXTRA_DELAY_MS))

  navigator.go('home')
}

export function hide() {
  try {
    wx.hideLoading?.()
  } catch (_) {}
  if (_bounceTick) {
    ticker.remove(_bounceTick)
    _bounceTick = null
  }
  if (!root) return
  root.destroy({ children: true })
  root = null
}
