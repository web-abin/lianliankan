/**
 * Cannon Strike 关卡配置类型（依据 .a-docs/02-logic-spec.md §5.1）
 */

export interface LevelData {
  version: number
  levelId: string
  worldSize: { width: number; height: number }
  cannonPosition: { x: number; y: number }
  targets: TargetDef[]
  obstacles: ObstacleDef[]
  par?: number
}

export interface TargetDef {
  id: string
  type: 'default' | 'special' | 'bonus'
  position: { x: number; y: number }
  radius: number
  score: number
  health?: number
}

export interface ObstacleDef {
  id: string
  shape: 'rect' | 'circle'
  position: { x: number; y: number }
  size?: { width: number; height: number }
  radius?: number
  bounce?: boolean
}
