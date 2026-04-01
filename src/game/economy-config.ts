/** OpenSpec llk-economy-store 定价与来源常量 */

export const SHOP_PRICE_CAPYBARA = 400
export const SHOP_PRICE_TOOL_PACK = 300
export const SHOP_PRICE_SOUND_PACK = 400
export const SHOP_PRICE_BLOOD = 50

/** 连续签到第 1–7 天金币（第 7 天起封顶 50） */
export const SIGN_IN_COINS = [5, 10, 15, 20, 30, 40, 50] as const

export const COINS_DESK_DAILY = 50
export const COINS_MAIN_CLEAR_PER_LEVEL = 20
export const COINS_CIRCLE_ONCE = 100

/** 喊人 +3 血；每日次数上限（0 表示不限制） */
export const SHOUT_BLOOD_BONUS = 3
export const SHOUT_DAILY_CAP = 0

/** 局内分享成功：提示/刷新/消除 各增加量 */
export const SHARE_BONUS_HINT = 3
export const SHARE_BONUS_REFRESH = 1
export const SHARE_BONUS_ELIMINATE = 1

/** 激励视频开关：与分享并行，true 时优先走激励视频入口（占位） */
export const FEATURE_REWARDED_VIDEO = false
