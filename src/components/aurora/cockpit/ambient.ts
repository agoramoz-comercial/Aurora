/** Ambient light modes (MBUX-style drive modes) — one accent drives glows, needles and focus. */
import { useEffect, useState } from "react";

export type AmbientMode = "conservador" | "equilibrado" | "dinamico";
export const AMBIENT_MODES: { id: AmbientMode; label: string; hint: string }[] = [
  { id: "conservador", label: "Conservador", hint: "Leitura calma, risco baixo" },
  { id: "equilibrado", label: "Equilibrado", hint: "Uso geral" },
  { id: "dinamico", label: "Dinâmico", hint: "Trading e alertas" },
];
const KEY = "aurora.ambient";

export function useAmbient(): [AmbientMode, (m: AmbientMode) => void] {
  const [mode, setMode] = useState<AmbientMode>(() => {
    try {
      const v = window.localStorage.getItem(KEY) as AmbientMode | null;
      return v && AMBIENT_MODES.some((m) => m.id === v) ? v : "equilibrado";
    } catch {
      return "equilibrado";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.ambient = mode;
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* storage blocked: keep for this session */
    }
  }, [mode]);
  // Keep every ModeSwitch (top bar, Definições) in sync.
  useEffect(() => {
    const on = (e: Event) => setMode((e as CustomEvent<AmbientMode>).detail);
    window.addEventListener("aurora-ambient", on);
    return () => window.removeEventListener("aurora-ambient", on);
  }, []);
  const set = (m: AmbientMode) => {
    setMode(m);
    window.dispatchEvent(new CustomEvent("aurora-ambient", { detail: m }));
  };
  return [mode, set];
}

/** Cockpit Aurora (v3) is the default; ?design=v2 keeps the previous design. */
export const isV3 = () =>
  typeof window === "undefined" ||
  new URLSearchParams(window.location.search).get("design") !== "v2";
