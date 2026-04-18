# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project type

WeChat **mini-game** (not H5) built with **pixi.js@6 + matter-js + vite**. Output is a single CJS bundle at `dist/game.js` that is loaded by the WeChat Devtools project at `dist/`. The game is a 连连看-style (linking/elimination) puzzle game ("llk" = 连连看 in code).

## Commands

```bash
pnpm dev          # vite build -w (development watch). Then import dist/ into WeChat Devtools.
pnpm build        # production build → dist/game.js
pnpm build:ctx    # build the open-data-context (leaderboard sandbox) separately
```

There is **no test runner** configured (`pnpm test` is a stub).

When uploading via WeChat Devtools, the **"将JS编译成ES5"** option must be enabled.

## Required reading: AGENTS.md

**[AGENTS.md](AGENTS.md) is the source of truth for WeChat mini-game constraints.** It documents 19 sections of non-obvious gotchas that will break the build or runtime if violated. Read it before making changes that touch:

- Entry/initialization (sections 1-2): logic must defer 2× rAF before touching `wx`/`canvas`
- PIXI integration (sections 3, 5-7, 9): interaction plugin replacement, accessibility destroy, GLSL 100 only, mandatory `PIXI.settings`
- Build config (section 8): CJS only, `inlineDynamicImports`, `process.env.NODE_ENV` replacement
- Coordinates (sections 4, 10): touch coords are direct (no DOM offset); use `windowWidth`/`windowHeight`/`DESIGN_REF_W`/`designLayoutH`/`safeAreaTopPx` from `~/core`
- Audio (section 11): `wx.createInnerAudioContext` only — no `Audio`/`AudioContext`
- Interaction (section 12): use `(x as any).interactive = true` workaround; `pointerdown`, not `click`
- Open data context (section 13): leaderboard rendered in `dist/context/` sandbox
- Forbidden Web APIs (section 15): no DOM, no `fetch`, no `localStorage`, no `eval`

## Architecture

### Initialization flow

```
src/app.ts            ← entry; defers via setTimeout + 2× rAF (mandatory — see AGENTS §1)
  └─ src/bootstrap.ts ← dynamically imports core, store, save, routes
       └─ src/core/   ← env.ts (adapter + unsafe-eval) MUST run before index.ts (renderer)
       └─ src/route/  ← scenes registered, then loading.show() kicks off the first scene
```

`src/core/env.ts` must execute first because it installs `@iro/wechat-adapter` (DOM shim), `@pixi/unsafe-eval` (replaces PIXI's `new Function` shader compilation), and swaps PIXI's interaction plugin for `@iro/interaction` (touch-based).

### Scene routing

`src/navigator.ts` is a stack-based scene router. Scenes are objects with `{ show, hide }` methods exported from `src/route/{home,game,loading}/index.ts`. Use `go(name, opts)` / `back()` / `redirect(name, opts)` to switch scenes. The router auto-handles a back button sprite on the stage.

### Coordinate / scaling system

Two coordinate systems coexist:

- **In-game world (levels, sprites)**: designed at `750 × 1334`. `store.mem.screen.dr = min(rw/750, rh/1334)`. Containers do `container.scale.set(dr)`.
- **Full-screen pages (home, modals)**: width still uses `DESIGN_REF_W = 750`, but height is `designLayoutH = round(750 * windowHeight / windowWidth)` so it matches the actual screen aspect ratio (no letterboxing). Each full-screen page computes its own `dr = min(sw/750, sh/designLayoutH)`.

Always import `windowWidth` / `windowHeight` / `DESIGN_REF_W` / `designLayoutH` / `safeAreaTopPx` from `~/core` rather than calling `wx.getSystemInfoSync()` again.

### UI / popup design system

`src/ui/ui-kit.ts` is the shared design language module ("春日草地彩铅水彩风" — Spring Meadow watercolor style). It exports color constants, animation helpers, and factory functions used by every popup:

- `makePanelBg(w, h, onClose?)` — vertical 3-slice adaptive popup background using `assets/common/bg-popup.png` (top 25% fixed, middle 50% stretches, bottom 25% fixed). When `onClose` is supplied it auto-mounts a unified close button (`assets/button/close.png`).
- `panelPad(w)` — standard popup padding (top 19%, lr 17%, bot 20.5% of panel width). Every popup positions content via `cTop = py + pad.top`, `cBot = py + PANEL_H - pad.bot`, `contentW = PANEL_W - 2 * pad.lr`.
- `bounceIn(target, finalScale)` / `bounceOut(target, finalScale, overlay, onDone)` — standard popup enter/exit animations. All modals use these for consistent feel.
- `makeJellyBtn`, `makeOverlay`, `makeToggle`, `makeTabCapsule`, `txt`, `txtWrap`, `drawProgressBar`, etc.

All ~10 popup files in `src/ui/*-modal.ts` and `src/ui/*-screen.ts` follow the same skeleton: build `wrap` container with overlay `dim` and content `root`, call `makePanelBg(W, H, close)`, position content using `panelPad`, run `bounceIn` on enter, `bounceOut` in `close()` with a `closing` re-entry guard.

### Asset preloading

`src/ui/home.ts` exports `ASSET_URLS` — an array of all texture paths that need to be preloaded before the home screen renders. New shared assets used in modals must be added here so they are warm by the time popups open. The loading scene preloads this list; see `src/route/loading/index.ts` and `src/route/home/index.ts`.

### State

`src/core/store.ts` exposes a single MobX `observable` `mem` for ambient runtime state (screen dims, menu button rect, font, visibility). Game-specific persistent state (inventory, save data) lives in `src/game/llk-save.ts`.

### Backend / leaderboard

- Optional Supabase backend wired via `vite.config.ts` `replace` plugin (`__SUPABASE_URL__` / `__SUPABASE_ANON_KEY__` injected from `.env`). See `src/wx/supabase-sync.ts` and `supabase/`.
- WeChat friend leaderboard runs in the **open data context** at `dist/context/` (separate build via `pnpm build:ctx`, configured by `dist/game.json`'s `"openDataContext": "context"`).

## Conventions

- **Path aliases** (`tsconfig.json`, `vite.config.ts`): `~/*` → `src/*`, `@/*` → repo root.
- **Chinese comments are required** for UI sections and key business logic (see AGENTS §18 and `.trae/rules/dev-notice.md`). Use comments like `// 砖块区域`, `// 顶部菜单栏`, `// 游戏结束弹窗` to mark structural regions.
- **Update `docs/需求文档.md`** whenever game logic (rules, numbers, flow, rewards, unlocks) changes — see AGENTS §19. Spec drift is treated as a real bug.
- **Asset copy** is automatic: `vite.config.ts`'s `copyAssetsToDist` plugin syncs `assets/` → `dist/assets/` on every build, so new images are picked up without extra steps.
- **`dist/` is committed** because it's the artifact loaded by WeChat Devtools — don't add it to `.gitignore`.

## Known issues / gotchas

### 开放数据域 ES5 编译报错 `@babel/runtime`

微信开发者工具的"将 JS 编译成 ES5"会对 `dist/context/` 下的代码做 Babel 转译，但开放数据域沙箱无法 resolve `@babel/runtime/helpers/*` 模块，导致运行时报 `module '@babel/runtime/helpers/regeneratorRuntime.js' is not defined`。**解决方案**：在 `dist/project.config.json` 的 `babelSetting.ignore` 中加入 `"context/**"`，跳过开放数据域的 ES5 编译。修改 `dist/project.config.json` 时注意保留此配置。

### `webapi_getwxaasyncsecinfo:fail access_token missing`

这是微信 SDK 内部报错（`err_code: 41001`），与项目代码无关。通常原因：小游戏未绑定 AppID、开发者未登录、或本地调试时缺少 access_token。不影响游戏运行，可忽略。

## Where to find more

- `AGENTS.md` — WeChat mini-game gotchas (read first for any non-trivial change)
- `docs/需求文档.md` — product / gameplay spec (must stay in sync with code)
- `docs/设计文档.md` — visual / UX design spec
- `docs/资源清单.md` — asset inventory
- `docs/音效设计.md` — sound design
- `supabase/README.md` — backend schema & functions

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
  config          # 一些配置文件，例如关卡难度配置
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

---

## 17. AnimatedSprite 宽高设置时机

**问题**：在帧纹理未就绪（baseTexture 未 valid）时直接给 `AnimatedSprite` 设置 `width/height`，纹理初始尺寸为 0，后续纹理加载完成后会出现异常放大或显示尺寸不符合预期（比如想设为屏宽的一半却超大）。

**正确做法**：
- 等首帧纹理就绪后再按目标宽度等比缩放，优先使用 `scale` 而非在未就绪时直接设 `width/height`。
- 计算方式：`s = targetW / tex0.width`，然后 `roleAnim.scale.set(s)`；其中 `targetW` 可为 `DESIGN_W / 2`（设计坐标的一半，对应屏幕一半）。

```ts
const roleAnim = new PIXI.AnimatedSprite(roleFrames)
const targetW = Math.round(DESIGN_W / 2)
const tex0 = roleFrames[0]
const base = (tex0 as any).baseTexture
const apply = () => {
  const w = (tex0 as any).orig?.width || tex0.width
  if (w > 0) roleAnim.scale.set(targetW / w)
}
base?.valid ? apply() : base?.once?.('loaded', apply)
```


## 18. UI 和关键逻辑必须加注释

在 UI 组件或核心业务逻辑实现部分，务必注明区域、功能等中文注释，以便代码阅读和维护。

- 例如：实现砖块区时，需加 `// 砖块区域`
- 其他典型注释示例：
  - `// 顶部菜单栏`
  - `// 分数显示`
  - `// 棋盘绘制`
  - `// 底部操作按钮`
  - `// 动画效果区域`
  - `// 游戏结束弹窗`

务必让每个明显结构、关键交互或业务区域都有简明的中文说明。注释应放在逻辑起始处，避免无头无尾让后来人迷惑。

---

## 19. 游戏逻辑变更必须同步更新需求文档

**问题**：开发过程中如果只修改实现、不更新需求文档，后续会出现“代码行为”和“产品定义”不一致，导致联调、验收、继续迭代时产生歧义。

**正确做法**：
- 只要涉及**游戏逻辑**调整，就必须同步更新 `docs/需求文档.md`。
- 所谓“游戏逻辑”，包括但不限于：核心玩法规则、数值规则、胜负条件、关卡流程、奖励发放、解锁条件、任务目标、教程引导、失败惩罚、道具效果、状态机切换、UI 交互对应的业务含义。
- 如果实现与当前需求文档不一致，必须先确认最终方案，并在交付代码时一并更新文档，不能只留在代码里。
- 若本次改动同时影响表现层与逻辑层，需求文档至少要体现**玩家可感知的行为变化**与**关键规则变化**，避免只写视觉描述、不写规则变化。
- 提交较大逻辑改动时，应检查 `docs/需求文档.md` 中对应章节是否仍然准确，必要时补充变更说明、流程描述或规则示例。

**最低要求**：
- 改了玩法，更新玩法说明。
- 改了数值或判定，更新规则描述。
- 改了流程或状态，更新流程文档。
- 改了奖励、目标或解锁，更新对应章节。