# Moltbot + Clawd 系统设计（VLA 任务群为主）

> 最后更新：2026-02-19 rev.11（Asia/Shanghai）  
> 相关文档：`20-cron-tasks.md`（任务清单）、`30-vla-tasks.md`（VLA 任务群）、`40-ai-app-tasks.md`（AI App 任务群）、`40-migration-runbook.md`（迁移）  
> 设计目标：用**脚本编排**把每日信号沉淀为可复用资产（memory + GitHub），并通过周期任务做跨内容推理与校验。

## 0) 总体思维：这套系统的必然性（先读这个）

如果你在做任何快速演进的研究或研发（VLA/具身智能只是本文的落地例子），**每天都会被同一个结构性问题困住**：

- 论文与项目数量高速增长（RSS、GitHub、公司动态、基准榜单、Demo、融资……）
- “读到了”并不等于“沉淀了”：消息流会消失，链接会失效，团队成员的记忆会漂移
- LLM 能写摘要，但**不擅长稳定地维护一个长期知识库**（尤其当输入变长、约束变多时）

因此，结论不是“要不要做自动化”，而是：**必须把信息流变成资产流**。这套系统的必然性来自三个不可回避的事实：

### 0.1 必然性 1：你需要可复跑、可审计的“研究情报流水线”

研究情报不是一次性输出，而是可回溯的决策依据：

- 你要知道“某条结论是基于哪个来源、哪天出现、后来有没有被推翻”
- 你需要能复盘：为什么那天没收录、为什么后来才发现、是谁/哪个规则过滤掉了

这要求流水线具备：**确定性（prep） + 结构化（LLM） + 落盘（post） + 验收（watchdog）**。

### 0.2 必然性 2：你需要把 LLM 放到它最擅长的位置（而不是让它统治全流程）

LLM 最强的是“在有限上下文里做结构化表达与归纳”，最弱的是“长期状态一致性与去重”。

所以系统采用两阶段：

- **prep（脚本）**：抓取、过滤、去重、候选集裁剪（可复跑、可对账）
- **LLM（可选）**：只基于候选集生成严格 JSON（输入有上限、输出有 schema）
- **post（脚本）**：写入 memory / GitHub / Telegram（可审计、可回滚）

### 0.3 必然性 3：你需要一个“长期公共接口”，让团队协作和知识复用变简单

仅靠 Telegram 不够：它适合触达，不适合沉淀；也不适合作为团队协作入口。

所以系统把 GitHub 的 VLA-Handbook 当作交付层，让“每天/每周的信号”进入可检索、可评审、可版本化的知识库（详见下方 `5.0`）。

---

### 0.4 为什么是 Moltbot（它的特性被用在了哪里）

这套系统不是“几段 cron + 脚本拼起来”，而是把 Moltbot 当作执行平面使用：

- **统一调度**：`cron/jobs.json` 作为单一任务入口，避免散落在多处的 crontab 难维护
- **多 Agent 分工**：`reports` 负责研究类推理；`main` 负责健康检查；其他 agent 分担不同任务群
- **消息通道能力**：内置 Telegram 账号路由、静默策略、异常告警输出（脚本只需调用 CLI）
- **工具编排**：LLM 与 web search 只在限定阶段出现，降低不可控 side effects
- **并发与隔离**：maxConcurrent/subagents 约束，避免早间任务互相争抢资源导致“连锁超时”

### 0.5 为什么必须回写 GitHub（Handbook 的特性被用在了哪里）

GitHub 的价值不在“存文件”，而在它天然提供的工程特性：

- **版本化**：commit/diff/time/author 让每条结论可追溯、可回滚
- **协作**：PR/Review 把“系统自动追加”与“人类编辑”放在同一个协作面上
- **可检索**：Markdown 目录结构 + 全文搜索，让知识库可持续生长
- **公共接口**：对外暴露稳定的、可消费的文档入口（`theory/`、`deployment/`、`reports/`）

### 0.6 你最终得到的不是“日报”，而是一套可持续的知识资产（ASCII）

```
Sources(RSS,Github,Leaderboards,Web) 
  └─► prep(确定性候选与去重)
        └─► LLM(可选,严格JSON)
              └─► post(落盘+交付)
                    ├─► memory/  (唯一状态源,可复跑)
                    ├─► GitHub   (长期知识库,可审计/协作)
                    └─► Telegram (即时触达,低打扰)

And:
  watchdog(验收与补跑) + preflight(网关自愈) + crontab(兜底)
```

---

## 1) 系统全景（ASCII）

```
                 ┌───────────────────────────────────────┐
                 │               systemd                 │
                 │  /home/admin/.config/systemd/user/    │
                 │    moltbot-gateway.service            │
                 └───────────────────────┬───────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           Moltbot Gateway                             │
│  Node: /usr/bin/node (v24.13.0)                                       │
│  Entry: /opt/moltbot/dist/index.js                                    │
│  Port: 18789 (LAN bind)                                               │
│  Config: /home/admin/.moltbot/moltbot.json                             │
│  Cron:   /home/admin/.moltbot/cron/jobs.json (27 jobs)                │
│  Agents: main / reports / ai_daily_pick / ai_app_monitor              │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ triggers (by schedule)
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           Clawd Workspace                             │
│  /home/admin/clawd/                                                   │
│   ├─ scripts/  (prep/run/post/gh/tools)                               │
│   ├─ memory/   (持久状态，唯一状态源)                                  │
│   │   ├─ *.json                                                       │
│   │   └─ tmp/  (两阶段中间产物)                                        │
│   └─ VLA-Handbook/ (仓库工作区/子目录)                                 │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ reads/writes
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          External Systems                             │
│  GitHub Contents API  ──(read/write)──► sou350121/VLA-Handbook         │
│                       ──(read/write)──► sou350121/Agent-Playbook      │
│  Telegram Bot API      ──(send msg)──► chat_id 1898430254               │
│  Alibaba Cloud Qwen     ──(LLM)──────► reports agent                   │
│  Perplexity Search      ──(web)──────► vla social / hw search          │
│  Evo-SOTA raw JSON      ──(read)─────► SOTA tracker                    │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.1 组件职责（文字说明）

- **systemd user service**：负责把 Gateway 变成“常驻服务”，提供自动重启能力（`Restart=always`）。这保证了 cron 调度与消息通道在机器短暂抖动后能自动恢复。
- **Moltbot Gateway**：统一的“调度与执行平面”。它读取 `jobs.json` 作为任务定义，按时触发各个 agent 的 turn，并负责把消息投递到 Telegram、把工具调用串起来。
- **Clawd Workspace**：统一的“数据与脚本平面”。所有任务的确定性逻辑都在 `scripts/`，所有持久状态都在 `memory/`，两者共同保证**可复跑**与**可迁移**。
- **External Systems**：GitHub/Telegram/Qwen/Perplexity/Evo-SOTA 都被当作“可替换的外部依赖”。系统设计上避免把关键状态放在外部系统里，外部系统只做**输入源**或**交付渠道**。

---

## 2) 外部系统集成与认证（ASCII）

```
┌───────────────────────────┐
│ GitHub API (Contents)     │
│  - read/write markdown    │
│  - rate limit friendly    │
└─────────────┬─────────────┘
              │ token env: GITHUB_TOKEN
              │ config: /home/admin/clawd/memory/github-config.json
              │         /home/admin/clawd/memory/github-config-agent-playbook.json (Agent-Playbook)
              │ token file fallback: /home/admin/.moltbot/.env
              ▼
  used by:
   - /home/admin/clawd/scripts/gh-paper-index-update.py
   - /home/admin/clawd/scripts/gh-contents-upload.py
   - /home/admin/clawd/scripts/post-vla-sota.py (benchmark_tracker.md)
   - /home/admin/clawd/scripts/post-vla-release.py (release_tracker.md)
   - /home/admin/clawd/scripts/post-ai-app-workflow.py (Agent-Playbook blog/)
   - /home/admin/clawd/scripts/post-vla-weekly.py (VLA-Handbook reports/weekly/)
   - /home/admin/clawd/scripts/post-ai-weekly.py (Agent-Playbook blog/)
   - /home/admin/clawd/scripts/gh-handbook-changes-collect.py

┌───────────────────────────┐
│ Telegram Bot API          │
│  - push updates/alerts    │
└─────────────┬─────────────┘
              │ tokens live in:
              │  /home/admin/.moltbot/moltbot.json (accounts)
              ▼
  sending path:
   - CLI: /home/admin/.local/share/pnpm/moltbot message send ...
   - used in post-* scripts and some runners

┌───────────────────────────┐
│ Alibaba Cloud Qwen         │
│  - LLM generation          │
└─────────────┬─────────────┘
              │ keys live in:
              │  /home/admin/.moltbot/agents/*/agent/auth-profiles.json
              ▼
  used by:
   - VLA Daily: run-vla-daily-two-phase.py (agent generation)
   - VLA Social: run-vla-social-two-phase.py (agent generation)
   - Biweekly: gateway job prompt uses qwen model for reasoning
   - SOTA: prep-vla-sota.py 仅用于“机构补全”小批量调用（非正文生成）

┌───────────────────────────┐
│ Perplexity Web Search      │
│  - bounded web search      │
└─────────────┬─────────────┘
              │ key lives in moltbot.json (tools.web.search)
              ▼
  used by:
   - prep-vla-social.py (phase 1)
   - prep-vla-release.py (Layer 2 硬件厂商定向搜索 via agent)

┌───────────────────────────┐
│ Evo-SOTA raw JSON          │
│  - raw GitHub JSON         │
└─────────────┬─────────────┘
              ▼
  used by:
   - prep-vla-sota.py (public/data/*.json)
```

### 2.1 安全与可运维性（文字说明）

- **GitHub Token 管理**：GitHub 写入通过 config JSON 指定 `token_env`（当前为 `GITHUB_TOKEN`），并允许从 `/home/admin/.moltbot/.env` 读取兜底。VLA-Handbook 使用 `github-config.json`，Agent-Playbook 使用 `github-config-agent-playbook.json`。设计目标是让“换 token / 换 repo”不需要改脚本代码。
- **Telegram 多账号路由**：Bot token 存在 `moltbot.json` 的 `channels.telegram.accounts` 内。系统使用 3 个 Bot 按领域分流：`original`（VLA 内容）、`ai_agent_dailybot`（AI App/Agent 内容）、`new`（系统运维告警）。Cron job 通过 `payload.account` 字段指定；**默认值为空即走 `original`（VLA bot）**，AI App 类任务必须显式设置 `account: ai_agent_dailybot`，否则内容发到错误频道。`moltbot cron edit` CLI 不支持 `--account`，若需修改须停 gateway → 手动改 `~/.moltbot/cron/jobs.json` → 重启（见 `40-ai-app-tasks.md` §8 rev.11）。
- **LLM Key 按 agent 隔离**：LLM key 放在 `~/.moltbot/agents/<agent>/agent/auth-profiles.json`，这样可以做到“某个任务/agent 出问题时单独轮换 key”，减少全局风险。
- **外部搜索的边界**：Perplexity/Web Search 只用于“候选生成”层（prep），避免让 LLM 在正文生成阶段再次联网导致不可控的事实漂移。

---

## 3) 每日任务时序与依赖（ASCII）

### 3.1 全周任务日历（完整视图）

```
┌─────────────────────────────────────────────────────────────────────┐
│  时间(CST)  │ 每日(Mon–Sun)          │ 一/三/五         │ 周五    │ 周日  │
├─────────────┼────────────────────────┼──────────────────┼─────────┼───────┤
│  06:00      │ memory-snapshot (cron) │                  │         │       │
│  06:30      │ Gateway Preflight      │                  │         │       │
│  06:45      │ AI App RSS             │                  │         │       │
│  07:30      │ VLA RSS 收集           │                  │         │       │
│  08:00      │ VLA Daily Hotspots     │                  │         │       │
│  08:30      │ VLA Social Intel       │                  │         │       │
│  08:45      │ VLA SOTA Tracker       │                  │         │       │
│  09:00      │ VLA Release Tracker    │                  │         │       │
│  09:15      │ Calibration Check      │                  │         │       │
│  09:30      │ Daily Watchdog 验收    │                  │         │       │
│  15:30      │                        │ Theory Deep Dive │         │       │
│             │                        │   (Round 1)      │         │       │
│  16:00      │                        │ Theory Deep Dive │         │       │
│             │                        │   (Round 2)      │         │       │
│  17:30      │                        │                  │ VLA     │       │
│             │                        │                  │ Weekly  │       │
│  11:00      │                        │                  │         │ AI    │
│             │                        │                  │         │ Weekly│
│  12:00      │                        │                  │         │ AI    │
│             │                        │                  │         │ Self  │
├─────────────┼────────────────────────┼──────────────────┼─────────┼───────┤
│             │     二/四/六 15:30     │                  │         │       │
│  15:30      │  AI App Deep Dive     │                  │         │       │
└─────────────┴────────────────────────┴──────────────────┴─────────┴───────┘

  另：VLA-Handbook Biweekly Report 每隔两周 10:00 (anchor Feb 10)
      VLA Biweekly Reflection       每隔两周 10:30（Report 后 30 分钟）
      AI App Biweekly Report        每隔两周 10:00 (anchor Feb 17，与 VLA 错开一周)
      AI App Biweekly Reflection    每隔两周 10:30（Report 后 30 分钟）
      AI Agent 自省与自动调参      每周日 14:00（低风险自动调参）
```

> **阅读提示**：早间 06:00–09:30 链路每日运行，是系统的"信息采集层"；下午/晚间任务是"深度生成层"，在采集层数据就绪后运行。

### 3.1.1 早间关键链路详情（06:00–09:30）

```
06:00  (linux crontab) memory-snapshot.py
06:30  Gateway Preflight  -> 健康检查；必要时重启 gateway；成功则静默
06:45  AI App RSS (非 VLA)
07:30  VLA RSS 收集 (vla-rss-YYYY-MM-DD.json)
08:00  VLA Daily Hotspots 依赖 07:30 的 RSS 文件
08:30  VLA Social Intelligence 读取 vla-daily-hotspots / vla-rss 做 exclusion
08:45  VLA Benchmark SOTA Tracker (Evo-SOTA raw json)
09:00  VLA Release Tracker (GitHub releases + hw web search)
09:10  (linux crontab) watchdog 备用（万一 gateway 调度失效）
09:30  Daily Watchdog - 验收与补跑（全链路）
```

### 3.1.2 下午/周度任务详情

```
Theory Deep Dive (一/三/五 15:30 + 16:00):
  - R1 15:30: prep-vla-theory.py 选论文 → Qwen agent → post-vla-theory.py
  - R2 16:00: 同上，prep 自动排除 R1 已写论文（读 vla-theory-articles.json）
  - 依赖：vla-daily-hotspots.json（当天 08:00 已落盘）
  - 产出：GitHub VLA-Handbook theory/*.md + vla-theory-articles.json

VLA Weekly Deep Dive (周五 17:30):
  - prep-vla-weekly.py 汇聚本周 daily/social/sota/release/theory 数据
  - 依赖：周一至周五的 memory 文件 + 当天 R1/R2 Theory（16:20 前完成）
  - 产出：GitHub VLA-Handbook reports/weekly/*.md + vla-weekly-digest.json

AI App Weekly Deep Dive (周日 12:30):
  - prep-ai-weekly.py 汇聚本周 ai-app 数据
  - 产出：GitHub Agent-Playbook blog/*.md + ai-weekly-digest.json

AI Agent 自省与自动调参 (周日 14:00):
  - 读取 ai-app-daily-stats / ai-app-daily / ai-app-social-intel / ai-daily-pick / workflow-digest
  - 执行低风险自动调参（B 词、search_terms_social、rss_priority），并写入独立变更日志
  - 产出：Telegram + `ai-app-active-config.json` + `ai-app-change-log.json`

VLA Biweekly Reflection (每 14 天，Biweekly Report 后 30 分钟):
  - 读取 _biweekly_{today}.md + biweekly-reasoning.json + SOTA/Release/Theory memory
  - Qwen 生成 3-10 个反思判断题（趋势/资源/真伪/技术追问，至少 1 个技术追问）
  - 产出：Telegram + GitHub VLA-Handbook reports/biweekly/reflection_{date}.md
  - 防御：若 biweekly report 文件不存在则 skip

AI App Deep Dive (二/四/六 15:30，与 VLA Theory 完美错开):
  - prep-ai-deep-dive.py 从最近 3 天 AI App memory 选题
  - 去重：ai-app-deep-dive-articles.json + GitHub 路径检查
  - Qwen agent: web_fetch 源 URL → 撰写 1500-3000 字深度分析
  - post-ai-deep-dive.py: frontmatter 注入 + LaTeX 安全网 + GitHub push + Telegram
  - 依赖：ai-app-daily.json + ai-app-social-intel.json + ai-daily-pick.json（`daily_picks[]` 结构，当天 08:15 已落盘）
  - 产出：GitHub Agent-Playbook memory/blog/archives/deep-dive/*.md + ai-app-deep-dive-articles.json

AI App Biweekly Report (每 14 天，anchor Feb 17 10:00，与 VLA 错开一周):
  - 读取 6 个 AI App memory 文件做跨期推理（500 字以内）
  - 产出：Telegram + GitHub Agent-Playbook reports/biweekly/{date}.md
  - Memory: ai-app-biweekly-reasoning.json

AI App Biweekly Reflection (每 14 天，AI App Biweekly Report 后 30 分钟):
  - 读取 _ai_biweekly_{today}.md + ai-app-biweekly-reasoning.json + deep-dive-articles.json
  - Qwen 生成 3-10 个反思问题（趋势/资源/真伪/技术追问）
  - 产出：Telegram + GitHub Agent-Playbook reports/biweekly/reflection_{date}.md

Calibration Check - 假设校准扫描 (每天 09:15):
  - prep-calibration-check.py 从 VLA + AI Agent 9 个 memory 源汇总当天信号
  - Qwen 逐条扫描 assumptions.json（14 条核心假设）的失效条件
  - 严判标准：信号必须直接提供失效条件的具体证据，仅相关不算触发
  - 无触发 → 静默（无事即成功）；有触发 → Telegram 🚨 + confidence_suggestion
  - 产出：calibration-check-{date}.json + 条件性 Telegram
  - 闭环：Monthly Prompt Evolution Review 每月扫描累积触发，输出假设维护建议
```

### 3.2 依赖类型

```
数据依赖（强）:
  VLA RSS  ─► VLA Daily (读取 vla-rss-YYYY-MM-DD.json)
  VLA Daily ─► VLA Social (exclusion: 已覆盖论文/链接)
  VLA Daily ─► Theory Deep Dive (读取 vla-daily-hotspots.json 选论文)
  Theory R1 ─► Theory R2 (vla-theory-articles.json 去重)
  Daily/Social/SOTA/Release/Theory ─► VLA Weekly (汇聚全周 memory)
  Biweekly Report ─► Biweekly Reflection (读取 _biweekly_{today}.md + reasoning.json)
  AI App Daily/Social/Pick ─► AI App Deep Dive (读取最近 3 天 memory 选题)
  AI App Daily/Social/Pick/Workflow/Weekly/DeepDive ─► AI App Biweekly Report (汇聚 14 天 memory)
  AI App Biweekly Report ─► AI App Biweekly Reflection (读取 _ai_biweekly_{today}.md)
  AI App Daily + RSS + Config ─► post-ai-app-daily.py (补写关键词级 stats)
  AI App Daily Stats + Social/Pick/Workflow ─► AI Agent 自省与自动调参
  VLA/AI Daily/Social/SOTA/Release/Pick/RSS ─► Calibration Check (汇聚 9 个 memory 源)

时间依赖（弱，避免资源争用）:
  08:30 Social 与 08:45 SOTA/09:00 Release 错开
  15:30 Theory R1 与 16:00 Theory R2 间隔 30 分钟（R1 超时 20min 仍有余量）
  15:30 AI App Deep Dive (二四六) 与 VLA Theory (一三五) 完美错开，零冲突
  17:30 VLA Weekly 在 16:00 R2 结束后 90 分钟（充足安全间隔）
  VLA Biweekly Reflection 在 VLA Biweekly Report 后 30 分钟
  AI App Biweekly Reflection 在 AI App Biweekly Report 后 30 分钟
  VLA Biweekly (anchor Feb 10) 与 AI App Biweekly (anchor Feb 17) 错开一周
  Watchdog 放在所有早间上游之后
```

### 3.2.1 关于 08:45 SOTA 与 09:00 Release 的位置（不是依赖关系）

SOTA（Evo-SOTA）与 Release（GitHub API + Web Search）**不依赖** Daily/Social 的产物；把它们放在 08:45/09:00 主要是工程性取舍：

- **并发资源控制**：Gateway 有 `maxConcurrent=2` 的全局并发限制，早间 08:00–09:00 已经有多个重任务（LLM + Web）。错开能降低“连锁超时”的概率。
- **消息流可读性**：把“论文热点 → 社交信号 → 榜单/发布 → 验收”按认知顺序排列，读者在 Telegram 里更容易形成上下文。
- **Watchdog 语义清晰**：09:30 统一验收，便于判断上游是否真正完成（尤其是 Release 需要更新 `github-last-seen`）。

如果未来机器资源更充裕，或你希望更快获取榜单/发布信号，完全可以把 SOTA/Release 提前或并行；但需要同步评估并发与告警噪声（并更新 `20-cron-tasks.md` 时间线说明）。

### 3.3 VLA 任务功能说明（面向使用者）

下面只列 VLA 相关任务（AI App 任务不展开）。

- **VLA RSS 信息收集**（`vla-rss-collect.py`）
  - **目的**：用低 token 的方式抓取 arXiv RSS + hf-papers feed，做关键词过滤，形成当日论文候选池。
  - **输入**：RSS 源 + 默认关键词（若配置文件存在则以配置为准）。
  - **输出**：`/home/admin/clawd/memory/vla-rss-YYYY-MM-DD.json`
  - **运行特性**：运行期间输出 `[progress]` 进度行到 stdout；仅当全部 feed 失败才输出告警行。

- **VLA Daily Hotspots**（`prep-vla-daily.py` → `run-vla-daily-two-phase.py` → `post-vla-daily.py`）
  - **目的**：把当日候选论文压缩成“研究者可读”的 5–10 条热点，并增量写入 Handbook 索引。
  - **关键策略**：两阶段编排（先确定性候选，再用 LLM 做结构化与导读），并把 LLM 输入限制在 topN 候选，避免长 prompt 质量劣化。
  - **输出**：
    - memory：`vla-daily-hotspots.json`（历史去重用）、`daily-stats.json`（统计用）
    - GitHub：`theory/paper_index.md`（自动追加区）
    - Telegram：当日导读 + 条目列表

- **VLA Social Intelligence**（`prep-vla-social.py` → `run-vla-social-two-phase.py` → `post-vla-social.py`）
  - **目的**：补足“非论文信号”（人物动向、开源、融资、工具发布等），同时避免与 Daily/RSS 重复。
  - **关键策略**：prep 阶段构建 exclusion set（来自 RSS + Daily 历史 + 社交历史），只把“新增且近期”的信号喂给 LLM。
  - **输出**：memory `vla-social-intel.json` + Telegram（有则发）

- **VLA Benchmark SOTA Tracker**（`prep-vla-sota.py` → `post-vla-sota.py`，runner：`run-vla-sota-two-phase.py`）
  - **目的**：追踪基准榜单 SOTA 变动，避免“读论文凭感觉”。
  - **数据源（更具体）**：Evo-SOTA 来自 GitHub 仓库 `MINT-SJTU/Evo-SOTA.io`，脚本通过 raw base `https://raw.githubusercontent.com/MINT-SJTU/Evo-SOTA.io/main/` 拉取固定清单（在代码里显式写死，保证确定性）：
    - `public/data/calvin.json`
    - `public/data/libero.json`
    - `public/data/liberoPlus.json`
    - `public/data/metaworld.json`
    - `public/data/robochallenge.json`（critical source）
    - `public/data/robocasa_gr1_tabletop.json`
    这些 JSON 提供不同 split/metric 下的 leaderboard 记录；prep 阶段会按各 benchmark 的主指标偏好（`METRIC_PREF`）抽取榜首记录，并对重点赛道（LIBERO、RoboChallenge）抽取 Top5 细节用于推送与周榜快照。
  - **关键策略**：
    - 只在榜单变动时推送；无变动时周五发一次“周榜快照”
    - `robochallenge` 为关键源：缺失必须强制 Telegram 告警（不允许静默）
    - 机构信息：多层提取（域名 hint + 已知模型映射 + 严格置信 LLM 补全）并落盘缓存
  - **输出**：memory `vla-sota-tracker.json`、GitHub `theory/benchmark_tracker.md`、Telegram（变动/周榜/异常）

- **VLA Release Tracker**（`prep-vla-release.py` → `post-vla-release.py`，runner：`run-vla-release-two-phase.py`）
  - **目的**：追踪仿真平台/工具链/数据集与硬件厂商的正式发布，评估对研究路线的影响。
  - **两层信息源**：
    - Layer 1：GitHub release/tag（9 个 watchlist repo）
    - Layer 2：硬件厂商定向 web search（9 个 query，限近 7 天）
  - **关键策略**：过滤 `nightly/dev/canary/snapshot` 之类噪音标签；无变动静默。
  - **Watchlist 维护策略（必须写在文档里）**：
    - watchlist 定义位置：`/home/admin/clawd/scripts/prep-vla-release.py` 的 `GITHUB_WATCHLIST`
    - 单条格式（dict）：`{"repo": "owner/name", "name": "DisplayName", "type": "sim|toolchain|dataset|hardware"}`
    - 行为约束：
      - 优先请求 `GET /repos/{repo}/releases/latest`；若 404（无 release）则回退 `GET /repos/{repo}/tags?per_page=1`
      - 自动忽略 `nightly/dev/canary/snapshot` 等噪音 tag（仍会更新 last-seen，避免重复检查）
    - 维护建议：新增 repo 前先确认它的 release/tag 语义是否“正式发布”，否则会带来噪音；必要时把它放到 Social/手动渠道更合适。
  - **输出**：memory `vla-release-tracker.json`、GitHub `product/release_tracker.md`、Telegram（仅变动）

### 3.4 信号覆盖矩阵（快速检查盲区）

这张表的目的：让你一眼看清“什么信号由谁捕获、落在哪里、有没有空白”。未来要加新信号类型时，先在这里补一行，就能反推需要扩展哪个任务/脚本。

| 信号类型 | 主要捕获任务 | 补充捕获 | 沉淀位置（优先 GitHub，其次 memory） | 备注 / 盲区提示 |
| :--- | :--- | :--- | :--- | :--- |
| 学术论文（arXiv/hf-papers） | VLA RSS + VLA Daily Hotspots | Social（偶发） | `theory/paper_index.md` + `vla-daily-hotspots.json` | RSS 关键词覆盖决定召回；可通过 `active-config.json` 调整 |
| 社交 / 人物 / 融资 / 公司动向 | VLA Social Intelligence | — | `vla-social-intel.json` | 强依赖外部搜索可用性；降级见 7.1.1 |
| Benchmark SOTA / 榜单变动 | VLA Benchmark SOTA Tracker | Daily（论文自报，偶发） | `theory/benchmark_tracker.md` + `vla-sota-tracker.json` | 关键源 `robochallenge` 缺失会强告警 |
| 仿真平台 / 工具链更新 | Release Tracker（Layer 1） | Social（偶发） | `product/release_tracker.md` + `vla-release-tracker.json` | watchlist 质量决定噪音/漏报；维护见 3.3 |
| 硬件发布 / SDK 开源 | Release Tracker（Layer 2） | Social（偶发） | `product/release_tracker.md` + `vla-release-tracker.json` | 外部搜索不稳定时会退化为仅 Layer 1 |
| 数据集发布（GitHub release / paper） | Daily + Release（L1） | Social | `theory/paper_index.md` 或 `product/release_tracker.md` | “数据集”同时出现在论文/仓库两侧，需避免重复推送 |
| 上游基座模型 / 训练范式趋势 | Daily + Social | Biweekly（回顾） | `reports/biweekly/`（总结） | 偏“趋势”类信号更依赖 LLM 归纳，需控制输入长度 |

---

## 4) 两阶段脚本架构（通用模式 + 例子）

### 4.1 通用模式（prep -> agent/LLM -> post）

```
cron job (Gateway)
   │
   ▼
run-*-two-phase.py  (orchestrator)
   ├─ Phase 1: prep-*.py
   │     - 纯确定性：抓取/过滤/去重/候选集
   │     - 输出到 memory/tmp/*.json
   │     - ⚠ 每阶段前后输出 [progress] 消息（flush=True）
   │
   ├─ Phase 2: LLM/Agent (可选)
   │     - 只吃候选集摘要（bounded）
   │     - 输出严格 JSON（schema 校验）
   │     - Session ID 含日期（如 vla-social-2026-02-15），每日独立上下文
   │
   └─ Phase 3: post-*.py
         - 写入 memory（持久状态）
         - （可选）写入 GitHub（Contents API）
         - （可选）发送 Telegram
```

> **2026-02-15 rev.5 修复**：所有 8 个 two-phase 脚本在每个 `_run()` / `_agent_generate()` 调用前后添加了 `print("[progress] ...", flush=True)` 中间进度消息。原因：Qwen agent 使用 `process` 工具运行脚本时，如果 60 秒内没有 stdout 输出，会认为脚本卡死并主动 kill 进程（实测 VLA SOTA Tracker 连续 2 天因此失败）。同时，cron 任务 prompt 增加"绝对禁止提前 kill 进程"指令。  
> **2026-02-15 rev.6 ~~补充~~（已被 rev.7 撤回）**：~~progress 走 stderr~~ → 实测失败，见 rev.7。  
> **2026-02-16 rev.7 纠正**：rev.6 将 `daily-watchdog.py` / `ai-app-rss-collect.py` 的 progress 改为 stderr，结果 agent 连续两天杀死进程。**根因**：agent 结合 prompt "若 stdout 为空则回复为空" 判定 stdout 为空 = 无有用输出，主动终止进程（prompt 引导的误杀，非机械超时）。**修复**：(1) progress 全部回归 stdout（`print("[progress]...", flush=True)`），放弃 "silent on success" 设计；(2) watchdog prompt 删除 "stdout 为空" 条款，改为 agent 过滤 `[progress]`/`[done]` 行；(3) heartbeat 从 120s 改为 30s 间隔；(4) prompt 明确指定 exec `timeout: 900`。**结论**：所有需要 agent 执行的脚本，progress 必须走 stdout，不存在 stderr 的替代方案。patience 指令必须通过 `moltbot cron edit` 写入（直接编辑 `jobs.json` 会被 Gateway 覆写）。
> **2026-02-16 rev.8 补强**：仅在 `_run()` 调用前后打点仍不足以覆盖长执行窗口。根因是多数脚本内部使用 `subprocess.run(stdout=PIPE)`，子进程执行期间父进程 stdout 仍会静默 150-540 秒。**修复**：新增共享模块 `/home/admin/clawd/scripts/_heartbeat_run.py`（`Popen + threading.Event`），在子进程运行期间每 20 秒输出一次 `[progress] ... still running...`；8 个 `run-*-two-phase.py` 与 `daily-watchdog.py` 的 `_run`/`_run_cmd` 全部接入；`ai-app-rss-collect.py` 的 HN 顺序抓取段补充进度心跳。同时将脚本型 cron prompt 统一补齐 `timeout: N` + patience + 禁止中途叙述，避免 agent 在长阶段误杀或提前总结。
> **2026-02-19 发现**：`run-vla-daily-two-phase.py` 从未被创建。Cron job payload 引用该脚本长达数日，但文件不存在，导致 VLA Daily Hotspots 每日静默失败（`lastStatus: ok` 但 Telegram 无推送）。**根因**：系统搭建时遗漏了该文件，且 Moltbot LLM 会吞掉 exec 报错对外报 ok。**修复**：新建 `run-vla-daily-two-phase.py`，实现"读 RSS JSON → LLM 选纸 → post-vla-daily.py 落盘推送"完整三阶段。**教训**：`ok status ≠ 任务成功`，验收必须同时检查 runs summary 内容 + Telegram 实际推送 + memory 文件日期。（详见 `12-model-id-and-web-search.md` §8）

### 4.2 例：VLA Daily Hotspots（真实落盘点）

来自脚本：
- orchestrator: `/home/admin/clawd/scripts/run-vla-daily-two-phase.py`
- post: `/home/admin/clawd/scripts/post-vla-daily.py`

```
vla-rss-YYYY-MM-DD.json
      │
      ▼
prep-vla-daily.py
  └─ vla-daily-candidates-*.json   (memory/tmp)
      │
      ▼
LLM(agent=reports, qwen)
  └─ vla-daily-llm-output-*.json   (memory/tmp)
      │
      ▼
post-vla-daily.py
  ├─ write memory:
  │    - /home/admin/clawd/memory/vla-daily-hotspots.json
  │    - /home/admin/clawd/memory/daily-stats.json
  ├─ write GitHub:
  │    - theory/paper_index.md   (via gh-paper-index-update.py)
  └─ send Telegram:
       - moltbot message send --channel telegram ...
```

### 4.3 哪些任务使用 LLM

```
使用 LLM 生成正文:
  - VLA Daily Hotspots
  - VLA Social Intelligence
  - VLA-Handbook Biweekly Report
  - VLA Weekly Deep Dive
  - AI App Weekly Deep Dive
  - VLA Theory Deep Dive（双轮 R1+R2，一三五 15:30/16:00；自主 agent，非两阶段；按 AGENTS.md theory/ 模板写深度文章；禁止 LaTeX，含 GitHub 去重检查）
  - VLA Biweekly Reflection（每 14 天，Biweekly 后 30 分钟；单次 agent turn 生成 3-10 个反思/技术追问题，推送 TG + GH）
  - Calibration Check（每天 09:15；prep 脚本汇总 9 个 memory 源，agent 逐条扫描 assumptions.json 失效条件；大部分时候静默输出）

纯脚本（不生成正文，或仅局部补全）:
  - VLA RSS 信息收集
  - VLA Benchmark SOTA Tracker（仅 org 补全可能触发小批量 LLM）
  - VLA Release Tracker（正文由脚本生成；Layer 2 搜索通过 agent 产出结构化结果）
  - Daily Watchdog / Gateway Preflight

已开启百煉 enable_search（联网搜索增强）的任务:
  - **全量开启**：所有使用 `qwen3.5-plus` 的任务均默认开启。
  - 策略: 模型自主决策（Self-determine）。
  - 机制: `moltbot.json` `models.params` passthrough (不再是 per-task `streamParams`)。
  - 注: 模型会根据任务 prompt 和上下文自主决定是否需要调用联网搜索，避免了强制搜索带来的延迟。纯脚本任务（RSS 收集、Preflight）不调用 LLM，不受影响。
```

### 4.4 为什么必须“两阶段”（设计动机）

- **确定性与可复跑**：prep 阶段把“抓取/过滤/去重/候选生成”做成纯脚本，输出 JSON 落盘。任何时候都可以拿同一份候选 JSON 重跑 LLM 或 post，便于验收与回溯。
- **控制 LLM 输入规模**：runner 会把候选集裁剪到固定上限（例如 Daily 只喂前 20 条），避免长上下文导致质量下降或成本不可控。
- **严格 schema**：runner 会对 LLM 输出做 JSON 解析与结构检查，不满足 schema 直接失败，避免“格式正确但内容不可用”污染 memory。
- **交付与状态分离**：post 阶段统一负责落盘与投递，cron payload 本身尽量不直接 deliver，减少重复投递与不可控副作用。

### 4.5 假设校准层 (Calibration Layer)

**核心逻辑**：系统在每日信息流之上叠加一层"假设失效监测"，让已有管线不仅回答"今天发生了什么"，还能主动回答"今天有什么信号可能动摇我的核心判断"。

```
架构:
  assumptions.json (14 条核心假设)
    ├─ 域: VLA (10)、AI Agent (3)、投资 (1)
    ├─ 每条含: hypothesis / invalidation_conditions / horizon / confidence / status
    └─ 更新规则: 系统建议 + 人工批准 (hybrid)

  Calibration Check 任务 (6ef90bba-...):
    - 时间: 每天 09:15（在全部 daily 数据落盘后）
    - Phase 1: prep-calibration-check.py 读取 9 个 memory 源 → _calibration_candidates_{date}.json
    - Phase 2: LLM 逐条扫描失效条件
      · 严判标准: 信号必须直接提供具体证据，仅相关不算触发
      · severity: critical / warning / informational
      · confidence_suggestion: 基于 severity 调整置信度建议
    - 输出: calibration-check-{date}.json
    - Telegram: 无触发 → 静默；有触发 → 🚨 推送

  闭环维护:
    - Monthly Prompt Evolution Review 每月扫描累积触发
    - 输出建议: 新增/归档/拆分/合并/调参假设
    - 最终修改 assumptions.json 需人工确认

  已知修复 (2026-02-18):
    - prep-calibration-check.py 5 个提取函数字段名修复:
        vla_rss:    items/entries → papers
        vla_social: reports → social_intel; 内层 items → signals
        vla_sota:   benchmarks → vla-sota-tracker; last_updated → date
        ai_daily:   daily_reports/reports → ai_app_daily
        ai_social:  reports → social_intel; 内层 items → signals
    - 修复后信号覆盖: 48 条(2/9源) → 79 条去重(7/9源)
    - 首次运行结果 (2026-02-18 09:15): 14 假设 × 48 信号, 无触发, 静默成功
```

---

## 5) GitHub 联动（VLA-Handbook）数据流（ASCII）

### 5.0 为什么要回写 VLA-Handbook（意义）

这套系统不是“每天发消息就结束”。**GitHub 上的 VLA-Handbook 是交付层的长期载体**，它把每日信号变成可检索、可审计、可复用的知识资产，具体意义是：

- **把“即时消息”变成“可累积的知识库”**：Telegram 适合即时触达，但不适合长期沉淀；Handbook 的 Markdown 文件能持续增长、可全文搜索、可按目录组织。
- **版本化与可追溯（审计友好）**：每一次更新都有 commit、diff、时间戳与 commit message。出现误收录/误判时，可以回溯来源并快速回滚，避免“口口相传”。
- **团队协作与评审入口**：Handbook 天然支持 PR/Review 工作流；系统自动追加的内容与人工维护的内容可以在同一仓库里协作，减少信息分裂。
- **跨任务联动的“公共接口”**：多条任务最终都写到同一个仓库（`theory/`、`deployment/`、`reports/` 等），等价于为下游分析提供统一的数据面：
  - Daily 负责把论文入口沉到 `theory/paper_index.md`
  - SOTA 把榜单变动沉到 `theory/benchmark_tracker.md`
  - Release 把平台/硬件发布沉到 `product/release_tracker.md`
  - Biweekly 把“跨内容推理”沉到 `reports/biweekly/`
  这些文件一起构成了“本系统对外可消费的稳定 API（人类可读）”。
- **降低单点依赖**：即使 Telegram 丢消息、或某天推送失败，Handbook 仍然保留当期落盘结果；同理，后续任务也可以通过 GitHub 追溯“当时系统认为的事实”。

边界说明：

- **GitHub 是交付层，不是状态层**：系统的去重、last-seen、缓存仍然以 `memory/` 为准；写回 GitHub 主要面向阅读、检索与协作，而非驱动内部逻辑。
- **写入策略偏“追加”**：例如 `paper_index.md` 的 `Daily Papers (Auto)` 区域、tracker 表格等，目标是避免破坏人工维护内容，确保长期可维护。

### 5.1 GitHub 配置与通用写入器

```
/home/admin/clawd/memory/github-config.json
  ├─ repo: sou350121/VLA-Handbook
  ├─ api_base: https://api.github.com
  └─ token_env: GITHUB_TOKEN

token:
  - env: GITHUB_TOKEN
  - fallback file: /home/admin/.moltbot/.env

通用写入器:
  - /home/admin/clawd/scripts/gh-contents-upload.py
      - PUT 任意 markdown 文件到 repo
      - 顺带维护 reports/biweekly/README.md 表格索引
```

### 5.2 写入路径映射（核心）

```
VLA Daily Hotspots
  └─ theory/paper_index.md
     (via /home/admin/clawd/scripts/gh-paper-index-update.py)

VLA Benchmark SOTA Tracker
  └─ theory/benchmark_tracker.md
     (in /home/admin/clawd/scripts/post-vla-sota.py)

VLA Release Tracker
  └─ product/release_tracker.md
     (in /home/admin/clawd/scripts/post-vla-release.py)

VLA-Handbook Biweekly Report
  ├─ reports/biweekly/YYYY-MM-DD.md
  └─ reports/biweekly/README.md
     (via /home/admin/clawd/scripts/gh-contents-upload.py)

AI 工作流灵感精选（Agent-Playbook 仓库）
  └─ memory/blog/archives/ai-workflow-inspiration/{YYYY-MM-DD}.md
     (in /home/admin/clawd/scripts/post-ai-app-workflow.py)

VLA Weekly Deep Dive
  └─ reports/weekly/{YYYY-MM-DD}.md
     (in /home/admin/clawd/scripts/post-vla-weekly.py)

AI App Weekly Deep Dive（Agent-Playbook 仓库）
  └─ blog/{YYYY-MM-DD}-weekly-digest.md
     (in /home/admin/clawd/scripts/post-ai-weekly.py)

VLA Theory Deep Dive (R1 + R2, 一三五 15:30/16:00)
  └─ theory/{slug}_dissection.md  (或 theory/tactile/{slug}_dissection.md)
     (in /home/admin/clawd/scripts/post-vla-theory.py)
     安全网：内置 LaTeX→代码块正则清洗；先写 memory 再推 GitHub（防双轮竞态）

（条件触发）Biweekly 同步更新 Handbook 业务文档
  - deployment/robot_hardware_selection_pricing.md 或 product/*
  - deployment/*（仿真平台）
  - companies/*（公司动态）
```

### 5.2.1 各写入器的行为约束（文字说明）

- **`theory/paper_index.md`（Daily）**：
  - 写入方式：只追加到 `## 📄 Daily Papers (Auto)` 自动区（不存在则创建），不改动用户手写区。
  - 去重方式：标题归一化 + fuzzy 相似度；并带“once-per-day guard”（如果已存在 `daily YYYY-MM-DD` 标记则跳过）。

- **`theory/benchmark_tracker.md`（SOTA）**：
  - 写入方式：按 benchmark section 追加新行；只在 `items` 非空（确有变动）时写入。
  - 推送策略：变动即推送；周五无变动则推送“周榜快照”（含重点赛道 top5 + 机构信息）。

- **`product/release_tracker.md`（Release）**：
  - 写入方式：追加行（去重：行文本级去重）；仅当本期 `items` 非空才写入。
  - 过滤策略：nightly/dev/canary/snapshot 默认不计入“正式 release”。

- **`reports/biweekly/*`（Biweekly）**：
  - 写入方式：`gh-contents-upload.py` 上传报告，并维护 `reports/biweekly/README.md` 表格索引（同日覆盖/去重）。
  - 本期增强：Biweekly prompt 会额外读取 `vla-sota-tracker` 与 `vla-release-tracker`，在报告中加入“Benchmark 动态”和“平台与硬件变动”。

- **`theory/{slug}_dissection.md`（Theory Deep Dive, 生成性内容）**：
  - 写入方式：每次创建一个独立 `.md` 文件（非追加），通过 `post-vla-theory.py` 推送。
  - 去重方式：三层去重——(1) `prep` 阶段读 `vla-theory-articles.json` 排除已写论文；(2) prompt 指令 `web_fetch` GitHub 目标路径做运行时去重；(3) `post` 阶段 GitHub PUT 用 SHA 做幂等更新。
  - LaTeX 安全网：`post-vla-theory.py` 内置 `_sanitize_latex()` 正则，将 `$$...$$` → 代码块、`$...$` → 行内代码，防止 GitHub 渲染错误。
  - **质量防线（重要——此任务是生成性内容，非结构化提取）**：
    1. **文件标记**：所有自动生成的 Theory 文章文件名统一使用 `{slug}_dissection.md` 后缀（vs 人工撰写的 `{slug}.md`），reader 可通过文件名区分来源。`post-vla-theory.py` 在文章顶部插入 YAML frontmatter，包含 `auto_generated: true`、`generated_at` 时间戳和 `source_paper` arXiv ID，便于批量查询和过滤。
    2. **Prompt 约束**：Qwen prompt 明确要求"引用原文关键公式和数据，不编造实验数值"；对关键指标要求给出论文原表引用。
    3. **当前审查模式**：自动写入 main branch + 事后人工校对。用户通过 Telegram 推送的链接做异步 review；如发现质量问题可直接在 GitHub 修正或删除。
    4. **升级路径（未来可选）**：若需要更严格的质量门槛，可改为推送到 `draft/theory/` 分支，由人工 review 后 merge 到 main。此改动只需修改 `post-vla-theory.py` 的 `TARGET_BRANCH` 常量。

- **`reports/weekly/*`（VLA Weekly Deep Dive）**：
  - 写入方式：每周创建一个独立 `.md` 文件，通过 `post-vla-weekly.py` 推送至 VLA-Handbook `reports/weekly/`。
  - 去重方式：按日期去重（同日覆盖）。

- **`blog/*`（Agent-Playbook 仓库 — AI App Weekly + Daily）**：
  - 写入方式：独立 `.md` 文件，通过 `post-ai-weekly.py` / `post-ai-app-workflow.py` 推送至 Agent-Playbook 的 `blog/` 目录。
  - **写入策略与 VLA-Handbook 的差异**：Agent-Playbook 的 `blog/` 目录是**纯自动维护区**（不含人工撰写文件），因此不存在"人工区保护"问题。写入策略为"整文件创建/覆盖"而非"追加到已有文件"。
  - 失败策略：同样遵循"不阻塞"原则——GitHub 推送失败时 memory 仍落盘，Telegram 仍推送，失败原因记入 stdout JSON。

### 5.2.2 GitHub 失败策略（不阻塞原则）

- 对 Daily/SOTA/Release：**GitHub 写入失败不阻塞 memory 落盘与 Telegram 推送**（但会在 stdout JSON 里记录失败原因，便于 Watchdog/人工排查）。
- 对 Biweekly：报告上传成功但 README 更新失败时，仍返回报告 URL，并在第二条 Telegram 确认消息中标注 README 未更新（避免误判为整单失败）。
- 对 Theory/Weekly/AI Weekly：同上——**memory 先行、GitHub 后推、失败不阻塞**。Theory 额外保障：memory 在 GitHub 推送前写入（确保 R2 去重即使 R1 推送超时也能生效）。

### 5.3 SOTA Tracker 的“关键源”保护（robochallenge）

来自 `/home/admin/clawd/scripts/prep-vla-sota.py`：
- 数据源列表 `DATA_SOURCES`（固定）
- `CRITICAL_SOURCE_SLUGS = {'robochallenge'}`

```
Evo-SOTA raw JSON 拉取失败（critical source）
   ├─ prep 阶段直接失败（skip_reason=critical_source_missing）
   └─ runner 强制发 Telegram 异常告警（不允许静默失败）
```

---

## 6) Memory 状态设计（唯一状态源）

### 6.1 分类与示例

```
配置类 (config):
  - active-config.json
  - ai-app-active-config.json
  - github-config.json
  - exclusion_sets.json

追踪类 (tracker/history):
  - vla-daily-hotspots.json        (reported_papers + last_report_date)
  - vla-social-intel.json          (social_intel[])
  - vla-sota-tracker.json          (sota 变动历史)
  - vla-release-tracker.json       (release 历史 + github-last-seen)
  - daily-stats.json               (daily_stats[])
  - ai-app-daily-stats.json        (daily_stats[]，含 keywords_hit/miss 与 sources_zero)
  - ai-app-change-log.json         (ai_app_change_log[]，AI 自省改动历史)
  - ai-app-pending-changes.json    (pending_changes[]，中风险待确认提案)
  - assumptions.json               (核心假设登记簿，14 条 VLA/AI Agent/投资假设，含失效条件与置信度)
  - biweekly-reasoning.json        (biweekly_reasoning[])
  - vla-weekly-digest.json         (vla_weekly_digest[] 周报历史)
  - ai-weekly-digest.json          (ai_weekly_digest[] 周报历史)
  - vla-theory-articles.json       (theory_articles[] 已写深度文章去重)

缓存类 (cache):
  - vla-paper-org-cache.json       (paper_id -> org 置信度缓存)

产出类 (output):
  - calibration-check-{date}.json  (每日假设校准扫描结果；triggered_assumptions[] + confidence_suggestion)

中间产物 (tmp，不是状态源):
  - memory/tmp/*-candidates-*.json
  - memory/tmp/*-llm-output-*.json
  - memory/tmp/vla-theory-article-*-*.md   (agent 生成的深度文章，post 脚本读取后推 GitHub)
  - memory/tmp/*-post-input-*.json
  - memory/tmp/_calibration_candidates_{date}.json  (Calibration Check prep 脚本汇总的当天信号)
```

### 6.2 读写关系图（ASCII）

```
── 早间链路（每日 06:00–09:30）──────────────────────────────────────────

vla-rss-YYYY-MM-DD.json  ─┐
                          ├──► prep-vla-daily.py ─► (tmp candidates) ─► LLM ─► post-vla-daily.py
active-config.json     ───┘                               │                     │
                                                         ▼                     ├──► vla-daily-hotspots.json
                                                daily-stats.json (upsert)      └──► daily-stats.json

vla-daily-hotspots.json ─┐
vla-rss-YYYY-MM-DD.json  ├──► prep-vla-social.py (exclusion) ─► LLM ─► post-vla-social.py ─► vla-social-intel.json
vla-social-intel.json  ──┘

Evo-SOTA raw JSON ─► prep-vla-sota.py ─► vla-paper-org-cache.json (cache) ─► post-vla-sota.py ─► vla-sota-tracker.json

GitHub API + hw web search ─► prep-vla-release.py ─► post-vla-release.py ─► vla-release-tracker.json

── Theory Deep Dive（一/三/五 15:30 R1 + 16:00 R2）─────────────────────

vla-daily-hotspots.json  ─┐
vla-theory-articles.json  ├──► prep-vla-theory.py ─► (candidate JSON)
active-config.json     ───┘         │
                                    ▼
                          LLM (Qwen, autonomous agent turn)
                            ├─ web_fetch arXiv HTML/abs（论文全文）
                            ├─ web_fetch GitHub（去重检查）
                            └─ 生成 Markdown 深度文章
                                    │
                                    ▼
                          post-vla-theory.py
                            ├──► vla-theory-articles.json（先写 memory，保证 R2 去重）
                            ├──► GitHub VLA-Handbook theory/*.md（sanitize LaTeX → push）
                            └──► Telegram 推送

── VLA Weekly Deep Dive（周五 17:30）────────────────────────────────────

vla-daily-hotspots.json   ─┐
vla-social-intel.json      │
vla-sota-tracker.json      ├──► prep-vla-weekly.py ─► (tmp weekly-candidates JSON)
vla-release-tracker.json   │         │ 含 theory_deep_dives 列表
vla-theory-articles.json  ─┘         ▼
                                   LLM ─► post-vla-weekly.py
                                            ├──► vla-weekly-digest.json
                                            └──► GitHub VLA-Handbook reports/weekly/*.md

── AI App Weekly Deep Dive（周日 12:30）─────────────────────────────────

ai-app-rss-*.json          ─┐
ai-app-daily-hotspots.json  ├──► prep-ai-weekly.py ─► (tmp candidates JSON) ─► LLM ─► post-ai-weekly.py
                            ─┘         │                                                  │
                                       ▼                                                  ├──► ai-weekly-digest.json
                               ai-weekly-digest.json (读历史去重)                         └──► GitHub Agent-Playbook blog/*.md

── AI Agent 自省与自动调参（周日 14:00）────────────────────────────────

ai-app-rss-{date}.json        ─┐
ai-app-daily.json              ├──► post-ai-app-daily.py（确定性统计）
ai-app-active-config.json     ─┘         │
                                          └──► ai-app-daily-stats.json（keywords_hit/miss, sources_zero）
                                                   │
                                                   ▼
                                     cron: AI Agent 自省与自动调参
                                       ├──► ai-app-active-config.json（低风险自动调参）
                                       ├──► ai-app-change-log.json（每轮写）
                                       ├──► ai-app-pending-changes.json（中风险提案）
                                       └──► Telegram

── VLA Biweekly Reflection（每 14 天，Biweekly 后 30 分钟）──────────────

_biweekly_{today}.md        ─┐
biweekly-reasoning.json      │
vla-sota-tracker.json         ├──► LLM (Qwen, 生成 3-10 个反思判断题)
vla-release-tracker.json      │         │
vla-theory-articles.json    ─┘         ▼
                                 _biweekly_reflection_{today}.md (本地)
                                   ├──► Telegram 推送
                                   └──► GitHub VLA-Handbook reports/biweekly/reflection_{today}.md

── AI App Deep Dive（二/四/六 15:30）──────────────────────────────────────

ai-app-daily.json             ─┐
ai-app-social-intel.json       ├──► prep-ai-deep-dive.py ─► (candidate JSON × 3)
ai-daily-pick.json             │         │
ai-app-deep-dive-articles.json┘         ├─ URL prefetch (GitHub API 优先, 15s)
                                         │   └──► memory/tmp/prefetch-{slug}.txt
                                         ▼
                                       LLM (Qwen, autonomous agent turn)
                                         ├─ read prefetch file（优先本地内容）
                                         ├─ web_fetch 补充（仅 prefetch 不足时）
                                         ├─ 失败 → 自动切下一候选（最多 3 个）
                                         └─ 生成 Markdown 深度分析文章
                                                 │
                                                 ▼
                                       post-ai-deep-dive.py
                                         ├──► ai-app-deep-dive-articles.json（先写 memory）
                                         ├──► GitHub Agent-Playbook memory/blog/archives/deep-dive/*.md
                                         └──► Telegram 推送

── AI App Biweekly Report（每 14 天，anchor Feb 17 10:00）─────────────────

ai-app-daily.json             ─┐
ai-app-social-intel.json       │
ai-daily-pick.json             ├──► LLM (Qwen, 跨期推理, 500 字以内)
ai-app-workflow-digest.json    │         │
ai-weekly-digest.json          │         ▼
ai-app-deep-dive-articles.json┘   gh-contents-upload.py (--config agent-playbook)
                                     ├──► ai-app-biweekly-reasoning.json
                                     ├──► GitHub Agent-Playbook reports/biweekly/{date}.md
                                     └──► Telegram (报告 + 提交确认)

── AI App Biweekly Reflection（每 14 天，Report 后 30 分钟）────────────────

_ai_biweekly_{today}.md            ─┐
ai-app-biweekly-reasoning.json      ├──► LLM (Qwen, 3-10 个反思问题)
ai-app-deep-dive-articles.json    ─┘         │
                                             ▼
                                       gh-contents-upload.py (--config agent-playbook)
                                         ├──► Telegram 推送
                                         └──► GitHub Agent-Playbook reports/biweekly/reflection_{date}.md

── Calibration Check（每天 09:15）──────────────────────────────────────────

vla-rss-{date}.json          ─┐
vla-daily-hotspots.json       │
vla-social-intel.json         │
vla-sota-tracker.json         │
vla-release-tracker.json      ├──► prep-calibration-check.py ─► _calibration_candidates_{date}.json
ai-app-daily.json             │
ai-daily-pick.json            │
ai-app-social-intel.json      │
assumptions.json             ─┘
                                         │
                                         ▼
                               LLM (Qwen, agent turn)
                                 ├─ 逐条扫描 assumptions.json 失效条件
                                 ├─ 严判：信号须直接提供失效证据
                                 └─ 输出 triggered_assumptions[] + confidence_suggestion
                                         │
                                         ▼
                               calibration-check-{date}.json
                                 ├──► 无触发 → 静默（无事即成功）
                                 └──► 有触发 → Telegram 🚨 推送
```

### 6.3 核心状态不变量（必须维持）

- **所有去重/last-seen 都必须落在 memory**：
  - Daily 用 `vla-daily-hotspots.json.reported_papers` 防重复
  - Social 用 exclusion set（从 Daily/RSS/历史 social 汇总）防重复
  - Release 用 `vla-release-tracker.json.github-last-seen` 防“同一 repo 重复推送”
  - SOTA 用 `vla-sota-tracker.json` 防“同一条变动重复写入”
  - VLA Theory 用 `vla-theory-articles.json` 防重复（R1/R2 去重）
  - AI App Deep Dive 用 `ai-app-deep-dive-articles.json` 防重复（title + URL 双重检查）

- **prep 脚本必须对齐真实 memory 结构**（2026-02-15 rev.2 教训）：
  - `ai-app-daily.json`：顶层 `ai_app_daily[]`，每项含 `date` + `items[]`，item 字段为 `title/url/category/importance/why`。**按日累积，30 天自动清理**（通过 `memory-upsert.py`）。
  - `ai-app-social-intel.json`：顶层 `social_intel[]`，每项含 `date` + `signals[]`，signal 字段为 `type/source/person_or_entity/summary/url/signal_level`
  - `ai-daily-pick.json`：顶层 `daily_picks[]`（rev.4 结构变更），每项含 `date` + `items[]`，item 字段为 `title/category/source/url/why_picked`。**按日累积，30 天自动清理**（通过 `memory-upsert.py`）。读取端需同时兼容旧平面结构 `{date, items[]}`。
  - 假设与真实结构不匹配会导致 prep 返回 0 候选 → Deep Dive 整条链路空转

- **Memory 写入必须走确定性脚本**（2026-02-15 rev.4 新增）：
  - Agent 直接 `write_file` 写 memory 会丢失历史（实测 5 天运行只剩 1 天数据）。
  - 正确做法：agent 把当天数据 pipe 给 `memory-upsert.py`，由脚本负责读取已有文件 → 按 date upsert → 30 天窗口清理 → 原子写回。
  - 目前 `ai-app-daily.json` 和 `ai-daily-pick.json` 已改用此机制；VLA 侧由 post 脚本自行累积（`_merge_hotspots()` 等），暂不需要迁移。

- **tmp 不是状态源**：`memory/tmp` 文件可删可不迁移；但任何“今天是否跑过”之类的判断，都不能依赖 tmp。

### 6.4 迁移时最容易踩坑的状态文件（提醒）

- `vla-sota-tracker.json` 丢失会导致首日把大量记录当作“新变动”
- `vla-release-tracker.json` 丢失会导致首日重复推送 GitHub release
- `vla-paper-org-cache.json` 丢失会导致机构信息重新提取，增加 arXiv 请求与 LLM 补全成本

---

## 7) 可靠性与恢复机制（ASCII）

### 7.1 三层保障

```
Layer 0: Gateway Preflight (06:30)
  - moltbot health
  - gateway restart
  - fallback: pkill + moltbot gateway run
  - cron config 校验：isolated+agentTurn / 两阶段+timeoutMs
  - 关键 job 守护：检查 CRITICAL_JOB_IDS（Theory R1/R2 + Weekly x2 + Biweekly Reflection）是否在 jobs.json 中
    → 缺失则从 jobs.json.preflight-bak 自动恢复 + 告警
    → 正常则更新备份
    ⚠ 局限性：备份恢复只修复磁盘上的 jobs.json，但 Gateway 内存中仍缺少该 job。
      Gateway 下次覆写时会再次擦除。完整恢复流程：
      (1) preflight 检测缺失 → 恢复 jobs.json → 重启 Gateway（令其重新加载）
      (2) 若 Gateway 重启不可行，则调用 `moltbot cron add` 将 job 注入内存
      当前实现已包含步骤 (1)（preflight 在恢复后会触发 gateway restart）；
      若未来发现仍有漏网情况，可在 preflight 中追加 `moltbot cron add` 作为 fallback。
  - 成功静默；仅异常才输出（交给 cron 推送）

Layer 1: Daily Watchdog (09:30)
  - 检查 memory 是否落盘
  - 检查 GitHub 关键文件是否更新
  - 缺失则调用 moltbot cron run JOB_ID 触发补跑（best-effort）
  - 成功静默；异常才输出

Layer 2: Linux crontab 兜底（admin）
  - 06:00 memory-snapshot（独立于 gateway）
  - 09:10 watchdog-backup（独立于 gateway）
```

### 7.1.1 外部依赖降级矩阵（长时间不可用时）

可靠性不只是不停补跑；更重要的是当某个外部依赖“连续不可用”时，系统能**自动收缩到仍可信的能力边界**。

| 外部依赖不可用 | 受影响任务 | 系统当前行为（降级方式） | 仍可用能力 | 运维建议 |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen/LLM API** | Daily、Social、Biweekly（以及任何依赖 LLM 的任务） | runner/agent 阶段失败，post 不执行；Watchdog 会尝试补跑但仍会失败 | RSS、SOTA（除 org 补全外）、Release（L1/L2 若 agent 可用则部分）仍可跑 | 临时停用 LLM 任务或切换模型/Key；优先保留 RSS+SOTA+Release 保持“事实层”不断档 |
| **Perplexity/Web Search** | Social（prep）、Release Layer 2（hw search） | Social 可能候选为空或失败；Release Layer 2 失败会记录 `hw_search_failed:*` warning，但 Layer 1 仍继续 | RSS、Daily（若 LLM 正常）、SOTA、Release Layer 1 | 把 Social/Layer2 视为“退化可用”；优先排查 key/网络，再考虑扩大/调整 query |
| **GitHub API（Contents）** | 所有 Handbook 写入（paper_index/benchmark_tracker/release_tracker/biweekly 上传） | memory 落盘与 Telegram 通常不受影响；GitHub 写入失败会在 stdout JSON 里记录 | Telegram 仍能触达；memory 仍保持状态一致性 | 恢复后可手动重跑对应 job；注意 token/权限/403/rate limit |
| **Telegram API** | 所有推送 | post 阶段发送失败会记录 rc/err；Watchdog 不以 Telegram 成功为验收条件 | memory 与 GitHub 仍可持续更新 | 先确保没有“双跑 polling”；检查 bot token/allowlist/网络；恢复后可人工补发关键消息 |
| **Evo-SOTA raw JSON** | SOTA Tracker | critical source（`robochallenge`）缺失会强制 Telegram 告警并任务失败；避免静默盲区 | 其他任务不受影响 | 优先排查网络/DNS；必要时临时降频或切换镜像源（需同步修改脚本与文档） |

### 7.2 Watchdog 触发补跑逻辑（简化）

来自 `/home/admin/clawd/scripts/daily-watchdog.py`：

```
for each core_check:
  if missing:
     attempt rerun via: moltbot cron run <JOB_ID> --force
     re-check

special:
  - vla_release: 以 vla-release-tracker.json 内 github-last-seen 的当日更新时间作为“已运行”证据
  - memory_rw: 写入/读取 probe 文件验证 memory 可用
```

### 7.3 “宁可不写也不写错”的落盘原则

```
涉及 Handbook 内容更新（尤其是 Biweekly 条件触发更新）：
  - 只有在“确认为正式发布 + 信息量足够”时才更新 deployment/product/companies
  - 不确定时跳过，不做弱推断、不填空
```

---

## 8) 变更评审准则（维护者视角）

> Section 0 负责说明“为什么要建这套系统”；本节只回答“维护者如何评审一次改动是否安全”。

### 8.1 评审清单（提交前必须过一遍）

- **边界是否清晰**：是否仍然遵守“两阶段”（prep 确定性、LLM 可选、post 统一落盘/交付）的责任划分？（见 Section 4）
- **状态是否可追溯**：是否引入了新的“关键状态”？如果是，是否落在 `memory/` 而不是 GitHub/tmp？（见 Section 6）
- **幂等与去重是否保持**：是否可能导致重复推送/重复写入（尤其是 tracker/last-seen 逻辑）？
- **外部依赖是否新增/变化**：如果新增外部依赖，是否补充了降级策略并更新 `7.1.1`？
- **LLM 输入是否膨胀**：是否扩大了候选集/上下文上限？如果是，是否有明确上限与 schema 校验？
- **GitHub 写入是否仍“只追加、不破坏人工区”**：尤其是 `paper_index.md` 的 auto section、各 tracker 表格。
- **告警与静默是否一致**：成功时 stdout 是否保持为空？异常是否可行动、可定位？
- **文档是否同步**：若改动涉及时间线、watchlist、数据源、落盘路径，是否同步更新 `20-cron-tasks.md` / `30-vla-tasks.md` / 本文？
- **生成性内容是否有溯源标记**：若任务产出的是 LLM 生成的文章/报告（非结构化提取），是否带有 `auto_generated: true` frontmatter？文件名是否与人工撰写文件可区分？（见 5.2.1 Theory Deep Dive 质量防线）

### 8.2 常见反模式（明确禁止）

- **在正文生成阶段联网**：会导致事实漂移与不可复现（应放到 prep 阶段产出候选与来源列表）。
- **把关键状态只写在 GitHub**：GitHub 是交付层，不是状态层；状态必须在 memory，避免 API 失败导致逻辑失真。
- **失败时“补充编造”**：任何缺数据场景宁可输出空数组/跳过 section，也不能编造条目。
- **直接编辑 `jobs.json`（任何改动，包括 prompt）**：Gateway 会定期将内存状态覆写到 `jobs.json`，直接编辑的**任何字段**（新增 job、修改 prompt、改参数）都会被擦除。必须通过 `moltbot cron add`（新增）或 `moltbot cron edit`（修改）CLI 操作，才能同时更新 gateway 内存并持久化。rev.10 教训：rev.9 通过直接编辑 `jobs.json` 加入的 patience 指令在数小时内全部丢失。
- **假设 memory 文件结构而不验证**：不同任务写入的 memory 文件结构差异很大（嵌套 vs 扁平、字段名各异）。新增读取 memory 的脚本**必须先读取真实文件验证字段名和嵌套层次**，否则首次运行必败。
- **让 LLM agent 直接写 memory 文件**：agent 不擅长"读取已有 → 合并 → 写回"的逻辑，实测会丢失全部历史数据。memory 写入必须走 `memory-upsert.py` 或 post 脚本。
- **对不需要联网的纯脚本任务开启 enable_search**：虽然 `qwen3.5-plus` 下 `enable_search` 是全局开启的，但模型会自主决策是否搜索，因此不再有 rev.8 时期的强制延迟担忧。但对于纯脚本任务（RSS 收集 / Watchdog / Preflight），它们不调用 LLM，因此该参数无实际影响。
- **子进程阶段无心跳导致 agent 杀死进程**：仅在 `_run()` 前后打点不够；只要内部使用 `subprocess.run(stdout=PIPE)`，子进程执行期间父进程仍可静默数分钟（实测 150-540 秒）。LLM agent 的 `process` 工具会据此判定 hung 并 kill。**必须在子进程执行期间持续输出心跳（建议每 20-30 秒）**，推荐统一使用 `/home/admin/clawd/scripts/_heartbeat_run.py`。
- **内部 agent 调用使用固定 session ID**：two-phase 脚本内部调用 `node agent --session-id <固定值>` 时，跨天的 session 历史会累积，可能导致 LLM 上下文污染（如 AI Weekly 生成了 VLA 内容）。**session ID 必须包含日期**（如 `ai-weekly-2026-02-15`），确保每日独立上下文。
- **将 progress 输出到 stderr 而非 stdout**（rev.7 纠正）：曾经认为 "silent-on-success" 脚本应把 progress 写到 stderr 以保持 stdout 为空。**实测失败**：agent 结合 prompt 中 "stdout 为空则回复为空" 的指示，将空 stdout 理解为"无输出"并主动 SIGKILL 进程。**所有 agent 执行的脚本，progress 必须走 stdout**。如需避免 TG 噪音，应在 prompt 中指示 agent 过滤 `[progress]` 行。
- **heartbeat 间隔过长（> 35 秒）**：agent 的 exec 工具会在无新输出时判定进程可能 hung。在长等待循环中（如 watchdog 等待补跑结果），heartbeat 间隔不得超过 30 秒。
- **cron prompt 未指定 exec timeout**：若 prompt 不明确指定 `timeout: N`，agent 可能使用默认短超时值，导致长运行脚本被工具层面 SIGKILL。**必须在 prompt 中明确写 `timeout: N` 秒数**。
- **用 root 用户运行/修改文件后不修复 owner（Root 污染）**：维护操作中一旦用 root 修改 `/home/admin/.clawdbot/` 或 `/home/admin/.moltbot/` 下的文件（不仅是 `memory/tmp`，还包括 `agents/*/agent/models.json`、`agents/*/agent/auth-profiles.json`），很容易把 owner 变成 `root:root`，随后所有以 `admin` 运行的 cron/agent 会在读写配置时直接 `EACCES` 全挂。**修复**：立刻 `chown -R admin:admin /home/admin/.clawdbot /home/admin/.moltbot`。**预防**：优先使用 `sudo -u admin` 执行所有运维操作。（真实事故：2026-02-17，见 `20-cron-tasks.md` rev.16）
- **使用 Python 3.7+ 语法（系统 Python 为 3.6）**：`subprocess.run(capture_output=True)` 仅 3.7+ 支持，必须用 `stdout=subprocess.PIPE, stderr=subprocess.PIPE` 替代。f-string 可用（3.6 支持），但 `:=` 海象运算符不可用（3.8+）。


