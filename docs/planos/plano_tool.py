#!/usr/bin/env python3
"""plano_tool — valida, reconstrói e mede o plano MIA-VS (plano-operadores.mia.yaml).

  python3 plano_tool.py check    # lógica: aridades, DAG de fases, pesos, requisitos
  python3 plano_tool.py render   # YAML → Markdown legível (reversibilidade)
  python3 plano_tool.py stats    # tokens estimados: YAML vs texto original
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import yaml

HERE = Path(__file__).parent
SPEC = HERE / "plano-operadores.mia.yaml"
PROSE = HERE / "PLANO-IMPLANTACAO-OPERADORES.md"
ARITY = {"redteam": 2, "fases": 4, "prompts": 5, "loops": 3, "receita": 2, "raci": 4, "kpis": 2, "requisitos": 3}


def load() -> dict:
    return yaml.safe_load(SPEC.read_text(encoding="utf-8"))


def tokens(text: str) -> int:
    return int(len(text) / 3.5)  # heurística do AGENTS.md (pt ≈ 3,5 car./token)


def topo(fases: dict) -> list[str]:
    deg = {k: len(v[1]) for k, v in fases.items()}
    out, q = [], deque(k for k, d in deg.items() if d == 0)
    while q:
        n = q.popleft()
        out.append(n)
        for k, v in fases.items():
            if n in v[1]:
                deg[k] -= 1
                if deg[k] == 0:
                    q.append(k)
    if len(out) != len(fases):
        raise ValueError("dependências circulares nas fases")
    return out


def check(p: dict) -> list[str]:
    err = []
    for sec, n in ARITY.items():
        for k, v in p[sec].items():
            if not isinstance(v, list) or len(v) != n:
                err.append(f"{sec}.{k}: esperado {n} campos, tem {len(v) if isinstance(v, list) else 'não-lista'}")
    fases = p["fases"]
    for k, v in fases.items():
        for d in v[1]:
            if d not in fases:
                err.append(f"fases.{k}: depende de fase inexistente {d}")
    try:
        topo(fases)
    except ValueError as e:
        err.append(str(e))
    peso = sum(v[0] for v in p["spec"]["A"]["nota"].values())
    if abs(peso - 1) > 1e-9:
        err.append(f"spec.A.nota: pesos somam {peso}, não 1")
    for k, v in p["requisitos"].items():
        if v[1] not in fases:
            err.append(f"requisitos.{k}: fase {v[1]} inexistente")
    for k, v in p["receita"].items():
        if v[1] not in fases:
            err.append(f"receita.{k}: fase {v[1]} inexistente")
    return err


def table(head: list[str], rows: list[list]) -> str:
    fmt = lambda r: "| " + " | ".join(str(c) for c in r) + " |"
    return "\n".join([fmt(head), fmt(["---"] * len(head)), *map(fmt, rows)])


def render(p: dict) -> str:
    m, pr = p["meta"], p["produtos"]
    s = [f"# Plano {m['id']} · cliente {m['cliente']} · {m['data']} · estado: {m['estado']}",
         f"Método: {', '.join(m['metodo'])}. Reaproveita da Aurora: {', '.join(m['base_aurora'])}.", "",
         "## Produtos", table(["#", "Produto", "Faz", "Valor"], [[k, v["nome"], v["faz"], v["valor"]] for k, v in pr.items()]),
         f"Ordem de construção: {' → '.join(p['ordem'])}.", "",
         "## Red Team", table(["Risco", "Porquê", "Decisão"], [[k.replace("_", " "), *v] for k, v in p["redteam"].items()]), "",
         "## Fases (ordem topológica)",
         table(["Fase", "Semanas", "Depende de", "Entregas", "Gate"],
               [[k, p["fases"][k][0], ", ".join(p["fases"][k][1]) or "—", p["fases"][k][2], p["fases"][k][3]] for k in topo(p["fases"])]), "",
         "## Nota do trader (produto A)",
         table(["Componente", "Peso", "Medidas"], [[k, f"{v[0]:.0%}", ", ".join(v[1])] for k, v in p["spec"]["A"]["nota"].items()]), "",
         "## Prompts", table(["ID", "Entrada", "Saída", "Proíbe", "Teste", "Aceitação"], [[k, *v] for k, v in p["prompts"].items()]), "",
         "## Ciclos", table(["ID", "Ciclo", "Sai quando", "Limite"], [[k, *v] for k, v in p["loops"].items()]), "",
         "## Receita", table(["Fonte", "Modelo", "Fase"], [[k, *v] for k, v in p["receita"].items()]), "",
         "## RACI", table(["Papel", "F1", "F2-3", "F4", "F5-6"], [[k, *v] for k, v in p["raci"].items()]), "",
         "## KPIs", table(["KPI", "Meta", "Fase"], [[k, *v] for k, v in p["kpis"].items()]), "",
         "## Requisitos", table(["ID", "Requisito", "Fase", "Estado"], [[k, *v] for k, v in p["requisitos"].items()]), "",
         "## Próximas ações", *[f"{i}. {a}" for i, a in enumerate(p["proximas"], 1)]]
    return "\n".join(s) + "\n"


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    plano = load()
    if cmd == "check":
        e = check(plano)
        print("OK: plano coerente" if not e else "\n".join(e))
        sys.exit(1 if e else 0)
    if cmd == "render":
        sys.stdout.write(render(plano))
    if cmd == "stats":
        y, t = SPEC.read_text(encoding="utf-8"), PROSE.read_text(encoding="utf-8") if PROSE.exists() else ""
        print(f"YAML: {tokens(y)} tokens · texto original: {tokens(t)} tokens · poupança: {1 - tokens(y) / max(1, tokens(t)):.0%}")
