# Aurora — Ollympius Dashboard

Plataforma de inteligência financeira institucional. Reúne numa só superfície o fluxo de notícias com leitura de impacto sobre carteira, a consolidação de contas em várias corretoras, análise técnica com gráficos TradingView, modelação financeira sistémica com demonstrações 3-way auditáveis, valuation por DCF com análise de sensibilidade, plano de negócios e um marketplace de ativos.

Construída como aplicação cliente, sem backend: todos os modelos correm no browser a partir de drivers explícitos, o que torna cada número rastreável até à sua premissa.

---

## Secções

| Secção | O que faz |
|---|---|
| **Notícias** | Fluxo de duas camadas — primárias (ativos em carteira, impacto directo) e secundárias (regime e macro). Cada notícia traz score de impacto, banda de confiança, horizonte e camadas de evidência. |
| **Ollympius Dashboard** | Visão geral de performance: tendência de receita, volume semanal, metas, equipa e KPIs. |
| **Analytics** | Análise por instrumento: velas com volume, SMA20/50 e painel RSI sincronizado (TradingView Lightweight Charts), intervalos, score de risco, watchlist e motor de alertas. |
| **Corretoras** | Ligação de contas em 12 corretoras (modo demonstração), património e P&L consolidados, curva de património, alocação por corretora ou classe e posições num só quadro. |
| **Benchmark & Projeções** | Mesa de modelação institucional. Motor de cenários Bear/Base/Bull, demonstrações 3-way, DCF com mapa de sensibilidade e ponte de valor. |
| **Plano de Negócios** | Economia unitária, TAM/SAM/SOM, break-even, McKinsey 7S, risco KPMG e roadmap de capital. |
| **Modelo Financeiro & DCF Hub** | Pipeline operacional de 38 folhas sobre 6 emitentes tecnológicos, com rationale de analista por grupo. |
| **Marketplace** | Listagens de ativos, pedidos e fluxo de venda. |
| **Definições** | Reduzir movimento, atalhos e reposição dos dados guardados localmente por cada módulo. |

Em qualquer ecrã, **Ctrl/⌘ + K** abre a paleta de comandos: saltar para uma secção ou adicionar uma corretora.

---

## Benchmark & Projeções

A secção mais densa da aplicação. Nove folhas dispersas foram consolidadas em seis fases analíticas, pela ordem em que um analista lê um modelo: **drivers → margens → capital → demonstrações → valor**.

- **Motor de cenários.** Bear / Base / Bull re-correm o modelo sistémico completo. A faixa de KPIs, os gráficos, as demonstrações e o DCF descrevem sempre o mesmo mundo — não há números de cenários diferentes no mesmo ecrã.
- **Demonstrações 3-way.** Demonstração de resultados, balanço e fluxos de caixa, derivados dos mesmos drivers. O balanço é verificado a cada ano e o selo no cabeçalho reflete essa verificação em tempo real.
- **DCF com duas metodologias.** Gordon Growth e Exit Multiple. O preço-alvo apresentado é o ponto médio das duas (prática de *football field*), com ambas visíveis no rodapé do KPI.
- **Mapa de sensibilidade 5×5.** WACC × crescimento perpétuo, com o upside de cada célula face a um preço de mercado editável no cabeçalho.

> O preço de mercado é uma **referência editável**, não uma cotação em tempo real. O upside resultante é o que estes drivers suportam — pode ser negativo, e isso é um output legítimo do modelo.

---

## Corretoras

Assistente de três passos para ligar uma conta: escolher a corretora (Interactive Brokers, Saxo, XTB, Trading 212, eToro, DEGIRO, Charles Schwab, Fidelity, Alpaca, Binance, Coinbase, Kraken), escolher o método de ligação (API só de leitura, OAuth ou extrato CSV) e sincronizar.

- **Modo demonstração.** Nenhuma credencial é pedida nem enviada. As posições de cada conta são geradas de forma determinística a partir do identificador da ligação, por isso a mesma conta mostra sempre as mesmas posições, e só a variação do dia muda.
- **Consolidação.** Património, P&L aberto, variação do dia, curva de 180 dias, alocação e tabela de posições somam todas as contas ligadas.
- **Persistência.** As ligações ficam em `localStorage` (`aurora-brokers-v1`) e podem ser repostas em *Definições*.

O catálogo vive em [`src/data/brokers.ts`](src/data/brokers.ts) e o estado em [`src/data/brokerStore.tsx`](src/data/brokerStore.tsx). Uma integração real substitui `buildSnapshot` por um adaptador por corretora, servido por uma função serverless que guarda as chaves no servidor.

---

## Sistema de design

Toda a aplicação assenta numa linguagem visual única — *Ollympius* — para que nenhuma secção pareça vinda de outro produto:

- Superfícies de vidro (`glass`, `glass-soft`, `glass-pill`) com desfoque e raios consistentes
- Cabeçalhos em pill, um único azul de acento (`--aurora-accent`), numerais tabulares em todos os valores
- Primitivas partilhadas em [`src/components/aurora/primitives.tsx`](src/components/aurora/primitives.tsx): `WorkspaceHeader`, `StatTile`, `SegmentedTabs`, `TickerChips`, `SectionLabel`, `Panel`
- Vocabulário único de gráficos em [`src/components/aurora/chartTheme.ts`](src/components/aurora/chartTheme.ts): paleta, eixos, tooltips (`GlassTooltip`) e legendas
- Gráficos de preço em [`src/components/aurora/charts/TvChart.tsx`](src/components/aurora/charts/TvChart.tsx): um wrapper de TradingView Lightweight Charts para velas, áreas, linhas, volume e osciladores em painel próprio

Ao criar uma secção nova, componha o cromado a partir destas primitivas em vez de reescrever superfícies.

---

## Stack

React 19 · TypeScript · Vite 8 · TanStack Router · Tailwind CSS 4 · Framer Motion · Recharts · TradingView Lightweight Charts · Radix UI · cmdk

---

## Executar localmente

Requer Node.js 22.12 ou superior.

```bash
npm install
```

```bash
npm run dev
```

A aplicação fica em `http://localhost:5173`. Para expor na rede local (telemóvel, outra máquina), use `npm run dev -- --host`.

### Outros comandos

```bash
npm run build
```

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

### Deploy

O projeto está preparado para o Vercel: [`vercel.json`](vercel.json) fixa o build do Vite, a saída em `dist`, o rewrite de SPA e a cache imutável dos assets com hash. O [`.vercelignore`](.vercelignore) deixa de fora as folhas de cálculo de origem.

---

## Estrutura

```
src/
├── components/aurora/
│   ├── primitives.tsx       Primitivas do sistema de design
│   ├── chartTheme.ts        Paleta e configuração de gráficos
│   ├── DashboardShell.tsx   Shell, navegação e routing entre secções
│   ├── benchmark/           Mesa de modelação e valuation
│   ├── businessPlan/        Plano de negócios
│   ├── teslaModel/          Pipeline de 38 folhas e DCF hub
│   ├── home/                Fluxo de notícias
│   ├── analytics/           Análise por instrumento
│   ├── brokers/             Corretoras: workspace, assistente e detalhe
│   ├── charts/              TvChart (TradingView) e GlassTooltip (Recharts)
│   ├── settings/            Definições
│   └── marketplace/         Listagens e fluxo de venda
├── lib/finance/             Motores de modelação (puros, testáveis)
└── data/                    Datasets e drivers
```

Os motores em `lib/finance/` são funções puras: recebem drivers e devolvem projeções. Não tocam no DOM nem em estado de React, pelo que podem ser corridos isoladamente — por exemplo com `npx tsx` — para validar um modelo sem abrir a aplicação.

---

## Dados

Os drivers de cada emitente vivem em [`src/lib/finance/stockBenchmarkData.ts`](src/lib/finance/stockBenchmarkData.ts). O balanço de abertura é normalizado no carregamento: o capital próprio é derivado como *plug* (ativo menos passivo) em vez de depender do valor introduzido à mão, garantindo que as demonstrações fecham em todos os emitentes.

Os datasets incluídos são ilustrativos e destinam-se a demonstrar o motor. Não constituem recomendação de investimento.

---

## Licença

MIT © 2026 AGORAMOZ. Ver [LICENSE](LICENSE).
