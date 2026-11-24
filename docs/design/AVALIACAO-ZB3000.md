# Avaliação ZABATAINA 3000 · Cockpit Aurora v3 (26 nov 2026)

Métodos: **ZABATAINA 3000** (M02, M05, M13, M17, M18, Red Team, QA) · **REA** (evidência medida no produto, não opinião) · **CodeForge 3000** (requisitos com critério de aceitação e estado).
Âmbito: design e sistema tal como estão no ramo `claude/magical-ptolemy-3hu200` (F1–F4 + correções desta avaliação).

## 1. Sumário executivo
- 9 fluxos de utilizador mapeados em desktop (1440×900) e telemóvel (iPhone 14): **18/18 concluídos** após correções (antes: 16/18).
- Defeitos reais encontrados e corrigidos: separador «Pagar» com o mesmo nome do botão «Pagar» (ambíguo no telemóvel); modo de luz inacessível no telemóvel; 29 alvos < 24 px no fluxo de notícias (agora 2).
- «Ver impacto na carteira» abre agora em **ecrã inteiro** (vista de impacto com palco, mesma linguagem do Cockpit).
- Índice do painel simulado de 1M de clientes: **89,8/100** (modelo, ver limites em §5). Pior segmento: analistas (84,3), por causa do tempo de carregamento do Analytics.
- Maior dívida de design: **consistência** — até 10 tamanhos de letra e 10 raios por área (meta: ≤ 6 e ≤ 5).

## 2. Evidência (REA) — o que foi medido e como
| Medida | Ferramenta | Tipo de evidência |
|---|---|---|
| Conclusão de cada fluxo, passos, tempo até ao conteúdo | Playwright, build de produção local | E1 (medição direta) |
| Alvos interativos < 24 px (WCAG 2.5.8) | DOM no fim de cada fluxo | E1 |
| Estabilidade visual (CLS) | PerformanceObserver `layout-shift` | E1 |
| Consistência (tamanhos de letra, raios, cores de texto por área) | estilos computados | E1 |
| Acessibilidade | axe WCAG 2.2 AA nas 11 áreas | E1 |
| Regressão | 94 testes E2E (Finanças 32+19, Aurora Chat 26, PM 17) | E1 |
| Satisfação por segmento | modelo de painel (§5) | **simulação, não dados de clientes reais** |
| Agências de referência | listas publicadas por agências (§6) | E3/E4 (autopromocionais) |

Limitações: tempos medidos em servidor local (sem latência de rede real); fotografias da Wikimedia bloqueadas no ambiente de teste.

## 3. Mapa de fluxos — dinâmico (macro) e micro-dinâmico
| ID | Fluxo | Passos | Tempo até conteúdo (desktop / móvel) | Alvos < 24 px | CLS | Pontuação |
|---|---|---|---|---|---|---|
| F1 | Ler notícia → ver impacto em ecrã inteiro | 2 | 80 / 83 ms | 2 | 0 | 91 |
| F2 | Ver risco da carteira (zero layer) | 1 | 931 / 910 ms | 0 | 0 | 86 |
| F3 | Abrir registo de despesa | 2 | 1000 / 912 ms | 0 | 0 | 89–90 |
| F4 | Pagar uma conta | 3 | 420 / 345 ms | 0 | 0 | 94 |
| F5 | Importar extrato bancário | 4 | 207 / 77 ms | 3 | 0 | 85 |
| F6 | Comprar um ativo | 3 | 560 / 253 ms | 0 | 0 | 92–94 |
| F7 | Analisar ação em ecrã inteiro | 2 | 1519 / 1151 ms | 2 | 0 | 78–82 |
| F8 | Pesquisar (⌘K) e navegar | 3 | 330 / 109 ms | 1 | 0 | 91 |
| F9 | Mudar modo de luz | 1 | 199 / 835 ms | 0–1 | 0 | 94–97 |

Pontuação por fluxo = 40% sucesso + 25% eficiência (passos e tempo) + 15% alvos + 10% estabilidade + 10% consistência da área.
Micro-dinâmica observada: foco visível e ordem de tabulação corretas na barra de áreas (← →, Alt+← →); o palco das Notícias segue o cartão focado; nenhuma mudança de layout (CLS 0) em todos os fluxos; F2, F3 e F7 pagam o carregamento diferido da área (≈ 1 s) na primeira visita.

## 4. Consistência por área (meta: ≤ 6 tamanhos de letra, ≤ 5 raios)
| Área | Tamanhos de letra | Raios | Cores de texto |
|---|---|---|---|
| Notícias | 8 | 7 | 24 |
| Aurora Chat | 10 | 6 | 17 |
| Finanças Pessoais | 7 | 7 | 18 |
| Portfolio Management | 10 | 8 | 15 |
| Analytics | 6 | 9 | 21 |
| Corretoras | 6 | 7 | 21 |
| Benchmark & Projeções | 5 | 9 | 21 |
| Plano de Negócios | 6 | 7 | 15 |
| Modelo Financeiro & DCF | 6 | 9 | 16 |
| Marketplace | 9 | 10 | 18 |
| Definições | 4 | 6 | 11 |

Diagnóstico: as áreas ainda misturam valores v2 avulsos (`text-[12px]`, `rounded-[12px]`, cores `white/45`…) com tokens v3. A F5 deve substituí-los pelos tokens `--cx-*`.

## 5. Painel simulado de 1 000 000 de clientes
Modelo determinístico: 6 segmentos com pesos e mistura de dispositivos **assumidos** (hipóteses a validar), cada um com o seu peso por fluxo; a satisfação do segmento é a média ponderada das pontuações medidas em §3.

| Segmento (hipótese) | Clientes | Móvel | Fluxos dominantes | Índice |
|---|---|---|---|---|
| Investidor de retalho no telemóvel (MZ) | 350 000 | 85% | F1, F6, F2 | 91,2 |
| Família a gerir orçamento | 250 000 | 70% | F3, F4, F5 | 90,7 |
| Empreendedor / PME | 150 000 | 40% | F3, F5, F8 | 88,9 |
| Gestor de carteira profissional | 100 000 | 10% | F2, F7, F8 | 85,5 |
| Utilizador com necessidades de acessibilidade | 80 000 | 50% | F1, F3, F4, F8, F9 | 92,2 |
| Analista / estudante | 70 000 | 30% | F7, F1, F2 | 84,3 |
| **Total ponderado** | **1 000 000** | | | **89,8** |

Antes das correções desta avaliação, F4 e F9 falhavam no telemóvel: todos os clientes móveis que precisassem de pagar uma conta ou mudar o modo de luz ficavam bloqueados nesses passos.
**Isto não substitui investigação com clientes reais.** Próximo passo (M18): validar os pesos com analytics de produção e 5–8 testes de usabilidade por segmento.

## 6. Agências de referência (benchmark)
Fontes: listas 2026 publicadas por Cuberto, Punchcut, Fuselab, Boldare (cada uma promove-se a si própria → E3/E4).
| Agência | Porque cumpre os critérios (segundo as fontes) | Prática a adotar na Aurora |
|---|---|---|
| Work & Co | produto digital principal à escala enterprise (Cuberto) | um «flagship flow» por área, polido ao detalhe |
| Punchcut | interfaces complexas, multi-dispositivo, design systems (Punchcut) | especificar estados em todos os dispositivos |
| ustwo | estratégia de produto e design de serviço (Punchcut) | mapear o serviço completo, não só ecrãs |
| MetaLab | lançamentos rápidos e polidos (Punchcut) | ciclos curtos com capturas por gate (já em uso) |
| Clay / Ramotion | produto ligado à marca e a design systems (Cuberto, Boldare) | tokens únicos de marca e produto |
| Humbleteam | fintech com produto e marca em conjunto; também automóvel (Fuselab) | linguagem fintech × instrumentação |
| Fuselab Creative / HTEC Momentum | dashboards enterprise e produtos de dados (Fuselab, Cuberto) | densidade de dados com hierarquia clara |
Critério comum às melhores: investigação com utilizadores reais antes e durante o design, design system como fonte única, e verificação contínua. A Aurora já cumpre a segunda e a terceira; falta a primeira.

## 7. Requisitos (CodeForge 3000)
| ID | Requisito | Aceitação | Estado |
|---|---|---|---|
| REQ-UX-001 | «Ver impacto na carteira» em ecrã inteiro | abre como diálogo modal de ecrã inteiro, Esc fecha, foco devolvido | VERIFIED (F1) |
| REQ-UX-002 | Todos os fluxos essenciais concluíveis em desktop e móvel | 18/18 | VERIFIED |
| REQ-UX-003 | Alvos ≥ 24 px nos fluxos | ≤ 2 por fluxo | PARTIALLY VERIFIED (F5: 3) |
| REQ-UX-004 | Nomes acessíveis únicos | sem separador e botão homónimos | VERIFIED (Pagamentos) |
| REQ-UX-005 | Modo de luz acessível em todos os dispositivos | Definições + barra, sincronizados | VERIFIED (F9 móvel) |
| REQ-UX-006 | Consistência tipográfica e de forma | ≤ 6 tamanhos, ≤ 5 raios por área | NOT STARTED (F5) |
| REQ-UX-007 | Tempo até ao conteúdo ≤ 800 ms na 1.ª visita | F2/F3/F7 ≈ 0,9–1,5 s | NOT STARTED (pré-carregar áreas) |
| REQ-UX-008 | Validação com clientes reais | 5–8 testes por segmento | NOT STARTED |

## 8. Red Team
- O índice de 89,8 depende de pesos assumidos: com 60% de profissionais e analistas (30% + 30%) e o resto repartido igualmente cai para ≈ 87,2.
- Tempos locais subestimam a rede móvel em Moçambique; medir em produção (RUM) antes de concluir.
- O teste antigo das Notícias (`news.cjs`) clicava no título para abrir o detalhe; na v3 o detalhe abre pelo botão — atualizar o teste.

## 9. Próximas ações
1. F5 com tokens v3 em todas as áreas → REQ-UX-006.
2. Pré-carregar a área seguinte ao passar o rato/foco na barra → REQ-UX-007.
3. Plano de testes com clientes reais por segmento → REQ-UX-008.
