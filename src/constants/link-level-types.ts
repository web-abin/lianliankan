/**
 * 连连看主线关卡配置（依据 OpenSpec llk-gameplay-core：主线 JSON 仅 1…L 条）
 */

export type GravityDir = 'none' | 'left' | 'right' | 'up' | 'down'

export interface MainLineLevelEntry {
  id: string
  cols: number
  rows: number
  /** 图案种类数（≤ 当前主题图集帧数） */
  kindCount: number
  gravity?: GravityDir
  fog?: boolean
  flip?: boolean
}

export interface MainLineManifest {
  version: number
  levels: MainLineLevelEntry[]
}
