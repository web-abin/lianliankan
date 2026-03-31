/**
 * 首页路由
 */
import * as PIXI from 'pixi.js'
import { stage, loader } from '~/core'
import * as homeUI from '~/ui/home'
import { ASSET_URLS } from '~/ui/home'
import * as navigator from '~/navigator'

let root: PIXI.Container | null = null

async function preload() {
  const toLoad: string[] = (ASSET_URLS as unknown as string[]).filter(url => !loader.resources[url])
  if (toLoad.length === 0) return
  await new Promise<void>(resolve => {
    toLoad.forEach(url => loader.add(url))
    loader.load(() => resolve())
  })
}

function init() {
  root = homeUI.create(stage, {
    level: 1,
    coins: 9999,
    hearts: 10,
    maxHearts: 10,
    onStart: () => navigator.go('game', { level: 1 })
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
