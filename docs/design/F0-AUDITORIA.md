# F0 · Auditoria e linha de base (24 nov 2026)

## Inventário por área
| Área | Ficheiros | Linhas | Cartões/painéis | Gráficos |
|---|---|---|---|---|
| Notícias (`home`) | 6 | 1 518 | 5 | 0 |
| Aurora Chat (`proofmarket`) | 6 | 5 265 | 1 | 0 |
| Finanças Pessoais | 3 | 3 181 | 37 | 7 |
| Portfolio Management (`portfolio`) | 13 | 3 909 | 126 | 17 |
| Analytics | 8 | 1 170 | 29 | 6 |
| Corretoras | 5 | 1 248 | 11 | 10 |
| Benchmark & Projeções | 12 | 3 281 | 37 | 30 |
| Plano de Negócios | 1 | 648 | 5 | 3 |
| Modelo Financeiro & DCF | 1 | 1 220 | 73 | 7 |
| Marketplace | 7 | 1 820 | 3 | 0 |
| Definições | 1 | 158 | 4 | 0 |

Primitivas partilhadas: `GlassCard`, `Panel`, `MetricCard`, `SegmentedTabs`, `Drawer`, `Pie3D`, `chartTheme`, utilitário `.glass` (17 regras em `styles.css`). Mudar estas origens cobre a maior parte dos 331 cartões e 80 gráficos.

## Linha de base (build atual, 1440×900)
| Medida | Valor |
|---|---|
| axe WCAG 2.2 AA | **0** violações nas 11 áreas |
| Texto < 11px | **0** nas 11 áreas |
| Erros de JavaScript | 0 |
| JS inicial (gzip) | ≈ 191 KB (alvo v3: ≤ 210 KB) |
| Ativos totais | 2,5 MB |
| LCP (local, sem rede) | 1,28 s |
| E2E | Finanças 51 · Aurora Chat 26 · PM 17 · Notícias 6 — verdes |

Capturas «antes»: `f0/antes-noticias.jpg`, `f0/antes-pm.jpg`.

## Diagnóstico de design
1. **Sem «zero layer»**: KPIs críticos competem com cromagem (pílulas de título, badges repetidas).
2. **Hierarquia plana**: quase tudo em cartões do mesmo peso; nada indica o que é mais importante agora.
3. **Navegação fragmentada**: barra lateral + dock inferior + separadores; três sistemas para a mesma função.
4. **Limites invisíveis**: risco, concentração e metas aparecem como números soltos, sem escala nem limite.
5. **Palco ausente**: o fundo é igual em todas as áreas; as fotografias de notícias ficam presas em cartões pequenos.
6. **Cor de destaque fixa**: o azul não comunica estado nem modo.
