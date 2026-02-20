# AI 系统全息快照：三位一体架构 (OpenClaw + LLM + GitHub)

> [!IMPORTANT]
> **致 AI Agent (Codex/Clawd)**：这是你的认知锚点。它定义了系统的逻辑核心。你的目标不仅是运行代码，而是维护执行引擎（OpenClaw）、推理机（LLM）与持久化层（GitHub）之间“资产流”的完整性。

---

## 1. 逻辑核心：四层架构（已进化）

系统已从最初的"三位一体"（2026年2月）进化为**带假设校准反馈环的四层研究情报平台**。你必须尊重各层的边界与职责：

| 层级 | 组件 | 逻辑角色 | 实体 | 职责 |
| :--- | :--- | :--- | :--- | :--- |
| **执行层** | **OpenClaw** | **编排者** | Moltbot (Node.js) | 32 个 cron 任务、调度、Shell/Web 工具调用、Telegram 推送。 |
| **人格层** | **Character** | **身份源** |角色认知文件 / System Prompt | 定义 Agent 的立场（如：有角色立场的“研究助手”而非纯“执行进程”）。 |
| **认知层** | **LLM** | **推理者** | Qwen 3.5 Plus | 两阶段 ETL 推理。在"受限现实"中运行——只读清洗后的 JSON 候选集。 |
| **状态层** | **Memory** | **状态源** | `memory/*.json`（29+ 文件） | 系统逻辑的唯一事实来源。驱动去重、追踪与假设校准。**不可被 GitHub 替代。** |
| **交付层** | **GitHub** | **资产层** | VLA-Handbook + Agent-Playbook | 面向人类和下游任务的长期知识资产。有版本、可搜索、可审计。 |

### "资产流"哲学（闭环版）

系统不只是"发消息"，而是在**构建资产并持续验证核心判断**。

```
RSS / 联网搜索
      |
      v
 [OpenClaw Prep]  -----------------------------------------------+
      |                                                           |
      v                                                           v
 [LLM 推理]                                            assumptions.json
      |                                                 (14 条核心假设)
      v                                                           |
 [Memory JSON] <-- 累积写入 -- [post 脚本]                       |
      |                                                           |
      +---> Telegram  (信号——高时效，低留存)                     |
      |                                                           |
      +---> GitHub MD (资产——结构化，有版本记录)                 |
      |                                                           |
      +---> Calibration Check (09:15) <--------------------------+
               |   扫描 9 个 memory 源 × 14 条假设
               v
         confidence_suggestion (置信度调整建议)
         Telegram 🚨 (仅触发时推送)
```

三种产出模式：
- **信号（Signal）**：Telegram 通知。即时，短留存。
- **资产（Asset）**：GitHub Markdown。累积沉淀，人类可读，可审计。
- **校准（Calibration）**：每日假设验证。无触发则静默；核心判断被挑战时发出警报。

---

## 2. 第一层：OpenClaw (执行平面)

OpenClaw (Moltbot) 是系统的“身体”，提供传感器（RSS, 联网搜索）和执行器（Shell, GitHub API）。

### 2.1 配置模式 (供 AI 理解)
修改配置时必须遵循以下 JSON 结构：

#### `moltbot.json` (全局环境)
```json
{
  "auth": { "profiles": { "provider:name": { "provider": "...", "mode": "api_key" } } },
  "models": {
    "providers": {
      "alibaba-cloud-bailian": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": [{ "id": "qwen3.5-plus", "contextWindow": 1000000 }]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "alibaba-cloud-bailian/qwen3.5-plus" },
      "models": { "alibaba-cloud-bailian/qwen3.5-plus": { "params": { "enable_search": true } } }
    }
  }
}
```

#### `agents/*/agent/auth-profiles.json` (按 Agent 隔离的密钥)
**重要**：它的 schema 和 `moltbot.json` 不一样。这里必须用 `"type": "api_key"`（不是 `"mode"`）。

```json
{
  "version": 1,
  "profiles": {
    "alibaba-cloud-bailian:default": {
      "type": "api_key",
      "provider": "alibaba-cloud-bailian",
      "key": "<sk-...>"
    }
  }
}
```

#### `jobs.json` (调度器)
- **原则**：严禁直接编辑此文件。请使用 `moltbot cron edit/add`。
- **例外**：`moltbot cron edit` CLI 不支持 `--account` 选项。若需修改 `payload.account`，必须走应急程序：**停网关 → `sudo -u admin` 直接改 `jobs.json` → 启网关 → 回读验证**。若网关运行中直接改文件，会被内存同步覆盖。
- **逻辑**：任务分为 `systemEvent`（纯脚本执行）或 `agentTurn`（LLM 推理任务）。
- **现实检查**：即使网关默认模型是 `alibaba-cloud-bailian/qwen3.5-plus`，单个 job 仍可能把 `payload.model` 固定到别的模型（例如 `alibaba-cloud/qwen3-max-2026-01-23`）。务必以 job 的 `payload.model` 为准。

### 2.2 Telegram 三 Bot 路由规则

系统使用 3 个 Bot 按域分流，**新建任何有 Telegram 交付的任务时，必须显式设置 `payload.account`**：

| account | Bot 名 | 适用范围 |
| :--- | :--- | :--- |
| `original` | VLA-handbook-moltbotDaily | VLA 全部任务 |
| `ai_agent_dailybot` | AI Agent Daily | AI App / AI Agent 任务 |
| `new` | 运维 Bot | Watchdog / Preflight / 系统告警 |

- `payload.account` 为空时默认走全局 `botToken`（= `original`/VLA bot）。AI App 任务若未设置，内容会静默发到 VLA 频道——**不报错**。
- post script 的 argparse `--account` 默认值同样必须显式设置（不能是 `""`），否则直接调用时会走全局 bot。

---

## 3. 第二层：LLM (认知平面)

LLM (Qwen 3.5 Plus) 是系统的“大脑”。但它是一个被“确定性外壳”包裹的大脑。

### 3.1 受限现实 (两阶段管道)
我们从不让 LLM 处理未经清洗的原始数据。
1.  **第一阶段 (Prep)**：Python 脚本过滤并排序数据（如：提取前 20 篇论文）。输出：JSON 候选集。
2.  **第二阶段 (Reasoning)**：LLM 读取 JSON 候选集并应用复杂的业务规则。输出：结构化 JSON/Markdown。
3.  **第三阶段 (Post)**：Python 脚本验证并提交输出结果。

### 3.2 推理模式
- **会话隔离 (Session Isolation)**：每个任务必须有带日期的 Session ID（如 `vla-daily-2026-02-16`），防止上下文漂移和 Token 浪费。
- **自主决策**：对于 `qwen3.5-plus`，我们全局开启 `enable_search`，允许模型自主决定何时引用外部事实来支撑推理。

### 3.3 意图透明化 (Intent Transparency)
每个 Cron Job 的 Prompt 不仅仅是字符串，而是带有 **设计意图** 和 **硬约束** 的逻辑封装。
- **设计意图**：解释为什么这样设计（如：双轮冗余 R1/R2 是为了防超时）。
- **硬约束**：明确禁止项（如：禁止 LaTeX、web_fetch 次数上限）。
- **文档化**：所有 Prompt 的核心逻辑已在 `30-vla-tasks.md` 和 `40-ai-app-tasks.md` 的 §7 中详细定义。

---

## 4. 第三层：GitHub (持久化平面)

GitHub 是系统的“灵魂”与“记忆”。它是系统价值沉淀的地方。

### 4.1 持久化逻辑
- **内存 vs GitHub**：
  - `memory/*.json` 是 **系统状态**（逻辑驱动的唯一事实来源）。
  - `GitHub/*.md` 是 **知识资产**（人类阅读与下游任务的唯一事实来源）。
- **提交策略**：始终使用带有 Emoji 的描述性提交信息（📱 Daily, 📊 Report, 📝 Deep Dive）。

---

## 5. 系统的“范式”：编码与运维习惯

维护本系统时，必须遵守这些“遗传密码”：

### 5.1 确定性的健壮性
- **原子写入**：所有 memory 更新必须使用 `临时文件` + `os.replace`。
- **心跳机制**：Agent 执行的脚本必须每 20-30s 向 **stdout** 打印 `[progress]`，防止被网关强制杀掉。
- **无事即成功**：运维脚本（Watchdog/Preflight）在正常情况下应保持静默，仅在异常时报错。

### 5.2 Python 3.6 兼容性
- 生产环境为 Python 3.6.8。
- **禁用**：`capture_output=True`, `:=` (海象运算符), 包含嵌套引号的 f-string。
- **推荐**：`subprocess.run(stdout=subprocess.PIPE, stderr=subprocess.PIPE)`。

### 5.3 三件套验收（2 分钟 go/no-go）
任何迁移 / 模型变更 / 事故恢复后，先跑这三条。**都应该“静默”或显示 OK**：

```bash
# 1) 网关健康（应显示 OK）
sudo -u admin /home/admin/.local/share/pnpm/moltbot gateway health

# 2) Preflight 成功应完全静默（stdout 为空）
sudo -u admin python3 /home/admin/clawd/scripts/gateway-preflight.py

# 3) Watchdog 成功应完全静默（stdout 为空）
sudo -u admin python3 /home/admin/clawd/scripts/daily-watchdog.py
```

可选：确认 `qwen3.5-plus` 真的可用（从本地 auth store 读取 key；不会打印 key）：

```bash
sudo -u admin HOME=/home/admin python3 -c "import json,urllib.request; p='/home/admin/.clawdbot/agents/main/agent/auth-profiles.json'; d=json.load(open(p)); k=d['profiles']['alibaba-cloud-bailian:default']['key']; u='https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'; b=json.dumps({'model':'qwen3.5-plus','messages':[{'role':'user','content':'ping'}],'max_tokens':8,'temperature':0}).encode(); r=urllib.request.urlopen(urllib.request.Request(u,data=b,headers={'Authorization':'Bearer '+k,'Content-Type':'application/json'}),timeout=20); print('OK',r.status)"
```

### 5.4 系统进化运维基线（新增）
- **A1 健康快照**：`emit-system-health.py` 每天 09:45（Watchdog 后）写入 `/home/admin/clawd/memory/system-health.json`。
- **A2 生命周期清理**：`memory-janitor.py` 负责 30d/14d/3d 窗口；先以 `--dry-run` 运行观察，再切正式清理。
- **B1 周度质量评审**：`Weekly Output Quality Review` 每周日 10:30 写入 `/home/admin/clawd/memory/quality-review.json`。
- **A1↔B1 闭环**：健康快照已纳入 `quality_review.last_overall/trend_4w` 摘要字段，形成质量信号回路。
- **B1/B3 双域分栏（已对齐）**：周度评审与月度演进 Prompt 已明确要求按 `VLA` 与 `AI Agent` 两域分开评审/提案，并强制 `scope` 字段；禁止混写。
- **B2 Horizon Scan 已上线**：J / J-AI prompt 已加入视野扫描护栏（每轮最多 1 个新关键词、默认进 `keywords_B`、每条建议需 >=2 个学术/技术来源证据）。
- **B3 Prompt Evolution 已上线**：`Monthly Prompt Evolution Review` 每月写入 `/home/admin/clawd/memory/prompt-evolution.json`（仅建议，不自动改 prompt）。同时承担假设登记簿月度维护三步骤：① 过期 horizon 扫描 → ② 累积触发审视 → ③ 覆盖盲区候选假设发现（A 现有调整 / B 全新候选，双栏分列输出）。
- **C1 Calibration Check 已上线**：`Calibration Check - 假设校准扫描`（每天 09:15）读取 `assumptions.json`（14 条核心假设，跨 VLA/AI Agent/投资）+ 9 个 memory 源，LLM 扫描失效条件。无触发时静默；有触发时 🚨 Telegram 推送 + `confidence_suggestion`。产出：`calibration-check-{date}.json`。修改 `assumptions.json` 须人工确认。
- **A1 伪失败防护**：`emit-system-health.py` 已加入 CLI 假失败过滤（以 memory 产物反证），过滤结果写入 `tasks.false_failures_filtered`。
- **无事即成功**：两个脚本在健康状态应保持静默；仅在降级/异常时输出。
- **防复错变更流程**：遇到持续 CLI `1006` 时，采用受控流程：
  1) 停网关 2) 用 `admin` 落盘变更 3) 启网关 4) 回读 `jobs.json` 验证。
  这是应急路径；常规仍优先 `moltbot cron edit/add`。

---

## 6. 关键反模式 (死刑红线)

1.  **Stderr 陷阱**：严禁将进度信息输出到 `stderr`。OpenClaw 会将 stdout 为空视为"任务异常结束"并杀进程。**必须使用 stdout** 打印进度。
2.  **Root 污染（双重风险）**：
    - **严禁**以 `root` 修改 `/home/admin/.clawdbot/` 或 `/home/admin/.moltbot/` 下任何文件。Owner 变成 `root:root` 后 gateway 无法写入，导致 EACCES 全挂。**真实事故 (2026-02-17)**：Root 所有的 `models.json` 导致 8 个任务全败。**真实事故 (2026-02-19)**：Cursor StrReplace 修改 `moltbot.json` 导致文件丢失，gateway crash-loop 104 次。修复：从 `.bak` 用 `sudo -u admin python3` 恢复（见 `12-model-id-and-web-search.md` §7）。
    - **Cursor IDE 工具 = root 操作**：StrReplace/Write 以 root 运行。要改 `.moltbot/` 或 `.clawdbot/` 下的文件，必须在**终端**用 `sudo -u admin`，绝不能用 Cursor 文件工具。
    - **scripts/ 目录次级风险**：`/home/admin/clawd/scripts/` 下脚本被 Cursor StrReplace 后 owner 也变 root:root。脚本运行不受影响（world-readable），但 `sudo -u admin` 无法修改。修复：`sudo chown admin:admin /home/admin/clawd/scripts/*.py`。**真实发现 (2026-02-19)**：21 个脚本因此变为 root 所有。
    - 新 provider auth profile 必须用 `"type": "api_key"`（不是 `"mode"`），且须为**所有** agent（main、reports、ai_app_monitor、ai_daily_pick）添加。
3.  **幻觉状态**：严禁臆测 memory 文件的结构。在写入前必须先读取并验证 Schema。
4.  **直接编辑 Job**：手动改 `jobs.json` 会被 Gateway 的内存同步覆盖。请使用 CLI。**例外**：`payload.account` 字段 CLI 不支持，须走「停网关 → `sudo -u admin` 改文件 → 重启网关 → 回读验证」。
5.  **固定 Session ID**：使用 `vla-daily` 等固定 ID 会导致跨天上下文污染。必须使用 `vla-daily-{YYYY-MM-DD}`。
6.  **无约束搜索**：如果候选数据中已有信息，不要强制模型搜网。将 `enable_search` 作为事实校对工具，而非主要爬虫。
7.  **伪失败（CLI 1006）**：`moltbot cron run` 可能因为 websocket `1006` 断连返回 `exit_code=1`，但网关后台仍继续执行并最终完成。不要相信 CLI 返回码。应通过 `jobs.json state`、`cron runs` 或实际产物（memory/GitHub/Telegram）验收。
8.  **不回读=未生效**：任何配置变更，如果没有回读校验（`jobs.json`、memory 输出、`nextRunAtMs`），都视为不安全。"命令返回成功" 不能作为唯一证据。
9.  **`ok status ≠ 任务成功`（静默失败）**：LLM agent session 正常退出（`lastStatus: ok`）不代表脚本执行成功。真实验收须同时检查：`cron runs` summary 是否为 JSON 产出（非 `⚠️ Exec failed`）、Telegram 是否有实际推送、memory 文件是否含今日日期条目。**真实事故 (2026-02-19)**：`run-vla-daily-two-phase.py` 从未创建，连续多日 `lastStatus: ok` 但 Telegram 无推送，exec 报错被 LLM 吞掉。
10. **空 account 默认 = 静默路由错误**：post script 的 argparse `--account` 默认为 `""` 时，不传 `--account` 给 moltbot，走全局 botToken（VLA bot）。AI App 内容会静默发到 VLA 频道，不报任何错误。**VLA post scripts 必须设 `default="original"`，AI App post scripts 必须设 `default="ai_agent_dailybot"`**。

---

## 7. 演进日志与避坑指南 (优化心得)

本系统是迭代优化的结果。请勿回退到这些已被弃用或证伪的方案：

### 7.1 稳定性：从“触发即忘”到“闭环运维”
- **坑点**：早期依赖 CLI/网关返回码。现实中 `1006` 断连会让你误判“失败”，但任务可能在后台已完成。
- **优化**：
  - **Gateway Preflight (06:30)**：在早高峰前主动重启网关并校验 `jobs.json`，并且**自动检测 Root 污染**（扫描 `/home/admin/.clawdbot/agents/` 下非 admin owner 文件）。
  - **Daily Watchdog (09:30)**：通过读取 `memory` 和 `GitHub` 产物来二次校验全部任务。若缺失则触发 `force rerun`。
  - **并发控制**：将 `maxConcurrent` 从 4 降至 2。以前高峰期的拥堵会导致“雪崩式超时”。

### 7.2 推理：从“黑盒 LLM”到“两阶段 ETL”
- **坑点**：让 LLM 在一轮对话内完成爬虫、过滤和资产写入。导致成本高昂、URL 幻觉以及 403 错误直接挂掉整个任务。
- **优化**：
  - **Phase 1 (Prep)**：Python 处理所有“脏活”（RSS, API, 去重）。
  - **Phase 2 (Reason)**：LLM 只看清洗后的 JSON 候选。
  - **原因**：Qwen 3.5 Plus 擅长从结构化数据中提取信息，但如果指令过于复杂且包含大量原始网页，质量会大幅下降。

### 7.3 集成：从“Git 数据库”到“Git 交付”
- **坑点**：早期尝试从 GitHub 读取系统状态（如“上次抓取日期”）。
- **优化**：
  - **Memory JSON**：所有驱动逻辑的状态必须留在本地 JSON。
  - **GitHub Markdown**：仅用于人类阅读和长期归档。
  - **收益**：即使 GitHub API 触发频率限制或宕机，系统逻辑依然能正常运行。

---

## 8. AI 指令：如何演进系统

当你被要求增加新功能时：
1.  **分析流向**：识别它在 Prep → Reason → Post 生命周期中的位置。
2.  **定义资产**：知识在 GitHub 的哪里落盘？Memory 里的 Schema 是什么？
3.  **封装推理**：确保 LLM 的 Prompt 被一个确定性的 Prep 脚本包裹。
4.  **校验四层**：确保 OpenClaw 能调度它，LLM 能推理它，Memory 能追踪它，GitHub 能存储它。
5.  **考虑校准影响**：新功能会产生可能挑战 `assumptions.json` 的信号吗？若是，确保 `prep-calibration-check.py` 能读取新的 memory 源。


## 9. 任务 Prompt 核心逻辑 (Task Prompt Core Logic)

这是系统全部 32 个任务的 Prompt 设计初衷与约束。作为 Agent，你必须理解每个任务背后的“为什么”，而不仅仅是“做什么”。

---

### 9.1 VLA 研究任务 (11 个)

### VLA RSS 信息收集
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每日清晨自動從 RSS 源（arXiv, PapersWithCode, GitHub）採集與 VLA 關鍵詞相關的論文與項目。
- **關鍵設計決策**：
  - **極簡模式**：僅調用 1 次 exec 工具，防止 Agent 擅自嘗試其他方式獲取數據。
  - **透傳回覆**：輸出 stdout 作為唯一回覆，確保 Gateway 正確捕獲數據流並更新 memory。
- **硬約束**：禁止 web_search/fetch；禁止添加任何解釋性前言或結語。

### VLA Daily Hotspots
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：從當日採集到的 RSS 數據中，挑選最值得關注的 VLA 熱點論文進行日报推送。
- **關鍵設計決策**：
  - **確定性候選集**：嚴禁自主上網搜索，確保選文完全基於 prep 腳本提供的 JSON。
  - **無狀態推理**：Agent 職責僅為調用執行腳本，分析與去重邏輯封裝在 Python 腳本中。
- **硬約束**：禁止 web_search/fetch；禁止任何過程性句子（如 "Now running..."）。

### VLA Social Intelligence
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：監控 Twitter、GitHub Trending 等社交媒體上的 VLA 領域討論與趨勢。
- **關鍵設計決策**：
  - **複雜邏輯封裝**：依賴 `run-vla-social-two-phase.py` 處理網頁抓取、清洗與去重。
  - **任務原子性**：Agent 作為觸發器，確保採集流程不受 LLM 幻覺影響。
- **硬約束**：禁止自主執行任何非指定腳本的命令。

### VLA Benchmark SOTA Tracker
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：追蹤 Papers With Code 等平台上的 VLA 基準測試排行榜變動，維護 SOTA 記錄。
- **關鍵設計決策**：
  - **資產驅動**：專注於 SOTA 數據的結構化提取與 GitHub `theory/benchmark_tracker.md` 的增量更新。
- **硬約束**：禁止額外分析或自由輸出，僅返回腳本 stdout。

### VLA Release Tracker
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：監控核心 VLA 項目（如 OpenVLA, Octo）的 GitHub Release/Tag 更新。
- **關鍵設計決策**：
  - **長超時設計**：設置 360s+ 超時以應對多個倉庫的 API 輪詢延時。
- **硬約束**：腳本運行期間禁止輸出任何描述或狀態信息，必須等待進程完全結束。

### VLA Theory Deep Dive (Round 1/2)
- **Prompt 類型**：自主 Agent
- **核心目的**：選取當日日报中最具價值的 1 篇論文進行結構化深度拆解，存入 VLA-Handbook/theory/。
- **關鍵設計決策**：
  - **深度優先**：每次僅處理 1 篇，信息不足時用 `> TODO` 標記或跳過，拒絕平庸總結。
  - **雙輪冗餘**：R1 與 R2 分時段運行，防止單次超時導致的深度文章漏產。
- **硬約束**：禁止 LaTeX 語法；web_fetch 總計 <= 5 次；絕對禁止輸出 Token。

### VLA 代碼深度分析
- **Prompt 類型**：自主 Agent
- **核心目的**：剖析標記為 `actionable` 的開源項目代碼，提升對其實現細節的理解。
- **關鍵設計決策**：
  - **靜態分析**：只讀代碼不跑代碼，禁止 clone 或安裝依賴。
  - **預算控制**：設置 100,000 Token 預算，防止過度閱讀不相關文件。
- **硬約束**：禁止安裝依賴；web_fetch 總計 <= 10 次。

### VLA Weekly Deep Dive
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：每週五對整週 VLA 領域的科研、項目、社交情報進行綜合綜述。
- **關鍵設計決策**：
  - **數據聚合**：調用 `run-vla-weekly-two-phase.py` 整合整週 memory 數據流。
- **硬約束**：輸出 stdout 作為唯一最終回覆。

### VLA-Handbook Biweekly Report
- **Prompt 類型**：自主 Agent
- **核心目的**：每 14 天進行跨內容推理，識別隱藏的模式、趨勢與技術缺口。
- **關鍵設計決策**：
  - **思考者角色**：強調「推理」而非「總結」，要求產出可驗證的預測。
  - **資產沉淀**：同時生成 Telegram 推送與 GitHub MD 存檔。
- **硬約束**：正文限 500 字以內；空 Section 必須刪除。

### VLA Biweekly Reflection
- **Prompt 類型**：自主 Agent
- **核心目的**：生成 3-10 個判斷題或技術追問，迫使讀者建立立場。
- **關鍵設計決策**：
  - **立場驅動**：問題不需要答案，價值在於引發思考與驗證。
  - **具體錨定**：必須基於本期雙週報告的具體事件生成。
- **硬約束**：嚴禁泛泛而談，必須有具體數據支持。

### 系統自省與自動調參 (J)
- **Prompt 類型**：自主 Agent
- **核心目的**：VLA 管道的進化引擎，根據運行統計數據自動優化配置。
- **關鍵設計決策**：
  - **閉環演進**：觀察過去 14 天數據 → 執行低風險改動 → 下一週期驗證。
  - **自主性控制**：低風險改動（如關鍵詞增刪）直接執行，不需要人工批准。
- **硬約束**：每輪最多自動執行 3 個改動。

---

### 9.2 AI App 监控、运维与进化任务 (21 个)

### 7.1 AI App 监控任务 (11 个)

#### AI 应用监控 - 稳定源收集
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每日清晨採集 AI 應用開發領域的穩定 RSS 源數據。
- **關鍵設計決策**：
  - **極簡模式**：採用單次 exec 調用，確保採集流程穩定且不被 LLM 幻覺干擾。
- **硬約束**：禁止 web_search/fetch；禁止添加解釋文字。

#### AI 应用开发监控日报
- **Prompt 類型**：自主 Agent
- **核心目的**：根據採集到的 RSS 生成每日監控日報，存入 memory 與 GitHub。
- **關鍵設計決策**：
  - **嚴格時效**：優先 72 小時內信息，超過 30 天默認不收錄。
  - **來源優先**：強制要求一手來源（官方、GitHub Release 等），二手轉述僅作補充。
  - **寧缺毋濫**：新信息不足時減少篇幅，不湊數。
- **硬約束**：必須包含一手來源鏈接；禁止模糊引用。

#### AI 应用开发社交情报
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：監控 AI 應用開發領域的 Twitter、GitHub Trending 社交動態。
- **關鍵設計決策**：
  - **複雜邏輯封裝**：依賴 `run-ai-app-social-two-phase.py` 處理網頁抓取與清洗雜訊。
- **硬約束**：僅返回腳本 stdout 作為唯一回覆。

#### AI Agent 每日精選
- **Prompt 類型**：自主 Agent
- **核心目的**：跨 VLA 與 AI App 兩個頻道，挑選當日最具價值的單一核心亮點。
- **關鍵設計決策**：
  - **高門檻篩選**：強調實證（GitHub Release、官方博客）而非媒體轉述。
  - **歷史標註**：引用超過 7 天前的信息必須標註「舊聞補充」。
- **硬約束**：禁止占位符或模糊來源；寧缺毋濫。

#### AI 工作流灵感精选
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：每週四次（一/三/五/日）從採集數據中提取 AI 工作流（Workflow）相關靈感。
- **關鍵設計決策**：
  - **兩階段執行**：由 `run-ai-app-workflow-two-phase.py` 處理數據過濾。
- **硬約束**：僅返回腳本 stdout。

#### AI App Deep Dive
- **Prompt 類型**：自主 Agent
- **核心目的**：針對最具潛力的 AI 工具或產品進行 1500-3000 字的深度文章分析。
- **關鍵設計決策**：
  - **預抓取優先**：優先讀取 prep 腳本提供的預抓取文件，內容不足才調用 web_fetch。
  - **備選機制**：當首選目標抓取失敗時，自動嘗試下一候選（最多 3 個）。
- **硬約束**：web_fetch 總計 <= 5 次；嚴禁編造版本號或數字。

#### AI App Weekly Deep Dive
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：每週日對本週 AI 應用開發領域的所有進展進行綜述與歸檔。
- **關鍵設計決策**：
  - **數據聚合**：調用 `run-ai-weekly-two-phase.py` 整合整週 memory 數據。
- **硬約束**：僅返回腳本 stdout。

#### AI App Biweekly Report
- **Prompt 類型**：自主 Agent
- **核心目的**：每兩週進行一次 AI 應用領域的跨內容推理與趨勢識別。
- **關鍵設計決策**：
  - **長期視角**：強調工具收斂、碎片化趨勢等跨期推理。
- **硬約束**：正文限 500 字以內；空 Section 刪除。

#### AI App Biweekly Reflection
- **Prompt 類型**：自主 Agent
- **核心目的**：生成 3-10 個反思問題，引發讀者對 AI 應用趨勢的深層判斷。
- **關鍵設計決策**：
  - **題型覆蓋**：強制包含趨勢判斷、資源分配、真偽判斷、技術追問四類。
- **硬約束**：問題必須錨定具體數據/工具/事件。

#### AI Agent 自省与自动调参 (J-AI)
- **Prompt 類型**：自主 Agent
- **核心目的**：AI Agent 監控管道的進化引擎，自動優化配置。
- **關鍵設計決策**：
  - **閉環邏輯**：觀察近 7 天數據 → 執行低風險改動 → 驗證改動效果。
  - **數據門檻**：若當週數據量不足（<4天），則進入保守調整模式。
- **硬約束**：每輪最多執行 3 個低風險改動。

#### Token Usage Weekly Report
- **Prompt 類型**：自主 Agent（跨任務統計）
- **核心目的**：每週六統計系統所有任務的 Token 消耗、費用與環比變化。
- **關鍵設計決策**：
  - **動態掃描**：實時通過 `cron list` 獲取當前任務列表，而非硬編碼。
  - **多維分析**：統計次數、總 Token、平均成本及手動對話成本。
- **硬約束**：必須與上週數據對比計算環比變化。

---

### 7.2 共享运维任务 (5 个)

#### Gateway Preflight
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每日清晨重啟網關、校驗 `jobs.json` 配置並檢測 Root 權限污染。
- **關鍵設計決策**：
  - **靜默原則**：stdout 為空則代表正常，Agent 立即結束且不發送回覆。
- **硬約束**：禁止調用任何工具（除 1 次 exec）；禁止輸出過程文本。

#### Daily Watchdog
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：上午驗證當日所有核心任務的產出，並在缺失時觸發補跑。
- **關鍵設計決策**：
  - **噪聲過濾**：Agent 需過濾 `[progress]` 雜訊，僅返回正式報告內容。
- **硬約束**：過濾後若為空，則最終回覆為空。

#### System Health Snapshot
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：生成系統當日健康快照，過濾 CLI 偽失敗，存入 `system-health.json`。
- **關鍵設計決策**：
  - **數據依賴**：其產出的 JSON 為每週質量評審提供核心量化依據。
- **硬約束**：僅返回腳本 stdout。

#### Memory Janitor
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每日掃描內存文件夾，報告建議清理的項（30d/14d/3d 窗口）。
- **關鍵設計決策**：
  - **安全護欄**：目前僅運行 `--dry-run` 模式，只報告不執行實際刪除。
- **硬約束**：僅返回腳本 stdout。

#### Server Health Check - Fixed
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每小時監控磁盤、內存與 Gateway 進程狀態。
- **關鍵設計決策**：
  - **結構化告警**：⚠️ 告警頭 + 腳本輸出內容 + 針對性運維建議。
- **硬約束**：禁止過程性敘述；stdout 為空則回覆為空。

---

### 7.3 系统进化任务 (4 个)

#### Weekly Output Quality Review
- **Prompt 類型**：自主 Agent
- **核心目的**：每週日評審過去 7 天的產出質量，識別漏報（Missed Stories）。
- **關鍵設計決策**：
  - **雙域分欄**：嚴格區分 VLA 與 AI Agent 域，禁止將兩域結論混寫。
  - **量化校準**：讀取 `system-health.json` 進行數據對齊。
- **硬約束**：每條 missed story 或建議必須標註 scope（vla / ai_agent）。

#### Monthly Prompt Evolution Review
- **Prompt 類型**：自主 Agent
- **核心目的**：每月 1 日分析質量趨勢，提出 Prompt 改進提案與可驗證指標。
- **關鍵設計決策**：
  - **權責分離**：Agent 僅提供建議與指標，不進行自動化的配置修改。
  - **假設登記簿維護（三步）**：① 過期 horizon 掃描 → ② 累積觸發審視 → ③ 覆蓋盲區候選假設發現。
  - **候選假設發現**：掃描近 30 天 memory 信號，VLA 域與 AI Agent 域各自獨立識別「現有假設未覆蓋的結構性規律」。每個候選必須包含：現象 + memory 文件名 + 近 30 天次數、與現有假設的差異說明、hypothesis 草案、成熟度（emerging / accumulating / mature）。
  - **A/B 雙欄強制輸出**：【A 現有假設調整】（修參數/措辭）與【B 候選假設（全新）】必須分欄列出，不得混寫。
- **硬約束**：必須雙域分欄評價；候選假設僅在成熟度 accumulating（3–5 次信號）及以上才提出，信號不足可空缺並注明原因；修改 `assumptions.json` 須人工確認。

#### Calibration Check - 假设校准扫描
- **Prompt 類型**：自主 Agent
- **核心目的**：每日掃描核心假設是否觸發失效條件。
- **關鍵設計決策**：
  - **跨域掃描**：整合 VLA、AI Agent 與投資等多個維度的信號進行碰撞。
  - **異常警報**：無信號則靜默；有觸發則 Telegram 告警。
- **硬約束**：修改 `assumptions.json` 必須人工確認。

#### 系統自省與自動調參 (J)
- **Prompt 類型**：自主 Agent
- **核心目的**：VLA 管道的進化引擎，自動優化關鍵詞配置。
- **關鍵設計決策**：
  - **閉環邏輯**：觀察過去 14 天數據 → 執行低風險改動 → 下一週期驗證。
- **硬約束**：每輪最多自動執行 3 個改動。
