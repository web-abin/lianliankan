/** 定价与奖励数值常量（与需求文档保持一致） */

// ── 商店定价 ─────────────────────────────────────
export const SHOP_PRICE_CAPYBARA = 400
/** 单个道具售价：提示 / 刷新 / 消除均为 100 金币 */
export const SHOP_PRICE_TOOL = 100
export const SHOP_PRICE_SOUND_PACK = 400
/** 购买血量单价 */
export const SHOP_PRICE_BLOOD = 50

// ── 金币来源 ─────────────────────────────────────
/** 连续签到第 1–7 天金币（第 7 天起封顶 50） */
export const SIGN_IN_COINS = [5, 10, 15, 20, 30, 40, 50] as const
/** 每日添加桌面奖励 */
export const COINS_DESK_DAILY = 50
/** 主线每通关 1 关奖励 */
export const COINS_MAIN_CLEAR_PER_LEVEL = 20
/** 圈子好礼一次性奖励 */
export const COINS_CIRCLE_ONCE = 100
/** 每日挑战通关奖励 */
export const COINS_DAILY_CHALLENGE = 50

// ── 血量来源 ─────────────────────────────────────
/** 喊人成功 +3 血 */
export const SHOUT_BLOOD_BONUS = 3
/** 喊人每日次数上限（0 = 不限制） */
export const SHOUT_DAILY_CAP = 0

// ── 局内道具分享补给 ──────────────────────────────
/** 每个道具每日最多可分享补给次数 */
export const TOOL_SHARE_DAILY_CAP = 3
/** 分享成功每次补给 1 个道具 */
export const SHARE_BONUS_PER_TOOL = 1

/** 激励视频开关（占位，未接入时为 false） */
export const FEATURE_REWARDED_VIDEO = false
