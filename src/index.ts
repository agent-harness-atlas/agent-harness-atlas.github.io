// Matrix / leaderboard page entry. Renders 8 agents × 6 dimensions from the
// single grounded data source. Ports the Open Design template's render logic.
import {
  META,
  AGENTS,
  DIMENSIONS,
  BANDS,
  PENDING,
  ICONS,
  BRANDS,
  UI,
  type Lang,
  loadState,
  t,
  esc,
  scoreOf,
  bandOf,
  setLang,
  setTheme,
} from "./atlas";

const state = loadState();

function renderHead(): void {
  const cols = document.getElementById("cols")!;
  cols.innerHTML =
    '<col class="c-agent">' +
    DIMENSIONS.map(() => '<col class="c-dim">').join("") +
    '<col class="c-score"><col class="c-detail">';
  const head = document.getElementById("head")!;
  let html = '<th class="col-agent"></th>';
  for (const d of DIMENSIONS) {
    const sub = state.lang === "zh" ? `<span class="dim-en">${d.en}</span>` : "";
    html += `<th data-dim="${d.id}"><span class="dim-zh">${t(d, state.lang)}</span>${sub}</th>`;
  }
  html += '<th class="col-score"></th><th></th>';
  head.innerHTML = html;
}

function renderBody(): void {
  const body = document.getElementById("body")!;
  // F-rank: order rows by overall score, highest first. Same score → alphabetical
  // by name (stable, deterministic). Pending (null) sinks to bottom.
  const ranked = [...AGENTS].sort((a, b) => {
    const sa = scoreOf(a);
    const sb = scoreOf(b);
    if (sa === null && sb === null) return a.name.localeCompare(b.name);
    if (sa === null) return 1;
    if (sb === null) return -1;
    if (sb !== sa) return sb - sa;
    return a.name.localeCompare(b.name);
  });
  const rows = ranked.map((a, i) => {
    let cells = "";
    const br = BRANDS[a.id] || { bg: "var(--accent)", fg: "#fff" };
    const ver = a.version ? t(a.version, state.lang) : "";
    cells +=
      `<td><div class="agent-cell" data-testid="agent-row-${a.id}">` +
      `<span class="agent-rank">${i + 1}</span>` +
      `<div class="agent-glyph${br.mono ? " is-mono" : ""}" style="background:${br.bg};color:${br.fg}">${ICONS[a.id] || esc(a.name.slice(0, 2))}</div>` +
      `<div><div class="agent-name">${esc(a.name)}</div>` +
      `${ver ? `<div class="agent-vendor"><span class="agent-ver" title="${t(UI.testedVer, state.lang)}">${esc(ver)}</span></div>` : ""}</div></div></td>`;

    for (const d of DIMENSIONS) {
      const c = a.cells[d.id] || { score: null, zh: "—", en: "—", fix: null };
      const b = bandOf(c.score);
      const isNum = typeof c.score === "number";
      const box =
        `<span class="scorebox b-${b.cvar}${isNum ? "" : " is-pending"}">` +
        `<span class="num">${isNum ? c.score : "—"}</span>` +
        `<span class="track"><i style="--w:${isNum ? c.score : 0}%"></i></span>` +
        "</span>";
      const ev = c.fix && t(c.fix, state.lang) && t(c.fix, state.lang) !== "—" ? t(c.fix, state.lang) : "";
      cells +=
        `<td class="cell" data-testid="cell-${a.id}-${d.id}" data-score="${isNum ? c.score : ""}">${box}` +
        `<span class="tip">${esc(t(c, state.lang))}` +
        (ev ? `<span class="ev">${t(UI.evidence, state.lang)}: ${esc(ev)}</span>` : "") +
        "</span></td>";
    }

    const sc = scoreOf(a);
    const sb = bandOf(sc);
    const isNum = typeof sc === "number";
    cells +=
      `<td class="score-cell"><span class="ov b-${sb.cvar}${isNum ? "" : " is-pending"}" data-testid="overall-${a.id}" data-overall="${isNum ? sc : ""}">` +
      `<span class="n">${isNum ? sc : "—"}</span>` +
      `<span class="bd">${t(sb, state.lang)}</span></span></td>`;
    cells +=
      `<td class="detail-cell"><a class="go" href="agent.html#${a.id}" data-testid="detail-link-${a.id}" aria-label="${t(UI.viewDetail, state.lang)}">` +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></td>';

    return `<tr>${cells}</tr>`;
  });
  body.innerHTML = rows.join("");
}

function renderLegend(): void {
  const el = document.getElementById("legend")!;
  const items = BANDS.map(
    (b) => `<span class="lg"><span class="sw" style="--c:var(--${b.cvar})"></span>${t(b, state.lang)} · ${b.min}+</span>`,
  );
  items.push(
    `<span class="lg"><span class="sw" style="--c:var(--${PENDING.cvar})"></span>${t(PENDING, state.lang)}</span>`,
  );
  el.innerHTML = items.join("");
}

function applyI18n(): void {
  document.documentElement.lang = state.lang;
  document.getElementById("h1")!.innerHTML =
    state.lang === "zh"
      ? 'AI <em>Agent</em> Harness Leaderboard — 源码级横评'
      : 'AI <em>Agent</em> Harness Leaderboard — source-level benchmark';
  document.getElementById("updated")!.textContent = META.updated;
  document.getElementById("lede")!.innerHTML =
    state.lang === "zh"
      ? '逐项拆解主流编码 Agent 的 <strong>记忆、上下文压缩、技能扩展、成本、权限沙箱与多 Agent 编排</strong>，给出源码级的客观横评。'
      : 'A source-level breakdown of how leading coding agents handle <strong>memory, context compaction, skills, cost, sandboxing and multi-agent orchestration</strong>.';
  const fl = document.getElementById("footLine");
  if (fl) fl.textContent = t(UI.weekly, state.lang) + " · " + META.updated;
}

function rerender(): void {
  applyI18n();
  renderHead();
  renderBody();
  renderLegend();
}

function onLang(lang: Lang): void {
  state.lang = lang;
  setLang(lang);
  rerender();
}
function onTheme(theme: "light" | "dark"): void {
  state.theme = theme;
  setTheme(theme);
}

document.getElementById("langBtn")!.addEventListener("click", () => onLang(state.lang === "zh" ? "en" : "zh"));
document.getElementById("themeBtn")!.addEventListener("click", () => onTheme(state.theme === "light" ? "dark" : "light"));

setTheme(state.theme);
setLang(state.lang);
rerender();
