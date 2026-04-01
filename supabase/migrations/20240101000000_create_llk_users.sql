-- 连连看用户表
-- 存储昵称头像、金币、已购、主线关卡进度与世界榜聚合字段
-- 每日挑战状态仅存本地，不在此表中

CREATE TABLE IF NOT EXISTS llk_users (
  -- 主键：使用 uuid，与 openid 分离以降低泄露风险
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 微信身份（唯一索引，用于登录后查找用户）
  openid TEXT NOT NULL UNIQUE,

  -- 展示信息（来自 wx.getUserInfo 或 wx.getUserProfile）
  nickname  TEXT        NOT NULL DEFAULT '',
  avatar_url TEXT       NOT NULL DEFAULT '',

  -- 经济数据
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),

  -- 已购项目（bool 字段，后期可改为 JSONB 数组以扩展）
  purchased_capybara  BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_sound_pack BOOLEAN NOT NULL DEFAULT FALSE,

  -- 已解锁主题（text 数组，默认含 'food'）
  unlocked_themes TEXT[] NOT NULL DEFAULT '{food}',

  -- 主线关卡进度
  -- current_level = 下一可进入关卡序号（= 已通最高关 + 1，至少 1）
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),

  -- 世界榜聚合字段（三键排序：关卡数 DESC, 步数 ASC, 通关时间戳 ASC）
  -- 语义：当前最高关卡（current_level - 1）那一局的步数
  best_level_steps    INTEGER NOT NULL DEFAULT 0 CHECK (best_level_steps >= 0),
  -- 达到当前最高关卡时的物理时间（Unix ms），用于并列时比先后
  best_level_cleared_at BIGINT  NOT NULL DEFAULT 0,

  -- 防刷辅助字段
  -- 上次上报时间（用于服务端限频）
  last_report_at BIGINT NOT NULL DEFAULT 0,
  -- 连续异常上报计数（步数异常时累加；超阈值后需人工审核）
  suspicious_count INTEGER NOT NULL DEFAULT 0,

  -- 元数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON llk_users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON llk_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 世界榜查询用复合索引（关卡数 DESC, 步数 ASC, 通关时间戳 ASC）
CREATE INDEX IF NOT EXISTS idx_llk_users_rank
  ON llk_users (current_level DESC, best_level_steps ASC, best_level_cleared_at ASC);

-- Row Level Security：客户端只能读，写操作由 Edge Function 以 service_role 执行
ALTER TABLE llk_users ENABLE ROW LEVEL SECURITY;

-- 任何人可读（世界榜展示），不允许客户端直接写
CREATE POLICY "public read" ON llk_users
  FOR SELECT USING (true);

-- 说明：INSERT / UPDATE 仅允许 service_role（Edge Function）执行
--       客户端持有 anon key，无写权限
