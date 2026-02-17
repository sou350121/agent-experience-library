# Anthropic 官方首发：Agent 评估体系怎么搭（编码 / 对话 / 研究 / 电脑操作）

Agent 越强，越难评估。

因为 Agent 不只是“回一句话”，它会多轮对话、调用工具、修改环境状态，还可能用你没预料到的方式完成任务——甚至“绕过”你写的评估逻辑。

Anthropic 在工程文章里把这件事讲得非常清楚：评估不是附加题，而是 Agent 能否规模化上线的**第一条护城河**。

- 参考来源：[`https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents`](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

（图片：Anthropic 原文中的 eval 组件图/Swiss Cheese 图，建议放 `static/img/agent-evals/anthropic-diagrams.jpg`）

---

## 0. 先把术语讲明白：你评估的到底是什么？

Anthropic 给了一组很实用的定义（我用更“工程化”的中文翻译一遍）：

- **Task（任务 / 用例）**：一个测试样例，包含输入与成功标准。
- **Trial（试验）**：同一个 task 的一次运行（因为 agent 有随机性，所以要跑多次）。
- **Transcript（轨迹 / 记录）**：一次 trial 的完整记录（对话、工具调用、关键中间结果等）。
- **Outcome（结果态）**：trial 结束后环境的最终状态（例如数据库是否真的写入订单，而不只是 agent 说“已下单”）。
- **Grader（评分器）**：对 transcript 或 outcome 的一项检查/评分逻辑（一个 task 可以组合多个 grader）。
- **Eval harness（评估框架）**：负责跑任务、隔离环境、记录轨迹、执行 grader、汇总指标的一整套基础设施。

关键点：**你评估的从来不只是“模型”，而是 “模型 + scaffold/harness” 的组合系统。**

---

## 1) 三类评分器（Grader）：不要迷信单一答案

Agent 评估通常是“组合拳”，三类 grader 各有职责：

### A. 代码型（Code-based）grader：快、便宜、可复现

- 字符串匹配 / 正则 / 模糊匹配
- 二值测试（fail-to-pass / pass-to-pass）
- 静态分析（lint / typecheck / security）
- 结果态验证（DB / 文件系统 / 配置 / 产物）
- 工具调用验证（用了什么工具、参数是否合理）
- transcript 指标（turn 数、tool call 数、token、耗时）

### B. 模型型（Model-based）grader：能处理“主观性”和“开放式输出”

- rubric 打分（按维度打分，比如同理心、解释清晰度、是否遵循政策）
- 自然语言断言（LLM 判定某条断言是否成立）
- pairwise 对比（A/B 哪个更好）
- 多评审一致性（multi-judge consensus）

注意：模型评分**天生不确定**，需要用少量人工/专家抽检做校准，否则会给你“虚假的安全感”。

### C. 人类（Human）grader：最贵但必要

- 专家评审（SME）
- 抽样复核（spot-check）
- A/B 用户实验

人类评分的价值往往在于：**校准 LLM grader**，以及评估那些“业务定义很复杂/高风险”的任务。

---

## 2) 两类评估：能力（capability）vs 回归（regression）

- **能力评估**：问“它能做到什么？”理想状态是从低分开始（给团队一座要爬的山）。
- **回归评估**：问“它还能不能稳定做到以前能做的？”理想状态接近 100%（质量红线）。

实践上：能力 eval 一旦被打满分，会逐步“毕业”为回归套件，否则 eval 会**饱和（saturation）**，失去改进信号。

---

## 3) 四类 Agent 怎么评（按 Anthropic 的“通用套路”翻译成可执行方法）

### 3.1 评估编码 Agent：结果 + 过程

编码 agent 的优势在于：很多任务可以有**确定性评分器**（能跑、能过测试）。

**（1）结果态：能否跑通/测试是否通过**  
参考基准：

- SWE-bench Verified：[`https://www.swebench.com/SWE-bench/`](https://www.swebench.com/SWE-bench/)
- Terminal-Bench：[`https://www.tbench.ai/`](https://www.tbench.ai/)

**（2）过程态：执行过程是否合理**  
即使都“过测”，也要分辨：是不是走了“反模式”（例如全表扫到内存里过滤）。

常用组合：

- 静态分析（复杂度、重复率、命名、漏洞、性能）
- LLM rubric（对代码质量/工具使用行为打分）
- transcript 指标（是否过度 tool call、是否绕远路）

示例（改写版，思路等价于 Anthropic 文中的展示，不要求你照搬全部 grader）：

```yaml
task:
  id: fix-auth-bypass_1
  desc: 修复当密码字段为空时的认证绕过漏洞

  graders:
    - type: deterministic_tests
      required:
        - test_empty_pw_rejected
        - test_null_pw_rejected

    - type: static_analysis
      commands:
        - eslint
        - tsc

    - type: llm_rubric
      rubric: prompts/code_quality.md

    - type: state_check
      expect:
        security_logs:
          event_type: auth_blocked

  tracked_metrics:
    - type: transcript
      metrics: [n_turns, n_toolcalls, n_total_tokens]
    - type: latency
      metrics: [time_to_first_token, time_to_last_token]
```

### 3.2 评估对话 Agent：最终状态 + 交互质量（通常需要用户模拟）

对话 agent 的难点在于：**互动本身就是评估对象**。

你既要验证“退款真的处理了”，也要验证“是否同理心、解释是否清晰、是否遵循政策/工具返回结果”。

典型做法：

- 用第二个 LLM 模拟用户（尤其是“对抗性对话”）
- state check 验证最终状态
- LLM rubric 评价语气/解释质量/是否 grounded
- transcript 约束（例如 max_turns）

相关基准：

- \(τ\)-Bench：[`https://arxiv.org/abs/2406.12045`](https://arxiv.org/abs/2406.12045)
- \(τ^2\)-Bench：[`https://arxiv.org/abs/2506.07982`](https://arxiv.org/abs/2506.07982)

### 3.3 评估研究 Agent：真实性（grounded）+ 覆盖（coverage）+ 来源质量

研究 agent 的输出很难像单元测试那样“绝对对/错”，更像“相对好/坏”：

- **真实性检查**：每个关键断言是否有来源支持（groundedness）
- **覆盖性检查**：任务要求的关键点是否覆盖（coverage）
- **来源质量**：是否使用权威来源，而不是只拿搜索排名第一

代表性基准：

- BrowseComp：[`https://arxiv.org/abs/2504.12516`](https://arxiv.org/abs/2504.12516)（“针在草堆里”的可验证问题）

### 3.4 评估计算机使用 Agent：UI 对了不算，后端状态才算

计算机使用 agent 是“像人一样点鼠标/看屏幕”的交互方式，因此评估也要升级：

- UI 层检查：URL、页面状态、UI 元素属性
- 后端状态验证：订单是否真的写入 DB、文件是否真的生成、配置是否真的生效

一个很容易忽略但很关键的点（Anthropic 提出）：  
**浏览器 agent 在 token 效率与延迟之间要取平衡**：

- 文本密集：读 DOM 往往更高效
- DOM 巨多且信息分散（如电商）：截图/视觉交互可能更省 token

所以评估里可以加入一条：**是否为场景选择了正确的交互工具（DOM vs screenshot）**。

---

## 4) 面对随机性：pass@k 与 pass^k

Agent 每次跑都可能不一样，所以需要用“多次 trial 的统计”描述它：

- **pass@k**：k 次尝试里“至少成功一次”的概率（偏“潜力/可用性”）
- **pass^k**：k 次尝试“次次都成功”的概率（偏“一致性/可靠性”）

你做产品时怎么选？

- **工具型**（一次成功就够用）：更关注 pass@k（尤其是 pass@1）
- **代理型**（用户期望每次都靠谱）：更关注 pass^k

---

## 5) 从 0 到 1 搭评估体系：一份工程路线图（高度概括）

Anthropic 的建议非常“工程化”，我把它浓缩成 8 步 checklist：

1. **别等完美数据集**：从 20–50 个真实失败用例开始
2. **任务必须可判定**：让两位领域专家能独立给出相同 pass/fail
3. **每个任务要有 reference solution**：证明任务可解、grader 没写错
4. **问题集要平衡**：既测“应该做”，也测“不该做”（避免单边优化）
5. **环境必须可复现/可隔离**：每次 trial 从干净环境开始，避免共享状态污染
6. **grader 不要过度约束路径**：尽量评 outcome，而不是死盯工具调用顺序
7. **必须读 transcript**：否则你不知道低分是 agent 烂，还是 eval 设计烂
8. **长期维护**：eval 是活体，需要 owner；能力 eval 饱和后要升级题库

---

## 参考链接

- Anthropic：Demystifying evals for AI agents  
  [`https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents`](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- \(τ\)-Bench：[`https://arxiv.org/abs/2406.12045`](https://arxiv.org/abs/2406.12045)
- \(τ^2\)-Bench：[`https://arxiv.org/abs/2506.07982`](https://arxiv.org/abs/2506.07982)
- BrowseComp：[`https://arxiv.org/abs/2504.12516`](https://arxiv.org/abs/2504.12516)
- SWE-bench Verified：[`https://www.swebench.com/SWE-bench/`](https://www.swebench.com/SWE-bench/)
- Terminal-Bench：[`https://www.tbench.ai/`](https://www.tbench.ai/)


