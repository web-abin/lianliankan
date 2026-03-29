/**
 * 首页路由
 */
import * as PIXI from 'pixi.js'
import { stage, loader } from '~/core'
import * as homeUI from '~/ui/home'
import { ASSET_URLS } from '~/ui/home'

let root: PIXI.Container | null = null

async function preload() {
  const toLoad: string[] = (ASSET_URLS as unknown as string[]).filter(url => !loader.resources[url])
  // 预加载首页角色动画帧，避免进入场景后 AnimatedSprite 播放时出现白帧闪烁
  for (let i = 1; i <= 120; i++) {
    const n = String(i).padStart(3, '0')
    const url = `assets/animate/role_ascii/role-${n}.png`
    if (!loader.resources[url]) toLoad.push(url)
  }
  if (toLoad.length === 0) return
  await new Promise<void>(resolve => {
    // 忽略个别资源加载失败，尽量不阻塞首页进入
    const onError = () => {}
    ;(loader as any).onError?.add?.(onError)
    toLoad.forEach(url => loader.add(url))
    loader.load(() => {
      ;(loader as any).onError?.remove?.(onError)
      resolve()
    })
  })
}

function init() {
  root = homeUI.create(stage, {
    level: 1,
    coins: 9999,
    hearts: 10,
    maxHearts: 10,
  })
}

export async function show() {
  await preload()
  if (!root) init()
  if (root && !stage.children.includes(root)) {
    stage.addChild(root)
  }
}

export function hide() {
  if (root && stage.children.includes(root)) {
    stage.removeChild(root)
  }
}
