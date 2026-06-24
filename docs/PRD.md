# Agent Harness Atlas — 产品文档 / PRD (v4.0)

> AI 编码 Agent 的 harness 能力源码级横评站点。每周更新。
> 状态：**草案 v0.2**。维度数已定（6 维，Bojun 6/24）。待批准产品方向后冻结 §9 验收契约 + `features.json`，进入构建。
> 设计来源：UI 模版已由 Open Design 定稿（`~/Downloads/index.html` + `agent.html`），本 PRD **采纳模版视觉为既定方向**，只负责梳理信息架构、内容方法论、UX flow、数据模型与周更机制。

---

## 1. 定位 & 目标

**一句话**：用源码级证据，客观横评主流 AI 编码 Agent 的 harness 工程能力，每周刷新。

**为什么做**：市面上的 agent 对比多停留在「功能清单 / 营销话术」层面，缺少**从 harness 实现（记忆、上下文压缩、技能扩展、权限沙箱…）出发、有源码引用、可核查**的客观评测。这个站点的差异化就是「**结论可追溯到源码行**」。

**成功标准**
- 每个评分都能点进去看到**真实证据**：开源 agent → `repo/path:Lx-Ly` 源码引用；闭源 agent → 官方文档链接 + 明确「docs 基准」标签。**没有凭空打分、没有占位套话。**
- 内容深度：源码分析 + 官方文档交叉验证，给出每维度的「亮点 / 短板」客观判断，不过度归因。
- UX：编辑感字体、语义通顺、不堆字；亮/暗主题可切换并持久；中/英可切换并持久。
- 可持续：周更只需重跑分析 + 改一处数据源，不碰渲染层。

**非目标（本期不做）**
- 不做实时跑分 / benchmark 数据（不接 API 实测延迟、token 计费实采）。
- 不做用户登录、评论、排行投票。
- 不做 agent 的安装教程 / 上手指南（这是评测站，不是文档站）。

---

## 2. 范围：Roster & 维度

### 2.1 评测对象（8 个，采纳模版 roster）

| # | id | 名称 | 厂商 | 语言 | 证据基准 |
|---|----|------|------|------|---------|
| 1 | `claude-code` | Claude Code | Anthropic | TypeScript | **docs**（核心为压缩后的 npm bundle，不开源） |
| 2 | `codex` | Codex CLI | OpenAI | Rust | source |
| 3 | `pi` | Pi | 待确认* | TS | source |
| 4 | `opencode` | opencode | SST / 开源 | TS | source |
| 5 | `cursor` | Cursor Agent | Anysphere | — | **docs**（IDE 内闭源） |
| 6 | `aider` | Aider | 开源 | Python | source |
| 7 | `cline` | Cline | 开源 (VS Code) | TS | source |
| 8 | `gemini-cli` | Gemini CLI | Google | TS | source |

\* **Pi 身份**：模版里标 "vendor TBD / Confirm which Pi this is"。这是 **agent 自己能闭环的考据**（源码 map 指向 `earendil-works/pi` ≈ `badlogic/pi-mono`），我会在 spike 阶段 clone 核实后落定，不占用你的决策。

**证据基准两类**：`source`（6 个，clone harness 源码、给真实 `path:Lx-Ly` 引用）、`docs`（2 个 claude-code + cursor，闭源 → 官方文档 + 公开拆解为准，**UI 显式标注 docs 基准，绝不假装读了源码**）。

### 2.2 评测维度（6 个）

模版数据层带 **6 个维度**，但 UI 文案仍写「5 维」——这是模版的**遗留标签 bug**（注释写「已从 8 砍到 5」，但数组实际是 6 项）。

| id | 中文 | English | 含义 |
|----|------|---------|------|
| `memory` | 持久记忆 | Memory | 跨会话长期记忆与持久化层 |
| `context` | 上下文压缩 | Context Mgmt | 上下文窗口管理与压缩 / 摘要策略 |
| `skill` | 技能扩展 | Skills / Tools | 工具 / 技能 / 插件扩展机制 |
| `cost` | 成本效率 | Cost / Tokens | token 效率与成本控制 |
| `sandbox` | 权限沙箱 | Permission/Sandbox | 权限模型与沙箱隔离 |
| `multiagent` | 多 Agent 编排 | Multi-agent | 派生子 agent、并行任务与协作 |

> **已定（Bojun 6/24）：保持 6 维。** UI 文案里的「5 维」是模版遗留 bug，dev 统一改成 6（内部闭环，不占用你）。

---

## 3. 内容方法论（本项目的核心，也是最容易翻车的地方）

Bojun 的硬要求是「**深度的源码分析，结合官方文档，给出客观判断**」。这意味着**渲染漂亮但内容编造 = 失败**。本期相对模版的最大升级，就是把「证据待填」的占位骨架，换成**可机器核查的真实证据**。

### 3.1 源码优先的 grounding 流程
1. **Spike（落定技术地面）**：对 6 个开源 agent `git clone --depth 1` 到 `/tmp/agent-src-spike/<id>`，核实是真项目（`git remote`/`rev-parse`），定位每维度的真实实现文件路径（已有 source-map 种子，见 skill `agent-harness-source-map`）。
2. **深度分析（并行 delegate_task）**：每个开源 repo 派一个 subagent（`toolsets:[terminal,file]`），产出**严格 JSON**：每维度 `score 1–100` + 中英双语证据 + **真实 `path:Lx-Ly` 引用**。返回后**逐条回核**（引用必须在磁盘上对得上，不允许编路径）。
3. **闭源诚实处理**：claude-code、cursor 标 `evidenceBasis:"docs"`，证据指向**维度相关的官方文档具体页面**（非首页），UI 渲染一个可见的「docs 基准」标签，让读者知道这两个不是源码级。
4. **持久化**：分析结果落到 **`analysis/<id>.json`**（提交进仓），作为构建期唯一数据源。矩阵分数 == analysis 分数（构建期校验，禁手改不同步）。

### 3.2 反编造红线（验收会查）
- ❌ 一个 agent 全维度引用同一个首页 URL（blanket citation）→ 失败。每维度引用要**维度相关、各不相同**。
- ❌ 开源 agent 写「证据待填 / Evidence pending」当成品 → 失败。开源必须有真实源码引用。
- ❌ 分数和 analysis JSON 不一致 → 构建期 `@scoresync` 校验拦截。
- ❌ 闭源 agent 假装给源码路径 → 失败。闭源只能 docs 基准。
- ✅ 客观判断：看短板 / critical path，不跳结论、不自己编因果，数据（源码行为）说话。

---

## 4. 信息架构 (IA)

两个页面 + 一份共享数据模型（模版当前是把数据**内联复制**在两个文件里；本期抽成**单一事实源**，两页消费）。

```
┌─ index.html  能力矩阵 (Capability Matrix / Leaderboard)
│    8 agent × 6 维 → 一屏总览，hover 看证据，点详情进二级页
│
├─ agent.html#<id>  Agent 详情 (Detail)
│    雷达图 + 逐维度评分 + 逐维度报告卡（含真实证据引用）
│
└─ data/  单一事实源
     analysis/<id>.json  ← 每个 agent 的深度分析（source 或 docs 基准）
     合成 → atlas 数据（META/DIMENSIONS/AGENTS/…）← index 与 agent 都引用它
```

**导航关系**：矩阵行的「详情 →」→ `agent.html#<id>`；详情页点品牌 logo → 回矩阵。无多级菜单，扁平两层。

---

## 5. UX Flow（Bojun 明确点名要的部分）

### Flow A — 浏览能力矩阵（落地页 index.html）
1. 打开站点 → 默认落在**能力矩阵**。语言/主题读 `localStorage`，无则默认 **中文 + 浅色**。
2. **顶栏**（sticky）：品牌 logo（骑士棋子 SVG）｜语言切换（中/EN）｜主题切换（浅/深）。
3. **矩阵主体**：
   - 第一列（sticky 左固定）= agent：品牌 glyph（内联 SVG，跟随主题）+ 名称 + 厂商。
   - 中间 6 列 = 各维度评分：大号衬线数字（0–100）+ 进度条 + 分段配色。
   - 右侧 = **综合分**（各维度均值，pending 不计入）+ 分段标签（卓越/扎实/可用/薄弱）。
   - 最右 = 「详情 →」入口。
4. **交互**：
   - hover 单元格 → 浮出 tooltip：该维度的**证据结论** + 「短板/待验证」指向。
   - hover 整行 → 行高亮。
   - 点「详情 →」→ 跳 `agent.html#<id>`。
5. **底部图例**：分段说明（卓越 85+ / 扎实 65+ / 可用 40+ / 薄弱 1+ / 待填）+ 周更标记。

### Flow B — 进入 Agent 详情（agent.html#<id>）
1. 顶栏与矩阵一致（同一套 logo/lang/theme），点 logo 回矩阵。
2. **Masthead**：大号品牌 glyph + agent 名 + **一句总评 verdict** + 综合分 /100。
3. **证据基准条**：明确标注 `source 源码基准` 或 `docs 文档基准`（诚实声明，闭源不冒充源码级）。
4. **上区**：
   - 左 = **N 边形雷达图**（6 轴 = 6 维；pending 维度塌到 0，诚实不虚高）。
   - 右 = 逐维度评分行：维度名 + 条 + 分 + 分段。
5. **下区：逐维度报告卡**（本期重头）。每张卡：
   - 维度名 + 分数 + 分段标签。
   - **证据段落**：客观结论，含 `code` 机制名（如 `auto-compact`、`repo-map`）。
   - **真实引用**：开源 → `repo/path:Lx-Ly`（可核）；闭源 → 官方文档链接。
   - 「**亮点 keep / 不足 fix**」标签行：做对的点 vs 待改进/待验证。
6. **交互**：改 hash（`#codex` → `#aider`）即换 agent，无整页刷新；lang/theme 持续生效。

### Flow C — 语言 / 主题切换（贯穿全站）
- 点 **中/EN** → 全站文本切换（数据层 zh/en 双字段 + UI 文案 i18n），写 `localStorage('atlas:lang')`，**跨页一致**。分数不变，只切语言。
- 点 **浅/深** → `data-theme` 切换（warm paper ↔ 暖黑），写 `localStorage('atlas:theme')`，**跨页一致**。
- i18n **key 对等**：zh 与 en 字段必须一一对应，构建期校验，禁单语缺字段。

### Flow D — 周更（运营在后台，用户有感知）
- **用户感知**：顶栏/页脚的「更新」**周标**（如 `2026-W26`）；可选 CHANGELOG 入口，展示本周相对上周的变化。
- **后台流程**：cron 每周触发 → 重跑源码分析（重新 clone + 深度 delegate）→ 更新 `analysis/<id>.json` → 校验 grounding（引用可核、分数同步、i18n 对等）→ bump 周标 + 写 CHANGELOG 日期条目 → 重建 / 重部署。
- **幂等**：同周重跑不应产生虚假 diff（`--check` 探测是否需要刷新，`--stamp` 落标）。

---

## 6. 设计系统（采纳模版，不另起炉灶）

模版的「Critique 编辑风」就是既定方向，**照搬**，不重新设计视觉：
- **字体**：Source Serif 4（编辑衬线，标题/数字/证据）｜IBM Plex Mono（标签/元信息）｜Inter（正文 sans）。中文回退 Songti SC / PingFang SC。
- **配色**：暖纸 `#f5f3ee` + 铁锈红 accent `#c96442`；暗色暖黑 `#16140f`。分段语义色（不是彩虹）：卓越=锈红、扎实=绿、可用=赭、薄弱=深红、待填=灰。
- **图标**：**全部内联 SVG，零 emoji**（品牌 glyph + UI 图标 + 雷达图均 SVG，跟随 `currentColor`）。这是硬约束，验收会用运行时探针查。
- **排版**：不堆字，证据段落 1–2 句客观结论；卡片化、留白；表格横向可滚动（窄屏不挤压）。
- **响应式**：≤860px masthead 改纵向、verdict 左对齐；≤560px 收窄边距；矩阵窄屏横滚不裁切。

---

## 7. 数据模型

单一事实源，构建期合成给两个页面。核心结构（沿用模版 schema + 增加证据基准/引用字段）：

```jsonc
// analysis/<id>.json — 每个 agent 一份（dev 不可改 PM 冻结的 schema）
{
  "id": "codex",
  "name": "Codex CLI",
  "vendor": "OpenAI",
  "lang": "Rust",
  "evidenceBasis": "source",          // "source" | "docs"  ← UI 显式渲染
  "repo": "openai/codex",             // source 基准必填；docs 基准为 null
  "verdict": { "zh": "...", "en": "..." },
  "cells": {
    "memory": {
      "score": 56,                    // 1–100 | null(=pending，不计综合分)
      "zh": "...", "en": "...",       // 证据结论（可含 `code` 机制名）
      "citations": [                  // source→真实 path:Lx-Ly；docs→官方URL
        { "path": "codex-rs/core/src/memory_usage.rs#L12-L40", "basis": "source" }
      ],
      "keep": { "zh": "...", "en": "..." },
      "fix":  { "zh": "...", "en": "..." }
    }
    // context / skill / cost / sandbox / multiagent ...
  }
}
```

```jsonc
// 站点级元数据
META = {
  updated: "2026-W26",   // 周标，周更改这里
  version: "4.0",
}
DIMENSIONS = [memory, context, skill, cost, sandbox, multiagent]  // 6 维
BANDS = [Exceptional 85+, Strong 65+, Functional 40+, Broken 1+]   // + Pending(null)
UI = { ... }            // 界面文案 i18n（zh/en 对等）
```

**评分语义**：0–100 数字分，越高 = 该维度能力越成熟。分段仅用于配色与标签，结论以数字为准。`null` = 待填/不适用，不计入综合分（雷达图塌到 0，诚实）。

---

## 8. 技术形态

- **Vite + 多页（index + agent）** 静态站，数据从 `analysis/*.json` 构建期注入（取代模版的内联复制）。
- **持久化**：`localStorage` 的 `atlas:lang` / `atlas:theme`。
- **质量门**：`make check`（lint + typecheck + test + build）。
- **探针测试**（Vitest 单测 + Playwright e2e）：
  - 中/EN 切换 + 持久化；浅/深主题 + 持久化。
  - **运行时 SVG-not-emoji** 探针（DOM 里不得出现 emoji 符号）。
  - i18n **key 对等**（zh/en 字段一一对应）。
  - `@grounding`：analysis JSON 结构良好、引用 `path:Lx-Ly` 形状合法。
  - `@scoresync`：矩阵分数 == analysis 分数。
  - `@citations`：开源 agent 引用真实可核、无 blanket、闭源标 docs。
- **远程评审**：本人验收时起 `vite preview` + 单 owner cloudflared 公网隧道（深链 `/agents/<id>` 走公网要 200）。

---

## 9. 验收契约（§4 机器可判定，**草案**，批准后冻结）

> 批准产品方向后，我把下面冻结成 `features.json`（F01…Fnn，behavior 级 `verification` + 可运行 `auto_verify`），并打 `_note`：dev 不可改 `verification`/`auto_verify`。这里先列骨架，证明方向对齐。

- **F01 数据单一事实源**：两页从合成数据消费，删除内联复制；改一处 `analysis/*.json` 两页同步。
- **F02 矩阵渲染**：8×6 矩阵，sticky 首列，分段配色，综合分=均值（pending 不计）。
- **F03 详情页**：雷达 + 逐维度评分 + 逐维度报告卡，hash 路由切 agent。
- **F04 i18n**：中/EN 全站切换 + 持久化 + key 对等。
- **F05 主题**：浅/深切换 + 持久化 + 跨页一致。
- **F06 SVG-only**：运行时无 emoji 探针通过。
- **F07 grounding**：`analysis/*.json` 结构良好 + 引用形状合法（`@grounding`）。
- **F08 scoresync**：矩阵/详情分数 == analysis 分数（`@scoresync`）。
- **F09 citations 真实性**：开源真实可核引用、无 blanket；闭源 `evidenceBasis:"docs"` + UI 标签（`@citations`）。
- **F10 evidenceBasis 标签**：详情页可见地区分 source / docs 基准。
- **F11 周更机制**：`--check`/`--stamp` + CHANGELOG 日期条目 + 周标渲染 + 幂等。
- **F12 响应式无裁切**：≤860/≤560 断点矩阵横滚不裁、masthead 重排。

---

## 10. 决策记录

1. **维度数 = 6 维（已定，Bojun 6/24）。** 含 `multiagent` 多 Agent 编排。模版 UI 的「5 维」标签是遗留 bug，dev 统一改成 6（内部闭环）。

其余均为 agent 自己闭环、不占用你的项：Pi 身份考据、stale 标签修正、roster 采纳模版、源码 grounding 全流程、隧道评审。

---

## 11. 执行模型（提案）

- 视觉已由 Open Design 定稿 → **无需 designer 角色**。
- 建议 **3 角色 relay**：PM（我，冻结契约 + 编排 + 终验）｜dev（实现 F01–F12，WIP=1）｜tester（独立复验 + 反编造探针 + 肉眼 UI 复核）。
- 你授权后我冻结 `features.json`，按 harness-kit 工作流跑，**只在真 blocker（缺凭证/破坏性副作用/方向选择）停下找你**，否则一路干到底、随时向你汇报进度。
- 若暂不配 dev/tester 多 bot，我可单 PM 模式直接构建并自验，再上 tester 复核。

---

*本文档为草案 v0.1。批准 §1–§8 产品方向 + §10 维度决策后，我冻结 §9 验收契约与 `features.json`，进入构建。*
