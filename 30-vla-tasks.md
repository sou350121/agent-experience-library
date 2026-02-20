# VLA 任务群文档

> 最后修订：2026-02-19 rev.3
> 关联文档：[00-root-docs.md](00-root-docs.md) | [50-system-design.md](50-system-design.md)

---

## 1) 任务总览

| 任务名称 | Job ID | Schedule (CST) | deliver | account | Telegram To |
|----------|--------|----------------|---------|---------|------------|
| VLA RSS 信息收集 | `55f14513` | 每天 07:30 | — | `original` | — |
| VLA Daily Hotspots | `a63e051a` | 每天 08:00 | false | `original` | 1898430254 |
| VLA Social Intelligence | `e170613a` | 每天 08:30 | false | `original` | 1898430254 |
| VLA Benchmark SOTA Tracker | `3aeb6134` | 每天 08:45 | — | `original` | 1898430254 (脚本内) |
| VLA Release Tracker | `2ec9125b` | 每天 09:00 | — | `original` | 1898430254 (脚本内) |
| VLA Theory Deep Dive (R1) | `7fe3f14c` | 周一/三/五 15:30 | false | `original` | 1898430254 |
| VLA Theory Deep Dive (R2) | `6c389b01` | 周一/三/五 16:00 | false | `original` | 1898430254 |
| VLA 代碼深度分析 | `03bdb20f` | 每周五 14:00 | true | `original` | 1898430254 |
| VLA Weekly Deep Dive | `48bb8537` | 每周五 17:30 | — | `original` | 1898430254 (脚本内) |
| VLA-Handbook Biweekly Report | `824a3683` | 每 14 天，次次 02-25 10:00 | — | `original` | 1898430254 (脚本内) |
| VLA Biweekly Reflection | `8f1d5d41` | 每 14 天，次次 02-25 10:30 | — | `original` | 1898430254 (脚本内) |

**说明：**
- `deliver: false` = 禁止 gateway 把 agent 最终回复直接投递到 Telegram（Telegram 由 post 脚本或显式 `moltbot message send` 处理）
- `account: original` = VLA-handbook-moltbotDaily 机器人（VLA 专用频道）
- SOTA / Release Tracker / Weekly / Biweekly 无 `deliver` 设置 = agent 不需要 Telegram final reply（post 脚本负责全流程）

---

## 2) 每日任务执行链

```
07:30  VLA RSS 信息收集
         └─ vla-rss-collect.py
         └─ 输出：/home/admin/clawd/memory/vla-rss-YYYY-MM-DD.json

08:00  VLA Daily Hotspots
         └─ run-vla-daily-two-phase.py
              Phase 1: 读取 vla-rss-YYYY-MM-DD.json
              Phase 2: LLM 选纸（agent reports）
              Phase 3: post-vla-daily.py
                         └─ 更新 vla-daily-hotspots.json（reported_papers 去重）
                         └─ 更新 daily-stats.json
                         └─ Telegram → 1898430254

08:30  VLA Social Intelligence
         └─ run-vla-social-two-phase.py
              Phase 1: prep-vla-social.py（GitHub/Twitter/Web 采集）
              Phase 2: LLM 分析（agent reports）
              Phase 3: post-vla-social.py
                         └─ 更新 vla-social-intel.json
                         └─ Telegram → 1898430254

08:45  VLA Benchmark SOTA Tracker
         └─ run-vla-sota-two-phase.py
              Phase 1: prep-vla-sota.py（Papers With Code 等）
              Phase 2: LLM 分析
              Phase 3: post-vla-sota.py
                         └─ 更新 vla-sota-tracker.json（含 last_checked 字段）
                         └─ 推 GitHub theory/benchmark_tracker.md（有新数据时）
                         └─ Telegram → 1898430254（有新数据或周五快照时）

09:00  VLA Release Tracker
         └─ run-vla-release-two-phase.py
              └─ 更新 vla-release-tracker.json（github-last-seen.checked_at）
              └─ Telegram → 1898430254（有新 release 时）

09:30  Daily Watchdog
         └─ daily-watchdog.py
              └─ 验证：vla_rss / vla_daily / vla_social / vla_release / vla_sota
              └─ 缺失时触发补跑（SOTA 仅告警，不补跑）
```

---

## 3) 每周任务

| 时间 | 任务 | 脚本 | 说明 |
|------|------|------|------|
| 周一/三/五 15:30 | VLA Theory Deep Dive (R1) | prep-vla-theory.py → post-vla-theory.py（agent 直接调用） | 日报中 strategic 论文深度解读 |
| 周一/三/五 16:00 | VLA Theory Deep Dive (R2) | 同上（备份轮次） | 防止 R1 超时漏报 |
| 周五 14:00 | VLA 代碼深度分析 | （LLM 直接执行） | 分析 actionable 论文代码 |
| 周五 17:30 | VLA Weekly Deep Dive | run-vla-weekly-two-phase.py | 一周 VLA 进展综述 |

---

## 4) Memory 文件与联动

| 文件 | 写入任务 | 读取任务 | 说明 |
|------|----------|----------|------|
| `vla-rss-YYYY-MM-DD.json` | VLA RSS 收集 | Daily Hotspots, SOTA, Watchdog | 日期分片，按天滚动 |
| `vla-daily-hotspots.json` | post-vla-daily.py | Watchdog, Weekly, Theory | `reported_papers[]` 去重列表 |
| `daily-stats.json` | post-vla-daily.py | Watchdog | 关键词命中统计 |
| `vla-social-intel.json` | post-vla-social.py | Watchdog | `social_intel[]` 按日期索引 |
| `vla-sota-tracker.json` | post-vla-sota.py | Watchdog | `last_checked` 日期戳（2026-02-19+） |
| `vla-release-tracker.json` | post-vla-release.py | Watchdog | `github-last-seen[repo].checked_at` |
| `vla-weekly-digest.json` | post-vla-weekly.py | Weekly | 周报去重，首次运行自动创建 |
| `active-config.json` | 手动维护 | vla-rss-collect.py, prep-vla-social.py | VLA 关键词配置（keywords_A/B） |

**关键路径：** `/home/admin/clawd/memory/`
**脚本路径：** `/home/admin/clawd/scripts/`

---

## 5) Watchdog 验证矩阵

| 检查项 | key | 验证方式 | 失败动作 |
|--------|-----|----------|----------|
| VLA RSS | `vla_rss` | 文件存在 | 立即补跑 vla-rss-collect.py |
| VLA Daily Hotspots | `vla_daily` | reported_papers 含今日条目 | 触发 cron run |
| VLA Social Intel | `vla_social` | social_intel 含今日条目 | 触发 cron run |
| VLA Release Tracker | `vla_release` | github-last-seen 任意 repo checked_at = today | 触发 cron run |
| VLA SOTA Tracker | `vla_sota` | last_checked = today | **告警只**（不补跑） |

---

## 6) Telegram 路由規則

所有 VLA 任務均路由到 **VLA-handbook-moltbotDaily**（account: `original`）。

```
Bot: VLA-handbook-moltbotDaily (account: original)
Channel: VLA 專屬 Telegram 頻道
Target: 1898430254
```

> ⚠️ 注意：`payload.account` 為空時，moltbot 使用 `moltbot.json` 的全局 `botToken`（= `original`/VLA bot）。
> 目前行為正確，但為防止全局默認被更改，**所有腳本 argparse `--account` 應顯式設為 `original`**（rev.3 已統一修正）。

## 8) Post Script Account 默認值一覽（2026-02-19 審計後）

| Script | argparse default | 調用來源 | 備注 |
|--------|-----------------|----------|------|
| `post-vla-daily.py` | `original` ✓ | `run-vla-daily-two-phase.py` 傳入 | rev.3 修正 |
| `post-vla-social.py` | `original` ✓ | `run-vla-social-two-phase.py` 傳入 | 原本已是顯式 |
| `post-vla-theory.py` | `original` ✓ | prompt 不傳（故依 default） | rev.3 修正 |
| `post-vla-sota.py` | `original` ✓ | `run-vla-sota-two-phase.py` 傳入（或依 default） | rev.3 修正 |
| `post-vla-release.py` | `original` ✓ | `run-vla-release-two-phase.py` 傳入（或依 default） | rev.3 修正 |
| `post-vla-weekly.py` | `original` ✓ | `run-vla-weekly-two-phase.py` 傳入 | rev.3 修正 |
| `post-ai-deep-dive.py` | `ai_agent_dailybot` ✓ | prompt 顯式傳 | rev.11 修正 |
| `post-ai-app-social.py` | `ai_agent_dailybot` ✓ | `run-ai-app-social-two-phase.py` 傳入 | rev.3 修正 |
| `post-ai-app-workflow.py` | `ai_agent_dailybot` ✓ | `run-ai-app-workflow-two-phase.py` 傳入 | rev.3 修正 |

---

## 9) 已知问题与变更日志

### 2026-02-19 rev.3（全面 account default 加固）

**背景：全系統審計發現所有 post/run script 的 argparse `--account` default 值存在隱式依賴風險。**

- **`post-ai-app-workflow.py` account 默認改為 `ai_agent_dailybot`**（真實 bug）：`_send_telegram` 函數默認正確但 argparse 默認為空。直接調用時 `account=""` → `if account:` False → 不傳 `--account` → 全局 botToken（VLA bot）。與今天 AI App Deep Dive 問題完全相同。
- **5 個 VLA post scripts account 默認改為顯式 `original`**：`post-vla-daily.py`、`post-vla-theory.py`、`post-vla-sota.py`、`post-vla-release.py`、`post-vla-weekly.py` 全部從 `default=""` 改為 `default="original"`，從隱式依賴全局 botToken 改為意圖明確。
- **修復 `/home/admin/clawd/scripts/` 下 21 個腳本的 root ownership**：過去 Cursor StrReplace 操作（以 root 身份運行）導致這些腳本 owner 變成 root:root。雖然執行無問題（world-readable），但 `sudo -u admin` 無法修改。已 `chown admin:admin /home/admin/clawd/scripts/*.py` 修正。

### 2026-02-19 rev.2

- **`post-ai-app-social.py` account 默認改為 `ai_agent_dailybot`**：修正潛伏 bug，防止直接調用時路由到 VLA bot。
- **`run-vla-weekly-two-phase.py` account 默認改為顯式 `original`**：從隱式依賴默認行為改為明確設置。

### 2026-02-19 rev.1（初始创建）

- **VLA Daily Hotspots 静默失败**：`run-vla-daily-two-phase.py` 脚本缺失，任务以 ok status 退出但无实际输出。修复：从零创建该脚本。
- **Theory Deep Dive deliver:true 杂讯**：R1/R2 的 `deliver:true` 导致 agent 最终回复被 gateway 二次投递到 Telegram，产生重复消息。修复：改为 `deliver:false`，no-candidates 分支改用显式 `moltbot message send --account original`。
- **active-config.json 缺失**：导致 daily-stats 关键词统计为空（silent degradation）。修复：手动创建含 keywords_A（16 项）/ keywords_B（18 项）的配置文件。
- **vla-weekly-digest.json 缺失**：首次 weekly 任务运行后自动生成，无需手动创建。
- **SOTA Tracker 无 last_checked 字段**：Watchdog 无法验证 SOTA 是否当日运行。修复：在 post-vla-sota.py 中始终写入 `last_checked`；在 daily-watchdog.py 中添加 `vla_sota` 告警检查。
- **VLA 代碼深度分析 deliver:true**：该任务无 post 脚本，`deliver:true` 是正确的（agent 最终回复即为 Telegram 内容）。保持不变。

---

## 7) 任务 Prompt 设计一览

### VLA RSS 信息收集
- **Prompt 類型**：純腳本 wrapper
- **核心目的**：每日清晨自動從 RSS 源（arXiv, PapersWithCode, GitHub）採集與 VLA 關鍵詞相關的論文與項目。
- **關鍵設計決策**：
  - **極簡模式**：僅調用 1 次 exec 工具，防止 Agent 擅自嘗試其他方式獲取數據。
  - **透傳回覆**：輸出 stdout 作為唯一回覆，確保 Gateway 正確捕獲數據流並更新 memory。
- **硬約束**：禁止 web_search/fetch；禁止添加任何解釋性前言或結語。

### VLA Daily Hotspots
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：從當日採集到的 RSS 數據中，挑選最值得關注的 VLA 熱點論文進行日报推送。
- **關鍵設計決策**：
  - **確定性候選集**：嚴禁自主上網搜索，確保選文完全基於 prep 腳本提供的 JSON。
  - **無狀態推理**：Agent 職責僅為調用執行腳本，分析與去重邏輯封裝在 Python 腳本中。
- **硬約束**：禁止 web_search/fetch；禁止任何過程性句子（如 "Now running..."）。

### VLA Social Intelligence
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：監控 Twitter、GitHub Trending 等社交媒體上的 VLA 領域討論與趨勢。
- **關鍵設計決策**：
  - **複雜邏輯封裝**：依賴 `run-vla-social-two-phase.py` 處理網頁抓取、清洗與去重。
  - **任務原子性**：Agent 作為觸發器，確保採集流程不受 LLM 幻覺影響。
- **硬約束**：禁止自主執行任何非指定腳本的命令。

### VLA Benchmark SOTA Tracker
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：追蹤 Papers With Code 等平台上的 VLA 基準測試排行榜變動，維護 SOTA 記錄。
- **關鍵設計決策**：
  - **資產驅動**：專注於 SOTA 數據的結構化提取與 GitHub `theory/benchmark_tracker.md` 的增量更新。
- **硬約束**：禁止額外分析或自由輸出，僅返回腳本 stdout。

### VLA Release Tracker
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：監控核心 VLA 項目（如 OpenVLA, Octo）的 GitHub Release/Tag 更新。
- **關鍵設計決策**：
  - **長超時設計**：設置 360s+ 超時以應對多個倉庫的 API 輪詢延時。
- **硬約束**：腳本運行期間禁止輸出任何描述或狀態信息，必須等待進程完全結束。

### VLA Theory Deep Dive (Round 1/2)
- **Prompt 類型**：自主 Agent
- **核心目的**：選取當日日报中最具價值的 1 篇論文進行結構化深度拆解，存入 VLA-Handbook/theory/。
- **關鍵設計決策**：
  - **深度優先**：每次僅處理 1 篇，信息不足時用 `> TODO` 標記或跳過，拒絕平庸總結。
  - **雙輪冗餘**：R1 與 R2 分時段運行，防止單次超時導致的深度文章漏產。
- **硬約束**：禁止 LaTeX 語法；web_fetch 總計 <= 5 次；絕對禁止輸出 Token。

### VLA 代碼深度分析
- **Prompt 類型**：自主 Agent
- **核心目的**：剖析標記為 `actionable` 的開源項目代碼，提升對其實現細節的理解。
- **關鍵設計決策**：
  - **靜態分析**：只讀代碼不跑代碼，禁止 clone 或安裝依賴。
  - **預算控制**：設置 100,000 Token 預算，防止過度閱讀不相關文件。
- **硬約束**：禁止安裝依賴；web_fetch 總計 <= 10 次。

### VLA Weekly Deep Dive
- **Prompt 類型**：兩阶段 wrapper
- **核心目的**：每週五對整週 VLA 領域的科研、項目、社交情報進行綜合綜述。
- **關鍵設計決策**：
  - **數據聚合**：調用 `run-vla-weekly-two-phase.py` 整合整週 memory 數據流。
- **硬約束**：輸出 stdout 作為唯一最終回覆。

### VLA-Handbook Biweekly Report
- **Prompt 類型**：自主 Agent
- **核心目的**：每 14 天進行跨內容推理，識別隱藏的模式、趨勢與技術缺口。
- **關鍵設計決策**：
  - **思考者角色**：強調「推理」而非「總結」，要求產出可驗證的預測。
  - **資產沉淀**：同時生成 Telegram 推送與 GitHub MD 存檔。
- **硬約束**：正文限 500 字以內；空 Section 必須刪除。

### VLA Biweekly Reflection
- **Prompt 類型**：自主 Agent
- **核心目的**：生成 3-10 個判斷題或技術追問，迫使讀者建立立場。
- **關鍵設計決策**：
  - **立場驅動**：問題不需要答案，價值在於引發思考與驗證。
  - **具體錨定**：必須基於本期雙週報告的具體事件生成。
- **硬約束**：嚴禁泛泛而談，必須有具體數據支持。

### 系統自省與自動調參 (J)
- **Prompt 類型**：自主 Agent
- **核心目的**：VLA 管道的進化引擎，根據運行統計數據自動優化配置。
- **關鍵設計決策**：
  - **閉環演進**：觀察過去 14 天數據 → 執行低風險改動 → 下一週期驗證。
  - **自主性控制**：低風險改動（如關鍵詞增刪）直接執行，不需要人工批准。
- **硬約束**：每輪最多自動執行 3 個改動。
