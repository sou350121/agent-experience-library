# System Holograph for AI: The Triple Alliance (OpenClaw + LLM + GitHub)

> [!IMPORTANT]
> **To AI Agents (Codex/Clawd)**: This is your cognitive anchor. It defines the logical nexus of the system. Your goal is not just to run code, but to maintain the integrity of the "Asset Flow" between the execution engine, the reasoner, and the persistence layer.

---

## 1. The Logical Core: Four-Layer Architecture

The system has evolved from a "Triple Alliance" (Feb 2026) into a **four-layer research intelligence platform** with a calibration feedback loop. You must respect the boundaries and responsibilities of each layer:

| Layer | Component | Logical Role | Entity | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Execution** | **OpenClaw** | **Orchestrator** | Moltbot (Node.js) | 32 cron jobs, scheduling, Shell/Web tooling, Telegram delivery. |
| **Character** | **Identity** | **Identity Layer** | System Prompt / Character Files | Defines the Agent's stance (e.g., a "Research Assistant" with a perspective, not just a "process"). |
| **Cognition** | **LLM** | **Reasoner** | Qwen 3.5 Plus | Two-phase ETL reasoning. Operates in "Bounded Reality" — only sees cleaned JSON candidates. |
| **State** | **Memory** | **State Layer** | `memory/*.json` (29+ files) | Unique source of truth for system logic. Drives dedup, tracking, calibration. Never replaced by GitHub. |
| **Delivery** | **GitHub** | **Asset Layer** | VLA-Handbook + Agent-Playbook | Long-term knowledge assets for humans and downstream tasks. Versioned, searchable, auditable. |

### The "Asset Flow" Philosophy (Closed Loop)

The system does not just "send messages" — it **builds assets and validates beliefs**.

```
RSS / Web Search
      │
      ▼
 [OpenClaw Prep]  ──────────────────────────────────────┐
      │                                                   │
      ▼                                                   ▼
 [LLM Reason]                                   assumptions.json
      │                                          (14 core hypotheses)
      ▼                                                   │
 [Memory JSON] ◄── accumulate ── [post scripts]          │
      │                                                   │
      ├──► Telegram  (Signal — high alert, low retention) │
      │                                                   │
      ├──► GitHub MD (Asset — structured, versioned)      │
      │                                                   │
      └──► Calibration Check (09:15) ◄────────────────────┘
               │   scans 9 memory sources × 14 assumptions
               ▼
         confidence_suggestion
         🚨 Telegram (triggered only)
```

Three delivery modes:
- **Signal**: Telegram notifications. Ephemeral, high-priority.
- **Asset**: GitHub Markdown. Cumulative, human-readable, auditable.
- **Calibration**: Daily hypothesis validation. Silent when clean; alert when a core belief is challenged.

---

## 2. Layer 1: OpenClaw (The Execution Plane)

OpenClaw (Moltbot) is the "Body". It provides the sensors (RSS, Web Search) and the actuators (Shell, GitHub API).

### 2.1 Configuration Schema (For AI Understanding)
You must follow these JSON structures when modifying configurations:

#### `moltbot.json` (Global Environment)
```json
{
  "auth": { "profiles": { "provider:name": { "provider": "...", "mode": "api_key" } } },
  "models": {
    "providers": {
      "alibaba-cloud-bailian": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": [{ "id": "qwen3.5-plus", "contextWindow": 1000000 }]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "alibaba-cloud-bailian/qwen3.5-plus" },
      "models": { "alibaba-cloud-bailian/qwen3.5-plus": { "params": { "enable_search": true } } }
    }
  }
}
```

#### `agents/*/agent/auth-profiles.json` (Per-Agent Secrets)
**Important**: This file is NOT the same schema as `moltbot.json`. It must use `"type": "api_key"` (not `"mode"`).

```json
{
  "version": 1,
  "profiles": {
    "alibaba-cloud-bailian:default": {
      "type": "api_key",
      "provider": "alibaba-cloud-bailian",
      "key": "<sk-...>"
    }
  }
}
```

#### `jobs.json` (The Scheduler)
- **Rule**: Never edit this file directly. Use `moltbot cron edit/add`.
- **Exception**: `moltbot cron edit` does NOT support the `--account` option. To set `payload.account`, use the break-glass procedure: **stop gateway → edit `jobs.json` as `sudo -u admin` → restart gateway → verify by readback**. Editing the file while the gateway is running will be overwritten by memory sync.
- **Logic**: Jobs are either `systemEvent` (for pure scripts) or `agentTurn` (for LLM reasoning).
- **Reality check**: Even if the gateway default model is `alibaba-cloud-bailian/qwen3.5-plus`, a job may pin `payload.model` to something else (e.g., `alibaba-cloud/qwen3-max-2026-01-23`). Always inspect the job's `payload.model`.

### 2.2 Telegram Three-Bot Routing Rules

The system uses 3 bots segmented by domain. **When creating any job with Telegram delivery, `payload.account` MUST be set explicitly:**

| account | Bot Name | Scope |
| :--- | :--- | :--- |
| `original` | VLA-handbook-moltbotDaily | All VLA tasks |
| `ai_agent_dailybot` | AI Agent Daily | AI App / AI Agent tasks |
| `new` | Ops Bot | Watchdog / Preflight / system alerts |

- An empty `payload.account` defaults to the global `botToken` (= `original` / VLA bot). AI App tasks left unset will silently deliver to the VLA channel — **no error is raised**.
- The argparse `--account` default in post scripts must also be explicit (never `""`); otherwise direct invocations fall back to the global bot.

---

## 3. Layer 2: LLM (The Cognitive Plane)

The LLM (Qwen 3.5 Plus) is the "Brain". However, it is a brain in a jar, bounded by **Deterministic Wrappers**.

### 3.1 Bounded Reality (Two-Phase Pipeline)
We never let the LLM handle raw, unfiltered data.
1.  **Phase 1 (Prep)**: Python scripts filter and rank data (e.g., top 20 papers). Output: JSON Candidates.
2.  **Phase 2 (Reasoning)**: LLM reads the JSON candidates and applies complex rules. Output: Structured JSON/Markdown.
3.  **Phase 3 (Post)**: Python scripts validate and commit the output.

### 3.2 Reasoning Patterns
- **Session Isolation**: Every task MUST have a date-based Session ID (e.g., `vla-daily-2026-02-16`) to prevent context drift and token waste.
- **Self-Determination**: With `qwen3.5-plus`, we enable `enable_search` globally, allowing the model to decide when to ground its reasoning in external facts.

### 3.3 Intent Transparency
Every Cron Job's Prompt is not just a string, but a logical wrapper with **Design Intent** and **Hard Constraints**.
- **Design Intent**: Explains the "why" behind the design (e.g., dual-round R1/R2 redundancy to prevent timeouts).
- **Hard Constraints**: Explicitly forbidden actions (e.g., No LaTeX, web_fetch limits).
- **Documentation**: The core logic of all Prompts is now detailed in Section 7 of `30-vla-tasks.md` and `40-ai-app-tasks.md`.

---

## 4. Layer 3: GitHub (The Persistence Plane)

GitHub is the "Soul" and "Memory". It is where the system's value accumulates.

### 4.1 Persistence Logic
- **Memory vs GitHub**: 
  - `memory/*.json` is the **System State** (Unique Source of Truth for logic).
  - `GitHub/*.md` is the **Knowledge Asset** (Unique Source of Truth for humans/downstream tasks).
- **Commit Strategy**: Always use descriptive commit messages with emojis (📱 Daily, 📊 Report, 📝 Deep Dive).

---

## 5. The "Vibe": Coding & Operational Patterns

To maintain this system, you must adhere to these "Genetic Codes":

### 5.1 Deterministic Robustness
- **Atomic Write**: Use `tmp file` + `os.replace` for all memory updates.
- **Heartbeat**: Agent-executed scripts MUST print `[progress]` to **stdout** every 20-30s to prevent SIGKILL.
- **Silent-on-Success**: Operational scripts (Watchdog/Preflight) remain silent unless an anomaly is detected.

### 5.2 Python 3.6 Compatibility
- The production environment is Python 3.6.8. 
- **NO**: `capture_output=True`, `:=`, f-strings with nested quotes that break 3.6.
- **YES**: `subprocess.run(stdout=subprocess.PIPE, stderr=subprocess.PIPE)`.

### 5.3 Three-Check Acceptance (2-minute go/no-go)
Run these after any migration / model change / incident recovery. **All should be silent or OK**:

```bash
# 1) Gateway should be OK
sudo -u admin /home/admin/.local/share/pnpm/moltbot gateway health

# 2) Preflight should be silent on success (stdout empty)
sudo -u admin python3 /home/admin/clawd/scripts/gateway-preflight.py

# 3) Watchdog should be silent on success (stdout empty)
sudo -u admin python3 /home/admin/clawd/scripts/daily-watchdog.py
```

Optional: verify `qwen3.5-plus` actually responds (reads key from local auth store; does NOT print the key):

```bash
sudo -u admin HOME=/home/admin python3 -c "import json,urllib.request; p='/home/admin/.clawdbot/agents/main/agent/auth-profiles.json'; d=json.load(open(p)); k=d['profiles']['alibaba-cloud-bailian:default']['key']; u='https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'; b=json.dumps({'model':'qwen3.5-plus','messages':[{'role':'user','content':'ping'}],'max_tokens':8,'temperature':0}).encode(); r=urllib.request.urlopen(urllib.request.Request(u,data=b,headers={'Authorization':'Bearer '+k,'Content-Type':'application/json'}),timeout=20); print('OK',r.status)"
```

### 5.4 Evolution Ops (New Baseline)
- **A1 Health Snapshot**: `emit-system-health.py` writes `/home/admin/clawd/memory/system-health.json` (daily 09:45, after Watchdog).
- **A2 Lifecycle Janitor**: `memory-janitor.py` handles 30d/14d/3d windows; start with `--dry-run` before enabling destructive cleanup.
- **B1 Weekly Quality Review**: `Weekly Output Quality Review` writes `/home/admin/clawd/memory/quality-review.json` (weekly Sunday 10:30).
- **A1↔B1 loop**: health snapshot now includes `quality_review.last_overall/trend_4w` for a compact quality signal.
- **B1/B3 dual-domain separation (aligned)**: weekly review and monthly evolution prompts now enforce split evaluation/proposals for `VLA` and `AI Agent`, require `scope`, and explicitly forbid mixed conclusions.
- **B2 Horizon Scan live**: J / J-AI prompts now include horizon scan with guardrails (max 1 new keyword per round, default to `keywords_B`, and >=2 academic/technical sources per recommendation).
- **B3 Prompt Evolution live**: `Monthly Prompt Evolution Review` writes `/home/admin/clawd/memory/prompt-evolution.json` (monthly, advisory-only; no automatic prompt edits). Also performs monthly assumptions maintenance (3-step): ① expired horizon scan → ② accumulated trigger review → ③ coverage blind spot candidate hypothesis discovery (output in A/B dual-column: A = existing hypothesis adjustments, B = new candidate hypotheses).
- **C1 Calibration Check live**: `Calibration Check - 假设校准扫描` (daily 09:15) reads `assumptions.json` (14 core hypotheses across VLA/AI Agent/Investment) + 9 memory sources. LLM scans for signals that might invalidate core assumptions. Silent when no trigger; 🚨 Telegram alert + `confidence_suggestion` when triggered. Output: `calibration-check-{date}.json`. Human approval required to modify `assumptions.json`.
- **False-failure shield in A1**: `emit-system-health.py` now filters known CLI false failures using memory evidence, writing filtered items to `tasks.false_failures_filtered`.
- **Silent-on-success**: both scripts should be silent on healthy runs; output only when degraded or error.
- **Anti-repeat workflow for cron changes**: under persistent CLI `1006`, use a guarded sequence:
  1) stop gateway 2) apply changes as `admin` 3) start gateway 4) verify by reading back `jobs.json`.
  This is a break-glass path; normal path is still `moltbot cron edit/add`.

---

## 6. Critical Anti-Patterns (The "Kill Switches")

1.  **The Stderr Trap**: Never output progress to `stderr`. OpenClaw interprets an empty `stdout` as "Task Finished Prematurely" and may kill the process. **Always use stdout** for progress markers.
2.  **The Root Poison (Double Risk)**:
    - **Never** modify any file under `/home/admin/.clawdbot/` or `/home/admin/.moltbot/` as `root`. Owner becomes `root:root`, gateway (running as `admin`) can no longer write, causing EACCES across all agents. **Real incident (2026-02-17)**: Root-owned `models.json` caused all 8 morning tasks to fail. **Real incident (2026-02-19)**: Cursor StrReplace on `moltbot.json` caused the file to be lost entirely — gateway entered crash-loop (104 restarts). Fix: restore from `.bak` with `sudo -u admin python3` (see `12-model-id-and-web-search.md` §7).
    - **Cursor IDE tools = root operations**: StrReplace/Write run as root. To modify files under `.moltbot/` or `.clawdbot/`, use `sudo -u admin` in a **terminal** — never use Cursor file tools.
    - **scripts/ directory secondary risk**: Scripts under `/home/admin/clawd/scripts/` modified by Cursor StrReplace also become `root:root`. Execution is unaffected (world-readable), but `sudo -u admin` cannot modify them. Fix: `sudo chown admin:admin /home/admin/clawd/scripts/*.py`. **Real discovery (2026-02-19)**: 21 scripts were found with root ownership.
    - New provider auth profiles must use `"type": "api_key"` (not `"mode"`), and must be added to **all** agents (main, reports, ai_app_monitor, ai_daily_pick).
3.  **The Hallucinated State**: Never assume the structure of a memory file. Always READ the file first to verify schema before writing.
4.  **Direct Job Editing**: Manually editing `jobs.json` will be overwritten by the Gateway's memory sync. Use `moltbot cron edit/add`. **Exception**: `payload.account` is not supported by the CLI — use the stop-edit-restart procedure.
5.  **Fixed Session ID**: Using a fixed ID like `vla-daily` causes context pollution across days. Use `vla-daily-{YYYY-MM-DD}`.
6.  **Unbounded Search**: Do not force the model to search the web if the data is already in the candidates. Use `enable_search` as a grounding tool, not a primary crawler.
7.  **The False Failure (CLI 1006)**: `moltbot cron run` can return `exit_code=1` due to websocket `1006` while the Gateway continues the job in the background. Do NOT trust the CLI return code. Verify via `jobs.json state`, `cron runs`, or the real assets (memory/GitHub/Telegram).
8.  **No Readback, No Change**: Any config change without post-change readback (`jobs.json`, memory output, nextRunAtMs) is considered unsafe. "Command succeeded" is never sufficient evidence.
9.  **`ok status ≠ Task Success` (Silent Failure)**: An LLM agent session that exits cleanly (`lastStatus: ok`) does NOT mean the script executed successfully. Real acceptance criteria: `cron runs` summary must be an actual JSON payload (not `⚠️ Exec failed`), Telegram must have received a real message, and the memory file must contain a today's-date entry. **Real incident (2026-02-19)**: `run-vla-daily-two-phase.py` was never created — tasks showed `lastStatus: ok` for multiple days with zero Telegram output; the exec error was silently swallowed by the LLM.
10. **Empty `account` Default = Silent Routing Error**: A post script with `argparse default=""` for `--account` does not pass `--account` to moltbot, falling through to the global `botToken` (VLA bot). AI App content silently lands in the VLA channel with no error raised. **VLA post scripts must set `default="original"`, AI App post scripts must set `default="ai_agent_dailybot"`**.

---

## 7. Evolutionary Log & Proven Path (The "Optimization Vibe")

This system is the result of iterative refinement. Do not revert to these discarded or problematic approaches:

### 7.1 Stability: From "Trigger & Pray" to "Closed-Loop Ops"
- **The Pitfall**: Initially, we relied on the CLI/Gateway return code. In reality, `1006` disconnects can make a run look failed even when the job finishes in the background.
- **The Optimization**:
  - **Gateway Preflight (06:30)**: Proactively restarts the gateway, validates `jobs.json`, and **detects Root Poison** (non-admin owned files under `/home/admin/.clawdbot/agents/`) before the morning peak.
  - **Daily Watchdog (09:30)**: Re-validates all tasks by reading `memory/*.json` and `GitHub/*.md`. If missing, it triggers a `force rerun`.
  - **Concurrency Control**: Reduced `maxConcurrent` from 4 to 2. Peak load (08:00-09:00) previously caused "cascading timeouts".

### 7.2 Reasoning: From "Black-Box LLM" to "Two-Phase ETL"
- **The Pitfall**: Letting the LLM crawl the web and write assets in one turn. Resulted in high costs, hallucinated URLs, and 403 errors killing the whole task.
- **The Optimization**:
  - **Phase 1 (Prep)**: Python handles all the "dirty work" (RSS, API, deduplication).
  - **Phase 2 (Reason)**: LLM only sees a cleaned, ranked JSON of candidates.
  - **Why?**: Qwen 3.5 Plus thrives on simple extraction from structured data, but struggles with "Infinite Context" if the instructions are complex.

### 7.3 Integration: From "Git as Database" to "Git as Delivery"
- **The Pitfall**: Initially trying to read system state (like "last seen date") from GitHub.
- **The Optimization**:
  - **Memory JSON**: All logic-driving state MUST live in local JSON files.
  - **GitHub Markdown**: Only for human consumption and long-term archiving.
  - **Benefit**: System remains functional even if GitHub API is rate-limited or down.

---

## 8. AI Directives: How to Evolve this System

When asked to add a new feature:
1. **Map the flow**: Identify where it sits in the Prep → Reason → Post lifecycle.
2. **Define the asset**: Where does knowledge land on GitHub? What is the Memory schema?
3. **Wrap the reasoning**: Ensure the LLM prompt is wrapped by a deterministic Prep script.
4. **Validate the alliance**: Ensure OpenClaw can schedule it, LLM can reason it, Memory can track it, GitHub can store it.
5. **Consider calibration impact**: Does it generate signals that might challenge `assumptions.json`? If so, ensure `prep-calibration-check.py` can read the new memory source.

## 9. Task Prompt Core Logic

This section defines the design intent and constraints for all 32 tasks in the system. As an Agent, you must understand the "Why" behind each prompt to ensure logical integrity.

---

### 9.1 VLA Research Tasks (11)

#### VLA RSS Collection
- **Prompt Type**: Pure script wrapper
- **Core Mission**: Automatically collect papers and projects from RSS sources (arXiv, PapersWithCode, GitHub) every morning.
- **Design Intent**: 
  - **Minimalist**: Only one `exec` call to prevent the Agent from hallucinating other data sources.
  - **Transparent**: Returns `stdout` as the sole response to ensure correct memory updates.
- **Hard Constraints**: No `web_search/fetch`; no conversational fluff (intro/outro).

#### VLA Daily Hotspots
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Select the most relevant VLA papers from the daily RSS pool for Telegram delivery.
- **Design Intent**: 
  - **Deterministic Candidates**: Logic is based strictly on the JSON provided by the `prep` script.
  - **Stateless Reasoning**: Analysis and deduplication are encapsulated in the Python script.
- **Hard Constraints**: No `web_search/fetch`; no procedural sentences ("Now running...").

#### VLA Social Intelligence
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Monitor VLA trends on Twitter, GitHub Trending, and other social platforms.
- **Design Intent**: 
  - **Complex Logic Encapsulation**: Relies on `run-vla-social-two-phase.py` for scraping, cleaning, and ranking.
- **Hard Constraints**: No unauthorized command execution outside the designated script.

#### VLA Benchmark SOTA Tracker
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Track SOTA leaderboard changes on platforms like Papers With Code.
- **Design Intent**: 
  - **Asset-Driven**: Focuses on structured data extraction and incremental updates to `theory/benchmark_tracker.md`.
- **Hard Constraints**: No extra analysis; return script `stdout` only.

#### VLA Release Tracker
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Monitor GitHub Releases/Tags for core VLA projects (e.g., OpenVLA, Octo).
- **Design Intent**: 
  - **Long-Timeout**: Designed with 360s+ timeout to handle API rate-limiting and polling latency.
- **Hard Constraints**: No status updates during execution; wait for process completion.

#### VLA Theory Deep Dive (Round 1/2)
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Deeply analyze the most significant VLA paper of the day and store it in `VLA-Handbook/theory/`.
- **Design Intent**: 
  - **Depth over Breadth**: Processes only 1 paper per turn; rejects mediocre summaries using `> TODO` for missing info.
  - **Dual-Round Redundancy**: R1 and R2 run at different times to prevent data loss due to timeouts.
- **Hard Constraints**: No LaTeX syntax; `web_fetch` <= 5 times; never print tokens.

#### VLA Code Deep Analysis
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Analyze code for projects marked as `actionable` to understand implementation details.
- **Design Intent**: 
  - **Static Analysis**: Read code only; no cloning, no dependency installation, no execution.
  - **Budget Control**: 100,000 token budget to prevent reading irrelevant files.
- **Hard Constraints**: No dependency installation; `web_fetch` <= 10 times.

#### VLA Weekly Deep Dive
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Synthesize a weekly overview of VLA research, projects, and social intelligence.
- **Design Intent**: 
  - **Data Aggregation**: Orchestrates the entire week's memory stream via `run-vla-weekly-two-phase.py`.
- **Hard Constraints**: Return script `stdout` as the sole response.

#### VLA-Handbook Biweekly Report
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Perform cross-content reasoning to identify patterns, trends, and technical gaps every 14 days.
- **Design Intent**: 
  - **The Thinker Role**: Emphasizes "Reasoning" over "Summarization"; requires verifiable predictions.
- **Hard Constraints**: Max 500 words; delete empty sections.

#### VLA Biweekly Reflection
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Generate 3-10 judgment questions or technical inquiries to force the reader to take a stance.
- **Design Intent**: 
  - **Stance-Driven**: Questions do not need answers; they trigger reflection and verification.
- **Hard Constraints**: No generic questions; must be anchored in specific data from the Biweekly Report.

#### System Self-Introspection & Tuning (J)
- **Prompt Type**: Autonomous Agent
- **Core Mission**: The evolution engine for the VLA pipeline; optimizes configurations based on stats.
- **Design Intent**: 
  - **Closed-Loop Evolution**: Observe (14 days) -> Execute (low-risk changes) -> Verify (next cycle).
  - **Autonomy**: Executes low-risk changes (e.g., keyword tuning) without manual approval.
- **Hard Constraints**: Max 3 automatic changes per round.

---

### 9.2 AI App Monitoring, Ops & Evolution (21)

#### AI App RSS Collection
- **Prompt Type**: Pure script wrapper
- **Core Mission**: Morning collection of stable RSS data in the AI application development field.
- **Design Intent**: Minimalist execution to prevent LLM hallucination during data ingest.

#### AI App Monitoring Daily
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Generate daily monitoring reports stored in memory and GitHub.
- **Design Intent**: 
  - **Strict Recency**: Prioritizes last 72 hours; excludes items older than 30 days.
  - **Source First**: Requires primary sources (Official blogs, GitHub releases); secondary sources are supplementary.
- **Hard Constraints**: Must include primary links; no vague citations.

#### AI App Social Intel
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Monitor Twitter and GitHub Trending for AI app development signals.
- **Design Intent**: Encapsulates complex scraping and noise-filtering in `run-ai-app-social-two-phase.py`.

#### AI Agent Daily Pick
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Select the single most valuable highlight across both VLA and AI App channels.
- **Design Intent**: High-threshold filtering; emphasizes evidence over media hype.
- **Hard Constraints**: No placeholders or generic sources.

#### AI Workflow Inspiration
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Extract workflow-related insights 4 times a week.
- **Design Intent**: Uses `run-ai-app-workflow-two-phase.py` for specialized trend filtering.

#### AI App Deep Dive
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Generate 1500-3000 word deep-dive articles on promising AI tools or frameworks.
- **Design Intent**: 
  - **Prefetch First**: Prioritizes pre-fetched data from the `prep` script; uses `web_fetch` only as a fallback.
  - **Retry Mechanism**: Automatically tries the next candidate (up to 3) if the first fails.
- **Hard Constraints**: `web_fetch` <= 5 times; no hallucinating versions or numbers.

#### AI App Weekly Deep Dive
- **Prompt Type**: Two-phase wrapper
- **Core Mission**: Sunday synthesis and archiving of the entire week's AI application progress.

#### AI App Biweekly Report
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Cross-content reasoning and trend identification for AI applications every 14 days.
- **Design Intent**: Focuses on long-term trends like tool convergence and fragmentation.

#### AI App Biweekly Reflection
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Generates 3-10 reflection questions to challenge the reader's judgment on AI trends.
- **Design Intent**: Mandatory coverage of 4 question types (Trend, Resource Allocation, Truth/Falsity, Technical Deep-dive).

#### AI Agent Self-Introspection (J-AI)
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Weekly evolution engine for the AI Agent monitoring pipeline.
- **Design Intent**: Conservative mode enabled if weekly data is insufficient (< 4 days).

#### Token Usage Weekly Report
- **Prompt Type**: Autonomous Agent
- **Core Mission**: Saturday audit of token consumption, costs, and week-over-week changes across all jobs.
- **Design Intent**: Dynamic scanning of the `cron list` instead of hard-coding task names.

---

### 9.3 Shared Ops & System Evolution

#### Gateway Preflight
- **Prompt Type**: Pure script wrapper
- **Mission**: Morning gateway restart, `jobs.json` validation, and Root Poison detection (06:30).
- **Design Intent**: "Silence-on-Success"; Agent terminates immediately if `stdout` is empty.

#### Daily Watchdog
- **Prompt Type**: Pure script wrapper
- **Mission**: Morning validation of all core task outputs; triggers reruns if missing (09:30).
- **Design Intent**: Noise filtering; strips `[progress]` lines to return only the formal report.

#### System Health Snapshot
- **Prompt Type**: Pure script wrapper
- **Mission**: Generates the `system-health.json` snapshot used for weekly quality reviews (09:45).

#### Memory Janitor
- **Prompt Type**: Pure script wrapper
- **Mission**: Daily scan of the memory folder for cleanup suggestions (30d/14d/3d windows).
- **Hard Constraints**: Currently restricted to `--dry-run` mode only.

#### Weekly Output Quality Review
- **Prompt Type**: Autonomous Agent
- **Mission**: Sunday review of the past 7 days' output quality and "Missed Stories."
- **Design Intent**: "Dual-Domain Separation"; strictly separates VLA and AI Agent conclusions.
- **Hard Constraints**: Every missed story or suggestion must have a designated `scope` (vla/ai_agent).

#### Monthly Prompt Evolution Review
- **Prompt Type**: Autonomous Agent
- **Mission**: Monthly analysis of quality trends and prompt improvement proposals.
- **Design Intent**:
  - **Advisory only**: does not modify configurations automatically.
  - **Assumptions maintenance (3-step)**: ① expired horizon scan → ② accumulated trigger review → ③ coverage blind spot candidate hypothesis discovery.
  - **Candidate hypothesis discovery**: scans 30-day memory signals; VLA and AI Agent domains scanned independently for patterns not covered by existing hypotheses. Each candidate must include: phenomenon + memory filename + 30-day count, difference from existing hypotheses, one-sentence hypothesis draft, maturity level (emerging / accumulating / mature).
  - **A/B dual-column output**: 【A Existing hypothesis adjustments】(parameter/wording tweaks) and 【B New candidate hypotheses】(not covered by existing set) must be listed in separate columns; no mixing.
- **Hard Constraints**: Dual-domain split mandatory; candidates only submitted at accumulating (3–5 signals) or above; human approval required to modify `assumptions.json`.

#### Calibration Check
- **Prompt Type**: Autonomous Agent
- **Mission**: Daily scan for signals that might invalidate core assumptions (09:15).
- **Design Intent**: Cross-domain collision between VLA, AI Agent, and Investment signals.
