# Agent Playbook（AI 应用开发监控手册）

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> **把每日涌入的 AI 工具、应用、架构变化转化为可查询、可推理、可累积的知识资产。**  
> 覆盖 Agent 框架、应用工具、架构深度解析、工作流灵感与社区情报。

---

## 为什么这个 Playbook 值得关注

- **每日自动 pipeline**：Moltbot 自动抓取 AI 工具/发布/社区信号，评级后写入本 repo。每天有新内容，不是手动维护的静态文档。
- **信号 → 洞见全链路**：原始 RSS → 过滤评级 → Deep Dive 解析 → 双周推理，每一层都有产出，避免"信息消费但不沉淀"。
- **可操作导向**：Deep Dive 强制包含 ASCII 架构图、生产崩溃陷阱、并发安全雷区和生存代码（不是摘要式综述）。
- **有观点，不灌水**：日报追工具 changelog，精选做编辑判断，社交情报追争议与观点——三条流水线定位不重叠。

---

## 先看这几篇（高信号入口）

- **① 工具/应用快速查询（高频入口）**：[`cognition/app_index.md`](./cognition/app_index.md)  
  日均新增 3–5 条，⚡战略级 / 🔧可操作 两级标注，按框架/工具/API 分类

- **② 生态全景图（理解分层）**：[`cognition/technology_landscape.md`](./cognition/technology_landscape.md)  
  Agent 层、模型层、基础设施层——帮你在高频条目之上形成稳定认知地图

- **③ 看架构怎么真正崩溃（Deep Dive）**：[`cognition/frameworks/`](./cognition/frameworks/)  
  12+ 篇资深工程师视角的诚实架构评审，每篇含：ASCII 架构图 + ≥2 个生产陷阱 + Claude Code 盲点 + 生存代码

- **④ 双周趋势推理（有观点的分析）**：[`reports/biweekly/`](./reports/biweekly/)  
  技术收敛/碎片化判断 + 上期预测回顾（✅/❌/⏳）+ 本期可验证预测

- **⑤ 真实工作流灵感（"我用 AI 做了 X"）**：[`memory/blog/archives/ai-workflow-inspiration/`](./memory/blog/archives/ai-workflow-inspiration/)  
  社区「I built / I automated」案例，过滤纯工具发布，只留有 before/after 的真实流程改造

---

## 🚀 快速开始（按目标选入口）

| 你现在想做什么 | 从这里开始 | 你会得到什么 |
|---|---|---|
| **查某个 AI 工具/框架** | [`cognition/app_index.md`](./cognition/app_index.md) | 工具描述 + 标签 + 日期 + 链接 |
| **理解某框架架构** | [`cognition/frameworks/`](./cognition/frameworks/) | 架构图 + 生产陷阱 + 代码示例 |
| **找实际落地案例** | [`action/use-cases/`](./action/use-cases/) | 真实场景 + 实施路径 + 避坑指南 |
| **跟社区热议/争议** | [`memory/blog/archives/`](./memory/blog/archives/) | 每日社交情报 + 观点信号 |
| **看趋势判断（双周）** | [`reports/biweekly/`](./reports/biweekly/) | 技术收敛/分歧 + 可验证预测 |
| **找 Prompt/脚手架** | [`action/prompts/`](./action/prompts/) + [`action/scaffolds/`](./action/scaffolds/) | 可复用 Prompt + 项目脚手架 |
| **了解 pipeline 原理** | [`cognition/architecture/`](./cognition/architecture/) | 系统设计文档 |

---

## 📂 目录结构

```
Agent-Playbook/
├── cognition/              # 认知层：理解与分析
│   ├── app_index.md        # AI 工具/应用索引（每日自动写入）
│   ├── technology_landscape.md  # 生态全景图（人工低频维护）
│   ├── frameworks/         # 框架深度解析（Deep Dive，12+ 篇）
│   └── methodology/        # 方法论文章
├── action/                 # 执行层：落地与实作
│   ├── use-cases/          # 真实场景案例
│   ├── scaffolds/          # 项目脚手架
│   ├── prompts/            # Prompt 库
│   ├── templates/          # SOP 模板
│   ├── tools/              # 工具使用指南
│   └── monitoring/         # 监控配置 + SCRIPTS.md pipeline 参考
├── memory/                 # 持久层：信号积累
│   └── blog/
│       └── archives/
│           ├── ai-daily-pick/          # 每日精选（编辑策展）
│           ├── ai-workflow-inspiration/ # 工作流灵感案例
│           ├── deep-dive/              # 架构深度解析存档
│           └── 2025/ 2026/             # 日报/社交情报归档
├── reports/                # 周期报告
│   ├── biweekly/           # 双周推理报告 + 预测回顾
│   └── cross-domain/       # 跨领域洞察
└── static/                 # 静态资源
```

---

## ⚙️ 自动化 Pipeline（内容是怎么来的）

本 repo 内容由 **Moltbot** 自动 pipeline 持续写入，人工负责深度内容和策展。

```
RSS 收集          → ai-app-rss-collect.py
│
├── 日报过滤       → prep-ai-app-rss-filtered.py → write-ai-app-daily.py
│                    每日 5–10 条工具/框架更新 → cognition/app_index.md
│
├── 每日精选       → ai-daily-pick-collect.py（web 搜索 + 🔴/🟡/🔵 编辑分级）
│                    → memory/blog/archives/ai-daily-pick/
│
├── 社交情报       → prep-ai-app-social.py → run-ai-app-social-two-phase.py
│                    观点/争议/病毒传播 → memory/blog/archives/
│
├── Deep Dive      → prep-ai-deep-dive.py → post-ai-deep-dive.py
│                    架构诚实评审（资深工程师视角）→ cognition/frameworks/
│
├── 工作流灵感     → prep-ai-app-workflow.py → run-ai-app-workflow-two-phase.py
│                    "I built/automated" 社区案例 → memory/blog/archives/ai-workflow-inspiration/
│
└── 双周推理       → run-ai-weekly-two-phase.py
                     技术收敛判断 + 预测 → reports/biweekly/
```

> Pipeline 脚本参考：见 [`action/monitoring/SCRIPTS.md`](./action/monitoring/SCRIPTS.md)（完整命名规则与 DAG 拓扑；两套 pipeline 共享同一台 Moltbot 网关）

---

## 🎯 内容导航

### Deep Dive（架构诚实评审）

每篇强制结构：① 架构本质（ASCII 图）② 谁在生产用 ③ 生产崩溃陷阱 ④ Claude Code 盲点 ⑤ 并发安全雷区 ⑥ 生存代码

见 [`cognition/frameworks/`](./cognition/frameworks/)（12+ 篇，持续更新）

### 双周报告（有预测、有回顾）

| 期次 | 链接 | 核心判断 |
|---|---|---|
| 2026-02-26 | [`reports/biweekly/2026-02-26.md`](./reports/biweekly/2026-02-26.md) | AG-UI 标准化 + 多智能体生产化；MCP 生态收敛 |
| 2026-02-18 | [`reports/biweekly/2026-02-18.md`](./reports/biweekly/2026-02-18.md) | Agent 执行层碎片化；分层推理路由省 66% 成本 |

预测回顾（✅已验证 / ❌落空 / ⏳待观察）见各期 [`reflection_*.md`](./reports/biweekly/)

---

## 📝 最近更新怎么看？

- **每日新增工具**：看 [`cognition/app_index.md`](./cognition/app_index.md) 最新几行（Moltbot 每日 append）
- **社区热议信号**：看 [`memory/blog/archives/`](./memory/blog/archives/) 最新日期目录
- **深度架构解析**：看 [`cognition/frameworks/`](./cognition/frameworks/) 最新 `.mdx` 文件
- **趋势与预测**：看 [`reports/biweekly/README.md`](./reports/biweekly/README.md)
- **版本变更**：看 [`CHANGELOG.md`](./CHANGELOG.md)

---

## 写作与贡献

- **新增工具条目**：只在 [`cognition/app_index.md`](./cognition/app_index.md) 对应分类表格末尾追加，备注栏标 `✍️`
- **写深度分析**：优先放 `cognition/`（分析）或 `action/`（实作）
- **原则**：信号进 `memory/blog/`，知识资产进 `cognition/` / `action/`

完整规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## ⚖️ 许可协议

内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh) 许可协议，代码采用 MIT 协议。
