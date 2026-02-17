# DeepSeek 之后，智源 Emu3 登 Nature：下一 token 统一多模态，通往“世界模型”的路线图

（图片：Nature 页面截图 + Emu3 架构图拼图，建议放 `static/img/emu3-nature/cover.jpg`）

2026 年 1 月 28 日，Nature 正刊发表了北京智源（BAAI）的论文《Multimodal learning with next-token prediction for large multimodal models》，核心结论很“粗暴”：

> **只用 next-token prediction（预测下一个 token）这一条训练目标，就能把文本、图像、视频（以及动作）统一到一个解码器模型里。**

- 论文：[`https://www.nature.com/articles/s41586-025-10041-x`](https://www.nature.com/articles/s41586-025-10041-x)  
- 代码：[`https://github.com/baaivision/Emu3`](https://github.com/baaivision/Emu3)

这件事的重要性不在于某个榜单分数，而在于它对“多模态/世界模型/具身智能”的路线选择给出了一个清晰信号：**极简统一范式**（tokenize everything → decoder-only → NTP）可能会成为长期可扩展的主干。

---

## 1) Emu3 解决的是什么“路线之争”？

长期以来，多模态是分裂的：

- 图像/视频生成：扩散模型主导（从噪声开始逐步去噪）
- 视觉语言理解：encoder + LLM 的“拼装式”范式主导（CLIP/视觉编码器 + LLM）

而 Emu3 押注的是：**把多模态学习“还原”为序列建模**——像 LLM 一样做 next-token prediction，只不过 token 不再只是文本。

Nature 原文摘要直接写了：Emu3 “trained solely with next-token prediction”，并且在理解与生成任务上可匹敌“task-specific models”，同时不需要 diffusion 或 compositional architectures。

---

## 2) Emu3 的核心架构：tokenize everything + decoder-only

论文里把体系拆成 5 个紧密组件（我按工程视角重排一下）：

1. **统一 tokenization（核心前提）**  
   - 文本：BPE tokenizer  
   - 视觉：vision tokenizer，把图像/视频压成离散 token 流
2. **统一序列格式（document-style）**  
   通过特殊 token 把 caption/meta/vision tokens 组织成同一种“文档序列”
3. **decoder-only Transformer（结构极简）**  
   主要改动是把 embedding 扩展到能接收视觉 token
4. **训练：统一 NTP + loss weighting + dropout（稳定性关键）**  
   多模态训练很容易崩（论文明确提到无 dropout 会 collapse），配方与权重非常敏感
5. **推理：继承 LLM 基础设施 + CFG（让自回归生成更能打）**  
   论文给出“token-centric multimodal infrastructure”的愿景：边端做 tokenization，只传 token id 上云训练/推理

（图片：Nature Fig.1/3，建议放 `static/img/emu3-nature/fig1-fig3.jpg`）

---

## 3) 为什么这条路可能通向“世界模型”？

世界模型在工程上最要命的不是“会看图”，而是：

- **能预测未来**（视频扩展/未来帧预测）
- **能把感知、语言、动作放进一个时间轴**（VLA）

而 Emu3 的统一范式天然支持：

- **视频续写**：把视频当序列，做下一个 token 预测 → 可做未来预测/扩展
- **VLA**：把 vision-language-action 当一个交错 token 序列 → “动作”也是 token

论文里明确展示了 vision–language–action modelling for robotic manipulation，并且把它视为 next-token framework 的自然扩展，而不是额外拼装一个“机器人分支”。

这就是它“世界模型味道”很重的原因：**把世界当序列，把行动也当序列。**

---

## 4) 这条路线真正的门槛：不是模型结构，而是 tokenizer + 数据 + 稳定训练

“decoder-only + NTP”看起来像降维打击，但真正难点会从“结构创新”迁移到：

- **tokenizer 表达力/压缩率/重建质量的 trade-off**（论文给了详细 tokenizer 设计与对比）
- **多模态数据的组织与清洗**（尤其长视频与时空一致性）
- **训练稳定性工程**（dropout、loss weighting、packing、并行策略）
- **评测与对齐**（生成/理解/视频/VLA 的不同评测与后训练策略）

换句话说：**结构变简单了，系统工程变难了。**

---

## 5) 对工程实践者的启发（比“扩散已死”更重要）

“扩散模型已死”这种论断没意义。更重要的是：如果你在做多模态产品/具身智能，你可以用 Emu3 作为一种“路线参考”：

- **统一目标函数**可以显著降低系统复杂度（少一些拼装、少一些接口胶水）
- **继承 LLM infra**是决定性优势（训练/推理/部署复用成熟生态）
- **世界模型路线**可能不是“另起炉灶”，而是“统一序列建模继续扩展”

---

## 参考链接

- Nature 论文：[`https://www.nature.com/articles/s41586-025-10041-x`](https://www.nature.com/articles/s41586-025-10041-x)
- Emu3 GitHub：[`https://github.com/baaivision/Emu3`](https://github.com/baaivision/Emu3)

