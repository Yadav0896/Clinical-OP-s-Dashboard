// ━━ Maya AI Engine - Knowledge Base Types ━━

export interface Drug {
  id: string;
  name: string;
  generic: string;
  mechanism: string;
  jcode: string;
  costRange: string;
  route: string;
  indications: string[];
}

export interface Payer {
  id: string;
  name: string;
}

export interface Indication {
  id: string;
  name: string;
  description: string;
}

// Convenient type aliases used across KB modules
export type DrugId = Drug['id'];
export type PayerId = Payer['id'];
export type IndicationId = Indication['id'];

export interface ICD10Rule {
  drugId: string;
  indicationId: string;
  payerId: string;
  validCodes: { code: string; desc: string }[];
  rejectedCodes: { code: string; desc: string; reason: string }[];
}

export interface DocRecommendation {
  name: string;
  required: boolean;
  rationale: string;
}

export interface DocumentRule {
  drugId: string;
  indicationId: string;
  payerId: string;
  documents: DocRecommendation[];
}

export type GapSeverity = 'critical' | 'warning' | 'pass';

export interface GapResult {
  severity: GapSeverity;
  title: string;
  detail: string;
  action?: string;
}

// Gap check rules as stored in gap-check.ts — flat rule entries
export interface GapCheckRule {
  id: string;
  drugId: string;
  indicationId: string;
  payerId: string;
  category: string;
  rule: string;
  checkFn: string;
  severity: GapSeverity;
  threshold: string;
  guidance: string;
}

export interface AppealStrategy {
  denialReason: string;
  strategy: string;
  citations: string[];
  letterTemplate: string;
}

export interface AppealRule {
  drugId: string;
  indicationId: string;
  payerId: string;
  appeals: AppealStrategy[];
}
