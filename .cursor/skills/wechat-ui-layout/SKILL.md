---
name: wechat-ui-layout
description: 微信小游戏 UI 布局兼容性处理专家。覆盖顶部安全区/胶囊按钮规避、多分辨率适配、底部手势安全线、背景图填充策略、弹窗相对定位、授权按钮坐标转换、Z-Index 层级、点击区域最小尺寸等微信小游戏特有的布局问题。当实现任何页面、弹窗、HUD、关卡 UI、背景图布局时使用此技能。
---

# 微信小游戏 UI 布局兼容性

## 0. 关键常量（每次布局必须引用）

从 `~/core` 拿屏幕信息，**不要重复调用 `wx.getSystemInfoSync()`**：

```ts
import { windowWidth, windowHeight, safeAreaTopPx, DESIGN_REF_W, designLayoutH } from '~/core'

// 胶囊按钮信息（一次性读取，缓存复用）
const capsule = wx.getMenuButtonBoundingClientRect()
// capsule.top / bottom / left / right / width / height（逻辑像素）
```

---

## 1. 顶部安全区与胶囊按钮规避

微信右上角胶囊按钮**不可移动**，必须为其留出空间。

```ts
// 顶部安全距离：取状态栏底部与胶囊按钮底部中较大值，再加间距
const capsule = wx.getMenuButtonBoundingClientRect()
const TOP_SAFE_PX = Math.max(safeAreaTopPx, capsule.bottom) + 8   // 逻辑像素

// 转换为设计坐标（dr 为当前页面缩放比）
const TOP_SAFE_DESIGN = TOP_SAFE_PX / dr

// 胶囊按钮右侧禁止区域（逻辑像素），关键 UI 必须在此左边
const CAPSULE_LEFT_PX = capsule.left - 8
const CAPSULE_LEFT_DESIGN = CAPSULE_LEFT_PX / dr
```

**检查清单**
- [ ] 金币/生命/关卡进度等 HUD 的 Y 坐标 ≥ `TOP_SAFE_DESIGN`
- [ ] 顶部按钮（返回、设置）的右边缘 ≤ `CAPSULE_LEFT_DESIGN`
- [ ] 绝不将关键信息放在距顶部 80px 逻辑像素以内

---

## 2. 多分辨率适配

### 缩放策略

```ts
// 全屏页（首页、结算页）：按当前屏比例计算逻辑高度
const dr = Math.min(windowWidth / 750, windowHeight / designLayoutH)
// designLayoutH = Math.round(750 * windowHeight / windowWidth)

// 关卡/弹窗：沿用 750×1334 设计稿
const dr = store.mem.screen.dr  // = Math.min(w/750, h/1334)
```

### 锚点定位模式（禁止硬编码绝对坐标）

| 元素位置 | 设计坐标计算方式 |
|---------|---------------|
| 顶部居中 | `x = 750/2, y = TOP_SAFE_DESIGN + offsetY` |
| 右上角 | `x = CAPSULE_LEFT_DESIGN - offsetX, y = TOP_SAFE_DESIGN` |
| 底部居中 | `x = 750/2, y = designLayoutH - BOTTOM_SAFE_DESIGN - h/2` |
| 左下角 | `x = offsetX, y = designLayoutH - BOTTOM_SAFE_DESIGN - h/2` |
| 居中弹窗 | `x = 750/2, y = designLayoutH/2`，内部元素相对弹窗中心偏移 |

---

## 3. 底部手势安全线

iOS/Android 全面屏底部有系统返回横条，防止误触：

```ts
const sys = wx.getSystemInfoSync()
// 底部安全距离（逻辑像素）
const BOTTOM_SAFE_PX = sys.safeArea
  ? windowHeight - sys.safeArea.bottom
  : 0
const MIN_BOTTOM_PX = Math.max(BOTTOM_SAFE_PX + 40, 60)  // 至少 60px

// 转换为设计坐标
const BOTTOM_SAFE_DESIGN = MIN_BOTTOM_PX / dr
```

**检查清单**
- [ ] "开始游戏"、"领取奖励"等主操作按钮距底边 ≥ `BOTTOM_SAFE_DESIGN`
- [ ] 广告触发按钮、关闭按钮之间间距 ≥ 80px（防止诱导误触，避免审核被拒）

---

## 4. 背景图填充策略

除非设计稿或需求**明确特殊说明**，任何页面背景图都按以下默认规范处理：

- 宽度始终为屏幕宽度的 `100%`
- 高度按图片原始宽高比自动缩放，**禁止拉伸变形**
- 图片整体以屏幕中心线做**垂直居中**
- 若超长屏导致上下有留白，使用与背景边缘接近的纯色做兜底，避免出现黑边

背景图可能短于超长屏，默认按以上规则布局：

```ts
// 背景图原始尺寸（设计稿或素材尺寸）
const BG_DESIGN_W = 750
const BG_DESIGN_H = 1334

// 默认规则：宽度铺满屏幕，高度按比例缩放，整体垂直居中
const bgScaleW = windowWidth / BG_DESIGN_W
const bgW = windowWidth / dr
const bgH = BG_DESIGN_H * bgScaleW / dr

const bg = new PIXI.Sprite(bgTexture)
bg.width = bgW
bg.height = bgH
bg.anchor.set(0.5)
bg.x = 750 / 2
bg.y = designLayoutH / 2
```

**背景色兜底**：在背景图下方放一个纯色 Graphics，颜色取背景图边缘主色：

```ts
// 背景色兜底（防止超长屏漏出黑边）
const bgColor = new PIXI.Graphics()
bgColor.beginFill(0x2d5a1b)  // 与背景图主色接近
bgColor.drawRect(0, 0, 750, designLayoutH)
bgColor.endFill()
container.addChildAt(bgColor, 0)  // 最底层
container.addChild(bg)
```

---

## 5. 父子嵌套相对定位（弹窗必读）

**弹窗内所有子元素必须相对弹窗尺寸定位，禁止使用全局屏幕坐标。**

```ts
// 弹窗容器（设计坐标）
const DIALOG_W = 600
const DIALOG_H = 800
const dialog = new PIXI.Container()
dialog.x = 750 / 2 - DIALOG_W / 2
dialog.y = designLayoutH / 2 - DIALOG_H / 2

// ✅ 正确：子元素相对弹窗左上角
const title = new PIXI.Text('标题')
title.x = DIALOG_W / 2  // 弹窗内居中
title.y = 60
dialog.addChild(title)

// ❌ 错误：子元素用全局屏幕坐标
// title.x = 375  // 会随弹窗移动而错位
```

**通用原则**：任何父子嵌套容器，子元素坐标以父容器左上角为原点。

---

## 6. 授权按钮坐标系转换

`wx.createUserInfoButton` 使用**逻辑像素屏幕坐标**，需从 PIXI 设计坐标转换：

```ts
// PIXI 设计坐标 → 逻辑像素屏幕坐标
function designToScreen(designX: number, designY: number, dr: number) {
  // 设计坐标原点在左上角，container 通常有 scale = dr
  return {
    x: designX * dr,
    y: designY * dr,
  }
}

// 按钮设计坐标（相对 container，container.scale = dr）
const btnDesignX = 375 - 150  // 居中，宽 300
const btnDesignY = designLayoutH - BOTTOM_SAFE_DESIGN - 60

const { x: left, y: top } = designToScreen(
  container.x / dr + btnDesignX,
  container.y / dr + btnDesignY,
  dr
)

const userInfoBtn = wx.createUserInfoButton({
  type: 'text',
  text: '授权登录',
  style: {
    left,
    top,
    width: 300 * dr,
    height: 88 * dr,
    // ...
  }
})
```

---

## 7. 排行榜（开放数据域）布局

- 排行榜做成**固定尺寸弹窗**，避免复杂滚动同步
- 固定尺寸建议：宽 700、高 900（设计坐标），居中显示
- 主域向子域传递的信息保持简单：

```ts
// 主域：发送显示指令
wx.getOpenDataContext().postMessage({
  type: 'show',
  x: Math.round((750/2 - 350) * dr),   // 逻辑像素
  y: Math.round((designLayoutH/2 - 450) * dr),
  width: Math.round(700 * dr),
  height: Math.round(900 * dr),
})

// 主域：隐藏时发送
wx.getOpenDataContext().postMessage({ type: 'hide' })
```

- 子域内部布局完全独立，不依赖主域坐标系
- 排行榜 Canvas 与主游戏 Canvas **叠加层级**：排行榜 Canvas 在上

---

## 8. 交互元素与边缘安全

```ts
// 边缘安全距离（设计坐标）
const EDGE_SAFE = 20 / dr  // 至少 20 逻辑像素

// 检查元素是否太靠近边缘（调试用）
function checkEdgeSafe(x: number, y: number, w: number, h: number) {
  if (x < EDGE_SAFE) console.warn('元素太靠近左边缘')
  if (y < TOP_SAFE_DESIGN) console.warn('元素太靠近顶部')
  if (x + w > 750 - EDGE_SAFE) console.warn('元素太靠近右边缘')
  if (y + h > designLayoutH - BOTTOM_SAFE_DESIGN) console.warn('元素太靠近底部')
}
```

---

## 9. Z-Index 层级规范

层级从低到高，严格按以下顺序 `addChild`：

```ts
// 层级常量（zIndex 值，需开启 PIXI.settings.SORTABLE_CHILDREN）
export const Z = {
  BG: 0,          // 游戏背景
  GAME: 10,       // 游戏主体
  UI: 20,         // 普通 UI（HUD、按钮）
  POPUP: 30,      // 弹窗层
  GUIDE: 40,      // 新手引导层
  LOADING: 50,    // 加载遮罩
  AD: 60,         // 广告层（系统控制，不手动管理）
}

// 使用示例
uiContainer.zIndex = Z.UI
popupContainer.zIndex = Z.POPUP
guideContainer.zIndex = Z.GUIDE
```

**广告关闭后检查**：激励视频播放完毕的回调中，确认弹窗状态仍然正确：

```ts
ad.onClose(() => {
  // 广告关闭后，恢复原有弹窗状态
  if (store.mem.pendingRewardPopup) {
    showRewardPopup()
  }
})
```

---

## 10. 点击区域最小尺寸（44pt 规则）

视觉图案可以小，但点击 HitArea 不小于 44pt（≈ 88 逻辑像素 / `88 * devicePixelRatio` 物理像素）：

```ts
// 小图标按钮（视觉 40×40，HitArea 88×88）
const btn = new PIXI.Sprite(iconTexture)
btn.width = 40 / dr
btn.height = 40 / dr
btn.anchor.set(0.5)
btn.interactive = true
btn.buttonMode = true

// 扩大点击区域
const hitPad = (88 - 40) / 2 / dr
btn.hitArea = new PIXI.Rectangle(
  -btn.width / 2 - hitPad,
  -btn.height / 2 - hitPad,
  btn.width + hitPad * 2,
  btn.height + hitPad * 2
)
```

---

## 11. 布局自检清单

实现任意 UI 页面后，逐项检查：

```
顶部
- [ ] 顶部 HUD Y 坐标 ≥ TOP_SAFE_DESIGN（状态栏+胶囊按钮底部+间距）
- [ ] 右上角元素右边缘 ≤ CAPSULE_LEFT_DESIGN

底部
- [ ] 主操作按钮距底边 ≥ BOTTOM_SAFE_DESIGN（全面屏手势安全线）
- [ ] 广告按钮与关闭按钮间距 ≥ 80px

背景
- [ ] 背景图宽度 100% 铺满，高度等比不变形
- [ ] 背景图下方有兜底背景色（与图片主色接近）
- [ ] 超长屏下背景图垂直居中，无黑边

弹窗/嵌套
- [ ] 弹窗子元素坐标相对弹窗容器，不使用全局坐标
- [ ] 弹窗在不同分辨率下垂直居中

交互
- [ ] 所有按钮 HitArea ≥ 88×88 逻辑像素
- [ ] 无按钮紧贴屏幕物理边缘（距左/右边缘 ≥ 20px）

层级
- [ ] 引导层 > 弹窗层 > UI层 > 游戏层 > 背景层
- [ ] 激励视频关闭后，弹窗状态正确恢复
```

## 12. 背景图

- 默认规则：`100%` 屏幕宽度、等比缩放高度、垂直居中
- 仅在设计稿明确要求时，才允许使用 `cover`、贴顶、贴底或局部裁切
- 尺寸建议 `850 × 1700` 或更高（为超长屏预留冗余空间）