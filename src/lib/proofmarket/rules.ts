/**
 * ProofMarket business rules — pure functions, no React.
 * BR-001/002 publication gate, MOD-004 abuse checks, SEC-010 link checks,
 * explainable ranking (FR-041) and per-domain reputation (FR-012, BR-012).
 */
import type {
  Author,
  CounterThesis,
  FeedPrefs,
  Horizon,
  Source,
  Thesis,
  ThesisVersion,
} from "@/data/proofmarket/types";

export const DAY = 86_400_000;

export const iso = (d: Date | number) => new Date(d).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);

export function formatDate(isoDate: string) {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const HORIZON_DAYS: Record<Horizon, number> = {
  lt3m: 90,
  "3-12m": 365,
  "1-3a": 365 * 2,
  gt3a: 365 * 4,
};

export const latest = (t: Thesis): ThesisVersion => t.versions[t.versions.length - 1]!;

/* ── Language rules ──────────────────────────────────────────────────── */

const PROMISE_PATTERNS: [RegExp, string][] = [
  [/\b(retorno|lucro|rendimento|ganho)s?\s+garantid[oa]s?\b/i, "promessa de retorno garantido"],
  [/\bsem\s+risco\b/i, "afirmação de ausência de risco"],
  [/\bdinheiro\s+f[áa]cil\b/i, "promessa de dinheiro fácil"],
  [/\bduplique\b|\bduplicar\s+o\s+(seu\s+)?dinheiro\b/i, "promessa de multiplicar dinheiro"],
  [/\b100\s*%\s*(certo|seguro|garantido)\b/i, "certeza absoluta"],
  [/\bganh[ae]\s+\d+\s*%\s*(por|ao|a\s+cada)\s+(dia|semana|m[êe]s)\b/i, "promessa de % periódica"],
  [/\bsinais?\s+vip\b/i, "venda de sinais"],
  [/\bcompre\s+j[áa]\b|\bvenda\s+j[áa]\b/i, "ordem de compra ou venda"],
];

const URGENCY_PATTERNS: [RegExp, string][] = [
  [/\b[úu]ltima\s+oportunidade\b/i, "urgência artificial"],
  [/\bn[ãa]o\s+perca\b/i, "urgência artificial"],
  [/\burgente\b/i, "urgência artificial"],
];

const INSULTS =
  /\b(idiota|burr[oa]|est[úu]pid[oa]|imbecil|mentiros[oa]|vigarista|palha[çc]o|ignorante|incompetente|aldrab[ãa]o)\b/i;
const PERSONAL_DATA = /(\+?258\s?)?8[2-7]\s?\d{3}\s?\d{4}\b|[\w.+-]+@[\w-]+\.[\w.]+/;
const PERSONAL_ATTACK = /\b(voc[êe]|tu)\s+(é|és|nunca|sempre)\b/i;

export function findPromises(text: string): string[] {
  return PROMISE_PATTERNS.filter(([re]) => re.test(text)).map(([, label]) => label);
}

/* ── Link checks (local demo heuristics; production uses a threat feed) ── */

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "is.gd", "ow.ly"];

export function checkUrl(raw: string): { ok: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "Endereço inválido. Use um link completo, começado por https://" };
  }
  if (url.protocol !== "https:")
    return { ok: false, reason: "Só aceitamos links https://, que são cifrados." };
  if (url.username || url.password || raw.includes("@"))
    return { ok: false, reason: 'O link contém credenciais ou um "@", padrão comum de phishing.' };
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname))
    return {
      ok: false,
      reason: "Links para endereços IP não são aceites. Use o domínio da fonte.",
    };
  if (url.hostname.startsWith("xn--") || url.hostname.includes(".xn--"))
    return { ok: false, reason: "O domínio usa caracteres que imitam outros domínios." };
  if (SHORTENERS.some((s) => url.hostname === s || url.hostname.endsWith("." + s)))
    return { ok: false, reason: "Links encurtados escondem o destino. Use o link original." };
  return { ok: true };
}

/* ── Publication gate (BR-001, BR-002, FR-020, FR-029) ───────────────── */

export type StepId = "entidade" | "afirmacao" | "premissas" | "fontes" | "cenarios" | "conflitos";

export interface Issue {
  id: string;
  level: "bloqueio" | "aviso";
  step: StepId;
  message: string;
}

export interface DraftForCheck {
  entityId: string;
  claim: string;
  mechanism: string;
  assumptions: string[];
  risks: string[];
  counterHypothesis: string;
  invalidation: string;
  scenarios: { kind: string; probability: number; outcome: string }[];
  sources: Source[];
  conflictDeclared: boolean;
  sponsor: string;
}

export function validateThesis(d: DraftForCheck, today = iso(Date.now())): Issue[] {
  const issues: Issue[] = [];
  const block = (id: string, step: StepId, message: string) =>
    issues.push({ id, level: "bloqueio", step, message });
  const warn = (id: string, step: StepId, message: string) =>
    issues.push({ id, level: "aviso", step, message });

  if (!d.entityId) block("entity", "entidade", "Escolha a empresa, ativo, setor ou tema da tese.");
  const claim = d.claim.trim();
  if (claim.length < 20)
    block("claim-short", "afirmacao", "A afirmação precisa de pelo menos 20 caracteres.");
  if (claim.length > 240)
    block("claim-long", "afirmacao", "A afirmação tem mais de 240 caracteres.");
  if (d.mechanism.trim().length < 80)
    block(
      "mechanism",
      "afirmacao",
      "Explique o mecanismo em pelo menos 80 caracteres: se X, então Y, porque Z.",
    );
  if (d.assumptions.filter((a) => a.trim()).length < 2)
    block("assumptions", "premissas", "Adicione pelo menos 2 premissas.");
  if (d.risks.filter((a) => a.trim()).length < 2)
    block("risks", "premissas", "Registe pelo menos 2 riscos.");
  if (d.counterHypothesis.trim().length < 30)
    block("counter", "premissas", "Escreva a melhor razão para estar errado (mín. 30 caracteres).");
  if (d.sources.length < 1) block("sources", "fontes", "Adicione pelo menos uma fonte datada.");

  const sum = d.scenarios.reduce(
    (s, x) => s + (Number.isFinite(x.probability) ? x.probability : 0),
    0,
  );
  if (sum !== 100)
    block(
      "prob-sum",
      "cenarios",
      `As probabilidades dos cenários somam ${sum}%. Têm de somar 100%.`,
    );
  const adverse = d.scenarios.find((s) => s.kind === "adverso");
  if (!adverse || adverse.probability <= 0 || !adverse.outcome.trim())
    block(
      "adverse",
      "cenarios",
      "O cenário adverso é obrigatório e tem de ter probabilidade acima de 0%.",
    );
  if (d.scenarios.some((s) => !s.outcome.trim()))
    block("scenario-text", "cenarios", "Descreva o resultado de cada cenário.");
  if (d.invalidation.trim().length < 30)
    block(
      "invalidation",
      "cenarios",
      'Defina o critério de invalidação: "Esta tese é falsa se…" (mín. 30 caracteres).',
    );
  else if (!/\d/.test(d.invalidation))
    warn(
      "invalidation-measure",
      "cenarios",
      "O critério de invalidação não tem nenhum número ou data. Fica difícil de verificar.",
    );

  if (!d.conflictDeclared)
    block("conflict", "conflitos", 'Declare os conflitos de interesse, mesmo que seja "nenhum".');

  const text = [
    claim,
    d.mechanism,
    d.counterHypothesis,
    ...d.assumptions,
    ...d.scenarios.map((s) => s.outcome),
  ].join(" ");
  for (const label of findPromises(text))
    block(
      `promise-${label}`,
      "afirmacao",
      `Linguagem proibida: ${label}. Teses descrevem cenários, não prometem resultados.`,
    );
  for (const [re, label] of URGENCY_PATTERNS)
    if (re.test(text))
      warn(
        `urgency-${label}`,
        "afirmacao",
        `Possível ${label}. Reescreva sem pressionar o leitor.`,
      );

  for (const s of d.sources) {
    const u = checkUrl(s.url);
    if (!u.ok) block(`url-${s.id}`, "fontes", `Fonte "${s.title}": ${u.reason}`);
    if (!s.date) block(`date-${s.id}`, "fontes", `Fonte "${s.title}" não tem data.`);
    else if (daysBetween(s.date, today) > 730)
      warn(
        `stale-${s.id}`,
        "fontes",
        `Fonte "${s.title}" tem mais de 2 anos. Confirme se ainda é a mais recente.`,
      );
  }
  if (d.sources.length && !d.sources.some((s) => s.kind !== "secundaria"))
    warn("no-primary", "fontes", "Nenhuma fonte é primária ou oficial.");
  if (d.sponsor.trim())
    warn(
      "sponsored",
      "conflitos",
      'Tese patrocinada: o cartão vai mostrar o rótulo "Patrocinado" com o patrocinador.',
    );

  return issues;
}

/* ── Counter-thesis abuse checks (MOD-004) ───────────────────────────── */

export function checkCounterText(text: string): Issue[] {
  const out: Issue[] = [];
  if (INSULTS.test(text))
    out.push({
      id: "insult",
      level: "bloqueio",
      step: "afirmacao",
      message: "Remova os insultos. Conteste a evidência, não a pessoa.",
    });
  if (PERSONAL_DATA.test(text))
    out.push({
      id: "pii",
      level: "bloqueio",
      step: "afirmacao",
      message: "Remova contactos pessoais (telefone ou email).",
    });
  if (PERSONAL_ATTACK.test(text))
    out.push({
      id: "attack",
      level: "aviso",
      step: "afirmacao",
      message: 'O texto parece dirigido à pessoa. Prefira "a premissa" ou "a evidência".',
    });
  for (const label of findPromises(text))
    out.push({
      id: `promise-${label}`,
      level: "bloqueio",
      step: "afirmacao",
      message: `Linguagem proibida: ${label}.`,
    });
  return out;
}

export function countersToday(
  counters: CounterThesis[],
  thesisId: string,
  authorId: string,
  today = iso(Date.now()),
) {
  return counters.filter(
    (c) => c.thesisId === thesisId && c.authorId === authorId && c.date === today,
  ).length;
}

/* ── Evidence quality ────────────────────────────────────────────────── */

export function evidenceQuality(v: ThesisVersion) {
  const n = v.sources.length;
  const strong = v.sources.filter((s) => s.kind !== "secundaria" && s.date).length;
  const label =
    n === 0 ? "Sem fontes" : strong / n >= 0.75 ? "Forte" : strong / n >= 0.4 ? "Média" : "Fraca";
  return { n, strong, label };
}

export const hasConflict = (v: ThesisVersion) =>
  v.conflict.position !== "nenhuma" ||
  v.conflict.remunerated ||
  !!v.conflict.sponsor ||
  !!v.conflict.relation;

/* ── Status banners (FR-021) ─────────────────────────────────────────── */

export interface Banner {
  tone: "info" | "warn" | "crit";
  text: string;
}

export function bannersFor(t: Thesis, today = iso(Date.now())): Banner[] {
  const b: Banner[] = [];
  const v = latest(t);
  const late = daysBetween(t.reviewDue, today);
  if (t.status === "arquivada")
    b.push({
      tone: "info",
      text: "Arquivada pelo autor. Continua acessível com todo o histórico.",
    });
  if (t.status === "concluida" || t.status === "invalidada" || t.status === "inconclusiva")
    b.push({
      tone: "info",
      text: `Revista: ${STATUS_LABEL[t.status].toLowerCase()}. A leitura abaixo é a versão final.`,
    });
  else if (late > 30)
    b.push({
      tone: "crit",
      text: `Revisão em atraso há ${late} dias. Trate esta tese como desatualizada.`,
    });
  else if (late >= 0)
    b.push({ tone: "warn", text: "Revisão devida. O autor ainda não reviu esta tese." });
  const lastEvent = t.events[t.events.length - 1];
  if (lastEvent && lastEvent.date > v.date)
    b.push({ tone: "warn", text: `Evento material depois da última versão: ${lastEvent.text}` });
  if (t.versions.length > 1) {
    const prev = t.versions[t.versions.length - 2]!;
    const strip = (c: ThesisVersion["conflict"]) => JSON.stringify({ ...c, declaredAt: "" });
    if (strip(prev.conflict) !== strip(v.conflict))
      b.push({ tone: "warn", text: `O autor alterou a declaração de conflitos na v${v.version}.` });
  }
  return b;
}

export const STATUS_LABEL: Record<Thesis["status"], string> = {
  ativa: "Ativa",
  em_revisao: "Em revisão",
  concluida: "Concluída",
  invalidada: "Invalidada",
  inconclusiva: "Inconclusiva",
  arquivada: "Arquivada",
};

/* ── Explainable ranking (FR-005, FR-040, FR-041) ────────────────────── */

export interface Ranked {
  thesis: Thesis;
  score: number;
  reasons: string[];
}

export function rankFeed(
  theses: Thesis[],
  opts: {
    prefs: FeedPrefs;
    followedAuthorIds: Set<string>;
    savedStances: Map<string, string>;
    today?: string;
  },
): Ranked[] {
  const today = opts.today ?? iso(Date.now());
  return theses
    .filter((t) => t.status !== "arquivada")
    .filter((t) => !(opts.prefs.limitSpeculative && t.risk === "especulativo"))
    .filter((t) => !(opts.prefs.hideConflicted && hasConflict(latest(t))))
    .map((t) => {
      const v = latest(t);
      const reasons: string[] = [];
      const age = Math.max(0, daysBetween(v.date, today));
      const q = evidenceQuality(v);
      let score = 0;
      if (opts.prefs.chronological) {
        score = -age;
        reasons.push(`Ordem cronológica: versão de ${formatDate(v.date)}`);
      } else {
        score += Math.max(0, 30 - age);
        if (age <= 14) reasons.push(`Recente: versão de ${formatDate(v.date)}`);
        score += q.n ? (q.strong / q.n) * 25 : 0;
        if (q.n) reasons.push(`Fontes fortes: ${q.strong} de ${q.n}`);
        if (t.counterOpen) {
          score += 5;
          reasons.push("Aceita contraditório");
        }
        if (opts.followedAuthorIds.has(t.authorId)) {
          score += 15;
          reasons.push("Segue este autor");
        }
        const seen = opts.savedStances.get(t.entity.id);
        if (opts.prefs.moreContrary && seen && seen !== t.stance) {
          score += 12;
          reasons.push("Perspetiva diferente das teses que guardou sobre esta entidade");
        }
        if (t.risk === "especulativo") {
          score -= 10;
          reasons.push("Risco especulativo: aparece mais abaixo");
        }
      }
      return { thesis: t, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/* ── Reputation (FR-012, BR-012) ─────────────────────────────────────── */

export const MIN_FORECASTS = 10;
export const BENCHMARK_BRIER = 0.25; // always answering 50%

export interface Dimension {
  key: string;
  label: string;
  value: string;
  sample: string;
  enough: boolean;
  note: string;
  ratio?: number;
}

export function reputationFor(author: Author, theses: Thesis[]): Dimension[] {
  const own = theses.filter((t) => t.authorId === author.id);
  const versions = own.map(latest);
  const sources = versions.flatMap((v) => v.sources);
  const strong = sources.filter((s) => s.kind !== "secundaria" && s.date).length;
  const reviewsDue = own.filter((t) => t.reviews.length > 0);
  const onTime = reviewsDue.filter((t) => t.reviews[t.reviews.length - 1]!.onTime).length;
  const corrections = own.reduce(
    (n, t) => n + t.versions.filter((v) => !v.material && v.version !== "1.0").length,
    0,
  );
  const f = author.forecasts;
  const brier = f.length ? f.reduce((s, x) => s + (x.p - x.outcome) ** 2, 0) / f.length : 0;

  return [
    {
      key: "evidencia",
      label: "Qualidade da evidência",
      value: sources.length ? `${Math.round((strong / sources.length) * 100)}% fontes fortes` : "—",
      sample: `${sources.length} fontes em ${own.length} teses`,
      enough: own.length >= 3,
      note: "Fontes primárias ou oficiais, com data.",
      ratio: sources.length ? strong / sources.length : undefined,
    },
    {
      key: "rigor",
      label: "Rigor de previsão",
      value: f.length >= MIN_FORECASTS ? `Brier ${brier.toFixed(2).replace(".", ",")}` : "—",
      sample: `${f.length} previsões resolvidas · referência ${BENCHMARK_BRIER.toFixed(2).replace(".", ",")}`,
      enough: f.length >= MIN_FORECASTS,
      note: "Menor é melhor. A referência é responder sempre 50%.",
      ratio: f.length >= MIN_FORECASTS ? Math.max(0, 1 - brier / BENCHMARK_BRIER) : undefined,
    },
    {
      key: "revisao",
      label: "Revisões no prazo",
      value: reviewsDue.length ? `${onTime} de ${reviewsDue.length}` : "—",
      sample: `${reviewsDue.length} ${reviewsDue.length === 1 ? "tese revista" : "teses revistas"}`,
      enough: reviewsDue.length >= 2,
      note: "Revistas até 7 dias depois da data marcada.",
      ratio: reviewsDue.length ? onTime / reviewsDue.length : undefined,
    },
    {
      key: "transparencia",
      label: "Conflitos declarados",
      value: own.length ? `${own.length} de ${own.length}` : "—",
      sample: `${own.length} teses`,
      enough: own.length >= 1,
      note: "A publicação exige declaração, por isso o valor só cai com omissões confirmadas.",
      ratio: own.length ? 1 : undefined,
    },
    {
      key: "correcoes",
      label: "Correções voluntárias",
      value: String(corrections),
      sample: "Correções menores publicadas",
      enough: true,
      note: "Corrigir cedo conta a favor.",
    },
  ];
}

/* ── Direct-message safety (SEC-031, MOD-010) ────────────────────────── */

const SCAM_PATTERNS: [RegExp, string][] = [
  [
    /\b(m-?pesa|e-?mola|mkesh|transfer[êe]ncia|dep[óo]sito|envie?\s+\d+\s*(mt|mzn|meticais|usd|\$))/i,
    "pedido de dinheiro",
  ],
  [/\b(grupo|canal|sinais?)\s+vip\b/i, "venda de sinais"],
  [/\bwhats\s?app\b|\btelegram\b/i, "contacto fora da plataforma"],
];

/** Returns the reasons a message looks like a scam, empty when it looks safe. */
export function scamSignals(text: string): string[] {
  const out = SCAM_PATTERNS.filter(([re]) => re.test(text)).map(([, l]) => l);
  out.push(...findPromises(text));
  if (PERSONAL_DATA.test(text)) out.push("contacto pessoal");
  return [...new Set(out)];
}
