/**
 * 《合成大榴莲》水果配置表：等级、半径、得分、下一级 ID
 */
export interface FruitDef {
  id: string
  name: string
  level: number
  /** 物理/显示半径（逻辑像素） */
  radius: number
  /** 合成该等级获得的分数 */
  score: number
  /** 合成后的下一级水果 id，最高级为 null */
  nextId: string | null
  /** 占位纹理 key，后续可替换为真实资源 */
  textureKey: string
  /** 用于占位绘制的颜色（Pixi fill） */
  color: number
}

export const FRUITS: FruitDef[] = [
  { id: 'grape', name: '葡萄', level: 1, radius: 22, score: 1, nextId: 'cherry', textureKey: 'fruit_1', color: 0x9b59b6 },
  { id: 'cherry', name: '樱桃', level: 2, radius: 28, score: 2, nextId: 'orange', textureKey: 'fruit_2', color: 0xe74c3c },
  { id: 'orange', name: '橘子', level: 3, radius: 36, score: 5, nextId: 'lemon', textureKey: 'fruit_3', color: 0xf39c12 },
  { id: 'lemon', name: '柠檬', level: 4, radius: 45, score: 8, nextId: 'kiwi', textureKey: 'fruit_4', color: 0xf1c40f },
  { id: 'kiwi', name: '猕猴桃', level: 5, radius: 56, score: 12, nextId: 'tomato', textureKey: 'fruit_5', color: 0x27ae60 },
  { id: 'tomato', name: '番茄', level: 6, radius: 68, score: 18, nextId: 'peach', textureKey: 'fruit_6', color: 0xe74c3c },
  { id: 'peach', name: '桃子', level: 7, radius: 82, score: 25, nextId: 'pineapple', textureKey: 'fruit_7', color: 0xf5b7b1 },
  { id: 'pineapple', name: '菠萝', level: 8, radius: 98, score: 35, nextId: 'coconut', textureKey: 'fruit_8', color: 0xf4d03f },
  { id: 'coconut', name: '椰子', level: 9, radius: 116, score: 50, nextId: 'durian', textureKey: 'fruit_9', color: 0xd5d8dc },
  { id: 'durian', name: '大榴莲', level: 10, radius: 138, score: 100, nextId: null, textureKey: 'fruit_10', color: 0x7d3c98 },
]

export const WORLD_WIDTH = 750
export const WORLD_HEIGHT = 1334
/** 死亡线 Y：水果超过此线并稳定则游戏结束 */
export const DEATH_LINE_Y = 260
/** 游戏区域左右边距 */
export const WALL_MARGIN = 24
/** 地面 Y */
export const GROUND_Y = 1280
/** 初始可生成的最大水果等级（随进度可提高） */
export const INITIAL_MAX_LEVEL = 3
/** 合成判定：两球相对速度低于此值不合成（避免误触） */
export const MERGE_SPEED_THRESHOLD = 2
/** 同时存在水果数量上限 */
export const MAX_FRUITS = 38

export function getFruitById(id: string): FruitDef | undefined {
  return FRUITS.find(f => f.id === id)
}

export function getFruitByLevel(level: number): FruitDef | undefined {
  return FRUITS.find(f => f.level === level)
}

export function getNextFruit(def: FruitDef): FruitDef | undefined {
  return def.nextId ? getFruitById(def.nextId) : undefined
}
