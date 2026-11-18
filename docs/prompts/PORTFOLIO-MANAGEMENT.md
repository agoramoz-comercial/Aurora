# Prompt mestre — Portfolio Management (Ollympius · Aurora)

> Método: **CodeForge 3000** (requisitos com ID, contrato por elemento interativo, testes ligados, barreiras G1–G10),
> **REA** (cada padrão marcado VER com fonte ou INF), **ECC** (sem segredos, dados de demonstração, redação de logs).
> Substitui o espaço «Ollympius Dashboard» na barra lateral.

## 1. Equipa sénior (papéis)
| Papel | Responsabilidade |
|---|---|
| Gestor de carteiras (CFA) | Fluxo de trabalho: construir, monitorizar, rebalancear, executar |
| Analista de risco quantitativo | Volatilidade, beta, VaR, drawdown, contribuição para o risco, stress |
| Analista de performance | TWR, comparação com referência, atribuição Brinson-Fachler |
| Compliance | Verificações pré-negociação, lista restrita, limites de concentração |
| Design de sistema | Vidro espacial Aurora, escala tipográfica ≥11px, componentes 21st.dev reimplementados |
| Engenharia + QA | Regras puras testadas, E2E, axe WCAG 2.1 AA, telemóvel 390px |

## 2. Os 10 sistemas de referência (REA)
| # | Sistema | O que trazemos | REA | Fonte |
|---|---|---|---|---|
| 1 | BlackRock Aladdin | Visão da carteira inteira; motor de risco integrado | VER | https://www.blackrock.com/aladdin |
| 2 | MSCI Barra Portfolio Manager | Risco por fatores; contribuição para o risco; atribuição | VER | https://www.finantrix.com/buyer-guides/portfolio-management-software-institutional-owners |
| 3 | SimCorp One / Dimension | Ciclo de vida multiativo numa só plataforma | VER | https://www.gartner.com/reviews/market/order-and-execution-management-systems-for-investment-firms |
| 4 | State Street Charles River IMS | Modelação de carteira e compliance pré e pós-negociação | VER | idem |
| 5 | Bloomberg PORT | Atribuição Brinson e híbrida multiativo | VER | https://www.purebenchmarks.com/performance-attribution-software-compared/ |
| 6 | FactSet Portfolio Analysis | Atribuição Brinson-Fachler; risco | VER | idem |
| 7 | Morningstar Direct | Atribuição alocação vs seleção | VER | idem |
| 8 | Enfusion / Clearwater | Cloud, OMS integrado, livro de ordens | VER | https://www.finantrix.com/buyer-guides/portfolio-management-software-institutional-owners |
| 9 | Orion / Envestnet Tamarac | Rebalanceamento por bandas de tolerância | INF | https://www.appsruntheworld.com/customers-database/category/portfolio-and-investment-management |
| 10 | Addepar | Agregação e rendimentos (dividendos/cupões) | INF | — |

## 3. Requisitos (CodeForge)
- **REQ-PM-001 Visão geral**: valor total animado, variação do dia, rendimento acumulado (TWR) vs referência, P&L não realizado, liquidez, gráfico de desempenho por período (1M/3M/6M/1A), alocação por classe.
- **REQ-PM-002 Posições**: tabela com quantidade, custo médio, preço, valor, peso, P&L, mini-gráfico; ações Comprar/Vender por linha.
- **REQ-PM-003 Ordens + compliance pré-negociação**: boletim de ordem com verificações (liquidez suficiente, peso máximo 15%, lista restrita, quantidade ≤ detida); ordem bloqueada explica porquê; ordens executadas atualizam posições e liquidez; livro de ordens.
- **REQ-PM-004 Alocação e rebalanceamento**: pesos-alvo editáveis, desvio vs alvo, banda de tolerância; gera plano de ordens (vendas primeiro), mostra custo e efeito; executar aplica o plano.
- **REQ-PM-005 Risco**: volatilidade anualizada, beta, drawdown máximo, VaR 95% 1 dia (histórico), Sharpe, concentração (top 5, HHI), contribuição para o risco por posição, gráfico de drawdown.
- **REQ-PM-006 Cenários de stress**: choques pré-definidos e personalizados; impacto total e por posição.
- **REQ-PM-007 Atribuição Brinson-Fachler** por classe: efeito alocação, seleção e interação; soma = excesso.
- **REQ-PM-008 Rendimentos**: dividendos e cupões previstos 12 meses, yield da carteira.
- **REQ-PM-009 Design**: componentes Number Ticker, Spotlight Card e Bento (padrões 21st.dev reimplementados), vidro Aurora, ≥11px.
- **REQ-PM-010** WCAG 2.1 AA, teclado, sem overflow a 390px, sem erros JS, persistência local.
- **Fora do âmbito**: dados de mercado em tempo real, execução real, custódia, aconselhamento. Tudo é simulação.

## 4. Fórmulas (src/lib/portfolio/pm.ts)
- Retorno diário `r_t = V_t / V_{t-1} − 1`; TWR = Π(1+r_t) − 1.
- Volatilidade anual = desvio-padrão(r) × √252. Sharpe = (média(r)×252 − rf) ÷ vol, rf = 4%.
- Beta = cov(r_p, r_b) ÷ var(r_b). Drawdown_t = V_t ÷ max(V_≤t) − 1.
- VaR 95% 1 dia = −percentil 5% de r × valor atual.
- Contribuição para o risco_i = w_i × cov(r_i, r_p) ÷ var(r_p) (soma = 100%).
- HHI = Σ w_i². Desvio = peso atual − peso-alvo; fora da banda quando |desvio| > tolerância.
- Brinson-Fachler: alocação = (w_p − w_b)(R_b,i − R_b); seleção = w_b (R_p,i − R_b,i); interação = (w_p − w_b)(R_p,i − R_b,i).
- Stress: impacto_i = valor_i × Σ (choque_fator × exposição_i,fator).

## 5. Design
Spatial glass Aurora: vidro escuro, um acento, `tabular-nums`, escala 11·12·13·15·22·30. Bento para a visão geral,
Spotlight Card nos indicadores, Number Ticker no valor total (respeita `prefers-reduced-motion`). Um só `Button`.

## 6. Verificação
Testes das regras, E2E de cada ação, axe nas 8 vistas, telemóvel, regressão das outras páginas, registo CodeForge G1–G10.
