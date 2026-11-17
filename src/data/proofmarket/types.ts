/**
 * ProofMarket domain types. The unit of content is the auditable thesis:
 * a claim with mechanism, sources, scenarios, an invalidation criterion,
 * declared conflicts and a review date. Versions are append-only.
 */

export type VerificationLevel = "N1" | "N2" | "N3" | "N4" | "N5" | "N6";

export interface Author {
  id: string;
  name: string;
  handle: string;
  initials: string;
  level: VerificationLevel;
  /** Exactly what was verified — never "expert". */
  verifiedWhat: string;
  verifiedBy: string;
  verifiedAt: string;
  validUntil?: string;
  limits: string;
  /** Declared (unverified) profile line. */
  declared?: string;
  domains: string[];
  /** Resolved probabilistic forecasts, used for the Brier score. */
  forecasts: { domain: string; p: number; outcome: 0 | 1 }[];
}

export type Stance = "positiva" | "negativa" | "neutra" | "condicional";
export type ThesisKind =
  | "valuation"
  | "resultados"
  | "macro"
  | "regulacao"
  | "risco"
  | "governacao";
export type Horizon = "lt3m" | "3-12m" | "1-3a" | "gt3a";
export type RiskLevel = "baixo" | "moderado" | "elevado" | "especulativo";
export type ThesisStatus =
  | "ativa"
  | "em_revisao"
  | "concluida"
  | "invalidada"
  | "inconclusiva"
  | "arquivada";
export type EntityKind = "empresa" | "ativo" | "setor" | "tema";

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  code?: string;
  market?: string;
  official: boolean;
}

export type SourceKind = "primaria" | "oficial" | "secundaria";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  kind: SourceKind;
}

export type ScenarioKind = "base" | "positivo" | "adverso";

export interface Scenario {
  kind: ScenarioKind;
  probability: number;
  outcome: string;
}

export type PositionBand = "nenhuma" | "longa" | "curta";

export interface Conflict {
  position: PositionBand;
  remunerated: boolean;
  sponsor: string;
  relation: string;
  declaredAt: string;
}

export interface ThesisVersion {
  version: string;
  date: string;
  claim: string;
  mechanism: string;
  assumptions: string[];
  risks: string[];
  counterHypothesis: string;
  invalidation: string;
  scenarios: Scenario[];
  sources: Source[];
  conflict: Conflict;
  changeNote: string;
  material: boolean;
  /** Warnings the author chose to publish with, shown to readers. */
  justifications?: string[];
}

export type ReviewDecision = "manter" | "atualizar" | "invalidar" | "concluir" | "inconclusiva";

export interface Review {
  date: string;
  decision: ReviewDecision;
  justification: string;
  onTime: boolean;
}

export interface MaterialEvent {
  date: string;
  text: string;
}

export interface Thesis {
  id: string;
  authorId: string;
  entity: Entity;
  kind: ThesisKind;
  stance: Stance;
  horizon: Horizon;
  risk: RiskLevel;
  status: ThesisStatus;
  publishedAt: string;
  reviewDue: string;
  counterOpen: boolean;
  versions: ThesisVersion[];
  reviews: Review[];
  events: MaterialEvent[];
  tags: string[];
  /** Seed reaction counts (other readers). */
  reactionCounts: Record<ReactionId, number>;
}

export type ReactionId =
  | "evidencia_util"
  | "premissa_questionavel"
  | "quero_fonte"
  | "risco_subestimado"
  | "explicacao_clara"
  | "necessita_atualizacao";

export type CounterTargetKind = "afirmacao" | "premissa" | "evidencia" | "cenario";
export type CounterType =
  | "evidencia_contraria"
  | "metodologia"
  | "confundidor"
  | "conflito"
  | "risco_omitido"
  | "interpretacao";

export interface CounterThesis {
  id: string;
  thesisId: string;
  authorId: string;
  targetKind: CounterTargetKind;
  targetText: string;
  targetVersion: string;
  type: CounterType;
  body: string;
  alternative: string;
  wouldChange: string;
  source?: Source;
  date: string;
  status: "publicada" | "respondida" | "resolvida";
  answer?: { text: string; stance: "mantenho" | "corrijo"; date: string };
}

export type ReportReason =
  | "fraude"
  | "promessa_retorno"
  | "conflito_oculto"
  | "promocao_nao_identificada"
  | "identidade_falsa"
  | "manipulacao"
  | "informacao_enganosa"
  | "assedio"
  | "dados_pessoais"
  | "spam"
  | "outro";

export interface Report {
  caseId: string;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  part: string;
  context: string;
  date: string;
  status: "recebido" | "em_triagem";
}

export interface FeedPrefs {
  chronological: boolean;
  limitSpeculative: boolean;
  moreContrary: boolean;
  hideConflicted: boolean;
}
