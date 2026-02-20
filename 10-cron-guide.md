## 通用 Agent 教学：用 Agent 建立/修订 Moltbot（Clawdbot）Cron 任务

> 目标：让任何人都能“指挥一个 Agent”，安全、可复现地创建/修改/停用/删除 cron 任务，并能自检是否真的生效。  
> 适用范围：Moltbot Gateway 内置 Cron（任务持久化在 `~/.moltbot/cron/jobs.json` 一类位置），**不是** Linux `crontab`。

---

## 直接给 Agent 下单（推荐命令格式：复制即用）

> 你只要把下面模板之一原样发给 Agent；**Agent 应该直接执行**（盘点 → 变更 → 验收 → 回报），而不是只讲解。
>
> 可选字段：
> - `user`: 目标 OS 用户（cron store 通常在该用户的 `~/.moltbot/` 下）。不写时，Agent 应默认选择“正在运行 gateway 的用户”（本机通常是 `admin`）。

### 1) 列出所有任务（含禁用）

```text
CRON LIST
user: admin
includeDisabled: true
```

### 2) 新增任务（main + systemEvent，适合日报/周报）

```text
CRON ADD
user: admin
name: Daily Report
schedule:
  kind: cron
  expr: "0 9 * * *"
  tz: Asia/Shanghai
sessionTarget: main
wakeMode: next-heartbeat
payload:
  kind: systemEvent
  text: |
    执行：生成日报，包含……（把你的指令写在这里）
smokeTest: true
```

### 3) 修改任务（按 id 或 name，推荐 id）

```text
CRON EDIT
user: admin
id: "<jobId>"
patch:
  wakeMode: now
  schedule:
    kind: cron
    expr: "0 * * * *"
    tz: Asia/Shanghai
smokeTest: true
```

也可以用 name（Agent 需要先匹配唯一任务再改）：

```text
CRON EDIT
user: admin
name: "VLA Daily Hotspots"
patch:
  schedule:
    kind: cron
    expr: "0 10 * * *"
    tz: Asia/Shanghai
smokeTest: true
```

### 4) 启用 / 停用 / 删除 / 立即运行 / 查看历史

```text
CRON ENABLE
user: admin
id: "<jobId>"
```

```text
CRON DISABLE
user: admin
id: "<jobId>"
```

```text
CRON REMOVE
user: admin
id: "<jobId>"
```

```text
CRON RUN
user: admin
id: "<jobId>"
force: true
```

```text
CRON RUNS
user: admin
id: "<jobId>"
limit: 50
```

---

## 你需要提供给 Agent 的信息（最小集合）

- **任务名**：清晰且稳定（例如 `Daily Report - Sales`）
- **运行时间**：
  - **cron 表达式**（5 段）+ **时区**（IANA，如 `Asia/Shanghai`），或
  - `at`（一次性时间点），或
  - `every`（固定间隔）
- **在哪里跑**（二选一）：
  - `sessionTarget: "main"`：进入主会话心跳流程（共享上下文）
  - `sessionTarget: "isolated"`：独立会话 `cron:<jobId>`（更干净、更适合后台杂务）
- **怎么唤醒**（二选一）：
  - `wakeMode: "now"`：立即触发（告警/健康检查推荐）
  - `wakeMode: "next-heartbeat"`：等下一次心跳（日报/周报推荐）
- **要做什么**（payload）：
  - main：`payload.kind = "systemEvent"` + `text`
  - isolated：`payload.kind = "agentTurn"` + `message`（可选 deliver/channel/to 等）

---

## 关键约束（写给 Agent 的“硬规则”）

- **main session** 只能用：
  - `sessionTarget: "main"` ⇒ `payload.kind` 必须是 `"systemEvent"`
- **isolated session** 只能用：
  - `sessionTarget: "isolated"` ⇒ `payload.kind` 必须是 `"agentTurn"`
- **一次只改一个维度更安全**：
  - 先改 schedule，再改 payload；或反过来。不要一次 patch 太多字段。

---

## 推荐操作方式（按优先级）

### 方式 A：让 Agent 用 CLI 管理（最稳）

Agent 按下面流程执行（你也可以直接复制给 Agent 当作执行指令）：

> 重要：Cron 的 job store 与 OS 用户的 `HOME` 强相关（通常在 `~/.moltbot/cron/`）。
> 如果 Agent 是以 root 运行命令，但你要管理的是 `admin` 的 cron，就要用 `sudo -u admin -H ...` 或 `runuser -u admin -- ...` 来执行 CLI，
> 否则很容易改到 root 自己的 `~/.moltbot`（或者写错权限）。

1) **先盘点现状**
- `moltbot cron status`
- `moltbot cron list --all`

2) **创建任务**
- `moltbot cron add ...`

3) **修改任务（patch）**
- `moltbot cron edit <jobId> ...`

4) **启用/停用/删除**
- 启用：`moltbot cron enable <jobId>`（或 `moltbot cron edit <jobId> --enable`）
- 停用：`moltbot cron disable <jobId>`（或 `moltbot cron edit <jobId> --disable`）
- 删除：`moltbot cron rm <jobId>`（别名：`remove` / `delete`）

5) **自检**
- 立即试跑：`moltbot cron run <jobId> --force`
- 看历史：`moltbot cron runs --id <jobId> --limit 50`

> 备注：CLI 会通过 Gateway RPC（`cron.add/update/remove/run/runs`）来改 job store，避免你手改 JSON 造成格式/并发问题。

### 方式 B：让 Agent 走 Gateway/Tool 调用（适合内置工具环境）

如果你的 Agent 运行环境提供了名为 `cron` 的工具，常见调用形状如下（示意）：

- 列表：

```json
{ "action": "list", "includeDisabled": true }
```

- 新增：

```json
{
  "action": "add",
  "job": {
    "name": "Example Job",
    "enabled": true,
    "schedule": { "kind": "cron", "expr": "0 9 * * *", "tz": "Asia/Shanghai" },
    "sessionTarget": "main",
    "wakeMode": "next-heartbeat",
    "payload": { "kind": "systemEvent", "text": "执行：……" }
  }
}
```

- 修改（patch）：

```json
{
  "action": "update",
  "jobId": "<jobId>",
  "patch": {
    "wakeMode": "now"
  }
}
```

- 删除/立即运行/查看历史：

```json
{ "action": "remove", "jobId": "<jobId>" }
```

```json
{ "action": "run", "jobId": "<jobId>" }
```

```json
{ "action": "runs", "jobId": "<jobId>" }
```

---

## Cron 表达式速查（5 段）

```text
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 星期 (0-6，0=周日；部分实现也接受 7=周日)
│ │ │ │ │
* * * * *
```

---

## 最常见的 3 个模板（给 Agent 直接套用）

### 模板 1：主会话日报（next-heartbeat）

**需求**：每天 09:00（上海时区）在主会话生成日报，不要立刻打断心跳节奏。  
**建议**：`sessionTarget=main` + `systemEvent` + `wakeMode=next-heartbeat`。

CLI 示例：

```bash
moltbot cron add \
  --name "Daily Report" \
  --cron "0 9 * * *" \
  --tz "Asia/Shanghai" \
  --session main \
  --wake next-heartbeat \
  --system-event "执行：生成日报（包含……）"
```

### 模板 2：告警/健康检查（now）

**需求**：每小时一次，发现异常就立刻提醒。  
**建议**：`wakeMode=now`。

CLI 示例：

```bash
moltbot cron add \
  --name "Health Check" \
  --cron "0 * * * *" \
  --tz "Asia/Shanghai" \
  --session main \
  --wake now \
  --system-event "执行：检查磁盘/内存/关键进程；仅失败时才通知。"
```

### 模板 3：隔离任务 + 投递到指定渠道（isolated + deliver）

**需求**：任务很吵，不想污染主会话；但结果要推送到 Telegram/Slack。  
**建议**：`sessionTarget=isolated` + `agentTurn` + `deliver/channel/to`。

CLI 示例（以 Telegram 为例，`to` 用占位符）：

```bash
moltbot cron add \
  --name "Nightly Summary (isolated)" \
  --cron "0 22 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --wake next-heartbeat \
  --message "执行：生成夜间总结（……）" \
  --deliver \
  --channel telegram \
  --to "<telegram-chat-id-or-topic>"
```

---

## 让 Agent“验收是否生效”的标准清单

Agent 每次变更后都要做：

- **列出任务确认字段已更新**：`moltbot cron list --all`
- **强制立即跑一次**（用于验证 payload/权限/外部依赖）：`moltbot cron run <jobId> --force`
- **检查 runs 里有没有错误**：`moltbot cron runs --id <jobId> --limit 20`
- **确认时区无误**：列表中 `tz` 与预期一致（避免“看起来是 9 点，实际按 UTC 跑”）

---

## 常见坑（提前让 Agent 避免）

- **把它当 Linux crontab**：这里 cron 跑在 Gateway 内部；系统 `crontab -l` 为空不代表没任务。
- **main/isolated 乱配 payload**：会直接被拒或运行异常；严格遵守“关键约束”。
- **一次性改太多字段**：排障困难；建议拆成两次 patch。
- **没做一次 `run --force`**：上线后才发现缺依赖/权限/外部接口变更。

---

## 推荐新增：早间网关预检（防超时）

用于在首批日任务前 10-15 分钟检查网关健康，失败自动拉起，降低后续任务 timeout 风险。

- 推荐计划：`30 6 * * *`（Asia/Shanghai）
- 推荐 Session：`isolated`
- 推荐 Agent：`main`
- 推荐路由：异常时走运维告警 bot（`account=new`）

执行脚本建议：

```bash
python3 /home/admin/clawd/scripts/gateway-preflight.py
```

运行约束建议：
- 正常时 stdout 为空（保持静默，不打扰）
- 异常才输出告警摘要
- 任务 prompt 限制“只允许 1 次 exec 调用该脚本”，禁止额外工具调用