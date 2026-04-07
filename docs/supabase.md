# Supabase 接入操作手册

## 一、建表（在 Supabase SQL Editor 执行）

打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目 → 左侧菜单 **SQL Editor** → 粘贴以下语句执行：

```sql
-- 连连看用户表
-- 存储昵称头像、金币、已购、主线关卡进度与世界榜聚合字段
-- 每日挑战状态仅存本地，不在此表中

CREATE TABLE IF NOT EXISTS llk_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  purchased_capybara BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_sound_pack BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_themes TEXT[] NOT NULL DEFAULT '{food}',
  -- current_level = 下一可进入关卡序号（已通最高关 + 1，至少 1）
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  -- 世界榜三键排序字段
  best_level_steps INTEGER NOT NULL DEFAULT 0 CHECK (best_level_steps >= 0),
  best_level_cleared_at BIGINT NOT NULL DEFAULT 0,
  -- 防刷字段
  last_report_at BIGINT NOT NULL DEFAULT 0,
  suspicious_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自动更新 updated_at 触发器
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

-- 世界榜复合索引（关卡数 DESC → 步数 ASC → 通关时间戳 ASC）
CREATE INDEX IF NOT EXISTS idx_llk_users_rank
  ON llk_users (current_level DESC, best_level_steps ASC, best_level_cleared_at ASC);

-- Row Level Security：anon key 只读，写操作仅 service_role（Edge Function）执行
ALTER TABLE llk_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON llk_users
  FOR SELECT USING (true);
```

---

## 二、部署 Edge Functions（终端命令）

### 1. 安装 Supabase CLI

```bash
npm install -g supabase
```

### 2. 登录并链接项目

```bash
# 登录（会打开浏览器授权）
supabase login

# 链接到项目（project-ref 是 URL 中的子域名，如 krajrhnieoplqshmujwa）
supabase link --project-ref krajrhnieoplqshmujwa
```

### 3. 配置 Secrets（服务端密钥，绝不进入客户端）

```bash
# 微信小游戏 AppId（在微信公众平台后台查看）
supabase secrets set WX_APP_ID=wx54d506ca8d073e11

# 微信小游戏 AppSecret（在微信公众平台后台查看，保密！）
supabase secrets set WX_APP_SECRET=<填入你的AppSecret>

# Supabase service_role key（在 Dashboard → Settings → API → service_role 复制）
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<填入service_role_key>
```

> ⚠️ `WX_APP_SECRET` 和 `SUPABASE_SERVICE_ROLE_KEY` 只存在这里，**绝对不要**写入 `.env` 或提交到 git。

### 4. 部署两个 Edge Functions

```bash
# 部署微信登录函数
supabase functions deploy wx-login --no-verify-jwt

# 部署通关上报函数
supabase functions deploy llk-report --no-verify-jwt
```

### 5. 验证部署

```bash
# 查看已部署的函数列表
supabase functions list

# 测试 wx-login（code 需从真实 wx.login 获取，此处仅测试连通性）
curl -X POST https://krajrhnieoplqshmujwa.supabase.co/functions/v1/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
# 预期返回：{"error":"wx_auth_failed",...} 或 {"error":"server not configured"}（说明函数已部署）
```

---

## 三、Edge Functions 源码说明

函数源码位于本项目：

| 函数名 | 文件路径 | 功能 |
|--------|----------|------|
| `wx-login` | `supabase/functions/wx-login/index.ts` | wx.code → openid → upsert用户 → 返回userId |
| `llk-report` | `supabase/functions/llk-report/index.ts` | 通关上报、限频、防刷、更新世界榜字段 |

---

## 四、关键信息速查

| 项目 | 值 |
|------|-----|
| Project URL | `https://krajrhnieoplqshmujwa.supabase.co` |
| Project Ref | `krajrhnieoplqshmujwa` |
| Anon Key（客户端只读） | 见 `.env` 文件 `SUPABAES_PROJECT_SECRET` |
| wx-login 函数地址 | `https://krajrhnieoplqshmujwa.supabase.co/functions/v1/wx-login` |
| llk-report 函数地址 | `https://krajrhnieoplqshmujwa.supabase.co/functions/v1/llk-report` |

---

## 五、世界榜排序规则（spec 权威）

```sql
-- 客户端直接 GET 此 URL 即可拉取 Top 50 世界榜
SELECT nickname, avatar_url, current_level, best_level_steps, best_level_cleared_at
FROM llk_users
WHERE suspicious_count < 3
ORDER BY current_level DESC, best_level_steps ASC, best_level_cleared_at ASC
LIMIT 50;
```

排序键优先级：
1. `current_level DESC`：已通最高关卡序号，越大越靠前
2. `best_level_steps ASC`：当前最高关那局步数，越少越靠前
3. `best_level_cleared_at ASC`：通关物理时间戳（Unix ms），越早越靠前
