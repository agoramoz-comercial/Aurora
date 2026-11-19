# Prompt mestre — Cartões com qualidade «Alerta» e gráficos circulares 3D

> CodeForge 3000 (requisitos, contratos, testes, G1–G10) · REA (evidência medida no código) · ECC (sem segredos).
> Regra de entrega: **capturas para aprovação antes de publicar** em aurora-weld-one.vercel.app.

## 1. Pergunta ao modelo (orquestração)
Antes de cada passo, o agente responde por escrito:
1. **Onde muda?** Na origem (utilitário `.glass`, `Panel`, `MetricCard`, `GlassCard`), nunca em 76 ficheiros soltos.
2. **Como provo?** Captura antes/depois das mesmas vistas + axe + texto ≥11px + testes E2E existentes.
3. **O que não posso partir?** Contraste AA, alvos de toque, regras de movimento (≤300ms), dados.
4. **Custo:** uma passagem de edição, uma construção, uma ronda de capturas. Sem ciclos repetidos.

## 2. Evidência (REA · VER no código)
Cartão de alerta (`portfolio/tabs/AlertsTab.tsx`, `AlertCard`):
| Propriedade | Valor medido |
|---|---|
| Fundo | tinta da severidade a 8% (`rgba(255,77,79,0.08)`) |
| Borda | 1px, a mesma cor a 20% |
| Raio · margem | 12px (`rounded-xl`) · 12px (`p-3`) |
| Título | 12px, **bold**, branco |
| Texto | 11px, branco a 70%, `leading-relaxed` |
| Etiquetas | 11px, bold, MAIÚSCULAS, `tracking-wider` |
| Hover | `bg-white/5` |

## 3. Requisitos
- **REQ-CARD-001** Todos os cartões do sistema com a qualidade do alerta: fundo com tinta neutra, borda nítida de 1px, raio 14px, realce interior no topo, hover subtil.
- **REQ-CARD-002** Tipografia do alerta nos cartões: título 12px bold; texto 11px a 70% com entrelinha folgada; etiquetas 11px bold maiúsculas com espaçamento.
- **REQ-PIE-001** Apenas os gráficos circulares passam a 3D: anel com espessura, paredes laterais sombreadas, brilho especular, vetorial (nítido a 4K e acima), legenda em texto acessível.
- **REQ-SAFE-001** Sem regressões: axe WCAG 2.2 AA 0, texto ≥11px, transições ≤300ms, testes E2E verdes.
- **REQ-GATE-001** Nada vai para produção sem aprovação das capturas.

## 4. Decisões
- O vidro continua por baixo (legibilidade sobre a fotografia); a tinta e a borda do alerta vão por cima, em neutro. A cor semântica fica para estados (crítico, aviso, sucesso), como no alerta.
- 3D desenhado em SVG (sem WebGL): leve, nítido em qualquer densidade, sem dependências novas.
