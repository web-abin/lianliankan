/**
 * 连连看消除特效：亮蓝半透明流光连线、爆裂环、star.png 星粒（含重力）、
 * 「好！」飘字、star2 弧形飞向进度条/宝箱并触发 HUD 脉冲。
 */
import * as PIXI from 'pixi.js'
import { FONT_FAMILY } from '~/constants/design-tokens'
import { playEliminationBurstSound } from '~/game/llk-sound'

/** 消除飘字：随机其一 */
const ELIMINATION_PRAISE_PHRASES = [
  '好耶！',
  '贴贴',
  '好',
  '棒',
  '酷',
  '漂亮',
  '精彩',
  '完美',
] as const

/** 爆裂环最大半径（设计坐标 px，与 80px 砖块一致的量级） */
const BURST_RING_MAX_RADIUS = 80

/** 主题粒子大小区间（设计坐标 px），最终大小 = MIN + rng * (MAX - MIN) */
const THEME_PARTICLE_SIZE_MIN = 60
const THEME_PARTICLE_SIZE_MAX = 90

/** 气泡粒子大小区间（设计坐标 px，圆形半径） */
const BUBBLE_SIZE_MIN = 12
const BUBBLE_SIZE_MAX = 30

/** 每个爆点生成的气泡数量占主题粒子数量的比例 */
const BUBBLE_RATIO = 0.4

/** 主题粒子总数量区间，最终数量 = MIN + rng * (MAX - MIN) */
const THEME_PARTICLE_COUNT_MIN = 6
const THEME_PARTICLE_COUNT_MAX = 12

/** 主题粒子爆散速度区间（设计坐标 px/s），速度越大扩散半径越大 */
const THEME_PARTICLE_SPEED_MIN = 130
const THEME_PARTICLE_SPEED_MAX = 340

/** 气泡粒子爆散速度区间（设计坐标 px/s） */
const BUBBLE_SPEED_MIN = 70
const BUBBLE_SPEED_MAX = 180

/** 各主题粒子贴图路径（默认主题作为兜底） */
const THEME_PARTICLE_URLS: Record<string, string[]> = {
  fruit: [
    'assets/theme/particle/flower1.png',
    'assets/theme/particle/flower2.png',
    'assets/theme/particle/flower3.png',
    'assets/theme/particle/flower4.png',
    'assets/theme/particle/grass1.png',
    'assets/theme/particle/grass2.png',
    'assets/theme/particle/grass3.png',
    'assets/theme/particle/grass4.png',
    'assets/theme/particle/star2.png',
  ],
  'music': [
    'assets/theme/particle/star2.png',
    'assets/theme/particle/yinfu1.png',
    'assets/theme/particle/yinfu2.png',
    'assets/theme/particle/yinfu3.png',
  ],
}
const DEFAULT_PARTICLE_URLS = THEME_PARTICLE_URLS.fruit

function animate(
  durationMs: number,
  onUpdate: (t: number) => void,
  onComplete?: () => void
): void {
  const start = Date.now()
  const tick = () => {
    const t = Math.min(1, (Date.now() - start) / durationMs)
    onUpdate(t)
    if (t < 1) requestAnimationFrame(tick)
    else onComplete?.()
  }
  requestAnimationFrame(tick)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}
function cubicBezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function mulberry32(seed: number) {
  return (): number => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Point2D = { x: number; y: number }

function pointAlongPath(
  pts: Point2D[],
  segLens: number[],
  dist: number
): { p: Point2D; ang: number } {
  if (pts.length < 2 || segLens.length === 0) {
    return { p: pts[0] ?? { x: 0, y: 0 }, ang: 0 }
  }
  let cum = 0
  for (let i = 0; i < segLens.length; i++) {
    const L = segLens[i]
    if (cum + L >= dist) {
      const t = L <= 0 ? 0 : (dist - cum) / L
      const x = pts[i].x + (pts[i + 1].x - pts[i].x) * t
      const y = pts[i].y + (pts[i + 1].y - pts[i].y) * t
      const ang = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x)
      return { p: { x, y }, ang }
    }
    cum += L
  }
  const last = pts.length - 1
  const ang = Math.atan2(pts[last].y - pts[last - 1].y, pts[last].x - pts[last - 1].x)
  return { p: { ...pts[last] }, ang }
}

/** 亮蓝半透明光束 + 沿路径移动的流光高亮 */
function drawBlueFlowBeam(
  g: PIXI.Graphics,
  pts: Point2D[],
  segLens: number[],
  revealLen: number,
  alpha: number,
  flowAlong: number,
  totalLen: number
): void {
  if (pts.length < 2 || revealLen <= 0 || alpha <= 0) return

  const layers = [
    { w: 18, color: 0x0088ff, a: 0.14 * alpha },
    { w: 11, color: 0x33aaff, a: 0.32 * alpha },
    { w: 5, color: 0x88ddff, a: 0.55 * alpha },
    { w: 2.2, color: 0xe8f8ff, a: 0.85 * alpha },
  ]

  for (const layer of layers) {
    g.lineStyle(layer.w, layer.color, layer.a)
    g.moveTo(pts[0].x, pts[0].y)
    let cum = 0
    for (let i = 0; i < segLens.length; i++) {
      const rem = revealLen - cum
      if (rem <= 0) break
      if (rem >= segLens[i]) {
        g.lineTo(pts[i + 1].x, pts[i + 1].y)
        cum += segLens[i]
      } else {
        const frac = rem / segLens[i]
        g.lineTo(
          pts[i].x + (pts[i + 1].x - pts[i].x) * frac,
          pts[i].y + (pts[i + 1].y - pts[i].y) * frac
        )
        break
      }
    }
  }

  // 流光点：沿已揭示路径游走的亮核
  if (totalLen > 0 && revealLen > totalLen * 0.2) {
    const wrap = flowAlong % totalLen
    const { p, ang } = pointAlongPath(pts, segLens, Math.min(wrap, revealLen))
    const pulse = 0.75 + 0.25 * Math.sin(flowAlong * 0.42)
    g.lineStyle(0)
    g.beginFill(0xffffff, 0.72 * alpha * pulse)
    g.drawEllipse(p.x, p.y, 9, 5)
    g.endFill()
    g.beginFill(0xaef0ff, 0.45 * alpha * pulse)
    const lx = p.x + Math.cos(ang) * 3
    const ly = p.y + Math.sin(ang) * 3
    g.drawEllipse(lx, ly, 5, 3)
    g.endFill()
  }
}

function pathMidpoint(pts: Point2D[], segLens: number[], totalLen: number): Point2D {
  if (pts.length === 0) return { x: 0, y: 0 }
  if (pts.length === 1 || totalLen <= 0) return pts[0]
  const half = totalLen * 0.5
  let cum = 0
  for (let i = 0; i < segLens.length; i++) {
    if (cum + segLens[i] >= half) {
      const t = (half - cum) / segLens[i]
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
      }
    }
    cum += segLens[i]
  }
  return pts[pts.length - 1]
}

export interface EliminationEffectOptions {
  fxLayer: PIXI.Container
  path: Array<{ r: number; c: number }>
  posA: Point2D
  posB: Point2D
  cellW: number
  cellH: number
  gridOriginX: number
  gridOriginY: number
  colPad: number
  rowPad: number
  boardRows: number
  boardCols: number
  progressBarTarget: PIXI.Container
  onProgressPulse?: () => void
  /** 当前主题 ID，用于选择粒子样式 */
  themeId?: string
}

export function playEliminationEffect(opts: EliminationEffectOptions): void {
  const {
    fxLayer,
    path,
    posA,
    posB,
    cellH,
    cellW,
    gridOriginX,
    gridOriginY,
    colPad,
    rowPad,
    boardRows,
    boardCols,
    progressBarTarget,
    onProgressPulse,
  } = opts

  const rng = mulberry32(Date.now() & 0xffff)
  const star2Tex = PIXI.Texture.from('assets/common/star2.png')

  // 主题粒子贴图
  const particleUrls = THEME_PARTICLE_URLS[opts.themeId ?? 'fruit'] ?? DEFAULT_PARTICLE_URLS
  const particleTexes = particleUrls.map(u => PIXI.Texture.from(u))

  const EDGE_MARGIN = 16
  const pts: Point2D[] = path.map(({ r, c }) => {
    let x = gridOriginX + c * (cellW + colPad) + cellW / 2
    let y = gridOriginY + r * (cellH + rowPad) + cellH / 2
    if (r < 0) y = gridOriginY - EDGE_MARGIN
    if (r >= boardRows) y = gridOriginY + boardRows * (cellH + rowPad) - rowPad + EDGE_MARGIN
    if (c < 0) x = gridOriginX - EDGE_MARGIN
    if (c >= boardCols) x = gridOriginX + boardCols * (cellW + colPad) - colPad + EDGE_MARGIN
    return { x, y }
  })
  const segLens: number[] = []
  let totalLen = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x
    const dy = pts[i].y - pts[i - 1].y
    const l = Math.sqrt(dx * dx + dy * dy)
    segLens.push(l)
    totalLen += l
  }

  const midForFx =
    pts.length >= 2 && totalLen > 0
      ? pathMidpoint(pts, segLens, totalLen)
      : { x: (posA.x + posB.x) / 2, y: (posA.y + posB.y) / 2 }

  const BURST_DELAY_MS = 215

  // 连线生长 + 流光（亮蓝半透明）
  if (pts.length >= 2) {
    const beam = new PIXI.Graphics()
    fxLayer.addChild(beam)
    let flowAcc = 0

    animate(
      220,
      t => {
        const revealLen = totalLen * easeOutCubic(t)
        flowAcc += 18
        beam.clear()
        drawBlueFlowBeam(beam, pts, segLens, revealLen, 1, flowAcc, totalLen)
      },
      () => {
        const flowStart = Date.now()
        const flowTick = () => {
          const elapsed = Date.now() - flowStart
          if (elapsed >= 170) {
            animate(
              120,
              t2 => {
                flowAcc += 22
                beam.clear()
                const pulse = 0.88 + 0.12 * Math.sin(flowAcc * 0.2)
                drawBlueFlowBeam(
                  beam,
                  pts,
                  segLens,
                  totalLen,
                  (1 - t2) * pulse,
                  flowAcc,
                  totalLen
                )
              },
              () => {
                if (beam.parent) beam.parent.removeChild(beam)
                beam.destroy()
              }
            )
            return
          }
          flowAcc += 24
          beam.clear()
          const pulse = 0.86 + 0.14 * Math.sin(flowAcc * 0.24)
          drawBlueFlowBeam(beam, pts, segLens, totalLen, pulse, flowAcc, totalLen)
          requestAnimationFrame(flowTick)
        }
        requestAnimationFrame(flowTick)
      }
    )
  }

  // 光束触达后：爆裂环 + 星粒（重力）+ 飘字（与两砖消除节奏对齐）
  setTimeout(() => {
    playEliminationBurstSound()

    const spawnBurstRing = (pos: Point2D) => {
      const ring = new PIXI.Graphics()
      ring.position.set(pos.x, pos.y)
      ring.blendMode = PIXI.BLEND_MODES.ADD
      fxLayer.addChild(ring)
      animate(
        260,
        t => {
          const e = easeOutCubic(t)
          const r = 6 + (BURST_RING_MAX_RADIUS - 6) * e
          const a = (1 - t) * 0.88
          ring.clear()
          // 黄色发光感：外圈柔、内圈亮
          ring.lineStyle(5, 0xffee88, a * 0.35)
          ring.drawCircle(0, 0, Math.max(2, r))
          ring.lineStyle(2.5, 0xffdd44, a * 0.75)
          ring.drawCircle(0, 0, Math.max(2, r * 0.94))
          ring.lineStyle(1.2, 0xffffff, a * 0.55)
          ring.drawCircle(0, 0, Math.max(1, r * 0.88))
        },
        () => {
          if (ring.parent) ring.parent.removeChild(ring)
          ring.destroy()
        }
      )
    }

    for (const pos of [posA, posB]) spawnBurstRing(pos)

    const nStars = THEME_PARTICLE_COUNT_MIN + Math.floor(rng() * (THEME_PARTICLE_COUNT_MAX - THEME_PARTICLE_COUNT_MIN + 1))
    const starsA = Math.ceil(nStars / 2)
    const starsB = nStars - starsA
    const gAccel = 520

    // 粒子
    // 主题粒子爆散
    const spawnStarBurst = (pos: Point2D, starCount: number) => {
      for (let i = 0; i < starCount; i++) {
        const tex = particleTexes[((rng() * particleTexes.length) | 0) % particleTexes.length]
        const spr = new PIXI.Sprite(tex)
        spr.anchor.set(0.5, 0.5)
        spr.position.set(pos.x, pos.y)
        spr.tint = 0xffffff
        spr.blendMode = PIXI.BLEND_MODES.NORMAL
        const px = THEME_PARTICLE_SIZE_MIN + rng() * (THEME_PARTICLE_SIZE_MAX - THEME_PARTICLE_SIZE_MIN)
        const baseW = tex.width || 32
        spr.scale.set(px / baseW)
        fxLayer.addChild(spr)

        const angle = rng() * Math.PI * 2
        const speed = THEME_PARTICLE_SPEED_MIN + rng() * (THEME_PARTICLE_SPEED_MAX - THEME_PARTICLE_SPEED_MIN)
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed - 40
        const lifespan = 380 + rng() * 140
        const spin = (rng() - 0.5) * 0.22
        const durationSec = lifespan / 1000

        animate(
          lifespan,
          t => {
            const elapsed = t * durationSec
            spr.x = pos.x + vx * elapsed
            spr.y = pos.y + vy * elapsed + 0.5 * gAccel * elapsed * elapsed
            spr.alpha = 1 - t
            const sc = (1 - 0.88 * t) * (px / baseW)
            spr.scale.set(sc)
            spr.rotation += spin
          },
          () => {
            if (spr.parent) spr.parent.removeChild(spr)
            spr.destroy()
          }
        )
      }
    }

    spawnStarBurst(posA, starsA)
    spawnStarBurst(posB, starsB)

    // 通用气泡粒子（所有主题都会有，圆形半透明气泡）
    const bubbleColors = [0xffffff, 0xffeedd, 0xddf4ff, 0xffe8f8, 0xeeffdd, 0xfff8cc]
    const spawnBubbles = (pos: Point2D, count: number) => {
      for (let i = 0; i < count; i++) {
        const bubble = new PIXI.Graphics()
        const radius = BUBBLE_SIZE_MIN + rng() * (BUBBLE_SIZE_MAX - BUBBLE_SIZE_MIN)
        const color = bubbleColors[((rng() * bubbleColors.length) | 0) % bubbleColors.length]
        // 气泡本体：半透明圆 + 高光
        bubble.beginFill(color, 0.45 + rng() * 0.25)
        bubble.drawCircle(0, 0, radius)
        bubble.endFill()
        // 高光点
        bubble.beginFill(0xffffff, 0.6)
        bubble.drawCircle(-radius * 0.28, -radius * 0.28, radius * 0.3)
        bubble.endFill()

        bubble.position.set(pos.x, pos.y)
        fxLayer.addChild(bubble)

        const angle = rng() * Math.PI * 2
        const speed = BUBBLE_SPEED_MIN + rng() * (BUBBLE_SPEED_MAX - BUBBLE_SPEED_MIN)
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed - 55
        const lifespan = 450 + rng() * 200
        const durationSec = lifespan / 1000

        animate(
          lifespan,
          t => {
            const elapsed = t * durationSec
            bubble.x = pos.x + vx * elapsed
            bubble.y = pos.y + vy * elapsed + 0.5 * gAccel * 0.35 * elapsed * elapsed
            bubble.alpha = (1 - t) * 0.85
            bubble.scale.set(1 - 0.5 * t)
          },
          () => {
            if (bubble.parent) bubble.parent.removeChild(bubble)
            bubble.destroy()
          }
        )
      }
    }

    const bubblesA = Math.ceil(starsA * BUBBLE_RATIO)
    const bubblesB = Math.ceil(starsB * BUBBLE_RATIO)
    spawnBubbles(posA, bubblesA)
    spawnBubbles(posB, bubblesB)

    // 消除飘字：随机赞美语，缩放弹出 + 上移淡出
    const phrase =
      ELIMINATION_PRAISE_PHRASES[
        Math.floor(rng() * ELIMINATION_PRAISE_PHRASES.length)
      ]
    const nice = new PIXI.Text(phrase, {
      fontFamily: FONT_FAMILY,
      fontSize: phrase.length <= 2 ? 40 : 34,
      fill: 0xffee66,
      fontWeight: '900',
      stroke: 0x5c3d1e,
      strokeThickness: 4,
    })
    nice.anchor.set(0.5, 0.5)
    nice.position.set(midForFx.x, midForFx.y)
    fxLayer.addChild(nice)

    animate(
      620,
      t => {
        const pop = t < 0.22 ? easeOutCubic(t / 0.22) : 1
        nice.scale.set(0.35 + 0.72 * pop)
        nice.y = midForFx.y - 62 * easeOutCubic(t)
        if (t < 0.5) nice.alpha = 1
        else nice.alpha = 1 - (t - 0.5) / 0.5
      },
      () => {
        if (nice.parent) nice.parent.removeChild(nice)
        nice.destroy()
      }
    )
  }, BURST_DELAY_MS)

  // 收集星：略晚于爆裂，沿弧线飞向进度条目标（宝箱）
  setTimeout(() => {
    const gp = progressBarTarget.getGlobalPosition(new PIXI.Point())
    const targetLocal = fxLayer.toLocal(gp)

    const cpX = midForFx.x + (targetLocal.x - midForFx.x) * 0.38
    const cpY = Math.min(midForFx.y, targetLocal.y) - 120

    const collStar = new PIXI.Sprite(star2Tex)
    collStar.anchor.set(0.5, 0.5)
    collStar.position.set(midForFx.x, midForFx.y)
    collStar.tint = 0xffffff
    collStar.blendMode = PIXI.BLEND_MODES.ADD
    const tw = star2Tex.width || 48
    collStar.scale.set((cellW * 0.48) / tw)
    collStar.alpha = 0
    fxLayer.addChild(collStar)

    animate(
      150,
      t => {
        collStar.alpha = t
        const pop = t < 0.42 ? 0.32 + (t / 0.42) * 0.78 : 1.08 - (t - 0.42) / 0.58 * 0.12
        collStar.scale.set(((cellW * 0.48) / tw) * pop)
      },
      () => {
        animate(
          780,
          t => {
            const e = easeInExpo(t)
            const bx = cubicBezierPoint(e, midForFx.x, cpX, cpX, targetLocal.x)
            const by = cubicBezierPoint(e, midForFx.y, cpY, cpY, targetLocal.y)
            collStar.position.set(bx, by)
            collStar.rotation += 0.1
            if (t < 0.74) {
              collStar.alpha = 1
            } else {
              collStar.alpha = 1 - (t - 0.74) / 0.26
            }
            const base = (cellW * 0.42) / tw
            if (t < 0.42) {
              collStar.scale.set(base * (1 + 0.18 * (t / 0.42)))
            } else {
              collStar.scale.set(base * (1.18 - ((t - 0.42) / 0.58) * 0.38))
            }
          },
          () => {
            if (collStar.parent) collStar.parent.removeChild(collStar)
            collStar.destroy()
            onProgressPulse?.()
          }
        )
      }
    )
  }, BURST_DELAY_MS + 40)
}
