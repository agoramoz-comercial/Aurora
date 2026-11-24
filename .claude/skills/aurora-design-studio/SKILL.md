---
name: aurora-design-studio
description: Estúdio de design orquestrado por agentes para criar ou refazer aplicações móveis, websites, plataformas, sistemas empresariais com IA e identidades visuais. Usa a linguagem «Cockpit Aurora» (clareza Apple × imersão PlayStation × instrumentação Mercedes-Benz MBUX). Ativar quando o utilizador pedir para redesenhar, criar design, design system, wireframes, protótipo, especificação de interface, backlog de UI ou apresentação de design — mesmo que só dê uma ideia curta.
---

# Aurora Design Studio · Skill de orquestração

## 0. Configuração (respostas ao questionário)
| # | Pergunta | Resposta adotada |
|---|---|---|
| 1 | Objeto principal | **Todos**: apps móveis, websites e plataformas, sistemas empresariais com IA, identidades visuais |
| 2 | Entrada esperada | **Todas**: ideia curta, briefing estruturado, documentos/ficheiros, imagens/referências |
| 3 | Saída principal | **Todas**: especificação escrita, prompts para agentes, wireframes e instruções de interface, arquitetura técnica e backlog, apresentação |
| 4 | Ferramentas | **GitHub** (código, PR), **Figma** (quando ligado), Vercel (pré-visualização/produção). Microsoft 365, Azure e Power Platform: opcionais, só se o conector estiver ligado |
| 5 | Autonomia | **Preparar implementação completa, sujeita a aprovação humana** (gates G1–G4) |
| 6 | Idioma | **Português** (pt-PT); termos técnicos e nomes de código em inglês |

Para mudar uma resposta, edite esta tabela; os agentes leem-na antes de cada missão.

## 1. Linguagem visual «Cockpit Aurora»
Fonte única: `docs/design/PLANO-REDESIGN-COCKPIT.md` §2 (não duplicar aqui).
Resumo: **Apple** = clareza, materiais de vidro, hierarquia tipográfica, movimento com mola; **PlayStation** = palco cinematográfico, carris de cartões com foco ampliado e brilho, navegação total por teclado/comando; **Mercedes-Benz MBUX** = «zero layer» (o essencial à primeira vista), instrumentos (mostradores, agulhas), luz ambiente por modo, hairlines de precisão.
Inspiração em princípios, nunca cópia: sem logótipos, marcas, ícones, sons ou ecrãs reproduzidos dessas empresas.

## 2. Grafo de agentes (pipeline determinístico)
```
briefing ─▶ diretor-criativo ─▶ arquiteto-design-system ─▶ designer-ux-ui ─┬▶ motion-dataviz ─┐
                                                                         └▶ arquiteto-tecnico ┤
                                         engenheiro-frontend ◀────────────────────────────────┘
                                                  │
                                           qa-guardiao ─▶ comunicador ─▶ (G4) publicação
```
O `orquestrador-design` dirige o grafo, mantém o estado e aplica os gates.

| Agente | Ficheiro | Entrega |
|---|---|---|
| Orquestrador | `.claude/agents/orquestrador-design.md` | plano, estado, decisões, gates |
| Analista de briefing | `.claude/agents/analista-briefing.md` | brief normalizado (JSON) |
| Diretor criativo (Designer) | `.claude/agents/diretor-criativo.md` | conceito, moodboard em texto, princípios |
| Arquiteto do design system | `.claude/agents/arquiteto-design-system.md` | tokens, componentes, regras |
| Designer UX/UI | `.claude/agents/designer-ux-ui.md` | fluxos, wireframes, specs de ecrã |
| Motion & data-viz | `.claude/agents/motion-dataviz.md` | coreografia, mostradores, gráficos |
| Arquiteto técnico | `.claude/agents/arquiteto-tecnico.md` | arquitetura, backlog, estimativas |
| Engenheiro front-end | `.claude/agents/engenheiro-frontend.md` | código, testes, pré-visualização |
| QA guardião | `.claude/agents/qa-guardiao.md` | relatório de qualidade e acessibilidade |
| Comunicador | `.claude/agents/comunicador.md` | apresentação e resumo executivo |

## 3. Contrato de passagem (handoff) — obrigatório entre agentes
```json
{ "missao": "string", "fase": "F0..F7", "agente": "string",
  "entradas": ["ref:ficheiro#seccao"], "decisoes": [{"id":"D-001","texto":"","porque":""}],
  "artefactos": [{"tipo":"spec|tokens|wireframe|codigo|teste|deck","caminho":""}],
  "riscos": [""], "perguntas_bloqueantes": [""], "proximo": "agente", "estado": "ok|bloqueado" }
```
Referências simbólicas (`src:`, `doc:`) em vez de colar conteúdo. Cada agente lê só os chunks de que precisa.

## 4. Gates de aprovação humana
- **G1 Conceito** — direção criativa + 2 capturas-conceito (antes de tocar em tokens).
- **G2 Sistema** — tokens e componentes num ecrã de referência (capturas).
- **G3 Ecrãs** — cada área redesenhada mostrada em capturas *antes* de publicar.
- **G4 Publicação** — QA verde + aprovação explícita → produção.
Sem aprovação, nada sai do ramo de trabalho. Mudanças pedidas reabrem só o passo afetado.

## 5. Barreiras de qualidade (não negociáveis)
WCAG 2.2 AA com axe = 0 violações · texto ≥ 11px · alvos de toque ≥ 24px (44px em móvel) · navegação completa por teclado com foco visível · `prefers-reduced-motion` respeitado · transições de UI ≤ 300ms (exceto entradas de palco ≤ 600ms) · nada de `transition-all` · dados nunca inventados em ecrãs de produção · desempenho: LCP < 2,5s, CLS < 0,1, bundle inicial sem crescer > 10%.

## 6. Economia de tokens
1 passagem por fase; editar na origem (tokens, primitivas) antes de ficheiros soltos; scripts idempotentes para mudanças em massa; capturas só nas vistas do gate; testes E2E existentes reutilizados; nunca reler ficheiros já em contexto.

## 7. Saídas por tipo de objeto
| Objeto | Saídas mínimas |
|---|---|
| App móvel | fluxos, ecrãs 390×844, gestos, estados offline, tokens nativos |
| Website/plataforma | mapa do site, layouts responsivos (390/768/1280/1440), SEO, performance |
| Sistema empresarial com IA | papéis e permissões, fluxos de aprovação, explicabilidade das respostas da IA, auditoria |
| Identidade visual | conceito, logótipo (vetor), paleta, tipografia, grelha, aplicações, manual |
