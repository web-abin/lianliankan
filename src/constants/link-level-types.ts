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
  /** 果冻覆盖的图块对数（必须为偶数，每对同类型），0 或不填时全部覆盖 */
  jellyCount?: number
}

export interface MainLineManifest {
  version: number
  levels: MainLineLevelEntry[]
}
