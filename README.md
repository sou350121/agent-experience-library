# Agent Playbook

[![CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
![Auto-updated](https://img.shields.io/badge/内容-每日自动写入-blue)

**AI 应用生态的自动化情报站。** 每天海量 AI 工具发布、架构变化、社区争议——这个仓库用自动 pipeline 把信号提纯成可查询、可推理、可累积的知识资产。

> 38 框架深度解析 · 2000+ 工具条目 · 每日自动写入 · 双周有观点的趋势推理

---

## 📬 今天更新了什么？（每日读者入口）

> 快速入口：[`daily/`](./daily/)（所有每日更新汇总）


| 类型 | 直达链接 | 更新节奏 |
|---|---|---|
| 🛠️ AI 工具 / 框架条目 | [`cognition/app_index.md`](./cognition/app_index.md) | 每日 3–5 条自动写入 |
| 📰 每日精选（编辑策展） | [`memory/blog/archives/ai-daily-pick/`](./memory/blog/archives/ai-daily-pick/) | 每日 |
| 🔥 社区热议 / 争议 / 病毒传播 | [`memory/blog/archives/`](./memory/blog/archives/) 最新日期目录 | 每日 |
| 💡 工作流灵感（"I built X"） | [`memory/blog/archives/ai-workflow-inspiration/`](./memory/blog/archives/ai-workflow-inspiration/) | Mon/Wed/Fri/Sun |
| 🔬 架构深度解析（Deep Dive） | [`cognition/frameworks/`](./cognition/frameworks/) 最新 `.mdx` | 每周 3 次 |
| 📊 双周趋势推理 | [`reports/biweekly/README.md`](./reports/biweekly/README.md) | 每两周 |

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

## 按需查找

| 目标 | 入口 | 说明 |
|---|---|---|
| 查某个 AI 工具 | [`cognition/app_index.md`](./cognition/app_index.md) | 工具 + 标签 + 日期 + 链接，每日更新 |
| 理解某框架架构 | [`cognition/frameworks/`](./cognition/frameworks/) | 架构图 + 生产陷阱 + 代码 |
| 生态全景图 | [`cognition/technology_landscape.md`](./cognition/technology_landscape.md) | Agent / 模型 / 基础设施分层认知地图 |
| 找落地案例 | [`action/use-cases/`](./action/use-cases/) | 真实场景 + 实施路径 + 避坑 |
| Prompt / 脚手架 | [`action/prompts/`](./action/prompts/) · [`action/scaffolds/`](./action/scaffolds/) | 可复用 Prompt + 项目脚手架 |
| 变更记录 | [`CHANGELOG.md`](./CHANGELOG.md) | Pipeline 改进 + 内容里程碑 |

---

## 内容是怎么自动生成的

```
RSS 收集
│
├── 日报            → 每日 5–10 条工具更新 → cognition/app_index.md
├── 每日精选        → web 搜索 + 🔴/🟡/🔵 编辑分级 → archives/ai-daily-pick/
├── 社交情报        → 观点 / 争议 / 病毒传播 → archives/
├── Deep Dive       → 资深工程师架构评审 → cognition/frameworks/
├── 工作流灵感      → "I built/automated" 社区案例 → archives/ai-workflow-inspiration/
└── 双周推理        → 技术收敛判断 + 预测 → reports/biweekly/
```

Pipeline 脚本完整参考：[`action/monitoring/SCRIPTS.md`](./action/monitoring/SCRIPTS.md)

---

## 目录结构

```
Agent-Playbook/
├── cognition/              # 认知层：理解与分析
│   ├── app_index.md        # ← AI 工具索引（每日自动写入）
│   ├── technology_landscape.md
│   ├── frameworks/         # ← 框架深度解析（38 篇）
│   └── architecture/
├── action/                 # 执行层：落地与实作
│   ├── use-cases/
│   ├── scaffolds/
│   ├── prompts/
│   ├── templates/
│   ├── tools/
│   └── monitoring/         # pipeline 配置 + SCRIPTS.md
├── memory/
│   └── blog/archives/
│       ├── ai-daily-pick/           # ← 每日精选
│       ├── ai-workflow-inspiration/ # ← 工作流灵感
│       └── 2025/ 2026/              # ← 日报 / 社交情报归档
├── reports/
│   ├── biweekly/           # ← 双周推理报告 + reflection
│   └── cross-domain/
└── static/
```

---

## 贡献

- 新增工具：在 [`cognition/app_index.md`](./cognition/app_index.md) 对应分类追加，备注栏标 `✍️`
- 深度分析：放 `cognition/`（分析）或 `action/`（实作）
- 原始信号：放 `memory/blog/`

完整规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## 许可协议

内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh)，代码采用 MIT。
