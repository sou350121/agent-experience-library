# AGENTS.md（AI 应用开发监控系统：给 Claude Code / Codex / Cursor 等编码代理）

> **最高准则：** 在开始任何工作前，务必阅读并严格遵守 [AGENT_CONSTITUTION.md](./AGENT_CONSTITUTION.md)。
>
> **项目定位：** 本仓库是"AI 应用开发监控系统"的 **Handbook（长期记忆体）**。
>
> - 信号（短寿命）：`memory/blog/`
> - 资产（长期可查）：`cognition/` + `action/` + `memory/reports/`
>
> **核心目标：** 让信息自动变成知识，让知识可查询、可推理、可累积。

---

## 1) 系统心智模型（你要按这个写）

- **Moltbot 写广度**：收集/过滤/写入索引、生成双周报告。
- **人写深度**：深度实作、代码拆解、架构洞察。

> 任何不确定事实必须标注"待核实"，严禁编造。

---

## 2) 目录拓扑（Holograph 架构）

本仓库遵循 [`cognition/architecture/ai_app_handbook_design.md`](./cognition/architecture/ai_app_handbook_design.md) 定义的三位一体架构。

- **`cognition/` (认知层)**：
  - 存放：技术栈、框架、方法论、架构模式、应用索引 (`app_index.md`)
  - 语义：Reference, Theory, "What & Why"
- **`action/` (执行层)**：
  - 存放：脚手架、SOP 模板、Prompt 库、集成指南、安全护栏、监控配置 (`monitoring/`)
  - 语义：SOP, How-to, Config
- **`memory/` (持久层)**：
  - 存放：Blog (Signals), Reports (`reports/`), Logs
  - 语义：Time-series data, Stream

---

## 3) 文件写入规则（硬约束）

### ✅ 允许编辑（人写区域）

- `cognition/frameworks/**` / `action/tools/**` / `cognition/methodology/**`
- `action/templates/**`
- `action/use-cases/**`
- `action/products/**` (如果存在)

### ⚠️ 仅追加，不覆盖（机器/索引区域）

- `cognition/app_index.md`：只能在对应分类表格末尾追加新行
- `memory/reports/README.md`：只能追加索引条目
- `memory/blog/archives/ai-daily-pick/README.md`：只能在表格末尾追加新行

### ❌ 默认不要触碰（自动化资产）

- `action/monitoring/daily-stats/**`
- `action/monitoring/change-log/**`

> `action/monitoring/active-config.json` 只有在"用户明确要求调整监控策略"时才允许改，并必须写清原因。

---

## 4) 标注系统（必须遵守）

- 重要性：⚡ / 🔧 / 📖
- 方向：🎯（primary）/ `[方向名]`（team）/ ✍️（人工）

`cognition/app_index.md` 的备注栏是关键证据链：记录来源、优先级与方向。

---

## 5) Moltbot 管道写入路径（Pipeline Output）

Moltbot 自动化管道会写入以下路径（不要手动覆盖这些文件）：

| 脚本 | 写入路径 | 频率 |
|:---|:---|:---|
| `write-ai-app-daily.py` | `memory/blog/archives/ai-daily-pick/YYYY-MM-DD.md` | 每日 |
| `post-ai-app-daily.py` | `memory/blog/archives/ai-daily-pick/README.md`（追加行） | 每日 |
| `post-ai-deep-dive.py` | `memory/blog/archives/deep-dive/YYYY-MM-DD-{slug}.md` | 按需 |
| `post-ai-weekly.py` | `memory/reports/YYYY-MM-DD.md` + `memory/reports/README.md` | 双周 |

---

## 6) 提交规范（Commit Convention）

小步提交（每次只做一类改动）。commit message 必须带正确 emoji 前缀：

| 任务 | 格式示例 |
|:---|:---|
| 每日 AI 精选 | `📄 daily pick: 2026-02-23 (+3 apps)` |
| 深度文章 | `📝 deep dive: {slug}` |
| 应用索引更新 | `🔧 app index: add {tool-name}` |
| 双周报告 | `📈 report: 2026-02-17 ~ 2026-02-23` |
| 文档/结构 | `docs: ...` |
| 新增机制/脚手架 | `feat: ...` |
| 配置/整理 | `chore: ...` |

---

## 7) 信号分类系统（Signal Classification）

本仓库监控的 AI 应用信号按三级分类：

**一级：产品发布（Product Launch）**
- 新工具/框架/API 发布（ProductHunt、GitHub Release、官方公告）
- 主要版本更新（破坏性 API 变更、重大功能）

**二级：技术洞察（Technical Insight）**
- 协议与架构演进（MCP 生态、AG-UI 协议、OpenAI Agents SDK、Anthropic Claude SDK）
- 工程实践（延迟/成本/可靠性 benchmark，需附数值与来源）
- 开源爆发（新 repo > 1000 stars/周，附 GitHub 链接）

**三级：生态信号（Ecosystem Signal）**
- 融资事件（与 AI 应用工具直接相关，附来源）
- 团队变动（核心维护者变更）
- 社区讨论（X/HN 高互动讨论，需附原贴链接）

> 三级信号仅记录事实，不夸大意义。不确定的内容标注"待核实"。

---

## 8) 查询提示（你应该怎么找答案）

- "最近有什么 X 相关的工具/应用？"→ 查 `cognition/app_index.md`
- "如何落地做 Y？"→ 查 `action/templates/` 与 `action/use-cases/`
- "过去两周趋势是什么？"→ 查 `memory/reports/`
- "今日精选是什么？"→ 查 `memory/blog/archives/ai-daily-pick/`
