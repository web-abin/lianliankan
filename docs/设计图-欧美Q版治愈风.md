# 设计图 Prompt 集合 · 欧美Q版治愈快消风

## 全局风格说明

**核心视觉语言**：本风格定位为 **"Q版治愈系快消风格（Western Cartoon / Mobile Game Illustration Style）"**，综合以下三大特征：

| 特征 | 描述 | 关键词 |
|------|------|--------|
| **粗黑/深色描边** | 所有角色与UI元素有明显闭合轮廓线（4~6px），色彩为深棕/黑，使角色在复杂背景中快速凸显 | bold outlines, stroke, cel-shading |
| **高饱和度对比色** | 色彩组合明亮鲜艳，主色系为饱和红橙黄绿蓝，配对时使用强烈的色彩对比，传递愉悦轻松感 | vibrant colors, high saturation, candy palette |
| **圆润几何造型** | 几乎无尖锐棱角，角色与UI元素像果冻或面团，具备"弹性感"，营造低攻击性、治愈系视觉 | rounded shapes, jelly body, bubble shapes |

**参考游戏风格**：Stumble Guys、Merge Mansion、Royal Match、Angry Birds、Candy Crush、Pokémon GO 的UI语言。

**统一技术规格**：
- 手机竖屏 9:19.5（iPhone 尺寸）
- 描边：4~6px 深棕/黑色（`#2D1A0E` 或 `#1A0A00`），闭合，轻微手绘抖动感
- 圆角：按钮/卡片/面板全部采用超大圆角（border-radius ≥ 24px），pill 形按钮优先
- 阴影：角色与卡片带有卡通风格的硬阴影（drop shadow，深色偏移 3~5px，无模糊）
- 字体：粗圆体，描边字（文字本身也带深色外描边）
- 光影：简单平涂 + 单层亮面高光（左上角），无复杂渐变

---

## 1. 加载页（Loading Screen）

### 英文 Prompt（Nano Banana）

```
Mobile game loading screen UI design, portrait 9:19.5, Western cartoon mobile game style, Q-version healing casual.

Central illustration: a super chubby round capybara character sitting cross-legged, eyes closed with a peaceful smile, a glowing tangerine perfectly balanced on top of its round head — the tangerine wobbles and nearly falls. Character has classic bold black outlines (5px), high-saturation warm orange body color with a single cel-shading highlight on top, jelly-like rounded body with no sharp edges. Character looks like it's made of soft dough.

Background: bright gradient sky blue to lime-yellow, large soft rounded cloud shapes with bold outlines in background. Small illustrated fruits (strawberry, tangerine, watermelon) bouncing gently at edges.

Bottom loading bar: thick pill-shaped progress bar, bright yellow fill, bold black outline, a cute tangerine rolling along the bar track.
Below bar: "Loading..." text in bold rounded bubble font with dark stroke outline on letters.
Very bottom: small gray health advisory text in 2 lines.

Color palette: vibrant orange #FF6B2B, sky blue #4ECBFF, lime green #7ED957, hot pink #FF5E8A, golden yellow #FFD43B. All fills are flat with single highlight.
Style: Western cartoon game UI, bold outlines, high saturation, rounded shapes, jelly body feel, no photorealism, no gradients.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏加载页UI设计，比例9:19.5，欧美卡通移动游戏风格，Q版治愈快消风。

中央主角插画：一只极度圆润的卡皮巴拉，盘腿端坐，闭眼微笑，头顶顶着一颗会发光的橘子（橘子摇摇欲坠），角色身体像果冻面团，没有尖角，全身用明亮暖橙色平涂，左上角单层高光，粗黑闭合描边（5px），深棕色（#2D1A0E）。

背景：明亮的天蓝色到柠檬黄渐变，背景有若干粗描边圆润云朵，四角飘着小水果插画（草莓、橘子、西瓜），活泼弹跳感。

底部进度条：厚实胶囊形进度条，亮黄色填充，粗黑描边，一只小橘子在轨道上滑动。
进度条下方："Loading..."粗圆体泡泡字，文字本身带深色外描边。
最底部：两行小字灰色健康提示文案。

配色：活力橙 #FF6B2B、天蓝 #4ECBFF、草绿 #7ED957、亮粉 #FF5E8A、金黄 #FFD43B。全体平涂+单层高光，无复杂渐变。
风格：欧美卡通游戏UI，粗黑描边，高饱和对比色，圆润几何造型，果冻体感，无写实感。
```

---

## 2. 首页（Home Screen）

### 英文 Prompt（Nano Banana）

```
Mobile game home screen UI design, portrait 9:19.5, Western cartoon mobile game style, Q-version healing.

Layout:
TOP LEFT STATUS AREA: 3 pill-shaped icon buttons in a row — gear icon (settings), coin icon with bright yellow number badge, red heart HP icon with white number. Each button has thick dark stroke outline, rounded pill shape, bright solid fills with single highlight. Hard drop shadow offset below each.

CENTER TOP: Game logo/title in large 3D-style bold bubble letters with dark stroke outlines and bright gradient fill, decorated with small jumping fruit icons.

CENTER HERO: Large capybara character illustration — very round, jelly-like body, bold outlines, standing/sitting happily. Head is oversized relative to body (Q-version proportion 1:1 head-to-body). Bright orange/tan color, single highlight on top. A tangerine balances on its head about to fall. Character emits a subtle warm glow aura.

LEFT SIDE 4 ICON BUTTONS (vertical): 圈子好礼 (gift box), 添加桌面 (phone+sparkle), 商店 (shopping bag), 主题 (palette). Each is a rounded square button with bright solid color, bold dark outline, and hard shadow.

RIGHT SIDE 4 ICON BUTTONS (vertical): 喊人 (megaphone), 每日奖励 (star calendar), 排行榜 (trophy), 每日挑战 (lightning bolt). Same button style.

BOTTOM: Very large wide pill button "开始游戏" in bright grass green with dark bold outlined text, hard shadow below. Small pill label "第X关" below it in white with dark outline.

Background: warm cream/peach gradient with large decorative illustrated fruits and leaves, bold outline style.
Style: Western cartoon mobile game, bold dark outlines, high saturation, rounded shapes, jelly Q-version characters.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏首页UI设计，比例9:19.5，欧美卡通移动游戏风格，Q版治愈快消风。

布局结构：
左上角状态区：3个横排胶囊形图标按钮——齿轮设置、金币数量（亮黄数字徽章）、红色爱心血量（白色数字）。每个按钮厚实深色描边，圆角胶囊，亮色平涂+单层高光，按钮下方有卡通硬阴影（深色偏移，无模糊）。

顶部中央：游戏大标题，3D立体泡泡字风格，深色描边轮廓，亮色填充，周围跳跃水果小图标装饰。

页面中央主角：大号卡皮巴拉角色插画，Q版比例（头身比约1:1），圆滚滚果冻体感，站姿/坐姿开心表情，粗深色闭合描边，明亮橙棕色平涂+顶部单层高光，头顶橘子要掉不掉，角色周围有淡淡暖光晕。

左侧4个圆角方形功能按钮（纵向排列）：圈子好礼（礼盒图标）、添加桌面（手机+闪光）、商店（购物袋）、主题（调色盘）。每个按钮亮色底色+深色粗描边+卡通硬阴影。

右侧4个圆角方形功能按钮（纵向排列）：喊人（大喇叭）、每日奖励（星星日历）、排行榜（奖杯）、每日挑战（闪电）。同款按钮风格。

底部：超宽胶囊大按钮"开始游戏"，亮草绿色底，深色描边粗体文字，按钮下方卡通硬阴影。下方"第X关"白色小胶囊标签。

背景：暖奶油粉渐变，配大号装饰性水果和叶子插画（粗描边风格）。
风格：欧美卡通移动游戏，粗深色描边，高饱和对比色，圆润Q版果冻体。
```

---

## 3. 局内页面（In-Game / Gameplay Screen）

### 英文 Prompt（Nano Banana）

```
Mobile game gameplay screen UI design, portrait 9:19.5, Western cartoon mobile game style, Q-version healing.

TOP BAR: rounded rectangle bar with bold dark outline and warm cream fill.
- Left: hamburger menu button (rounded square, bold outline, hard shadow)
- Center: "关卡 15" in bold bubble font with dark stroke
- Right: small mechanism hint icon button (rounded square)
Below top bar: thick horizontal progress bar — bright yellow fill with bold dark outline, cute mini treasure chest icon at right end that "bounces" as it fills. Progress fill bar has a bright highlight stripe.

GAME BOARD (center): 6×10 grid of tile cards.
- Each tile: rounded square card, bright solid color fill, bold dark outline (4px), hard drop shadow, cute fruit illustration inside (tangerine, strawberry, watermelon, apple — each with bold outlines and single highlight).
- Jelly tiles: same card but wrapped in a wobbly transparent gel layer (iridescent bubble film effect, bold outline around the gel bubble).
- Two matched tiles connected by a glowing dotted line path with sparkle particles.
- One tile shown "selected" with a bright yellow glow pulse around it.

SIDE REACTION: a tiny round capybara character floating near the board with a big "NICE!" speech bubble (bold outlined bubble font), surrounded by stars and sparkle effects.

BOTTOM TOOL BAR: 3 large rounded square buttons in a row, each with bright distinct colors:
- Hint: magnifying glass, bright blue button
- Refresh: circular arrows, bright purple button
- Eliminate: scissors/star, bright red-orange button
Each has bold dark outline, single highlight, hard shadow. Number badge on top-right corner of each.

Background: bright illustrated nature/forest scene with large rounded trees, bold outlines, high saturation.
Style: Western cartoon game UI, bold outlines, vibrant colors, jelly/bubble feel, no photorealism.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏局内对局页UI设计，比例9:19.5，欧美卡通移动游戏风格，Q版治愈快消风。

顶部状态栏：圆角矩形底条，粗深色描边，暖奶油填色。
- 左侧：汉堡菜单按钮（圆角方形，粗描边，硬阴影）
- 中央："关卡 15"粗圆泡泡字+深色描边
- 右侧：机制提示小图标按钮（圆角方形）
状态栏下方：厚实横向进度条，亮黄色填充+粗深色描边，右端可爱宝箱图标随进度跳动，进度填充内有亮色高光条纹。

中间棋盘区：6×10图块卡片网格。
- 每块：圆角正方形卡片，亮色平涂底色，粗深色描边（4px），卡通硬阴影，内部可爱水果插画（砂糖橘、草莓、西瓜、苹果，每个水果也有粗描边和单层高光）。
- 果冻图块：在普通卡片外包裹一层扭动的果冻气泡层（虹彩透明质感，外层有粗描边果冻轮廓）。
- 已选中图块：亮黄色脉动光晕包围。
- 两个配对图块之间连接发光虚线路径+星光粒子特效。

侧边Combo反应：棋盘旁悬浮一只圆滚滚小卡皮巴拉，大号对话气泡"NICE!"（粗描边泡泡字），周围星星爆炸。

底部工具栏：3个大圆角方形道具按钮横排，各有独立亮色：
- 提示：放大镜，亮蓝色按钮
- 刷新：循环箭头，亮紫色按钮
- 消除：剪刀/星，亮橙红按钮
每个粗深色描边+单层高光+硬阴影，右上角数量徽章。

背景：明亮自然/森林插画，圆润大树，粗描边高饱和。
风格：欧美卡通游戏UI，粗描边，高饱和对比色，果冻/泡泡质感，无写实。
```

---

## 4. 机制说明蒙层（Mechanism Tutorial Overlay）

### 英文 Prompt（Nano Banana）

```
Mobile game tutorial overlay UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: game board dimmed with semi-transparent dark purple overlay, board tiles barely visible.

CENTER TUTORIAL PANEL: large rounded rectangle (very large corner radius), bright cream/yellow fill, bold dark outline (5px), hard drop shadow offset below.
Panel decoration: colorful confetti-style dots and stars scattered on the panel border.

Panel contents:
- TOP: large illustrated mechanism icon — e.g. for gravity: a chunky bold-outlined arrow pointing down, with 3 cute tile cards falling and bouncing with Q-spring effect (shown as motion lines and rubber stretch frames)
- MIDDLE: explanation text 2~3 lines in bold rounded bubble font with dark stroke on letters
- CORNER: small round capybara character with surprised/curious expression, holding a magnifying glass, has a "!" speech bubble
- BOTTOM: large pill button "知道了！" in bright green with bold dark outline and hard shadow

Style: Western cartoon, bold outlines, vibrant colors, rounded shapes.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏机制说明蒙层UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：深紫半透明蒙层遮住棋盘（棋盘依稀可见），带轻微暗角。

中央说明面板：大号圆角矩形（超大圆角），亮奶油/柠檬黄填色，粗深色描边（5px），面板下方卡通硬阴影（深色偏移，无模糊）。
面板边框：彩色五彩纸屑圆点和星星散布点缀。

面板内容：
- 顶部：大号机制图示插画——例如重力机制：一个粗描边粗壮箭头朝下，3张可爱图块卡片下落并Q弹回弹（运动线条+橡皮拉伸帧表现）
- 中部：2~3行说明文字，粗圆体泡泡字+深色外描边
- 角落：一只小圆卡皮巴拉，惊讶/好奇表情，手持放大镜，头上"!"对话气泡
- 底部：大号胶囊按钮"知道了！"，亮绿色+粗深色描边+硬阴影

风格：欧美卡通，粗描边，高饱和色，圆润造型。
```

---

## 5. 局内菜单/设置弹窗（In-Game Settings Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game in-game pause menu popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.

CENTER POPUP: tall rounded rectangle panel, bright warm yellow/cream fill, bold dark outline (5px), hard shadow below.
Header bar: rounded rectangle strip at top with slightly different bright fill, "设置" title in bold outlined bubble font, X close button (circle with X, bold outline) at right.

List items (6 rows), each row is a rounded rectangle with bold outline:
- Sound effects: bold speaker icon (bright blue) + label + pill toggle (bright green ON / gray OFF)
- Vibration: bold vibrate icon + label + pill toggle
- Background music: bold music note icon + label + pill toggle
Each toggle pill is large, chunky, with bold outline and hard shadow.

Separator line (dotted, thick).

Action buttons (2 rows):
- "重玩本关": wide pill button, bright orange, bold outline, refresh icon, hard shadow
- "放弃挑战": wide pill button, bright red, bold outline, exit door icon, hard shadow

TOP DECORATION: small capybara character sitting on the very top edge of the popup, legs dangling, looking curious.

Style: Western cartoon mobile game popup, bold outlines, vibrant colors, rounded shapes.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏局内暂停菜单弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。

中央弹窗：高圆角矩形面板，亮暖黄/奶油填色，粗深色描边（5px），面板下卡通硬阴影。
顶部标题条：圆角矩形条形，略深填色，"设置"粗圆泡泡字+深色外描边，右侧圆形X关闭按钮（粗描边）。

列表项6行，每行圆角矩形行框+粗描边：
- 音效：粗描边喇叭图标（亮蓝色）+ 文字标签 + 胶囊形开关（开=亮绿，关=灰，开关本身粗描边+硬阴影，块头感强）
- 震动：粗描边震动图标 + 标签 + 胶囊开关
- 音乐：粗描边音符图标 + 标签 + 胶囊开关
- 问题反馈：粗描边聊天气泡图标 + 标签 + 右箭头

粗虚线分隔线。

操作按钮（2行宽胶囊）：
- "重玩本关"：亮橙色胶囊按钮，刷新图标，粗描边，硬阴影
- "放弃挑战"：亮红色胶囊按钮，出门图标，粗描边，硬阴影

弹窗顶边：一只小卡皮巴拉坐在弹窗顶部边缘，双腿悬空晃荡，好奇张望。

风格：欧美卡通弹窗，粗描边，高饱和色，圆润造型。
```

---

## 6. 放弃确认弹窗（Quit Confirmation Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game quit confirmation popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.

CENTER POPUP: rounded rectangle, bright cream fill, bold dark outline (5px), hard drop shadow.

Panel contents:
- TOP ILLUSTRATION: large capybara character with exaggerated teary wobble eyes, holding a tiny "再试试" flag, body slightly shrunk/squish pose (sad but adorably cute). Bold outlines, high saturation warm colors.
- Level label: "第 15 关" in bold outlined pill badge (bright orange)
- Progress circle: large chunky circular progress ring (bold stroke, bright yellow fill for completed portion), percentage number in center in bold font
- Encourage text 2 lines: bold rounded font, dark outline on letters
- TWO BUTTONS at bottom, side by side:
  - LEFT: large pill button "再试试" — bright vibrant green, bold outline, hard shadow, slightly larger
  - RIGHT: smaller pill button "放弃挑战" — muted gray or outlined-only, bold outline

Confetti stars burst at the top corners of the popup.
Style: Western cartoon, bold outlines, vibrant colors, rounded cute shapes.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏放弃确认弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。

中央弹窗：圆角矩形，亮奶油填色，粗深色描边（5px），卡通硬阴影。

面板内容：
- 顶部主插画：大号卡皮巴拉角色，夸张水汪汪泪眼（卡通大眼珠），手举"再试试"小旗，身体略微蜷缩的难过姿态（可爱不煽情）。粗描边，高饱和暖色。
- 关卡标签："第 15 关"粗描边胶囊徽章（亮橙色）
- 进度圆环：大号厚实圆形进度环（粗描边，已完成部分亮黄色填充），中央显示百分比粗体数字
- 鼓励文案2行：粗圆体字，文字带深色外描边
- 底部并排两个按钮：
  - 左：大号胶囊"再试试"——亮草绿色，粗描边，硬阴影，略大
  - 右：小一号胶囊"放弃挑战"——灰色或仅描边轮廓，粗描边

弹窗上角飞散星星彩带爆炸效果。
风格：欧美卡通，粗描边，高饱和色，圆润可爱造型。
```

---

## 7. 道具不足弹窗（Item Insufficient Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game item-insufficient popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.

CENTER POPUP: rounded rectangle, bright warm fill, bold dark outline (5px), hard shadow.

Panel contents:
- TOP ITEM ICON: large chunky illustrated item icon (e.g. magnifying glass for Hint), oversized with bold outlines, bright blue, bouncing/wobble animation implied. Large red circle badge with "0" on top-right.
- Title: "提示不够了！" in large bold bubble font, dark stroke on letters, slightly tilted for energy
- Item description: small text 1~2 lines
- REPLENISHMENT COUNT: pill-shaped counter badge "剩余 2 次" in bright yellow with bold outline and hard shadow
- SHARE BUTTON: very wide pill button, bright orange-red, bold outline, hard shadow. WeChat icon on left + "分享好友补给" bold text.
- Close link: small bold text "下次再说" at bottom

CORNER: small sad capybara sitting, holding an empty jar, looking up hopefully.

Style: Western cartoon, bold outlines, vibrant colors, rounded shapes.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏道具不足弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。

中央弹窗：圆角矩形，亮暖色填充，粗深色描边（5px），卡通硬阴影。

面板内容：
- 顶部大号道具图标：粗描边厚实插画图标（如放大镜=提示道具），亮蓝色，圆滚块头感，有Q弹跳动感。右上角大红圆形"0"数量徽章。
- 主标题："提示不够了！"大号粗圆泡泡字，深色外描边，略微倾斜有活力感
- 道具功能说明：1~2行小字
- 补给次数：胶囊形计数徽章"剩余 2 次"，亮黄色+粗描边+硬阴影
- 补给按钮：超宽胶囊按钮，亮橙红色，粗深色描边，硬阴影，左侧微信图标，"分享好友补给"粗体文字
- 底部关闭小字："下次再说"粗体

角落一只小卡皮巴拉坐着，捧着空罐子，仰头期待眼神。

风格：欧美卡通，粗描边，高饱和色，圆润造型。
```

---

## 8. 商店页 · 形象Tab（Shop - Character Tab）

### 英文 Prompt（Nano Banana）

```
Mobile game shop screen - Character tab UI design, portrait 9:19.5, Western cartoon mobile game style.

TOP BAR: rounded rectangle bar, bold outline, bright fill. "商店" title in bold bubble font. Close button (X in circle). Coin count with bright yellow coin icon on right.

TAB BAR: 3 pill tab buttons — "形象" (selected: bright fill + bold outline + hard shadow), "道具", "音效" (unselected: lighter fill). Bold outlines on all tabs.

CONTENT: 2×2 grid of character cards. Each card: rounded rectangle, bold dark outline (5px), hard drop shadow.
- Card 1 "默认形象": cute round capybara illustration, Q-version proportions (big head), simple outfit. Top-right green badge "已拥有" (bold outlined pill badge).
- Card 2 "卡皮巴拉形象": capybara with accessories (flower crown, little bag), bright vibrant colors. Price tag "400金币" (bright yellow pill). Bottom: bold outlined buy button in orange.
- Card 3 "水果冠款": capybara with fruit crown, but desaturated/grayscale treatment. "即将开放" gray pill badge with lock icon.
- Card 4 "冬日围巾款": capybara with scarf, desaturated. "即将开放" gray badge.

Each card has character name below in bold rounded font.
Background: bright sky gradient with cloud decorations.
Style: Western cartoon shop UI, bold outlines, vibrant colors, jelly Q-characters.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏商店页-形象Tab UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部标题栏：圆角矩形底条，粗描边，亮色填充。"商店"粗圆泡泡字。圆形X关闭按钮。右侧亮黄金币图标+数量。

Tab切换栏：3个胶囊形Tab——"形象"（选中：亮色填充+粗描边+硬阴影）、"道具"、"音效"（未选中：浅填色）。所有Tab均有粗描边。

内容区2×2角色卡片网格，每张卡片：圆角矩形，粗深色描边（5px），卡通硬阴影。
- 卡片1"默认形象"：Q版比例大头卡皮巴拉插画（超大圆头，小身体），亮色。右上角绿色"已拥有"胶囊粗描边徽章。
- 卡片2"卡皮巴拉形象"：戴花冠背小包的卡皮巴拉，高饱和亮色。价格标签"400金币"亮黄胶囊。底部橙色"购买"粗描边按钮。
- 卡片3"水果冠款"：头戴水果冠卡皮巴拉，整体降饱和灰调处理。"即将开放"灰色锁形胶囊徽章。
- 卡片4"冬日围巾款"：戴围巾卡皮巴拉，降饱和灰调。"即将开放"灰色徽章。

每张卡片角色名称在卡片下方，粗圆体字。
背景：亮色天空渐变+云朵装饰。
风格：欧美卡通商店UI，粗描边，高饱和色，Q版果冻角色。
```

---

## 9. 商店页 · 道具Tab（Shop - Items Tab）

### 英文 Prompt（Nano Banana）

```
Mobile game shop screen - Items tab UI design, portrait 9:19.5, Western cartoon mobile game style.

Same TOP BAR and TAB BAR as character tab, "道具" tab now selected/highlighted.

CONTENT: vertical list of 4 item rows. Each row: wide rounded rectangle card, bold dark outline (5px), hard shadow, bright distinct color per item.

- Row 1 (Hint): left side large round illustrated icon of magnifying glass — oversized chunky style, bright blue fill, bold outline, single highlight — item name "提示道具" bold bubble font — description 1 line — price "100金币" yellow pill — right side: orange pill buy button "购买" bold outline
- Row 2 (Refresh): same card layout, shuffle arrows icon in bright purple
- Row 3 (Eliminate): scissors/starburst icon in bright red-orange
- Row 4 (HP): chunky heart icon in bright red — "血量" — "购买+1点血量" — "50金币" — buy button

Each icon has bold dark outlines, single highlight, drop shadow. Very chunky and readable.

Style: Western cartoon items list, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏商店页-道具Tab UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部栏和Tab栏同形象Tab，"道具"Tab当前高亮选中。

内容区纵向4行道具卡片，每行：宽圆角矩形卡片，粗深色描边（5px），卡通硬阴影，每款道具有独立亮色主色调。

- 第1行（提示）：左侧大号圆滚厚实放大镜图标，亮蓝色+粗描边+单层高光，"提示道具"粗圆泡泡字，功能说明一行，"100金币"亮黄胶囊价格，右侧橙色"购买"粗描边按钮
- 第2行（刷新）：同卡片布局，循环箭头图标，亮紫色
- 第3行（消除）：剪刀/星爆图标，亮橙红色
- 第4行（血量）：粗大爱心图标，亮红色，"血量"，"购买+1点血量"，"50金币"，购买按钮

每个图标粗深色描边，单层高光，投影。块头感强，识别度高。

风格：欧美卡通道具列表，粗描边，高饱和色。
```

---

## 10. 商店页 · 音效Tab（Shop - Sound Tab）

### 英文 Prompt（Nano Banana）

```
Mobile game shop screen - Sound pack tab UI design, portrait 9:19.5, Western cartoon mobile game style.

Same header structure, "音效" tab selected.

CONTENT: 2 sound pack cards stacked vertically. Each card: wide rounded rectangle, bold dark outline (5px), hard shadow.

Card 1 "默认音效包": 
- Left: large illustrated speaker icon, bright yellow, bold outline, musical notes popping out from it
- Center: card name "默认音效包" bold bubble font, short description
- Right side: green "已拥有" pill badge + small circular play preview button (triangle icon, bold outline)

Card 2 "卡通音效包":
- Left: illustrated cartoon sound icon — colorful explosion of sound waves and musical symbols, bright multicolor
- Center: card name bold bubble font + description  
- Right side: "400金币" yellow price pill + orange "购买" buy button + play preview button

Musical note emoji scattered between and around cards, bold outlined style.
Style: Western cartoon sound shop, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏商店页-音效Tab UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部同结构，"音效"Tab当前高亮。

内容区纵向2张音效包卡片，每张：宽圆角矩形卡片，粗深色描边（5px），卡通硬阴影。

卡片1"默认音效包"：
- 左：大号喇叭插画图标，亮黄色+粗描边，音符从喇叭口爆出
- 中："默认音效包"粗圆泡泡字，简短说明
- 右：绿色"已拥有"胶囊徽章 + 小圆形播放预览按钮（三角形图标，粗描边）

卡片2"卡通音效包"：
- 左：卡通爆炸感音效插画图标，多色音波和音乐符号爆出，高饱和
- 中：名称粗圆字 + 说明
- 右："400金币"亮黄胶囊价格 + 橙色"购买"按钮 + 播放预览按钮

两张卡片间穿插飘散粗描边音符装饰。
风格：欧美卡通音效商店，粗描边，高饱和色。
```

---

## 11. 主题页（Theme Selection Screen）

### 英文 Prompt（Nano Banana）

```
Mobile game theme selection screen UI design, portrait 9:19.5, Western cartoon mobile game style.

TOP BAR: "主题" title bold bubble font, back button (left arrow in rounded square, bold outline).

CONTENT: 5 theme cards in a scrollable vertical list. Each card: wide rounded rectangle, bold dark outline (5px), hard shadow.

Theme 1 "水果主题" (unlocked, active):
- Left: 3×2 mini grid of tile preview icons (tangerine, strawberry, watermelon etc., all bold outlined cute illustrations)
- Center: theme name bold bubble font + short flavor text
- Right: bright green "使用中" pill badge (bold outline)
Card has bright warm yellow border glow to indicate selected.

Themes 2~5 (locked): same card layout but with a semi-transparent gray overlay on the preview area + large bold lock icon overlay.
- Each shows theme name + unlock condition in a small bold outlined pill label ("通关15关解锁", "完成5次每日挑战解锁", etc.)

Background: bright gradient, decorative elements matching selected theme.
Style: Western cartoon theme select UI, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏主题页UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部标题栏："主题"粗圆泡泡字，左侧返回按钮（圆角方形内左箭头，粗描边）。

内容区5张主题卡片纵向可滚动列表，每张：宽圆角矩形卡片，粗深色描边（5px），卡通硬阴影。

主题1"水果主题"（已解锁使用中）：
- 左侧：3×2微型图块预览格（砂糖橘、草莓、西瓜等小图标，均有粗描边可爱风格）
- 中部：主题名称粗圆泡泡字 + 简短风味文字
- 右侧：亮绿色"使用中"胶囊粗描边徽章
卡片整体有亮暖黄边框发光效果（选中状态）。

主题2~5（锁定状态）：同卡片布局，但预览区叠加半透明灰色遮罩+大号粗描边锁形图标。
每张显示主题名称 + 解锁条件小胶囊标签（"通关15关解锁"、"完成5次每日挑战解锁"等，粗描边圆角标签）。

背景：亮色渐变+当前选中主题风格的装饰元素。
风格：欧美卡通主题选择UI，粗描边，高饱和色。
```

---

## 12. 主题解锁弹窗（Theme Unlock Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game new theme unlock celebration popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Full screen celebration state (not just a popup, feels like a big moment):
Background: dark but animated — sparkle rays shooting from center, colorful confetti particles raining down, all bold outlined cartoon style.

CENTER PANEL: large rounded rectangle, bold dark outline (6px), hard shadow. Bright festive gradient inside (deep purple to bright pink, cartoon style).

Panel contents:
- TOP: large star burst explosion graphic, bold outlined, bright multicolor (gold, orange, pink)
- CENTER: large illustrated theme key visual — e.g. capybara playing xylophone in a forest (for music theme) — Q-version character, bold outlines, vibrant colors, jelly-like
- Floating above: 3D-style bold badge/medal "NEW!" in bold outlined font with gold fill
- Below character: theme name "「森林音乐会主题」" in very large bold bubble font with bright fill and dark stroke outline
- Sub-text: "恭喜解锁新主题！" in rounded font
- TWO BUTTONS:
  - "立即使用": large pill, bright orange-yellow, bold outline, hard shadow
  - "好的": medium pill, outlined only, lighter

Bold outlined confetti shower filling the whole screen edges.
Style: Western cartoon celebration, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏主题解锁庆祝弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

全屏庆祝状态（仪式感拉满，非普通弹窗）：
背景：深色但热闹——中心射出卡通星光放射线（粗描边），彩色五彩纸屑从上方雨下，全体粗描边卡通风格。

中央面板：大号圆角矩形，粗深色描边（6px），卡通硬阴影，内部亮色节日渐变（深紫→亮粉，卡通感）。

面板内容：
- 顶部：大号星爆图形，粗描边，多色（金、橙、粉）
- 中央：大号新主题关键视觉插画——例如卡皮巴拉在森林演奏木琴（音乐主题），Q版比例大头圆滚身体，粗描边，高饱和，果冻体感
- 插画上方悬浮：3D感粗描边"NEW!"徽章，金色填充
- 插画下方：主题名称"「森林音乐会主题」"超大粗圆泡泡字，亮色填充+深色外描边
- 副文案："恭喜解锁新主题！"圆体字
- 底部两个按钮：
  - "立即使用"：大号胶囊，亮橙黄色，粗描边，硬阴影
  - "好的"：中号胶囊，仅描边轮廓，较小

全屏边缘粗描边彩带纸屑飞洒。
风格：欧美卡通庆祝演出，粗描边，高饱和色。
```

---

## 13. 排行榜页 · 世界榜（Leaderboard - World Ranking）

### 英文 Prompt（Nano Banana）

```
Mobile game leaderboard - World ranking UI design, portrait 9:19.5, Western cartoon mobile game style.

TOP BAR: "排行榜" bold bubble title, back button. Decorative capybara holding a trophy on the side.

TAB BAR: "世界榜" (selected, bright fill) | "好友榜" pill tabs, bold outlines.

TOP 3 PODIUM AREA:
- GOLD 1st (center, tallest): large bright gold platform, thick dark outline. Player avatar in large circle frame (bold dark outline, gold ring). Crown icon on top (chunky bold outlined crown). Name text in bold outlined font. "第X关" pill badge.
- SILVER 2nd (left): silver platform, slightly shorter. Silver crown. Normal avatar size.
- BRONZE 3rd (right): bronze platform, shortest. Bronze laurel. Normal avatar.
All platforms have bold outlines, hard shadows, and chunky Q-style proportions.

RANK LIST (4~10): each row is a rounded rectangle card, bold outline, alternating cream/white fill.
Columns: bold rank number badge (circle) | avatar (small circle) | player name (bold) | level pill badge | time text

MY RANK: pinned bottom card, bright yellow fill + bold outline + hard shadow. "我" label.

Background: bright sky blue with cloud decorations, bold outlined style.
Style: Western cartoon leaderboard, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏排行榜-世界榜UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部标题栏："排行榜"粗圆泡泡字，返回按钮，旁边一只拿奖杯的小卡皮巴拉装饰。

Tab切换栏："世界榜"（高亮选中）| "好友榜"，胶囊形粗描边Tab。

前三名领奖台区域：
- 第1名（中央最高台）：亮金色台座，粗深色描边，圆形头像框（粗描边+金色环），头顶Q版粗描边金冠，名称粗体外描边字，"第X关"胶囊徽章。
- 第2名（左侧稍矮）：银色台座，银冠。
- 第3名（右侧最矮）：铜色台座，铜月桂。
所有台座粗描边+卡通硬阴影+厚实Q版比例。

4~10名列表：每行圆角矩形卡片，粗描边，奶油/白色交替填色。
列：粗圆形排名徽章 | 小圆形头像 | 粗体名称 | 关卡胶囊徽章 | 时间文字

底部固定"我的排名"卡片：亮黄色底+粗描边+硬阴影，"我"标签。

背景：亮天蓝色+粗描边云朵装饰。
风格：欧美卡通排行榜，粗描边，高饱和色。
```

---

## 14. 排行榜页 · 好友榜（Leaderboard - Friends）

### 英文 Prompt（Nano Banana）

```
Mobile game leaderboard - Friends tab UI design, portrait 9:19.5, Western cartoon mobile game style.

Same header + tab bar structure, "好友榜" tab selected.

PRIVACY CONSENT STATE (before data loaded):
- CENTER: large round illustration of 4 animals grouped together — capybara, small bird, turtle, monkey — all Q-version, bold outlines, vibrant, hugging/celebrating together (friendship scene)
- Panel: rounded rectangle, bold outline. Text about accessing friend relationship chain.
- Two large pill buttons:
  - "同意并查看": bright green, bold outline, hard shadow
  - "取消": outlined only

LOADED STATE (friend list with data):
- Same list row design as world ranking, with friend avatars and names

EMPTY STATE: lone capybara sitting sadly on the ground, looking sideways, "暂无好友数据" above it in bold outlined text, small capybara holding up a sign.

Style: Western cartoon friends leaderboard, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏排行榜-好友榜Tab UI设计，比例9:19.5，欧美卡通移动游戏风格。

顶部栏和Tab同结构，"好友榜"Tab当前高亮。

隐私确认状态（未加载数据）：
- 中央大号插画：4只动物聚在一起——卡皮巴拉、小鸟、乌龟、小猴，全部Q版大头圆身，粗深色描边，高饱和，互相拥抱/欢庆的友情场景
- 说明卡片：圆角矩形+粗描边，访问好友关系链说明文字
- 两个大号胶囊按钮：
  - "同意并查看"：亮绿色+粗描边+硬阴影
  - "取消"：仅描边轮廓

已加载状态（有好友数据）：
- 同世界榜列表行设计，显示好友真实头像和昵称

空态（无好友数据）：
- 一只卡皮巴拉孤独坐地上，侧目表情，举着一块小牌子，牌子上粗体外描边文字"暂无好友数据"

风格：欧美卡通好友榜，粗描边，高饱和色。
```

---

## 15. 首页设置弹窗（Home Settings Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game home settings popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Same structure as in-game settings popup but without the gameplay-specific buttons.

Background: semi-transparent dark overlay.
CENTER POPUP: tall rounded rectangle, bright cream fill, bold dark outline (5px), hard drop shadow.
Header: "设置" bold bubble title, decorative small fruits, X close circle button.
Toggle list rows (rounded rectangle rows, bold outline):
- Sound effects toggle (speaker icon, bright blue)
- Vibration toggle  
- Music toggle
- Feedback row with arrow

All toggles: chunky pill shape, bold outlines, hard shadows, bright green (on) / gray (off).
Top: capybara peeking over the popup top edge, ears and eyes visible.

Style: Western cartoon settings popup, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏首页设置弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

结构同局内设置弹窗，但去掉局内专属按钮（重玩/放弃）。

背景：半透明深色蒙层。
中央弹窗：高圆角矩形，亮奶油填色，粗深色描边（5px），卡通硬阴影。
标题条："设置"粗圆泡泡字+小水果装饰，X关闭圆形按钮。
开关列表行（每行圆角矩形+粗描边）：
- 音效开关（亮蓝喇叭图标）
- 震动开关
- 音乐开关
- 问题反馈（带右箭头）

所有开关：厚实胶囊形，粗描边+硬阴影，开=亮绿，关=灰。
弹窗顶部边缘：一只卡皮巴拉探头，只露出耳朵和眼睛。

风格：欧美卡通设置弹窗，粗描边，高饱和色。
```

---

## 16. 圈子好礼弹窗（Game Circle Gift Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game circle gift popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.
CENTER POPUP: rounded rectangle, bright festive yellow-orange fill, bold dark outline (5px), hard drop shadow.

Panel contents:
- TOP: large illustrated gift box — chunky 3D-style, bright red bow, gold body, bold outlines. Gold coins bursting from the top like a fountain, each coin bold outlined circle with "¥" mark.
- Title: "加入游戏圈！" large bold bubble font, dark stroke outline on letters
- Reward: oversized coin icon + "×100" in big bold number
- Description: small rounded font text
- CTA BUTTON: wide pill, bright vibrant orange, bold dark outline, hard drop shadow, left side game circle icon. "加入游戏圈" bold text.
- Close: small bold "下次再说" text

Coin explosion particles and sparkle stars covering the top area.
Style: Western cartoon gift popup, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏圈子好礼弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。
中央弹窗：圆角矩形，亮节日橙黄填色，粗深色描边（5px），卡通硬阴影。

面板内容：
- 顶部：大号厚实3D感礼盒插画，亮红蝴蝶结+金色礼盒身+粗描边，金币像喷泉一样从盒子顶部爆出（每枚金币粗描边圆形+¥标志）
- 主标题："加入游戏圈！"大号粗圆泡泡字+深色外描边
- 奖励展示：超大金币图标 + "×100"粗体大数字
- 说明小字
- 行动按钮：宽胶囊，亮橙色，粗深色描边，硬阴影，左侧游戏圈图标，"加入游戏圈"粗体字
- 底部小字："下次再说"粗体

金币爆炸粒子+星星闪光覆盖顶部区域。
风格：欧美卡通礼物弹窗，粗描边，高饱和色。
```

---

## 17. 喊人弹窗（Invite Friends Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game invite friends popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.
CENTER POPUP: rounded rectangle, bright warm fill, bold dark outline (5px), hard shadow.

Panel contents:
- TOP ILLUSTRATION: large capybara holding an oversized chunky megaphone/bullhorn (bold outlined, bright yellow megaphone), yelling. Sound waves exploding from the megaphone in big concentric rings (bold outlined). 3 small animal silhouettes in the distance (bird, turtle, monkey) running toward the source.
- Title: "喊人来助力！" large bold bubble font
- Reward badge: large chunky heart icon (bright red, bold outline) + "+3" big number + "血量" label in pill badge
- Description text
- SHARE BUTTON: wide pill, bright WeChat-green, bold outline, hard shadow, WeChat icon, "分享好友" bold text
- Close: "下次再说" small bold text

Sound wave decorations around the popup.
Style: Western cartoon invite popup, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏喊人弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。
中央弹窗：圆角矩形，亮暖色填充，粗深色描边（5px），卡通硬阴影。

面板内容：
- 顶部主插画：大号卡皮巴拉双手举着超大粗壮喇叭（粗描边亮黄色喇叭），用力吆喝，喇叭口爆出大圈同心圆音波（粗描边）。远处3个小动物剪影（小鸟、乌龟、小猴）向这边奔跑。
- 主标题："喊人来助力！"大号粗圆泡泡字
- 奖励徽章：大号厚实爱心图标（亮红色+粗描边）+ "+3"大数字 + "血量"胶囊标签
- 说明文字
- 分享按钮：宽胶囊，微信绿色，粗深色描边，硬阴影，微信图标，"分享好友"粗体字
- 底部："下次再说"小粗体

弹窗周围音波装饰。
风格：欧美卡通邀请弹窗，粗描边，高饱和色。
```

---

## 18. 添加桌面弹窗（Add to Desktop Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game add-to-desktop popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.
CENTER POPUP: rounded rectangle, bright fill, bold dark outline (5px), hard shadow.

Panel contents:
- TOP ILLUSTRATION: chunky bold-outlined illustration of a smartphone — the phone screen shows a bright colorful home screen grid of app icons. One icon (the capybara game icon — round capybara face in a bright rounded square) is being placed/dropped onto the screen with a sparkle effect and motion lines. Hand (or magic wand) placing it.
- Title: "添加到桌面" large bold bubble font
- Reward: coin icon + "50金币" in bold number + small "每日首次" label pill
- Description: small text
- CTA BUTTON: wide pill, bright orange, bold outline, hard shadow. "立即添加" bold text.
- Close: "下次再说"

Style: Western cartoon desktop popup, bold outlines, vibrant colors.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏添加桌面弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。
中央弹窗：圆角矩形，亮色填充，粗深色描边（5px），卡通硬阴影。

面板内容：
- 顶部主插画：粗描边厚实手机插画——手机屏幕显示彩色App图标网格，一个卡皮巴拉游戏图标（圆角方形内圆滚卡皮巴拉脸）正被放置上去，带闪光特效和运动线条，像被一只手（或魔法棒）投放到屏幕上。
- 主标题："添加到桌面"大号粗圆泡泡字
- 奖励：金币图标 + "50金币"粗体数字 + "每日首次"小胶囊标签
- 说明小字
- 行动按钮：宽胶囊，亮橙色，粗深色描边，硬阴影，"立即添加"粗体字
- 底部："下次再说"

风格：欧美卡通桌面添加弹窗，粗描边，高饱和色。
```

---

## 19. 每日奖励/签到弹窗（Daily Check-in Popup）

### 英文 Prompt（Nano Banana）

```
Mobile game daily check-in popup UI design, portrait 9:19.5, Western cartoon mobile game style.

Background: semi-transparent dark overlay.
CENTER POPUP: tall rounded rectangle, bright warm gradient fill (peach to light gold), bold dark outline (5px), hard shadow.

Panel header: "每日签到" bold bubble title, calendar + star decoration, bold outlined sparkle bursts.

7-DAY CHECK-IN GRID: 7 rounded square cells in a row (or 4+3 two rows), each cell:
- Bold dark outline
- Cell label "第X天"
- Coin icon (chunky bold outlined circle coin) with amount
- Days 1~3: gray desaturated overlay + large bold checkmark tick (bright green, bold outline) in center
- Day 4 (TODAY): bright golden glow ring around cell, "今天" bold pill label above, cell fill bright yellow, coin bouncing animation implied
- Days 5~7: slightly muted, lock icon overlay (small bold outlined lock)

REWARD BURST: below grid, large illustrated coin explosion — 5~7 coins bursting outward, each chunky bold outlined coin.

CTA: large wide pill "签到！" bright orange-red, bold outline, hard shadow, text with outlined letters.
Close: small bold text.

CORNER MASCOT: capybara waving enthusiastically with a tiny calendar prop, confetti around it.

Style: Western cartoon check-in popup, bold outlines, vibrant colors, chunky rewards.
```

### 中文 Prompt（豆包）

```
手机竖屏游戏每日签到弹窗UI设计，比例9:19.5，欧美卡通移动游戏风格。

背景：半透明深色蒙层。
中央弹窗：较高圆角矩形，亮暖渐变填色（桃色→淡金），粗深色描边（5px），卡通硬阴影。

面板顶部标题："每日签到"粗圆泡泡字，日历+星星装饰，粗描边星光爆炸点缀。

7天签到格子（横排7格或4+3两行），每格：
- 粗深色描边圆角方格
- "第X天"标签
- 厚实粗描边圆形金币图标+数量
- 第1~3天：灰色降饱和叠层+中央大号粗描边绿色打勾（已完成）
- 第4天（今天）：亮金色发光光晕环绕，"今天"粗胶囊标签在上方，格内亮黄色底，金币有跳动感
- 第5~7天：轻微降饱和，小号粗描边锁形图标叠加

格子下方：大号金币爆炸插画——5~7枚金币向四周爆射，每枚厚实圆形粗描边。

行动按钮：超宽胶囊"签到！"，亮橙红色，粗深色描边，卡通硬阴影，文字带外描边。
底部关闭小字。

角落吉祥物：卡皮巴拉开心挥手，拿着迷你日历，周围彩带纸屑飘落。

风格：欧美卡通签到弹窗，粗描边，高饱和色，厚实奖励感。
```

---

## 附：图块图标参考 Prompt（Tile Icons）

### 英文 Prompt（Nano Banana）

```
Set of 15 cute match game tile icons in Western cartoon mobile game style, white background, arranged in a 5×3 grid.
Icons: tangerine, pomelo, apple, strawberry, mangosteen, watermelon, turtle, bird, monkey, mushroom, four-leaf clover, lotus leaf, succulent plant, acorn, music note.

Each icon design principles:
- Rounded square card shape with 5px bold dark outline (#2D1A0E)
- Bright high-saturation flat fill colors (each icon has its own distinct vibrant color)
- Single cel-shading highlight on top-left area
- Hard drop shadow offset (no blur, dark color)
- Character/icon inside is Q-version style — oversized head or main element, tiny body, maximum cuteness
- Each icon has clear personality and expression if applicable (fruit faces optional)
- Jelly variant: same icon but wrapped in a wobbly iridescent gel bubble layer with bold outline

Consistent visual weight, readable at small sizes. Looks like assets from a premium mobile casual game.
Style: Western cartoon game tile icons, bold dark outlines, high saturation, rounded shapes, candy-style.
```

### 中文 Prompt（豆包）

```
治愈欧美卡通风格连连看游戏图块图标集，白色背景，15个图标排列在5×3网格。

图标：砂糖橘、柚子、苹果、草莓、山竹、西瓜、乌龟、小鸟、小猴、蘑菇、四叶草、睡莲、多肉植物、橡果、音符（共15种）。

每个图标设计规范：
- 圆角方形卡片形状，粗深色描边5px（#2D1A0E）
- 高饱和亮色平涂（每种图标有独立鲜明的主色调）
- 左上角单层亮面高光
- 卡通硬阴影（深色偏移，无模糊）
- 图标内主体为Q版比例——主体元素超大，配件极小，最大化可爱感
- 有表情的角色（如动物）加上大眼睛和表情
- 果冻变体：同款图标但外层包裹扭动的虹彩透明果冻气泡层，外轮廓粗描边

图标之间视觉重量一致，小尺寸下可识别。整体质感像高品质手机休闲游戏素材。
风格：欧美卡通游戏图块图标，粗深色描边，高饱和色，圆润造型，糖果感。
```
