// Shared types for the Agent Harness Atlas data model.
import type { Bilingual } from "./site";

export interface Cell {
  score: number | null;
  zh: string;
  en: string;
  citations: string[];
  keep: Bilingual;
  fix: Bilingual;
}

export type EvidenceBasis = "source" | "docs";

export interface AgentAnalysis {
  id: string;
  name: string;
  vendor: string;
  lang: string;
  evidenceBasis: EvidenceBasis;
  repo: string | null;
  evidenceNote?: Bilingual;
  verdict: Bilingual;
  cells: Record<string, Cell>;
  keyFiles: string[];
}

export interface Meta {
  updated: string;
  version: string;
  sourceNote: Bilingual;
}
