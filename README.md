# Agent Playbook

[![CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
![Auto-updated](https://img.shields.io/badge/内容-每日自动写入-blue)

**AI 应用生态的自动化情报站。** 每天海量 AI 工具发布、架构变化、社区争议——这个仓库用自动 pipeline 把信号提纯成可查询、可推理、可累积的知识资产。

> 38 框架深度解析 · 2000+ 工具条目 · 每日自动写入 · 双周有观点的趋势推理

---

## 和其他 AI 资讯合集的区别

| | 普通 AI 资讯合集 | Agent Playbook |
|---|---|---|
| 内容来源 | 人工搜集 / 定期更新 | 自动 pipeline，每日写入 |
| 架构分析深度 | 摘要介绍 | 强制 ASCII 图 + 生产崩溃陷阱 + 生存代码 |
| 工具发布 vs 争议 | 混在一起 | 三条流水线，定位不重叠 |
| 趋势判断 | 描述现象 | 双周给可验证预测，下期回顾 ✅/❌ |
| 是否"活的" | 静态文档 | 每天都有新提交 |

---

## 先看这几篇（建立认知框架）

- **① 工具快速查询**：[`cognition/app_index.md`](./cognition/app_index.md)  
  每日 3–5 条自动写入，⚡ 战略级 / 🔧 可操作标注

- **② 生态全景图**：[`cognition/technology_landscape.md`](./cognition/technology_landscape.md)  
  Agent 层 · 模型层 · 基础设施层的稳定认知地图

- **③ 架构怎么真正崩溃（Deep Dive）**：[`cognition/frameworks/`](./cognition/frameworks/)  
  38 篇诚实架构评审：ASCII 图 + 生产陷阱 + Claude Code 盲点 + 生存代码

- **④ 双周趋势推理**：[`reports/biweekly/README.md`](./reports/biweekly/README.md)  
  技术收敛/碎片化判断 + 上期预测回顾（✅/❌/⏳）+ 本期可验证预测

- **⑤ 真实工作流灵感**：[`memory/blog/archives/ai-workflow-inspiration/`](./memory/blog/archives/ai-workflow-inspiration/)  
  "I built / I automated" 案例，过滤纯工具发布，只留有 before/after 的真实改造

---

## 快速导航

| 目标 | 入口 | 说明 |
|---|---|---|
| 查某个 AI 工具 | [`cognition/app_index.md`](./cognition/app_index.md) | 工具 + 标签 + 日期 + 链接，每日更新 |
| 理解某框架架构 | [`cognition/frameworks/`](./cognition/frameworks/) | 架构图 + 生产陷阱 + 代码 |
| 找落地案例 | [`action/use-cases/`](./action/use-cases/) | 真实场景 + 实施路径 + 避坑 |
| 社区热议 / 争议 | [`memory/blog/archives/`](./memory/blog/archives/) | 每日社交情报 + 观点信号 |
| 趋势判断（双周） | [`reports/biweekly/`](./reports/biweekly/) | 技术收敛/分歧 + 可验证预测 |
| Prompt / 脚手架 | [`action/prompts/`](./action/prompts/) · [`action/scaffolds/`](./action/scaffolds/) | 可复用 Prompt + 项目脚手架 |
| 变更记录 | [`CHANGELOG.md`](./CHANGELOG.md) | Pipeline 改进 + 内容里程碑 |

---

## 内容是怎么自动生成的

```
RSS 收集
│
├── 日报            → prep-ai-app-rss-filtered.py → write-ai-app-daily.py
│                     每日 5–10 条工具更新 → cognition/app_index.md
│
├── 每日精选        → ai-daily-pick-collect.py（web 搜索 + 🔴/🟡/🔵 编辑分级）
│                     → memory/blog/archives/ai-daily-pick/
│
├── 社交情报        → prep-ai-app-social.py → run-ai-app-social-two-phase.py
│                     观点 / 争议 / 病毒传播 → memory/blog/archives/
│
├── Deep Dive       → prep-ai-deep-dive.py → post-ai-deep-dive.py
│                     资深工程师架构评审 → cognition/frameworks/
│
├── 工作流灵感      → prep-ai-app-workflow.py → run-ai-app-workflow-two-phase.py
│                     "I built/automated" 社区案例 → memory/blog/archives/ai-workflow-inspiration/
│
└── 双周推理        → run-ai-weekly-two-phase.py
                      技术收敛判断 + 预测 → reports/biweekly/
```

Pipeline 脚本完整参考：[`action/monitoring/SCRIPTS.md`](./action/monitoring/SCRIPTS.md)

---

## 目录结构

```
Agent-Playbook/
├── cognition/              # 认知层：理解与分析
│   ├── app_index.md        # AI 工具索引（每日自动写入）
│   ├── technology_landscape.md  # 生态全景图
│   ├── frameworks/         # 框架深度解析（38 篇）
│   └── architecture/       # 系统架构文档
├── action/                 # 执行层：落地与实作
│   ├── use-cases/          # 真实场景案例
│   ├── scaffolds/          # 项目脚手架
│   ├── prompts/            # Prompt 库
│   ├── templates/          # SOP 模板
│   ├── tools/              # 工具使用指南
│   └── monitoring/         # 监控配置 + SCRIPTS.md
├── memory/                 # 持久层：信号积累
│   └── blog/archives/
│       ├── ai-daily-pick/           # 每日精选
│       ├── ai-workflow-inspiration/ # 工作流灵感
│       └── 2025/ 2026/              # 日报 / 社交情报归档
├── reports/
│   ├── biweekly/           # 双周推理报告 + reflection
│   └── cross-domain/       # 跨领域洞察
└── static/
```

---

## 最近更新

- **每日工具条目**：[`cognition/app_index.md`](./cognition/app_index.md) 最新几行
- **社区热议信号**：[`memory/blog/archives/`](./memory/blog/archives/) 最新日期目录
- **深度架构解析**：[`cognition/frameworks/`](./cognition/frameworks/) 最新 `.mdx`
- **趋势与预测**：[`reports/biweekly/README.md`](./reports/biweekly/README.md)
- **版本变更**：[`CHANGELOG.md`](./CHANGELOG.md)

---

## 贡献

- 新增工具：在 [`cognition/app_index.md`](./cognition/app_index.md) 对应分类追加，备注栏标 `✍️`
- 深度分析：放 `cognition/`（分析）或 `action/`（实作）
- 原始信号：放 `memory/blog/`

完整规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## 许可协议

内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh)，代码采用 MIT。
