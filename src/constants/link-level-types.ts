/**
 * 连连看主线关卡配置
 */

export type GravityDir = 'none' | 'left' | 'right' | 'up' | 'down'

export interface MainLineLevelEntry {
  id: string
  cols: number
  rows: number
  /** 图案种类数（≤ 当前主题图集帧数） */
  kindCount: number
  /** 重力方向，默认无 */
  gravity?: GravityDir
  /** 是否启用果冻层机制 */
  jelly?: boolean
}

export interface MainLineManifest {
  version: number
  levels: MainLineLevelEntry[]
}
