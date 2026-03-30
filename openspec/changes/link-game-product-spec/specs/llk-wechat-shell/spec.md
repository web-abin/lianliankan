## ADDED Requirements

### Requirement: 首页功能入口

首页 SHALL 提供入口：圈子好礼、喊人、添加桌面、每日奖励、开始游戏、每日挑战、商店、主题、排行榜；并提供设置（音效、震动、音乐、问题反馈）。

#### Scenario: 开始游戏展示进度

- **WHEN** 玩家查看首页「开始游戏」
- **THEN** 系统展示当前可进入的关卡序号（例如第 4 关）

### Requirement: 圈子、桌面与签到

系统 SHALL 按经济 spec 发放圈子一次性奖励与桌面每日奖励； SHALL 实现连续签到 UI 与第 1–7 天奖励发放逻辑。

#### Scenario: 圈子一次性金币

- **WHEN** 玩家完成加入游戏圈条件（以微信能力为准）
- **THEN** 系统发放 100 金币且该奖励每个账号仅一次

### Requirement: 好友榜与世界榜

系统 SHALL 提供好友排行榜与世界排行榜入口。世界榜 SHALL 使用 Supabase 数据与 `llk-sync-rank-supabase` 中的排序规则。好友榜 SHALL 使用微信开放数据域能力展示关系链数据（主域通过 `postMessage` 与开放数据域通信），排序指标 SHOULD 与世界榜一致以便理解。

#### Scenario: 世界榜入口

- **WHEN** 玩家选择世界排行榜
- **THEN** 系统展示从 Supabase 拉取并按规则排序的列表

### Requirement: 问题反馈

系统 SHALL 使用微信小游戏官方提供的客服入口或客服会话能力承载「问题反馈」， SHALL NOT 依赖外部网页表单作为唯一渠道。

#### Scenario: 打开客服

- **WHEN** 玩家在设置中点击问题反馈
- **THEN** 系统调起微信客服能力

### Requirement: 性能与分包

系统 SHALL 为多主题图集规划分包或按需下载，控制首包体积； SHALL 在低端机上保证连连看主玩法可玩（具体帧率目标在实现任务中量化）。

#### Scenario: 非首包主题

- **WHEN** 玩家解锁非默认主题且本地无图集
- **THEN** 系统触发下载或分包加载后再应用主题

### Requirement: 分享与激励视频迁移

系统 SHALL 以分享作为局内道具主要获取方式； SHALL 为后续接入激励视频广告保留统一入口（与 `llk-economy-store` 一致）。

#### Scenario: 分享失败

- **WHEN** 用户取消分享或分享失败
- **THEN** 系统不增加道具并发提示失败原因（若平台可区分）
