// Shared runtime helpers used by both the matrix (index) and detail (agent) pages.
import { META, AGENTS } from "./generated/atlas-data";
import { DIMENSIONS, BANDS, PENDING, ICONS, BRANDS, UI, type Lang, type Bilingual, type Band } from "./site";
import type { AgentAnalysis } from "./types";

export { META, AGENTS, DIMENSIONS, BANDS, PENDING, ICONS, BRANDS, UI };
export type { Lang };

export interface AtlasState {
  lang: Lang;
  theme: "light" | "dark";
}

export function loadState(): AtlasState {
  const lang = (localStorage.getItem("atlas:lang") as Lang) || "zh";
  const theme = (localStorage.getItem("atlas:theme") as "light" | "dark") || "light";
  return { lang, theme };
}

export function t(o: Bilingual | Record<string, string> | undefined, lang: Lang): string {
  if (!o) return "";
  const v = (o as Record<string, string>)[lang];
  return v != null ? v : (o as Record<string, string>).zh || "";
}

export function esc(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// allow `code` backticks in evidence → <code>…</code> (escaped first)
export function md(s: string): string {
  return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function scoreOf(a: AgentAnalysis): number | null {
  let sum = 0;
  let n = 0;
  for (const d of DIMENSIONS) {
    const c = a.cells[d.id];
    if (c && typeof c.score === "number") {
      sum += c.score;
      n++;
    }
  }
  return n ? Math.round(sum / n) : null;
}

export function bandOf(s: number | null): Band | typeof PENDING {
  if (typeof s !== "number") return PENDING;
  for (const b of BANDS) {
    if (s >= b.min) return b;
  }
  return PENDING;
}

export function agentById(id: string): AgentAnalysis | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function setLang(lang: Lang): void {
  localStorage.setItem("atlas:lang", lang);
  document.documentElement.setAttribute("lang", lang);
}

export function setTheme(theme: "light" | "dark"): void {
  localStorage.setItem("atlas:theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}
