/**
 * Cannon Strike Design Tokens（依据 .a-docs/01-design-tokens.md）
 * 逆向时可将示例值替换为实测值。
 */

// ---------- §1 物理与碰撞 ----------
export const GRAVITY_Y = 980
export const CANNON_BALL_PHYSICS_RADIUS = 12
export const CANNON_BALL_RENDER_RADIUS = 14
export const CANNON_BALL_INITIAL_SPEED_MIN = 400
export const CANNON_BALL_INITIAL_SPEED_MAX = 900
export const GROUND_BOUNCE_COEF = 0.6
export const MAX_BOUNCE_COUNT = 3

// ---------- §2 目标与障碍颜色（十六进制） ----------
export const TARGET_COLOR_DEFAULT = '#FFD700'
export const TARGET_COLOR_SPECIAL = '#FF6B6B'
export const TARGET_COLOR_BONUS = '#4ECDC4'
export const OBSTACLE_COLOR_RECT = '#8B4513'
export const OBSTACLE_COLOR_CIRCLE = '#696969'

export const OBSTACLE_SHAPE_RECT = 'rect' as const
export const OBSTACLE_SHAPE_CIRCLE = 'circle' as const

/** 将 hex 转为 Pixi 可用的 number */
export function hexToNumber(hex: string): number {
  return parseInt(hex.slice(1), 16)
}

// ---------- §3 UI ----------
export const FONT_SIZE_TITLE = 32
export const FONT_SIZE_SCORE = 24
export const FONT_SIZE_BUTTON = 28
export const FONT_FAMILY = 'sans-serif'
export const UI_SAFE_MARGIN_X = 24
export const UI_SAFE_MARGIN_Y = 48
export const COLOR_UI_TEXT = '#FFFFFF'
export const COLOR_UI_BG = '#161a23'

// ---------- §4 相机/世界 ----------
export const WORLD_WIDTH = 750
export const WORLD_HEIGHT = 1334
export const CANNON_POSITION_X = 80
export const CANNON_POSITION_Y = 1200
export const GROUND_Y = 1280
