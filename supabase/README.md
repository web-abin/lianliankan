# Supabase 配置说明

## 数据库迁移

在 Supabase Dashboard → SQL Editor 中执行：

```
supabase/migrations/20240101000000_create_llk_users.sql
```

## Edge Functions 部署

需要安装 Supabase CLI（`npm install -g supabase`），然后：

```bash
# 登录
supabase login

# 链接项目（用 .env 中的 Project URL 后面的 project-ref）
supabase link --project-ref krajrhnieoplqshmujwa

# 设置 Edge Function 所需的 Secrets（仅服务端，不进入客户端）
supabase secrets set WX_APP_ID=wx54d506ca8d073e11
supabase secrets set WX_APP_SECRET=<填入微信小游戏后台的 AppSecret>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<填入 Supabase Dashboard → Settings → API → service_role key>

# 部署两个 Edge Functions
supabase functions deploy wx-login
supabase functions deploy llk-report
```

## 环境变量（.env）

客户端构建时需要的变量（已在 .env 中）：

| 变量名                  | 用途                              |
|------------------------|-----------------------------------|
| SUPABAES_PROJECT_URL   | Supabase REST/函数 base URL       |
| SUPABAES_PROJECT_SECRET | Supabase anon key（客户端只读）  |

> ⚠️ **绝不**将 `service_role key` 或 `WX_APP_SECRET` 写入 `.env` 文件并提交，这两个密钥仅存在 Supabase Secrets 中。

## 防刷策略（MVP）

| 层次      | 措施                                                        |
|-----------|-------------------------------------------------------------|
| 客户端    | Session 2 小时缓存，避免每次通关重新 wx.login              |
| Edge Function | 同一用户上报间隔 ≥ 30s（以 `last_report_at` 判断）     |
| Edge Function | 步数合理性校验：< minSteps 或 > minSteps×20 则标记 suspicious |
| Edge Function | suspicious_count ≥ 3 时不更新排行榜字段（仍记录日志）   |
| 数据库    | RLS 策略：anon key 只读；写操作仅 service_role 执行        |

## 世界榜排序规则（spec 权威定义）

1. `current_level DESC`（已通最高关卡序号降序）
2. `best_level_steps ASC`（当前最高关那局步数升序，步少优先）
3. `best_level_cleared_at ASC`（通关物理时间戳升序，更早优先）
