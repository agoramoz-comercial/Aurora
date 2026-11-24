---
name: operadores
description: Contexto compacto para trabalhar na área Operadores da Aurora (nota de traders, estúdio e marketplace de indicadores, ranking e contratos). Usar antes de alterar src/lib/operadores, a área Operadores ou o plano OPS-01.
---
# Operadores · pacote de contexto (ler só isto antes de mexer)

## Fonte única
- Plano (dados, não prosa): `docs/planos/plano-operadores.mia.yaml` → `python3 docs/planos/plano_tool.py check|render|stats`
- Estado dos ciclos: `docs/planos/loops-report.json` (gerado por `npm run loops`)

## Mapa de código
| Camada | Ficheiro | Contrato |
|---|---|---|
| Dados de mercado | `src/lib/operadores/market.ts` | `series(symbol, n)` determinística (trocar por feed real) |
| Import | `src/lib/operadores/trades.ts` | `parseTrades(csv)` → `Trade[]`; MT5 (Time/Price repetidos), CSV genérico |
| Nota (A) | `src/lib/operadores/score.ts` | `score(trades, seal)` pura; pesos `WEIGHTS` = plano spec.A |
| DSL (B) | `src/lib/operadores/dsl.ts` | linguagem fechada `FUNCS`; `parse`, `evaluate`; nunca `eval` |
| Prompt P1 | `src/lib/operadores/nl.ts` | `promptToFormula` → `{formula, parametros, explicacao, ambiguidades}` |
| Backtest (L2) | `src/lib/operadores/backtest.ts` | long-only, sinal no fecho t, posição em t+1 |
| Marketplace | `src/lib/operadores/marketplace.ts` | `publish` recusa sem backtest / promessas de lucro |
| UI | `src/components/aurora/operadores/OperadoresWorkspace.tsx` | 4 separadores; estado `aurora.operadores.v1` |
| Ciclos | `scripts/loops/run.ts`, `scripts/loops/cases.ts` | `npm run loops` (exit ≠ 0 se falhar) |

## Invariantes (não quebrar)
1. Números vêm só dos motores determinísticos; texto de IA nunca cria números.
2. Nada publicado sem backtest; nada de «lucro garantido».
3. Contratos = simulação local até F5 (parecer + testnet); sem dinheiro real, sem blockchain.
4. Biometria fora da nota. Tokens e copy trading automático: BLOCKED (licença).
5. Aviso «Desempenho passado não garante resultados futuros» onde houver retorno.
6. UI v3: tokens `--cx-*`, texto ≥ 11 px, alvos ≥ 24 px, axe 0.

## Ciclo de trabalho (Loop Engineer)
1. Alterar motor → `npm run loops` → todos PASS em 2 corridas seguidas.
2. L1 abaixo de 95%: acrescentar regra em `nl.ts`; **nunca** alterar as expectativas em `cases.ts` para passar; máx. 5 iterações → humano.
3. UI → build + E2E da área + axe → capturas → aprovação → publicar.
