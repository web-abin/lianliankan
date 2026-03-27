# Pixi.js 开发微信小游戏 — Agent 注意事项

本项目使用 **pixi.js@6 + matter-js + vite** 开发微信小游戏（非 H5）。微信小游戏环境与浏览器差异巨大，以下注意点必须严格遵守，否则会在真机/开发者工具上报错。

---

## 1. 入口初始化时序

**问题**：在 `game.js` 的同步顶层代码中访问 `wx` API 或 `canvas` 全局变量，会因 `__wxConfig.useWebWorker` 尚未赋值而崩溃。

**正确做法**（见 `src/app.ts`）：
- 所有逻辑必须延迟到**至少两个 requestAnimationFrame** 之后执行。
- 若 `requestAnimationFrame` 不可用，则用 `setTimeout(init, 50)` 兜底。
- 动态 `import('./bootstrap')` 也必须放在延迟函数内部。

```ts
// 正确
function deferInit() {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => requestAnimationFrame(init))
  } else {
    setTimeout(init, 50)
  }
}
setTimeout(deferInit, 0)

// 错误：顶层直接调用
wx.getSystemInfoSync() // ❌ 会崩溃
```

---

## 2. 必须引入 wechat-adapter 和 unsafe-eval

**问题**：微信小游戏没有 DOM/window/document，pixi.js 在初始化时依赖这些 Web API；同时微信禁止 `eval`，pixi 内部的 shader 编译用到了 `new Function`。

**正确做法**（见 `src/core/env.ts`）：
```ts
import '@iro/wechat-adapter'          // 必须第一行，模拟 DOM 环境
import { install } from '@pixi/unsafe-eval'
install(PIXI)                          // 替换掉 pixi 内部用到 eval 的代码
```

- `@iro/wechat-adapter` 和 `@pixi/unsafe-eval` 都是 **dependencies**，不是 devDependencies。
- `env.ts` 必须在 `core/index.ts` 中作为第一个 import 执行（`import './env'`）。

---

## 3. 必须替换 Interaction 插件

**问题**：pixi 默认的 interaction 插件依赖 DOM 事件（`addEventListener`），在微信小游戏中不可用。

**正确做法**（见 `src/core/env.ts`）：
```ts
import Interaction from '@iro/interaction'

// 移除 pixi 默认 interaction
for (const x in PIXI.extensions._queue) {
  for (const ext of (PIXI.extensions._queue as any)[x]) {
    if (ext.name === 'interaction') PIXI.extensions.remove(ext)
  }
}

// 注册微信专用 interaction
PIXI.extensions.add({
  name: 'interaction',
  ref: Interaction,
  type: [PIXI.ExtensionType.RendererPlugin, PIXI.ExtensionType.CanvasRendererPlugin]
})
```

---

## 4. 坐标映射必须直传

**问题**：微信触摸坐标已经是正确的画布物理坐标，无需任何变换。如果用 pixi 默认的 DOM 偏移计算，坐标会错位。

**正确做法**（见 `src/core/index.ts`）：
```ts
renderer.plugins.interaction.mapPositionToPoint = (point: PIXI.Point, x: number, y: number) => {
  point.set(x, y)  // 直接赋值，不做任何变换
}
```

---

## 5. canvas 是全局变量，不需要 DOM 查询

**问题**：在浏览器中需要 `document.getElementById('canvas')`，微信小游戏直接有全局 `canvas` 变量。

**正确做法**（见 `src/core/index.ts` 和 `src/type.d.ts`）：
```ts
// type.d.ts 中声明
declare const canvas: HTMLCanvasElement

// 直接使用
const renderer = new PIXI.Renderer({
  view: canvas,   // 全局变量，无需 document.querySelector
  // ...
})
```

---

## 6. 必须销毁 accessibility 插件

**问题**：pixi 默认注册 accessibility 插件，会尝试操作 DOM，在微信小游戏中会报错。

**正确做法**（见 `src/core/index.ts`）：
```ts
renderer.plugins.accessibility.destroy()
```
> 必须在 Renderer 创建后立即调用。

---

## 7. Shader 只能使用 GLSL 100

**问题**：微信小游戏的 WebGL 环境不支持 GLSL 300 es，pixi 某些内置 shader（如 TilingSprite）会在新版 pixi 中升级到 300，导致报错。

**正确做法**（见 `src/core/shader.ts` 和 `src/core/index.ts`）：
- 自定义 shader 必须使用 `#version 100`，不写版本号默认也是 100。
- TilingSprite 的 shader 需要手动替换（参考 [pixi#10443](https://github.com/pixijs/pixijs/pull/10443)）：
```ts
renderer.plugins.tilingSprite.shader = PIXI.Shader.from(vert, frag, {
  globals: renderer.globalUniforms
})
```

---

## 8. 构建配置要求（vite.config.ts）

**问题**：微信小游戏不支持 ES Module、动态 import，且运行时没有 `process.env`。

**必须配置项**（见 `vite.config.ts`）：
```ts
build: {
  lib: {
    formats: ['cjs'],             // 必须 CJS，不能 ESM
    fileName: () => 'game.js'     // 固定输出文件名
  },
  rollupOptions: {
    output: {
      inlineDynamicImports: true  // 必须内联所有动态 import
    }
  }
}
// 插件：必须替换 process.env.NODE_ENV
replace({ 'process.env.NODE_ENV': JSON.stringify('production') })
```

- 微信开发者工具上传代码时，必须开启 **"将JS编译成ES5"** 选项。
- 开发调试时运行 `pnpm dev`（vite build -w），将 `dist/` 目录导入微信开发者工具。

---

## 9. PIXI 全局设置

**必须在 env.ts 中设置**（见 `src/core/env.ts`）：
```ts
PIXI.settings.SORTABLE_CHILDREN = true
PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL   // 强制 WebGL，不走 Canvas2D 降级
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR
```

---

## 10. 分辨率与屏幕尺寸

### 获取屏幕宽高（业务代码请复用 core 导出）

微信侧以 **`wx.getSystemInfoSync()`** 的 **`windowWidth` / `windowHeight`** 为准（与开发者工具/真机可视区域一致）。项目在 `src/core/index.ts` 启动时读取一次，并 **导出同名常量**，其它模块不要自己再写一套魔法数字或重复调用（除非你做横竖屏切换并监听 `wx.onWindowResize` 再更新）。

```ts
import { windowWidth, windowHeight } from '~/core'

// 与画布对齐的全屏背景、根容器贴边等，用 windowWidth / windowHeight
const sw = windowWidth
const sh = windowHeight
```

- **`renderer.screen.width` / `height`**：与上述值一致（Renderer 即用 `windowWidth`/`windowHeight` 创建）。
- **`store.mem.screen.w` / `h`**：来自 `renderer.screen`，与 `windowWidth`/`windowHeight` 一致。
- **`store.mem.screen.rw` / `rh`**：与 `getSystemInfoSync()` 同步写入，与 `windowWidth`/`windowHeight` 相同，便于 MobX 里读。

### 全屏页逻辑高度与顶部安全区（首页等）

宽仍按 **750** 设计基准；**高**不要写死 1334，应按当前屏**宽高比**算出与屏幕一致的逻辑高度，避免上下黑边与真实屏不贴合：

- **`DESIGN_REF_W`**：固定 `750`（`src/core/index.ts` 导出）。
- **`designLayoutH`**：`Math.round(750 * windowHeight / windowWidth)`，与屏同比例。
- **`safeAreaTopPx`**：`getSystemInfoSync()` 的 `safeArea.top`（若无则用 `statusBarHeight`），单位 px；用于把 HUD 压到刘海/状态栏下方。

首页状态栏在设计坐标里的顶边示例：`STATUS_Y = (safeAreaTopPx + 10) / dr`（`+10` 为额外间距；`dr` 为该页自己的缩放，见 `src/ui/home.ts`）。

**注意**：`store.mem.screen.dr` 仍按 **750×1334** 计算，供关卡等沿用原稿比例；全屏首页使用 **本地** `dr = min(sw/750, sh/designLayoutH)`，与 `designLayoutH` 一致。

### Renderer 与缩放

**正确做法**（见 `src/core/index.ts`）：
```ts
const sys = wx.getSystemInfoSync()
const { devicePixelRatio, windowWidth, windowHeight } = sys
// safeAreaTopPx = sys.safeArea?.top ?? sys.statusBarHeight ?? 0  // 已导出 safeAreaTopPx

const renderer = new PIXI.Renderer({
  width: windowWidth,
  height: windowHeight,
  resolution: devicePixelRatio,  // 传入 DPR 保证高清屏清晰
  // ...
})
```

- 关卡等仍可按 **750×1334** 作为世界/弹窗设计稿。
- 全局 `store.mem.screen.dr`：`dr = Math.min(rendererWidth / 750, rendererHeight / 1334)`（见 `src/core/index.ts`）。
- UI Container 通过 `container.scale.set(dr)` 适配不同屏幕。

---

## 11. 音频：只能用 wx.createInnerAudioContext

**问题**：微信小游戏不支持 Web Audio API（`new AudioContext()`）直接播放，需使用微信专有 API。

**正确做法**（见 `src/core/sound.ts`）：
```ts
const ctx = wx.createInnerAudioContext({ useWebAudioImplement: true })
ctx.src = `${wx.env.USER_DATA_PATH}/sound.mp3`  // 必须是用户数据目录路径
ctx.play()
ctx.onEnded(() => ctx.destroy())   // 播完立刻销毁，避免内存泄漏
```

- BGM（循环背景音乐）使用 `useWebAudioImplement: false` 以获得更好兼容性。
- 音频文件需先下载到 `wx.env.USER_DATA_PATH`，不能直接使用网络 URL 作为 src。

---

## 12. 交互事件：interactive 写法

**问题**：pixi@6 中 `Container` 类型定义可能不包含 `interactive`/`interactiveChildren` 字段，TypeScript 会报错。

**正确做法**（见多处 UI 代码）：
```ts
// 方式 1：类型断言（适用于 Container）
;(root as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean }).interactive = true

// 方式 2：Graphics 自带 interactive（可直接设置）
g.interactive = true
g.buttonMode = true   // pixi@6 旧写法，等同于 cursor = 'pointer'
```

- 使用 `pointerdown`/`pointermove`/`pointerup` 事件，不使用 `click`/`mousedown`（touch 不触发）。
- 父容器必须设置 `interactive = true` 且 `interactiveChildren = true`，子元素的事件才能冒泡。
- `stage.interactive = false` 可以防止 stage 层拦截穿透到子容器的点击。

---

## 13. 排行榜 / 开放数据域

**问题**：微信关系链数据只能在独立的**开放数据域**（沙箱）中访问，主域无法直接读取好友数据。

**正确做法**（见 `src/wx/leaderboard.ts` 和 `src/context.ts`）：
- `game.json` 中配置 `"openDataContext": "context"` 指向开放数据域目录。
- 主域通过 `wx.getOpenDataContext().postMessage({ type: 'rank' })` 发送消息。
- 开放数据域通过 `wx.onMessage(data => {...})` 接收，在数据域内自行渲染排行榜画布。

---

## 14. wx API 异常防护

由于部分 wx API 在某些版本不存在，调用时加 `?.` 或 `try/catch`：
```ts
wx.showToast?.({ title: '提示', icon: 'none' })
try { wx.getOpenDataContext?.().postMessage?.({...}) } catch (_) {}
```

---

## 15. 禁止使用的 Web API

以下 Web API 在微信小游戏中**不可用**，禁止直接使用：

| 禁止使用 | 替代方案 |
|---|---|
| `document.createElement` / DOM 操作 | `@iro/wechat-adapter` 提供的 shim |
| `new Audio()` / `AudioContext` | `wx.createInnerAudioContext` |
| `fetch` | `wx.request` 或通过 adapter 的 fetch shim |
| `localStorage` | `wx.setStorage` / `wx.getStorage` |
| `eval` / `new Function` | `@pixi/unsafe-eval` 替换 |
| `window.location` | 微信小游戏没有页面路由概念 |
| CSS / HTML 元素 | 纯 Canvas/PIXI 绘制 |

---

## 16. 项目目录约定

```
src/
  app.ts          # 入口，仅做延迟初始化，不放业务逻辑
  bootstrap.ts    # 真正的启动逻辑（路由初始化）
  core/
    env.ts        # 第一步执行：adapter + unsafe-eval + interaction 替换
    index.ts      # 第二步执行：创建 Renderer、Stage、Ticker
    store.ts      # 全局响应式状态（mobx observable）
    sound.ts      # 音频封装（只用 wx API）
    shader.ts     # 兼容微信的 GLSL 100 shader
  route/          # 场景路由
  ui/             # UI 组件（纯 PIXI 绘制，无 HTML）
  wx/             # 微信专有 API 封装（分享、排行榜等）
  lib/            # 通用工具库
dist/             # 微信开发者工具导入此目录
  game.js         # vite 构建产物（单文件 CJS）
  game.json       # 小游戏配置
```
