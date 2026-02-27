# AI 应用开发监控系统（AI App Monitoring Handbook）

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> **把每日涌入的 AI 工具、应用、架构变化转化为可查询、可推理、可累积的知识资产。**  
> 覆盖 Agent 框架、应用工具、架构深度解析、工作流灵感与社区情报。

本仓库三层架构：

- **Moltbot**：生产者（自动收集 / 过滤 / 写入 / 报告）
- **Handbook（本 repo）**：累积者（结构化 / 版本控制 / 可搜索）
- **你**：消费者 + 深度生产者（查、读、写深度笔记）

---

## 为什么这个 Handbook 值得关注

- **每日自动 pipeline**：Moltbot 自动抓取 AI 工具/发布/社区信号，评级后写入本 repo。每天有新内容，不是手动维护的静态文档。
- **信号 → 洞见全链路**：原始 RSS → 过滤评级 → Deep Dive → 双周推理，每一层都有产出。
- **可操作导向**：Deep Dive 强制含 ASCII 架构图、生产崩溃陷阱、并发安全雷区和生存代码。
- **有观点，不灌水**：日报追 changelog，精选做编辑判断，社交追争议——三条流水线定位不重叠。

---

## 先看这几篇（高信号入口）

- **① 工具/应用快速查询**：[`stack/app_index.md`](./stack/app_index.md)  
  日均新增 3–5 条，⚡/🔧/📖 三级标注，按框架/工具/API 分类

- **② 生态全景图**：[`stack/`](./stack/) 目录  
  技术栈分层理解，在高频条目之上形成稳定认知地图

- **③ 双周趋势推理**：[`reports/biweekly/`](./reports/biweekly/)  
  技术收敛/碎片化判断 + 上期预测回顾（✅/❌/⏳）+ 本期可验证预测

- **④ 真实工作流灵感**：[`blog/`](./blog/)  
  社区「I built / I automated」案例，过滤纯工具发布，只留有 before/after 的真实流程改造

- **⑤ 监控系统配置与 pipeline 原理**：[`monitoring-system/`](./monitoring-system/)  
  动态参数 + 每日统计 + [`SCRIPTS.md`](./monitoring-system/SCRIPTS.md) pipeline 脚本参考

---

## 🚀 快速开始（按目标选入口）

| 你现在想做什么 | 从这里开始 | 你会得到什么 |
|---|---|---|
| **查某个 AI 工具/框架** | [`stack/app_index.md`](./stack/app_index.md) | 工具描述 + 标签 + 日期 + 链接 |
| **找实际落地案例** | [`use-cases/`](./use-cases/) | 真实场景 + 实施路径 + 避坑指南 |
| **跟社区热议/争议** | [`blog/`](./blog/) | 每日社交情报 + 观点信号 |
| **看趋势判断（双周）** | [`reports/biweekly/`](./reports/biweekly/) | 技术收敛/分歧 + 可验证预测 |
| **找 Prompt/脚手架** | [`implementation/`](./implementation/) | 可复用 Prompt + 项目脚手架 + SOP |
| **了解监控系统原理** | [`monitoring-system/SCRIPTS.md`](./monitoring-system/SCRIPTS.md) | Pipeline DAG + 脚本参考 |

---

## 📂 目录结构

```
Agent-Experience-Library/
├── stack/                  # 技术层：工具索引与分析（每日自动写入）
│   └── app_index.md        # AI 工具/应用索引
├── implementation/         # 实作层：集成、部署、Prompt、SOP
├── monitoring-system/      # 监控系统配置与自动输出
│   ├── SCRIPTS.md          # Pipeline 脚本参考（命名规则与 DAG）
│   ├── active-config.json  # 当前生效动态参数
│   ├── daily-stats/        # 每日统计（自动生成）
│   └── change-log/         # 配置变更历史
├── reports/                # 周期报告
│   └── biweekly/           # 双周推理报告 + 预测回顾
├── blog/                   # 信号层：每日动态（按日期归档）
├── use-cases/              # 场景层：可复现案例
├── products/               # 产品层：公司/产品拆解
├── starter-kits/           # 可复制脚手架
└── docs/                   # 历史文档（迁移中）
```

---

## ⚙️ 自动化 Pipeline（内容是怎么来的）

```
RSS 收集          → ai-app-rss-collect.py
│
├── 日报过滤       → prep-ai-app-rss-filtered.py → write-ai-app-daily.py
│                    每日 5–10 条工具更新 → stack/app_index.md
│
├── 每日精选       → ai-daily-pick-collect.py（web 搜索 + 🔴/🟡/🔵 编辑分级）
│                    → blog/
│
├── 社交情报       → prep-ai-app-social.py → run-ai-app-social-two-phase.py
│                    观点/争议/病毒传播 → blog/
│
├── Deep Dive      → prep-ai-deep-dive.py → post-ai-deep-dive.py
│                    架构诚实评审（资深工程师视角）→ stack/
│
├── 工作流灵感     → prep-ai-app-workflow.py → run-ai-app-workflow-two-phase.py
│                    "I built/automated" 社区案例 → blog/
│
└── 双周推理       → run-ai-weekly-two-phase.py
                     技术收敛判断 + 预测 → reports/biweekly/
```

完整脚本参考：[`monitoring-system/SCRIPTS.md`](./monitoring-system/SCRIPTS.md)

---

## 📝 最近更新怎么看？

- **每日新增工具**：看 [`stack/app_index.md`](./stack/app_index.md) 最新几行
- **社区热议信号**：看 [`blog/`](./blog/) 最新日期文件
- **趋势与预测**：看 [`reports/biweekly/`](./reports/biweekly/)
- **监控系统状态**：看 [`monitoring-system/daily-stats/`](./monitoring-system/daily-stats/)

---

## 写作与贡献

- **新增工具条目**：只在 `stack/app_index.md` 对应分类末尾追加，备注栏标 `✍️`
- **写深度分析**：放 `stack/`（分析）或 `implementation/`（实作）
- **原则**：信号进 `blog/`，知识资产进 `stack/` / `implementation/`

完整规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## ⚖️ 许可协议

内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh) 许可协议，代码采用 MIT 协议。
