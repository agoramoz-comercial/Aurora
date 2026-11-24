# Plano de implementação — Redesign «Cockpit Aurora» (v3)

> Clareza **Apple** × imersão **PlayStation** × instrumentação **Mercedes-Benz MBUX**.
> Executado pelos agentes da Skill `aurora-design-studio`, com aprovação humana em cada gate.
> Estado: **aguarda aprovação do plano** (antes de qualquer alteração visual).

## 1. Objetivo e resultados
Refazer o design de toda a Aurora com uma linguagem única, premium e avançada, sem perder funcionalidades nem dados.

| Resultado | Medida | Alvo |
|---|---|---|
| Informação essencial à primeira vista | KPIs críticos visíveis sem scroll a 1280×800 | 100% das áreas |
| Coerência | Ecrãs a usar só tokens v3 | 100% |
| Acessibilidade | axe WCAG 2.2 AA | 0 violações |
| Navegação | Tudo operável por teclado (setas/Enter/Esc) | 100% |
| Desempenho | LCP · CLS · bundle inicial | < 2,5s · < 0,1 · ≤ +10% |
| Regressões | Testes E2E existentes (Finanças 51, Chat 26, PM 17, Notícias) | todos verdes |

## 2. Linguagem visual (fonte única)
### 2.1 Princípios
1. **Zero layer** (MBUX): o que importa agora está no primeiro ecrã de cada área.
2. **Palco** (PlayStation): cada área tem uma atmosfera de fundo própria que muda suavemente.
3. **Foco** (PlayStation): o elemento ativo cresce, brilha e revela detalhe; o resto recua.
4. **Instrumentos** (MBUX): limites e metas mostram-se em mostradores com agulha, não só em números.
5. **Luz ambiente** (MBUX): um acento de cor por modo banha bordas, brilhos e agulhas.
6. **Clareza material** (Apple): vidro com 3 espessuras, tipografia hierárquica, movimento físico.

### 2.2 Modos de luz ambiente (como modos de condução)
| Modo | Uso | Acento | Brilho |
|---|---|---|---|
| Conservador | perfil de risco baixo / leitura | Azul glaciar `#6CB8FF` | suave |
| Equilibrado (padrão) | uso geral | Ciano aurora `#38E1D6` | médio |
| Dinâmico | trading / alertas | Âmbar `#FFB547` | intenso |
O modo escolhe-se em Definições e no ModeSwitch da barra superior; muda só tokens (`--ambient-*`).

### 2.3 Tipografia
Inter Display/Inter com números tabulares. Escala: Hero 34/40 · Título 22/28 · Secção 15/20 · Corpo 13/20 · Legenda 11/16. Mostradores: 28–40 semibold tabular.

### 2.4 Materiais e forma
Fundo base `#07090E` → palco por área (imagem livre de direitos ou gradiente) com véu 70–85%.
Vidro: fino (blur 16, 4% branco), regular (blur 28, 6%), espesso (blur 40, 9%) + realce superior 1px.
Raios 10/14/20/28 · hairlines 1px a 8–12% · sombras 3 níveis · grelha 8pt.

### 2.5 Movimento
Micro 120ms · componente 200ms · vista 300ms · palco ≤ 600ms; só transform/opacity; springs 260–320/26–32; `prefers-reduced-motion` desliga palco e agulhas.

## 3. Arquitetura da mudança
- **Tokens v3** em `src/styles.css` sob `[data-design="v3"]`; aliases mantêm v2 a funcionar.
- **Novos componentes** em `src/components/aurora/cockpit/`: `Stage`, `Rail`, `FocusCard`, `Gauge`, `KpiCluster`, `ModeSwitch`, `CommandBar`, `GlassPanel`.
- **Shell**: barra lateral → carril de áreas com foco estilo consola (ícone + nome ao focar); barra superior com ModeSwitch, pesquisa ⌘K e estado; dock inferior mantido mas reduzido.
- **Migração por área** atrás de `data-design`; cada área passa a v3 isoladamente e pode voltar atrás.

## 4. Fases, agentes e gates
| Fase | Agente(s) | Entrega | Gate |
|---|---|---|---|
| F0 Auditoria | analista-briefing, qa-guardiao | inventário de áreas, componentes, linha de base (capturas, axe, desempenho) | — |
| F1 Conceito | diretor-criativo | `conceito.md` + 2 capturas-conceito (Notícias e Portfolio Management) | **G1** |
| F2 Sistema | arquiteto-design-system, motion-dataviz | tokens v3, 3 modos de luz, Gauge, FocusCard, Rail, Stage | **G2** (ecrã de referência) |
| F3 Shell | designer-ux-ui, engenheiro-frontend | carril de áreas, barra superior, palco, ⌘K, teclado | **G3a** |
| F4 Áreas — vaga 1 | idem | Notícias, Finanças Pessoais, Portfolio Management, Analytics | **G3b** |
| F5 Áreas — vaga 2 | idem | Corretoras, Benchmark, Plano de Negócios, Modelo Financeiro, Aurora Chat, Marketplace, Definições | **G3c** |
| F6 Qualidade | qa-guardiao | relatório completo, correções | — |
| F7 Publicação | orquestrador-design, comunicador | produção + apresentação antes/depois | **G4** |

## 5. O que muda em cada área (resumo)
| Área | Zero layer | Instrumentos / foco |
|---|---|---|
| Notícias | manchete em palco cinematográfico + carril de notícias | foco amplia cartão e revela impacto |
| Finanças Pessoais | saldo, pode gastar hoje, alertas de custo | mostradores de orçamento e reserva |
| Portfolio Management | AUM, retorno, risco, alertas | mostrador de risco (VaR vs limite), carril de ativos |
| Analytics | preço, variação, RSI | gráfico em palco + ecrã inteiro |
| Corretoras | património total, P&L do dia | carril de corretoras com foco |
| Benchmark | probabilidade da meta, desvio | mostradores de meta e tolerância |
| Plano de Negócios / Modelo | KPIs do caso | cluster de mostradores |
| Aurora Chat / Marketplace / Definições | conteúdo principal | carris e foco; ModeSwitch em Definições |

## 6. Riscos e mitigação
| Risco | Mitigação |
|---|---|
| Regressão funcional | migração por área + E2E em cada gate |
| Excesso visual (brilho, blur) prejudica leitura | véus de contraste, limites de brilho por modo, axe |
| Desempenho com blur e imagens | 3 espessuras de vidro, imagens lazy e dimensionadas, palco desligável |
| Inspiração confundida com cópia | só princípios; sem marcas, ícones ou ecrãs reproduzidos |

## 7. Custo e cadência
Uma passagem por fase; capturas só nas vistas do gate; scripts idempotentes para mudanças em massa. Estimativa: F1–F3 numa sessão, F4 e F5 uma sessão cada, F6–F7 meia sessão.

## 8. Decisão pedida
Aprovar este plano para iniciar **F0 + F1** (auditoria e duas capturas-conceito). Nada é publicado antes do G4.
