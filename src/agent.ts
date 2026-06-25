// Agent detail page entry. Renders radar + per-dimension scores + per-dimension
// report cards (with real citations + evidence-basis label) from the single source.
import {
  META,
  AGENTS,
  DIMENSIONS,
  UI,
  ICONS,
  BRANDS,
  type Lang,
  loadState,
  t,
  esc,
  md,
  scoreOf,
  bandOf,
  agentById,
  setLang,
  setTheme,
  mdRich,
} from "./atlas";
import type { AgentAnalysis } from "./types";

const state = loadState();

function curId(): string {
  return (location.hash || "").replace("#", "") || AGENTS[0].id;
}

// ---- N-gon radar geometry (axis count follows DIMENSIONS) ----
const CX = 150;
const CY = 150;
const R = 110;
function axisAngle(i: number, total: number): number {
  return ((-90 + i * (360 / total)) * Math.PI) / 180;
}
function ptAt(i: number, total: number, frac: number): [number, number] {
  const ang = axisAngle(i, total);
  return [CX + Math.cos(ang) * R * frac, CY + Math.sin(ang) * R * frac];
}
function ringPoly(total: number, frac: number): string {
  const pts: string[] = [];
  for (let i = 0; i < total; i++) {
    const p = ptAt(i, total, frac);
    pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  }
  return pts.join(" ");
}
function radarSVG(a: AgentAnalysis): string {
  const dims = DIMENSIONS;
  const n = dims.length;
  const rings = [1, 0.75, 0.5, 0.25]
    .map((f) => `<polygon class="grid${f === 0.5 ? " grid-mid" : ""}" points="${ringPoly(n, f)}"/>`)
    .join("");
  let axes = "";
  for (let i = 0; i < n; i++) {
    const e = ptAt(i, n, 1);
    axes += `<line class="axis" x1="150" y1="150" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}"/>`;
  }
  const areaPts: string[] = [];
  let dots = "";
  let labels = "";
  for (let j = 0; j < n; j++) {
    const c = a.cells[dims[j].id];
    const sc = c && typeof c.score === "number" ? c.score : 0;
    const p = ptAt(j, n, sc / 100);
    areaPts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
    dots += `<circle class="dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3"/>`;
    const lp = ptAt(j, n, 1.18);
    labels += `<text class="axis-label" x="${lp[0].toFixed(1)}" y="${lp[1].toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(dims[j].short)}</text>`;
  }
  return (
    '<svg viewBox="-16 -20 332 344" xmlns="http://www.w3.org/2000/svg" aria-label="Score radar chart" data-testid="radar" data-axes="' +
    n +
    '">' +
    rings +
    axes +
    `<polygon class="area" points="${areaPts.join(" ")}"/>` +
    dots +
    labels +
    "</svg>"
  );
}

function basisLabel(a: AgentAnalysis): string {
  const isDocs = a.evidenceBasis === "docs";
  const txt = isDocs ? (state.lang === "zh" ? "文档基准" : "Docs basis") : state.lang === "zh" ? "源码基准" : "Source basis";
  const sub = isDocs
    ? a.evidenceNote
      ? esc(t(a.evidenceNote, state.lang))
      : ""
    : a.repo
      ? esc(a.repo)
      : "";
  return (
    `<div class="basis basis-${a.evidenceBasis}" data-testid="evidence-basis" data-basis="${a.evidenceBasis}">` +
    `<span class="basis-tag">${txt}</span>` +
    (sub ? `<span class="basis-note">${sub}</span>` : "") +
    "</div>"
  );
}

function render(): void {
  const a = agentById(curId());
  const root = document.getElementById("root")!;
  if (!a) {
    root.innerHTML = `<div class="notfound">${state.lang === "zh" ? "未找到该 agent。" : "Agent not found. "}<a href="index.html">${t(UI.backHome, state.lang)} →</a></div>`;
    return;
  }
  const sc = scoreOf(a);
  const scBand = bandOf(sc);
  const br = BRANDS[a.id] || { bg: "var(--accent)", fg: "#fff" };

  const head =
    '<header class="hd">' +
    '<div class="hd-left">' +
    `<div class="glyph${br.mono ? " is-mono" : ""}" style="background:${br.bg};color:${br.fg}">${ICONS[a.id] || esc(a.name.slice(0, 2))}</div>` +
    `<div><h1 class="hd-title" data-testid="agent-title">${esc(a.name)}</h1>` +
    `<div class="hd-tagline">${esc(a.vendor)} · ${esc(a.lang)}</div></div>` +
    "</div>" +
    `<p class="hd-verdict"><span class="vlabel">${t(UI.verdict, state.lang)} · ${sc === null ? "—" : sc} / 100</span>${esc(t(a.verdict, state.lang))}</p>` +
    "</header>";

  const basis = basisLabel(a);

  const rows = DIMENSIONS.map((d) => {
    const c = a.cells[d.id] || { score: null };
    const b = bandOf(c.score);
    const isNum = typeof c.score === "number";
    return (
      `<div class="score-row b-${b.cvar}">` +
      `<div class="score-name">${t(d, state.lang)}${state.lang === "zh" ? `<span class="en">${esc(d.en)}</span>` : ""}</div>` +
      `<div class="score-bar"><span class="score-bar-fill" style="width:${isNum ? c.score : 0}%"></span></div>` +
      `<div class="score-num${isNum ? "" : " is-pending"}">${isNum ? c.score : "—"}<span class="denom">/100</span></div>` +
      `<div class="score-band">${t(b, state.lang)}</div>` +
      "</div>"
    );
  }).join("");
  const top =
    '<section class="top">' +
    `<div class="radar-card"><div class="lbl">${t(UI.radarLabel, state.lang)}</div>${radarSVG(a)}` +
    `<div class="overall">${t(UI.overallLabel, state.lang)} · <span class="n">${sc === null ? "—" : sc}</span> / 100 · ${t(UI.band, state.lang)} <em>${t(scBand, state.lang)}</em></div>` +
    "</div>" +
    `<div class="scores">${rows}</div>` +
    "</section>";

  const cards = DIMENSIONS.map((d) => {
    const c = a.cells[d.id] || { score: null, zh: "—", en: "—", citations: [], keep: null, fix: null };
    const b = bandOf(c.score);
    const isNum = typeof c.score === "number";
    const keep = c.keep ? t(c.keep, state.lang) : "";
    const fix = c.fix ? t(c.fix, state.lang) : "";
    let tags = "";
    if (keep && keep !== "—")
      tags += `<div class="tag-row"><span class="tag tag-keep">${t(UI.keep, state.lang)}</span><div class="tag-body">${mdRich(keep)}</div></div>`;
    if (fix && fix !== "—")
      tags += `<div class="tag-row"><span class="tag tag-fix">${t(UI.fix, state.lang)}</span><div class="tag-body">${mdRich(fix)}</div></div>`;
    const cites = (c.citations || []).length
      ? '<div class="dim-cites" data-testid="cites-' +
        d.id +
        '">' +
        `<span class="cites-label">${a.evidenceBasis === "docs" ? (state.lang === "zh" ? "参考文档" : "Docs") : (state.lang === "zh" ? "参考代码" : "Source")}</span>` +
        '<div class="cites-list">' +
        c.citations.map((cit) => renderCite(cit, a)).join("") +
        "</div></div>"
      : "";
    return (
      `<article class="dim b-${b.cvar}" data-testid="report-${d.id}">` +
      '<div class="dim-head">' +
      `<div class="dim-name">${t(d, state.lang)}</div>` +
      `<div><div class="dim-score${isNum ? "" : " is-pending"}">${isNum ? c.score : "—"}<span class="denom">/100</span></div><span class="dim-band">${t(b, state.lang)}</span></div>` +
      "</div>" +
      `<p class="dim-evidence">${md(t(c, state.lang))}</p>` +
      (tags ? `<div class="dim-tags">${tags}</div>` : "") +
      cites +
      "</article>"
    );
  }).join("");
  const dimSection =
    `<h2 class="section-title">${t(UI.dimReports, state.lang)}<span class="en">${t(UI.dimReportsEn, state.lang)}</span></h2>` +
    `<div class="dim-grid">${cards}</div>`;

  const ft = `<footer class="ft"><span>${t(UI.weekly, state.lang)} · ${META.updated}</span></footer>`;

  root.innerHTML = head + basis + top + dimSection + ft;
}

function renderCite(cit: string, a: AgentAnalysis): string {
  if (/^https?:\/\//.test(cit)) {
    let label = cit;
    try {
      const u = new URL(cit);
      label = u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
    } catch {
      /* keep raw */
    }
    return `<a class="cite cite-doc" href="${esc(cit)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  }
  // source citation → link to the file on the repo, if repo known
  if (a.repo) {
    const m = cit.match(/^(.+?):L(\d+)(?:-L(\d+))?$/);
    if (m) {
      const lines = m[3] ? `#L${m[2]}-L${m[3]}` : `#L${m[2]}`;
      const href = `https://github.com/${a.repo}/blob/HEAD/${m[1]}${lines}`;
      return `<a class="cite cite-src" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><code>${esc(cit)}</code></a>`;
    }
  }
  return `<span class="cite cite-src"><code>${esc(cit)}</code></span>`;
}

function onLang(lang: Lang): void {
  state.lang = lang;
  setLang(lang);
  render();
}
function onTheme(theme: "light" | "dark"): void {
  state.theme = theme;
  setTheme(theme);
}

document.getElementById("langBtn")!.addEventListener("click", () => onLang(state.lang === "zh" ? "en" : "zh"));
document.getElementById("themeBtn")!.addEventListener("click", () => onTheme(state.theme === "light" ? "dark" : "light"));
window.addEventListener("hashchange", render);

setTheme(state.theme);
setLang(state.lang);
render();
