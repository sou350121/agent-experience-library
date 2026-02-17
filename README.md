# AI 应用开发监控系统（AI App Monitoring Handbook）

> 🚀 将每日涌入的 AI 工具、应用、API 更新转化为**可查询、可推理、可累积**的知识资产（GitHub 直读优先）。

本仓库是整套系统中的 **Handbook（长期记忆体）**：

- **Moltbot**：生产者（收集/过滤/写入/报告）
- **Handbook（本 repo）**：累积者（结构化、版本控制、可搜索）
- **你**：消费者 + 深度生产者（查、读、写深度笔记）

系统设计文档：[`cognition/architecture/ai_app_handbook_design.md`](./cognition/architecture/ai_app_handbook_design.md)

---

## 快速开始（3 个入口）

1) **查应用/工具索引（高频入口）**：[`cognition/app_index.md`](./cognition/app_index.md)

2) **看双周趋势与跨内容推理**：[`memory/reports/`](./memory/reports/)

3) **看落地实作与 SOP**：[`action/templates/`](./action/templates/)

---

## 目录导航（Holograph 架构）

本仓库遵循 [01-system-holograph-for-ai-zh.md](../01-system-holograph-for-ai-zh.md) 定义的三位一体架构：

| 目录 | 对应层级 | 内容说明 |
|---|---|---|
| `cognition/` | **认知层 (LLM)** | 技术栈、框架、方法论、架构模式、应用索引 |
| `action/` | **执行层 (OpenClaw)** | 脚手架、SOP 模板、Prompt 库、集成指南、安全护栏、监控配置 |
| `memory/` | **持久层 (GitHub)** | 每日信号 (Blog)、双周报告、运行日志 |
| `static/` | **资源层** | 静态图片资源 |

---

## 写作与贡献（简版）

- **新增应用条目**：只在 `cognition/app_index.md` 对应分类表格末尾追加新行，并在备注标注 `✍️`。
- **写深度分析**：优先写在 `cognition/`（分析）或 `action/`（实作）。
- **不要把 repo 变成信息垃圾场**：信号进 `memory/blog/`，资产进 `cognition/` / `action/`。

更完整规范见：[`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## ⚖️ 许可协议

内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh) 许可协议，代码采用 MIT 协议。
