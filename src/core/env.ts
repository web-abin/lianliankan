import '@iro/wechat-adapter'
import * as PIXI from 'pixi.js'
import {install} from '@pixi/unsafe-eval'
// @ts-expect-error
import Interaction from '@iro/interaction'

// @iro/wechat-adapter 的 XHR shim 缺少 abort()，PIXI loader 在请求出错时会调用它
// 补丁：若不存在则注入一个空实现，防止 "this.xhr.abort is not a function" 崩溃
if (
  typeof XMLHttpRequest !== 'undefined' &&
  typeof (XMLHttpRequest.prototype as any).abort !== 'function'
) {
  ;(XMLHttpRequest.prototype as any).abort = function () {}
}

PIXI.settings.SORTABLE_CHILDREN = true
PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR

install(PIXI)

// pixi.js@6
// remove default interaction extensions
for (const x in PIXI.extensions._queue) {
  // @ts-expect-error
  for (const ext of PIXI.extensions._queue[x]) {
    if (ext.name === 'interaction') {
      PIXI.extensions.remove(ext)
    }
  }
}

// add @iro/interaction
PIXI.extensions.add(
  {
    name: 'interaction',
    ref: Interaction,
    type: [PIXI.ExtensionType.RendererPlugin, PIXI.ExtensionType.CanvasRendererPlugin]
  }
)
