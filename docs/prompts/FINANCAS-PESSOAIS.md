# Prompt mestre — Finanças Pessoais (Ollympius · Aurora)

> Método: CodeForge (requisitos com ID, contrato por elemento interativo, testes ligados, barreiras G1–G10),
> REA (cada padrão de produto marcado VER com fonte ou INF), ECC (redação de segredos, sem dados reais).

## 1. Papel e equipa
Atua como equipa sénior: **Produto financeiro** (métodos), **Design de sistema** (tokens, tipografia, botões),
**Engenharia front-end** (React 19 + TS estrito + Tailwind 4), **QA/Acessibilidade** (Playwright + axe, WCAG 2.1 AA).

## 2. Missão
Página «Finanças Pessoais» dentro do dashboard Ollympius: prática, em meticais (MZN), que responde a 5 perguntas
em menos de 10 segundos: *Quanto posso gastar hoje? Para onde vai o dinheiro? Quanto valho? Quando fico sem dívidas?
Quantos meses aguento sem rendimento?*

## 3. Evidência (REA)
| Padrão | Origem | REA | Fonte |
|---|---|---|---|
| Orçamento base zero: cada metical tem uma função | YNAB | VER | https://www.ynab.com/ynab-method |
| Despesas não mensais poupadas todos os meses antes de abater dívida | YNAB | VER | https://www.ynab.com/blog/how-much-of-my-paycheck-should-i-save |
| Fundo de perda de rendimento = 3–6 meses de despesas essenciais | YNAB, Fidelity | VER | https://www.fidelity.com/learning-center/personal-finance/avalanche-snowball-debt |
| Avalanche (maior juro) poupa mais juros; bola de neve (menor saldo) dá vitórias rápidas | Fidelity | VER | idem |
| Grupos Fixas / Flexíveis / Não mensais (flex budgeting) | Monarch | VER | https://www.nerdwallet.com/finance/learn/best-budget-apps |
| Rastreio de subscrições e despesas recorrentes | Copilot, Rocket Money | VER | https://www.forbes.com/advisor/banking/best-budgeting-apps/ |
| Património líquido e projeção | Monarch, Empower | VER | https://useorigin.com/resources/blog/the-best-personal-finance-apps-in-2026 |
| «Seguro para gastar hoje» = disponível flexível ÷ dias restantes | Copilot (padrão de UI) | INF | — |

## 4. Requisitos (CodeForge)
- **REQ-FIN-001** Visão geral: património líquido, fluxo do mês, pronto para atribuir, seguro para gastar hoje, taxa de poupança, meses de reserva. *Aceitação:* 6 indicadores com valor e explicação.
- **REQ-FIN-002** Orçamento base zero por grupos; atribuir e mover dinheiro; alerta de excesso. *Aceitação:* atribuir reduz «Pronto para atribuir»; mover entre categorias mantém o total; categoria negativa mostra alerta e ação «Cobrir».
- **REQ-FIN-003** Transações: pesquisar, filtrar, adicionar, recategorizar; regra «sempre categorizar». *Aceitação:* nova despesa atualiza orçamento e fluxo; regra aplica-se a transações futuras e existentes.
- **REQ-FIN-004** Recorrentes detetadas automaticamente com custo anual e próxima data; marcar para cancelar. *Aceitação:* ≥2 ocorrências com intervalo 25–35 dias = mensal.
- **REQ-FIN-005** Plano de dívidas avalanche vs bola de neve com pagamento extra. *Aceitação:* meses até zero, juros totais, ordem e diferença entre métodos.
- **REQ-FIN-006** Objetivos com data: mensal necessário, progresso, projeção; reserva de emergência calculada. *Aceitação:* contribuir atualiza progresso; data impossível avisa.
- **REQ-FIN-007** Previsão 12 meses com cenário (variação de rendimento, poupança extra). *Aceitação:* gráfico muda com os controlos.
- **REQ-FIN-008** Sistema de design: escala tipográfica única (mín. 11px), componente `Button` partilhado (primário/secundário/fantasma/perigo, 36–40px), números tabulares.
- **REQ-FIN-009** WCAG 2.1 AA, teclado, sem overflow a 390px, sem erros JS.
- **Fora do âmbito:** ligação bancária real, impostos, conselhos de investimento (requer servidor e regulação).

## 5. Regras de negócio (funções puras em `src/lib/finance/personal.ts`)
- `readyToAssign = saldo de contas de caixa − Σ atribuído no mês` (nunca esconder negativo).
- `available(cat) = atribuído − gasto` ; excesso quando `< 0`.
- `safeToSpendToday = Σ disponível das Flexíveis ÷ dias restantes do mês` (mín. 0).
- `savingsRate = (rendimento − despesas) ÷ rendimento`.
- `runwayMonths = reserva líquida ÷ despesas essenciais mensais (Fixas)`.
- Dívidas: juro mensal = taxa anual ÷ 12; mínimos em todas; extra + mínimos libertados vão para a 1.ª da ordem.
- Objetivo: `mensal = (alvo − atual) ÷ meses até à data` ; data passada ⇒ aviso.
- Recorrência: mesmo comerciante, ≥2 ocorrências, intervalo médio 25–35 dias ⇒ mensal; 350–380 ⇒ anual.

## 6. Design
Mesmo vidro escuro, um acento (`--aurora-accent`), números `tabular-nums`, escala: 11 · 12 · 13 · 15 · 22 · 30px.
Botões: um só componente. Nada de botão sem ação (auditoria `flow_audit.py`).

## 7. Saída e verificação
Página + store + regras + testes de regras + E2E + axe. Registo CodeForge com G1–G10. Relatório honesto do que não foi feito.
