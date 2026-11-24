# Estado da missão · Redesign Cockpit Aurora
| Fase | Estado |
|---|---|
| Plano | aprovado (24 nov) |
| F0 Auditoria | concluída — `F0-AUDITORIA.md` |
| F1 Conceito | aprovado (G1) |
| F2 Sistema | aprovado (G2) |
| F3 Estrutura | aprovado (G3a) |
| F4 Vaga 1 | entregue — aguarda **G3b** (capturas em `f4/`) |
| F5–F7 | por iniciar |

Decisões: D-001 navegação única por carril de áreas no topo (substitui barra lateral e dock) · D-002 modo padrão «Equilibrado» (ciano) · D-003 mostradores para métricas com limite.
D-004 estrutura v3 por omissão; `?design=v2` mantém a anterior · D-005 Alt+←/→ muda de área; ← → dentro da barra · D-006 sem rotação automática de manchetes com movimento reduzido (WCAG 2.2.2).

F3 verificação: E2E Finanças 32 + 19, Aurora Chat 26, PM 17 — verdes; axe 0 nas 11 áreas; 0 erros JS; sem scroll horizontal a 390 px.
Pendentes para F4: etiquetas truncadas nos cartões de Finanças em móvel; seletor de modo de luz em Definições (no móvel a barra esconde-o).
F4: Notícias com palco e carril com foco (o palco segue o cartão focado); PM com cluster de 3 mostradores e carril de alertas; Finanças com 3 instrumentos (orçamento, reserva, poupança) e etiquetas sem corte; material v3 em todos os cartões (inclui Analytics). Verificação: E2E 94 verdes, axe 0 nas 11 áreas, 0 erros JS.
Próximo passo após G3b: F5 — Corretoras, Benchmark, Plano de Negócios, Modelo Financeiro, Aurora Chat, Marketplace e Definições (com seletor de modo de luz).
