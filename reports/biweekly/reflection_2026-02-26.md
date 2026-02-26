🤔 *AI 应用双周反思* | 2026-02-26

_读完没立场 = 这两周在消费而不在研究_

━━━ 趋势与判断 ━━━

1️⃣ *AG-UI* 协议被 *Microsoft*/*Google* 推动、*LangGraph*/*CrewAI*/*Mastra* adopted。这是真正的收敛还是大厂主导的伪标准？如果只能押一个非 AG-UI 方案活过 Q2，你选谁？

2️⃣ *LangChain Agent Builder* 正式版 vs *AutoGen v0.4* 全面重构。一个走向产品化，一个走向架构重写。哪条路更接近"生产级 Agent 基础设施"的终局？

3️⃣ 资本用真金白银投票：*Sapiom* $15M 解决 Agent 支付，*GitGuardian* $50M 解决凭证安全。哪个问题的技术壁垒更高？为什么支付只值安全的 1/3？

4️⃣ *Open WebUI* 在 9 天内连发 v0.8.1 → v0.8.3，其中 v0.8.1 带数据库 schema breaking change。这种迭代速度是工程成熟还是技术债累积的信号？

5️⃣ *LlamaIndex* 将 *OpenSearch* 向量存储默认引擎从 *nmslib* 切换到 *faiss*。这是性能驱动还是维护成本驱动？你的 RAG pipeline 受影响吗？

━━━ 技术追问 ━━━

🔬 *AG-UI* 协议的核心 wire format 是什么？它如何区分"agent 状态流"和"UI 状态同步"？如果让你实现一个 AG-UI client，第一个要处理的 edge case 是什么？
💡 答不上来建议读：https://github.com/microsoft/agent-framework 和 https://www.copilotkit.ai/blog/microsoft-agent-framework-is-now-ag-ui-compatible

🔬 *AutoGen v0.4* 宣称"全面重构支持异步通信"。v0.3 的同步模型哪里成了瓶颈？新的可扩展架构是如何解耦 agent 通信和执行的？
💡 答不上来建议读：https://devblogs.microsoft.com/autogen/autogen-reimagined-launching-autogen-0-4/

🔬 "Making MCP cheaper via CLI" 这篇文章提出用 CLI 替代部分 *MCP* 调用。具体是哪些操作可以被 CLI 替代？token 节省的量化数据是多少？
💡 答不上来建议读：https://kanyilmaz.me/2026/02/23/cli-vs-mcp.html

---
_以上问题基于本期 AI 应用监控数据自动生成，旨在强迫你形成判断。_
