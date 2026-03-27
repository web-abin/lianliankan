/**
 * Matter.js 物理世界：边界、水果刚体、碰撞检测与合成
 */
import Matter from 'matter-js'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  DEATH_LINE_Y,
  WALL_MARGIN,
  GROUND_Y,
  MERGE_SPEED_THRESHOLD,
  FRUITS,
  getFruitById,
  getNextFruit,
  type FruitDef,
} from './config'

export type { FruitDef }

const GRAVITY = 0.8
const WALL_THICK = 20

export interface FruitBody {
  body: Matter.Body
  level: number
  fruitId: string
  /** 用于从列表中移除 */
  id: number
}

let engine: Matter.Engine
let world: Matter.World
let fruitIdGen = 0
const fruitBodies = new Map<Matter.Body, FruitBody>()

export function createEngine(): Matter.Engine {
  engine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY },
  })
  world = engine.world
  createBoundaries()
  return engine
}

function createBoundaries() {
  const Bodies = Matter.Bodies
  const left = Bodies.rectangle(
    -WALL_THICK / 2,
    WORLD_HEIGHT / 2,
    WALL_THICK,
    WORLD_HEIGHT + 100,
    { isStatic: true }
  )
  const right = Bodies.rectangle(
    WORLD_WIDTH + WALL_THICK / 2,
    WORLD_HEIGHT / 2,
    WALL_THICK,
    WORLD_HEIGHT + 100,
    { isStatic: true }
  )
  const ground = Bodies.rectangle(
    WORLD_WIDTH / 2,
    GROUND_Y + 60,
    WORLD_WIDTH + 200,
    120,
    { isStatic: true, restitution: 0.2 }
  )
  Matter.World.add(world, [left, right, ground])
}

export function getWorld(): Matter.World {
  return world
}

export function getEngine(): Matter.Engine {
  return engine
}

export function createFruitBody(x: number, y: number, def: FruitDef): FruitBody {
  const Bodies = Matter.Bodies
  const body = Bodies.circle(x, y, def.radius, {
    restitution: 0.3,
    friction: 0.4,
    frictionAir: 0.01,
    density: 0.002,
    label: 'fruit',
  })
  const fb: FruitBody = {
    body,
    level: def.level,
    fruitId: def.id,
    id: ++fruitIdGen,
  }
  fruitBodies.set(body, fb)
  Matter.World.add(world, body)
  return fb
}

export function removeFruitBody(fb: FruitBody): void {
  fruitBodies.delete(fb.body)
  Matter.World.remove(world, fb.body)
}

export function getAllFruitBodies(): FruitBody[] {
  return Array.from(fruitBodies.values())
}

export function getFruitCount(): number {
  return fruitBodies.size
}

/** 检测任意水果是否超过死亡线（用于每帧检测） */
export function isAnyFruitAboveDeathLine(): boolean {
  for (const fb of fruitBodies.values()) {
    const y = fb.body.position.y
    if (y < DEATH_LINE_Y) return true
  }
  return false
}

/** 设置碰撞回调：同等级两球碰撞且速度足够时合成，返回 [bodyA 对应水果, bodyB 对应水果, 是否应合成] */
export function onCollisionStart(cb: (fa: FruitBody, fb: FruitBody, merge: () => void) => void): () => void {
  const pairs: Set<string> = new Set()
  const key = (a: Matter.Body, b: Matter.Body) => {
    const idA = a.id
    const idB = b.id
    return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`
  }

  const handler = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair
      if (bodyA.label !== 'fruit' || bodyB.label !== 'fruit') continue
      const fa = fruitBodies.get(bodyA)
      const fb = fruitBodies.get(bodyB)
      if (!fa || !fb || fa.level !== fb.level) continue
      const k = key(bodyA, bodyB)
      if (pairs.has(k)) continue
      pairs.add(k)

      const speedA = Math.sqrt(bodyA.velocity.x ** 2 + bodyA.velocity.y ** 2)
      const speedB = Math.sqrt(bodyB.velocity.x ** 2 + bodyB.velocity.y ** 2)
      if (speedA < MERGE_SPEED_THRESHOLD && speedB < MERGE_SPEED_THRESHOLD) continue

      const def = getFruitById(fa.fruitId)
      if (!def || !def.nextId) continue

      const merge = () => {
        pairs.delete(k)
        removeFruitBody(fa)
        removeFruitBody(fb)
      }
      cb(fa, fb, merge)
    }
  }

  Matter.Events.on(engine, 'collisionStart', handler)
  return () => Matter.Events.off(engine, 'collisionStart', handler)
}

export function updateEngine(dt: number): void {
  Matter.Engine.update(engine, dt * 1000)
}

export function resetFruitBodies(): void {
  const list = Array.from(fruitBodies.values())
  for (const fb of list) {
    Matter.World.remove(world, fb.body)
    fruitBodies.delete(fb.body)
  }
}

export function getDeathLineY(): number {
  return DEATH_LINE_Y
}

export { FRUITS, getNextFruit, getFruitByLevel }
