🤔 *AI 应用双周反思* | 2026-02-26

_读完没立场 = 这两周在消费而不在研究_

━━━ 趋势与判断 ━━━

1️⃣ *AG-UI* 协议被 *Microsoft*、*Google* 推动，*LangGraph*/*CrewAI*/*Mastra* 集体采用。这个方向是在收敛还是在碎片化？如果现在要选一个 Agent-UI 协议押注，你选 *AG-UI* 还是继续观望？

2️⃣ *AutoGen v0.4* 全面重构支持异步通信，*LangChain* 推出 *Agent Builder* 正式版。基础设施都在转向生产平台——这是成熟信号还是内卷信号？你的下一个生产项目会选哪个？

3️⃣ *Sapiom* 拿 $15M 做 Agent 支付、*GitGuardian* 拿 $50M 做凭证安全。资本在押注 Agent 自主性的瓶颈。你认为当前 Agent 落地的最大阻碍是技术还是安全/合规？

4️⃣ *Open WebUI* 两周内连发 v0.8.1 和 v0.8.3，v0.8.1 带破坏性数据库变更。这种迭代节奏对生产部署意味着什么？你会在生产环境用 *Open WebUI* 还是等更稳定的方案？

5️⃣ *LlamaIndex* 向量存储 v1.0.0 将默认引擎从 *nmslib* 切到 *faiss*。*nmslib* 已废弃但很多人还在用。你的 RAG 系统用的什么向量索引？有没有迁移计划？

━━━ 技术追问 ━━━

🔬 *AG-UI* 协议的核心通信机制是什么？它如何解决 Agent 与 UI 之间的实时流式传输问题？
💡 答不上来建议读：https://github.com/microsoft/agent-framework 和 https://www.copilotkit.ai/blog/microsoft-agent-framework-is-now-ag-ui-compatible

🔬 *AutoGen v0.4* 的重构中"异步通信"和"可扩展架构"具体指什么？跟 v0.2/v0.3 的架构差异在哪里？
💡 答不上来建议读：https://devblogs.microsoft.com/autogen/autogen-reimagined-launching-autogen-0-4/

🔬 有人提出用 *CLI* 替代 *MCP* 来降低成本。*MCP* 的开销主要在哪里？*CLI* 方案真的能省吗？
💡 答不上来建议读：https://kanyilmaz.me/2026/02/23/cli-vs-mcp.html

---

_以上问题基于本期 AI 应用监控数据自动生成，旨在强迫你形成判断。_
