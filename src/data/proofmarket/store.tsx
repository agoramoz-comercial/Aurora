/**
 * ProofMarket store — React context + reducer mirrored to localStorage,
 * same pattern as the Marketplace store. Published versions are append-only:
 * there is no action that deletes or rewrites a thesis version.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { iso, latest } from "@/lib/proofmarket/rules";
import { AUTHORS, ME_ID, SEED_COUNTERS, SEED_THESES } from "./seed";
import { SEED_CONVERSATIONS, type Conversation } from "./messages";
import type {
  Author,
  CounterThesis,
  FeedPrefs,
  ReactionId,
  Report,
  ReportReason,
  Review,
  Thesis,
  ThesisStatus,
  ThesisVersion,
} from "./types";

const STORAGE_KEY = "ollympius.proofmarket.v2";

interface State {
  created: Thesis[];
  overrides: Record<string, Thesis>;
  counters: CounterThesis[];
  reactions: Record<string, ReactionId[]>;
  saved: string[];
  followed: string[];
  followedAuthors: string[];
  reports: Report[];
  hidden: string[];
  prefs: FeedPrefs;
  conversations: Conversation[];
  myNote: string;
}

export const DEFAULT_PREFS: FeedPrefs = {
  chronological: false,
  limitSpeculative: false,
  moreContrary: true,
  hideConflicted: false,
};

const EMPTY: State = {
  created: [],
  overrides: {},
  counters: [],
  reactions: {},
  saved: ["THS-0101", "THS-0105"],
  followed: ["THS-0102", "THS-0101", "THS-0104", "THS-0105", "THS-0106", "THS-0107"],
  followedAuthors: ["rui"],
  reports: [],
  hidden: [],
  prefs: DEFAULT_PREFS,
  conversations: SEED_CONVERSATIONS,
  myNote: "",
};

type Action =
  | { type: "publish"; thesis: Thesis }
  | { type: "replace"; thesis: Thesis }
  | { type: "toggleReaction"; id: string; reaction: ReactionId }
  | { type: "toggleList"; key: "saved" | "followed" | "followedAuthors" | "hidden"; id: string }
  | { type: "addCounter"; counter: CounterThesis }
  | { type: "addReport"; report: Report }
  | { type: "setPrefs"; prefs: FeedPrefs }
  | { type: "sendMessage"; convId: string; text: string; thesisId?: string }
  | { type: "startConversation"; conv: Conversation }
  | { type: "readConversation"; convId: string }
  | { type: "moveConversation"; convId: string; folder: Conversation["folder"] | null }
  | { type: "setNote"; note: string };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "publish":
      return {
        ...state,
        created: [a.thesis, ...state.created],
        followed: [a.thesis.id, ...state.followed],
      };
    case "replace": {
      const isCreated = state.created.some((t) => t.id === a.thesis.id);
      return isCreated
        ? { ...state, created: state.created.map((t) => (t.id === a.thesis.id ? a.thesis : t)) }
        : { ...state, overrides: { ...state.overrides, [a.thesis.id]: a.thesis } };
    }
    case "toggleReaction": {
      const cur = state.reactions[a.id] ?? [];
      const next = cur.includes(a.reaction)
        ? cur.filter((r) => r !== a.reaction)
        : [...cur, a.reaction];
      return { ...state, reactions: { ...state.reactions, [a.id]: next } };
    }
    case "toggleList": {
      const cur = state[a.key];
      return {
        ...state,
        [a.key]: cur.includes(a.id) ? cur.filter((x) => x !== a.id) : [a.id, ...cur],
      };
    }
    case "addCounter":
      return { ...state, counters: [a.counter, ...state.counters] };
    case "addReport":
      return { ...state, reports: [a.report, ...state.reports] };
    case "setPrefs":
      return { ...state, prefs: a.prefs };
    case "sendMessage":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === a.convId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: `m${Date.now()}`,
                    from: "me" as const,
                    text: a.text,
                    at: Date.now(),
                    thesisId: a.thesisId,
                  },
                ],
              }
            : c,
        ),
      };
    case "startConversation":
      return state.conversations.some((c) => c.id === a.conv.id)
        ? state
        : { ...state, conversations: [a.conv, ...state.conversations] };
    case "readConversation":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === a.convId ? { ...c, unread: 0 } : c,
        ),
      };
    case "moveConversation":
      return {
        ...state,
        conversations:
          a.folder === null
            ? state.conversations.filter((c) => c.id !== a.convId)
            : state.conversations.map((c) =>
                c.id === a.convId ? { ...c, folder: a.folder as Conversation["folder"] } : c,
              ),
      };
    case "setNote":
      return { ...state, myNote: a.note };
  }
}

function load(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<State>;
    return {
      ...EMPTY,
      ...p,
      prefs: { ...DEFAULT_PREFS, ...(p.prefs ?? {}) },
      overrides: p.overrides && typeof p.overrides === "object" ? p.overrides : {},
      conversations: Array.isArray(p.conversations) ? p.conversations : SEED_CONVERSATIONS,
    };
  } catch {
    return EMPTY;
  }
}

export interface PublishInput {
  entity: Thesis["entity"];
  kind: Thesis["kind"];
  stance: Thesis["stance"];
  horizon: Thesis["horizon"];
  risk: Thesis["risk"];
  counterOpen: boolean;
  reviewDue: string;
  tags: string[];
  version: Omit<ThesisVersion, "version" | "date" | "changeNote" | "material">;
}

export interface ReviewInput {
  decision: Review["decision"];
  justification: string;
  conflict: ThesisVersion["conflict"];
  assumptionStatus: string[];
}

interface Api extends State {
  theses: Thesis[];
  allCounters: CounterThesis[];
  me: Author;
  authors: Author[];
  storageOk: boolean;
  getThesis: (id: string) => Thesis | undefined;
  getAuthor: (id: string) => Author;
  publish: (input: PublishInput) => string;
  review: (id: string, input: ReviewInput) => void;
  archive: (id: string) => void;
  toggleReaction: (id: string, r: ReactionId) => void;
  toggleSaved: (id: string) => void;
  toggleFollowed: (id: string) => void;
  toggleFollowAuthor: (id: string) => void;
  toggleHidden: (id: string) => void;
  addCounter: (c: Omit<CounterThesis, "id" | "date" | "status" | "authorId">) => string;
  report: (r: {
    targetId: string;
    targetLabel: string;
    reason: ReportReason;
    part: string;
    context: string;
  }) => string;
  setPrefs: (p: FeedPrefs) => void;
  sendMessage: (convId: string, text: string, thesisId?: string) => void;
  /** Returns the id of the existing or new conversation with an author. */
  conversationWith: (authorId: string) => string;
  readConversation: (convId: string) => void;
  moveConversation: (convId: string, folder: Conversation["folder"] | null) => void;
  setNote: (note: string) => void;
}

const Ctx = createContext<Api | null>(null);

const STATUS_BY_DECISION: Record<Review["decision"], ThesisStatus> = {
  manter: "ativa",
  atualizar: "ativa",
  invalidar: "invalidada",
  concluir: "concluida",
  inconclusiva: "inconclusiva",
};

function canPersist() {
  try {
    const k = "__pm_probe";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function ProofMarketStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const storageOk = useMemo(canPersist, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — kept in memory; the UI warns (FR-024) */
    }
  }, [state]);

  const theses = useMemo(
    () => [...state.created, ...SEED_THESES.map((t) => state.overrides[t.id] ?? t)],
    [state.created, state.overrides],
  );
  const byId = useMemo(() => new Map(theses.map((t) => [t.id, t])), [theses]);
  const authorsById = useMemo(() => new Map(AUTHORS.map((a) => [a.id, a])), []);
  const allCounters = useMemo(
    () => [...state.counters, ...(SEED_COUNTERS as CounterThesis[])],
    [state.counters],
  );

  const publish = useCallback(
    (input: PublishInput) => {
      const id = `THS-${9001 + state.created.length}`;
      const today = iso(Date.now());
      const thesis: Thesis = {
        id,
        authorId: ME_ID,
        entity: input.entity,
        kind: input.kind,
        stance: input.stance,
        horizon: input.horizon,
        risk: input.risk,
        status: "ativa",
        publishedAt: today,
        reviewDue: input.reviewDue,
        counterOpen: input.counterOpen,
        tags: input.tags,
        reactionCounts: {
          evidencia_util: 0,
          premissa_questionavel: 0,
          quero_fonte: 0,
          risco_subestimado: 0,
          explicacao_clara: 0,
          necessita_atualizacao: 0,
        },
        events: [],
        reviews: [],
        versions: [
          {
            ...input.version,
            version: "1.0",
            date: today,
            changeNote: "Publicação inicial.",
            material: true,
          },
        ],
      };
      dispatch({ type: "publish", thesis });
      return id;
    },
    [state.created.length],
  );

  const review = useCallback(
    (id: string, input: ReviewInput) => {
      const t = byId.get(id);
      if (!t) return;
      const today = iso(Date.now());
      const prev = latest(t);
      const [maj] = prev.version.split(".").map(Number);
      const onTime = new Date(today).getTime() - new Date(t.reviewDue).getTime() <= 7 * 86_400_000;
      const note = input.assumptionStatus.length
        ? ` Premissas: ${input.assumptionStatus.map((s, i) => `${i + 1} ${s}`).join(", ")}.`
        : "";
      const version: ThesisVersion = {
        ...prev,
        version: `${(maj ?? 1) + 1}.0`,
        date: today,
        conflict: { ...input.conflict, declaredAt: today },
        changeNote: `Revisão: ${input.decision}. ${input.justification}${note}`,
        material: true,
      };
      const next: Thesis = {
        ...t,
        status: STATUS_BY_DECISION[input.decision],
        reviewDue:
          input.decision === "manter" || input.decision === "atualizar"
            ? iso(Date.now() + 180 * 86_400_000)
            : t.reviewDue,
        versions: [...t.versions, version],
        reviews: [
          ...t.reviews,
          { date: today, decision: input.decision, justification: input.justification, onTime },
        ],
      };
      dispatch({ type: "replace", thesis: next });
    },
    [byId],
  );

  const archive = useCallback(
    (id: string) => {
      const t = byId.get(id);
      if (t) dispatch({ type: "replace", thesis: { ...t, status: "arquivada" } });
    },
    [byId],
  );

  const addCounter = useCallback(
    (c: Omit<CounterThesis, "id" | "date" | "status" | "authorId">) => {
      const id = `CTR-${Date.now().toString(36).toUpperCase()}`;
      dispatch({
        type: "addCounter",
        counter: { ...c, id, authorId: ME_ID, date: iso(Date.now()), status: "publicada" },
      });
      return id;
    },
    [],
  );

  const report = useCallback(
    (r: {
      targetId: string;
      targetLabel: string;
      reason: ReportReason;
      part: string;
      context: string;
    }) => {
      const caseId = `MOD-${new Date().getFullYear()}-${String(Date.now() % 1_000_000).padStart(6, "0")}`;
      dispatch({
        type: "addReport",
        report: { ...r, caseId, date: iso(Date.now()), status: "recebido" },
      });
      return caseId;
    },
    [],
  );

  const toggle = useCallback(
    (key: "saved" | "followed" | "followedAuthors" | "hidden") => (id: string) =>
      dispatch({ type: "toggleList", key, id }),
    [],
  );

  const api = useMemo<Api>(
    () => ({
      ...state,
      theses,
      allCounters,
      me: authorsById.get(ME_ID)!,
      authors: AUTHORS,
      storageOk,
      getThesis: (id) => byId.get(id),
      getAuthor: (id) => authorsById.get(id) ?? authorsById.get(ME_ID)!,
      publish,
      review,
      archive,
      toggleReaction: (id, r) => dispatch({ type: "toggleReaction", id, reaction: r }),
      toggleSaved: toggle("saved"),
      toggleFollowed: toggle("followed"),
      toggleFollowAuthor: toggle("followedAuthors"),
      toggleHidden: toggle("hidden"),
      addCounter,
      report,
      setPrefs: (prefs) => dispatch({ type: "setPrefs", prefs }),
      sendMessage: (convId, text, thesisId) =>
        dispatch({ type: "sendMessage", convId, text, thesisId }),
      conversationWith: (authorId) => {
        const found = state.conversations.find((c) => c.authorId === authorId);
        if (found) return found.id;
        const a = authorsById.get(authorId)!;
        const id = `dm-${authorId}`;
        dispatch({
          type: "startConversation",
          conv: {
            id,
            authorId,
            name: a.name,
            initials: a.initials,
            verified: a.level !== "N1",
            folder: "principal",
            unread: 0,
            messages: [],
          },
        });
        return id;
      },
      readConversation: (convId) => dispatch({ type: "readConversation", convId }),
      moveConversation: (convId, folder) => dispatch({ type: "moveConversation", convId, folder }),
      setNote: (note) => dispatch({ type: "setNote", note }),
    }),
    [
      state,
      theses,
      allCounters,
      authorsById,
      storageOk,
      byId,
      publish,
      review,
      archive,
      toggle,
      addCounter,
      report,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProofMarket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProofMarket must be used inside <ProofMarketStoreProvider>");
  return ctx;
}
