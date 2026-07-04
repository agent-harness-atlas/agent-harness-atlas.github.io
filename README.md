<div align="center">

# Agent Harness Atlas · Agent Harness 图鉴

**主流 AI 编码 Agent 的 harness 能力源码级横评**
**A source-level capability review of mainstream AI coding agents**

[**▶ 在线访问 / Live site**](https://agent-harness-atlas.github.io/)
·
[简体中文](#简体中文) · [English](#english)

8 个 Agent × 6 个维度 · 评分逐条可核 · 每周更新
8 agents × 6 dimensions · every score is citation-backed · updated weekly

</div>

---

<a name="简体中文"></a>

## 简体中文

### 这是什么

**Agent Harness Atlas** 横向评测主流 AI 编码 Agent 的 **harness 能力**——也就是模型之外那层"脚手架"工程：它怎么记住事情、怎么在有限上下文里腾挪、怎么扩展工具、怎么控成本、怎么沙箱隔离、怎么调度多个 Agent。

我们刻意**不评测模型本身的智商**。同一个底座模型，套在不同的 harness 上，可用性天差地别——这层工程往往才是日常体验的决定因素，却很少被系统地拿出来比。

每一格评分都来自**真实证据**：开源项目读源码，闭源产品读官方文档，每条结论都附带可点击的引用（源码行号或文档链接），可逐条核查。

### 评测维度（6 维）

| 维度 | 英文 | 考察什么 |
|------|------|----------|
| 持久记忆 | Memory | 跨会话长期记忆与持久化层 |
| 上下文压缩 | Context Mgmt | 上下文窗口管理与压缩 / 摘要策略 |
| 技能扩展 | Skills / Tools | 工具 / 技能 / 插件扩展机制 |
| 成本效率 | Cost / Tokens | token 效率与成本控制 |
| 权限沙箱 | Permission / Sandbox | 权限模型与沙箱隔离 |
| 多 Agent 编排 | Multi-agent | 派生子 Agent、并行任务与 Agent 间协作 |

综合分 = 六维取整平均（0–100）。定级阈值：**≥85 卓越 · ≥70 扎实 · ≥60 可用 · <60 薄弱**。

### 当前榜单（2026-W27）

| # | Agent | 综合 | 定级 | 证据来源 | 版本 |
|---|-------|:----:|:----:|----------|------|
| 1 | Gemini CLI | 85 | 卓越 | 源码 | v0.49.0 |
| 2 | Claude Code | 84 | 扎实 | 文档（闭源） | v2.1.201 |
| 3 | Codex CLI | 80 | 扎实 | 源码 | v0.142.5 |
| 4 | Cline | 73 | 扎实 | 源码 | v4.0.6 |
| 5 | opencode | 72 | 扎实 | 源码 | v1.17.13 |
| 6 | Pi | 72 | 扎实 | 源码 | v0.80.3 |
| 7 | Cursor Agent | 67 | 可用 | 文档（闭源） | v3.9 |
| 8 | Aider | 44 | 薄弱 | 源码 | v0.86.0 |

> 分数会随版本迭代和证据补充变化，以[线上版本](https://agent-harness-atlas.github.io/)为准。

### 怎么读这个站

- **能力矩阵页**（首页）：8×6 一览，每格是该 Agent 在该维度的分数 + 一句话定性，点表头可看维度释义。
- **Agent 详情页**：单个 Agent 的总评、评分雷达、逐维度报告（亮点 / 不足 / 证据引用）。
- 右上角可切换**中英双语**与**深 / 浅色**，偏好会被记住。

### 方法论

1. **证据优先**：开源读源码（标注 `源码` + 行号引用），闭源读官方文档（标注 `文档` + 链接）。不臆测、不脑补。
2. **单一数据源**：所有评分与结论存在 `analysis/<agent>.json`，构建时校验并合成为站点数据，前端只渲染、不藏数据。
3. **构建即门禁**：数据形状、评分范围、引用非空、维度齐全，在 `build-data` 阶段 fail-fast，坏数据进不了站。
4. **看短板、看关键路径**：定性以"决定日常可用性的瓶颈"为重点，不堆术语、不过度归因。

### 本地开发

```bash
npm install          # 安装依赖
npm run dev          # 本地开发服务器（Vite）
npm run build        # 合成数据 → 类型检查 → 构建到 dist/
npm run preview      # 预览构建产物
npm test             # 单元测试（Vitest）
npm run e2e          # 端到端测试（Playwright）
npm run lint         # 代码检查（Biome）
```

### 技术栈

无框架的原生 **TypeScript + Vite**，单页渲染，零运行时依赖。

```
analysis/*.json          每个 Agent 的评分与证据（单一数据源）
src/meta.json            版本、更新周、Agent 排序
src/site.ts              维度 / 定级 / 品牌 / UI 文案等展示常量
scripts/build-data.mjs   合成 + 校验 → src/generated/atlas-data.ts
src/index.ts             能力矩阵页渲染
src/agent.ts             Agent 详情页渲染
tests/ · e2e/            单元测试 + 端到端测试
```

### 贡献

欢迎补充新 Agent、更新版本评测、修正证据。新增一个 Agent：在 `analysis/` 加一份 `<agent>.json`（6 维齐全、每维带分数与引用），在 `src/meta.json` 的 `agentOrder` 登记，`npm run build` 通过即可。请保证每条结论都能落到源码行或官方文档。

### 许可

本仓库尚未指定开源许可证。在补充 `LICENSE` 文件之前，默认保留所有权利；如需复用代码或数据，请先与仓库所有者确认。

---

<a name="english"></a>

## English

### What this is

**Agent Harness Atlas** is a head-to-head review of the **harness** around mainstream AI coding agents — the scaffolding *outside* the model: how it remembers things, how it manages a finite context window, how it extends tooling, how it controls cost, how it sandboxes execution, and how it orchestrates multiple agents.

We deliberately **don't grade raw model intelligence**. The same base model wrapped in a different harness can feel like a completely different product — and that engineering layer, rather than the model, is often what decides the day-to-day experience. It rarely gets compared systematically. This does.

Every cell is **evidence-backed**: open-source projects are read at the source level, closed products are read from official docs, and each conclusion carries a clickable citation (source line numbers or doc links) you can verify yourself.

### The six dimensions

| Dimension | 中文 | What it probes |
|-----------|------|----------------|
| Memory | 持久记忆 | Cross-session long-term memory & persistence |
| Context Mgmt | 上下文压缩 | Context-window management & compaction / summarization |
| Skills / Tools | 技能扩展 | Tool / skill / plugin extension mechanism |
| Cost / Tokens | 成本效率 | Token efficiency & cost control |
| Permission / Sandbox | 权限沙箱 | Permission model & sandbox isolation |
| Multi-agent | 多 Agent 编排 | Sub-agent spawning, parallel tasks & coordination |

Overall = rounded mean of the six (0–100). Bands: **≥85 Exceptional · ≥70 Strong · ≥60 Functional · <60 Broken**.

### Current standings (2026-W27)

| # | Agent | Overall | Band | Basis | Version |
|---|-------|:-------:|:----:|-------|---------|
| 1 | Gemini CLI | 85 | Exceptional | source | v0.49.0 |
| 2 | Claude Code | 84 | Strong | docs (closed) | v2.1.201 |
| 3 | Codex CLI | 80 | Strong | source | v0.142.5 |
| 4 | Cline | 73 | Strong | source | v4.0.6 |
| 5 | opencode | 72 | Strong | source | v1.17.13 |
| 6 | Pi | 72 | Strong | source | v0.80.3 |
| 7 | Cursor Agent | 67 | Functional | docs (closed) | v3.9 |
| 8 | Aider | 44 | Broken | source | v0.86.0 |

> Scores shift as versions iterate and evidence is added — the [live site](https://agent-harness-atlas.github.io/) is canonical.

### How to read it

- **Capability matrix** (home): the 8×6 grid at a glance — each cell is a score plus a one-line verdict; click a column header for the dimension's definition.
- **Agent detail page**: per-agent verdict, score radar, and dimension-by-dimension reports (strength / gap / cited evidence).
- The top-right toggles switch **language (中/EN)** and **dark / light** theme; your preference is remembered.

### Methodology

1. **Evidence first.** Open source is read at the source level (tagged `source` with line citations); closed products are read from official docs (tagged `docs` with links). No guessing.
2. **Single source of truth.** All scores and conclusions live in `analysis/<agent>.json`, validated and composed at build time; the frontend only renders — it hides no data.
3. **Build as the gate.** Data shape, score range, non-empty citations, and full dimension coverage are checked fail-fast in `build-data`; bad data never reaches the site.
4. **Bottlenecks over buzzwords.** Verdicts focus on what actually bounds day-to-day usability, without term-dropping or over-attribution.

### Local development

```bash
npm install          # install dependencies
npm run dev          # dev server (Vite)
npm run build        # compose data → typecheck → build to dist/
npm run preview      # preview the production build
npm test             # unit tests (Vitest)
npm run e2e          # end-to-end tests (Playwright)
npm run lint         # lint (Biome)
```

### Tech stack

Framework-free vanilla **TypeScript + Vite**, single-page render, zero runtime dependencies.

```
analysis/*.json          per-agent scores & evidence (single source of truth)
src/meta.json            version, week, agent ordering
src/site.ts              presentation constants (dimensions / bands / brands / UI copy)
scripts/build-data.mjs   compose + validate → src/generated/atlas-data.ts
src/index.ts             capability-matrix page render
src/agent.ts             agent-detail page render
tests/ · e2e/            unit tests + end-to-end tests
```

### Contributing

New agents, version refreshes, and evidence corrections are welcome. To add an agent: drop an `<agent>.json` into `analysis/` (all six dimensions, each with a score and citations), register it in `agentOrder` in `src/meta.json`, and make `npm run build` pass. Every conclusion must trace to a source line or an official doc.

### License

No open-source license has been declared yet. Until a `LICENSE` file is added, all rights are reserved by default — please check with the repository owner before reusing the code or data.

---

<div align="center">
<sub>Built with evidence, not vibes · 用证据说话，不靠感觉</sub>
</div>
