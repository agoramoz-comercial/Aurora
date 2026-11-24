# Plano de implantação · Plataforma de Operadores, Indicadores e Planos de Negócio

> Pedido: Salomão Júnior (11/06) · Método: ZABATAINA 3000 com **Prompt Engineer** (prompts com contrato e testes) e **Loop Engineer** (ciclos construir → medir → corrigir com critério de saída).
> Estado: **plano**, nada construído. Cada fase só avança com aprovação humana no fim da fase anterior.
> Base existente: a Aurora já tem Marketplace, Plano de Negócios, Analytics (gráficos de velas) e Finanças. O plano reaproveita-os em vez de começar do zero.

---

## 1. Resumo executivo
O pedido junta **quatro produtos** numa plataforma:

| # | Produto | O que faz | Valor para o cliente |
|---|---|---|---|
| A | **Score de Operadores** | importa o histórico do trader (ficheiro ou API), calcula rentabilidade, consistência e risco e dá uma nota em segundos | prova pública e verificável da qualidade de um trader |
| B | **Estúdio e Marketplace de Indicadores** | o utilizador descreve um indicador em português, o sistema cria-o, testa-o no passado e permite vendê-lo | criar indicadores sem programar e ganhar com isso |
| C | **Gerador de Planos de Negócio** | formulário + conversa → relatório completo (Word), pitch (PDF) e modelo financeiro (Excel) com fontes | plano profissional em horas, não semanas |
| D | **Ranking e Contratos com Investidores** | ranking dos traders aprovados, perfil, ligação a investidores por contrato digital, copy trading supervisionado e, no fim, tokenização | o trader passa a ter capital de terceiros; o investidor escolhe com dados |

**Recomendação:** construir na ordem **A → B → C → D**. A e B geram valor e dados sem exigir licenças financeiras; D (contratos, copy trading, tokens) só depois de parecer jurídico e licença, porque mexe com dinheiro de terceiros.

---

## 2. Red Team — o que pode correr mal (ler antes de investir)
| Risco | Porque importa | Decisão proposta |
|---|---|---|
| **Tokens de traders = valores mobiliários** | um token cujo valor depende do desempenho de alguém é, na maioria dos países, um instrumento financeiro regulado (em Moçambique: Banco de Moçambique e Bolsa de Valores de Moçambique; na UE: MiCA/MiFID; nos EUA: SEC) | **Fase 6 bloqueada** até parecer jurídico por país e, se necessário, licença ou parceiro licenciado |
| **Copy trading automático com dinheiro de terceiros** | é gestão de carteiras/aconselhamento; exige licença e regras de proteção do investidor | começar com **sinais** (o investidor confirma cada ordem); automático só com licença ou via corretora parceira licenciada |
| **Biometria (batimento cardíaco, stress)** | dado pessoal sensível (RGPD e lei moçambicana de proteção de dados); pouca evidência científica de que melhora a previsão de desempenho | **opcional, com consentimento explícito**, fora da nota oficial até haver estudo que prove utilidade |
| **«Score em segundos» com dados enviados pelo próprio trader** | ficheiros podem ser manipulados | dois níveis de selo: *Declarado* (ficheiro) e *Verificado* (ligação API só de leitura à corretora) |
| **Patente internacional (PCT) do conceito** | ideias e métodos de negócio em software raramente são patenteáveis tal como estão | proteger por **marca + direitos de autor + segredo comercial**; patente só para uma invenção técnica concreta, avaliada por agente de patentes |
| **Indicadores gerados por IA com erros** | um cálculo errado vendido no marketplace causa perdas e reclamações | linguagem de fórmulas fechada (sem código livre), testes automáticos e backtest obrigatório antes de publicar |
| **Promessas de rentabilidade** | publicidade enganosa | aviso padrão: «desempenho passado não garante resultados futuros» em todo o lado onde aparecem retornos |

---

## 3. Roteiro por fases (estimativas, a confirmar com a equipa)
| Fase | Duração estimada | Entregas | Porta de saída (gate) |
|---|---|---|---|
| **F0 · Validação e jurídico** | 3–4 semanas | entrevistas a 20 traders e 10 investidores; parecer jurídico (tokens, copy trading, dados); escolha de país-piloto | parecer escrito + 60% dos traders entrevistados dispostos a ligar a conta |
| **F1 · Score de Operadores (MVP)** | 6–8 semanas | importação CSV/Excel + MetaTrader 5 + Binance (só leitura); nota com explicação; perfil público | nota calculada em ≤ 10 s; reprodutível; 50 traders reais no piloto |
| **F2 · Estúdio de Indicadores** | 6–8 semanas | prompt → fórmula → gráfico → backtest → guardar com título, descrição, tags e parâmetros | 95% dos 200 pedidos de teste geram fórmula correta (§6) |
| **F3 · Marketplace e comunidade** | 4–6 semanas | publicar, comprar, aplicar; avaliações, ranking de criadores, pontos e níveis; comissões | 1.ª venda real; zero indicadores publicados sem backtest |
| **F4 · Gerador de Planos de Negócio** | 6–8 semanas | formulário (pequeno comerciante / grande empresa), conversa de correção, Word + PDF + Excel, fontes citadas | 10 planos revistos por um consultor com nota ≥ 3/4 |
| **F5 · Ranking e contratos (piloto)** | 6–8 semanas | painel de ranking, perfis, contratos digitais em **rede de teste** (testnet), sinais com confirmação do investidor | auditoria do contrato inteligente + aprovação jurídica |
| **F6 · Copy trading e tokenização** | após licença | execução automática com limites, distribuição de lucros, tokens | licença ou parceiro licenciado; auditoria externa |

Caminho crítico: F0 → F1 → (F2 ‖ F4) → F3 → F5 → F6. F2 e F4 podem correr em paralelo com equipas distintas.

---

## 4. Especificação funcional por produto

### A · Score de Operadores
**Entrada:** ficheiro CSV/Excel do histórico ou ligação só de leitura a MetaTrader 5, Binance, Interactive Brokers, eToro, Coinbase (confirmar acesso e termos de cada API na F0).
**Normalização:** todas as operações para um formato único (data, ativo, lado, quantidade, preço de entrada/saída, comissões, moeda), conversão cambial diária.
**Nota final (0–100)**, transparente e explicada ao trader:
| Componente | Peso | Medidas |
|---|---|---|
| Rentabilidade ajustada ao risco | 30% | Sharpe, Sortino, retorno anualizado |
| Consistência | 25% | % de meses positivos, estabilidade da curva, nº de operações |
| Controlo de risco | 25% | drawdown máximo, VaR, alavancagem média, uso de stop-loss |
| Disciplina | 10% | excesso de operações, perdas após perdas |
| Verificação e histórico | 10% | selo Verificado/Declarado, meses de histórico (mín. 6) |
Biometria: módulo opcional à parte («Perfil emocional»), nunca obrigatório.
**Saída:** nota, gráfico de evolução, pontos fortes e fracos, selo, data do cálculo.

### B · Estúdio e Marketplace de Indicadores
1. **Prompt** («média móvel exponencial de 21 que cruza a de 50 e só compra se o RSI estiver abaixo de 40»).
2. **Tradução** para uma linguagem de fórmulas fechada (ex.: `EMA(close,21) cross_above EMA(close,50) AND RSI(14) < 40`), com biblioteca validada: SMA, EMA, Fibonacci, RSI, MACD, Bandas de Bollinger, Estocástico, ATR, VWAP, sinais de cruzamento.
3. **Gráfico interativo** sobre as velas (reaproveita o gráfico do Analytics).
4. **Backtest automático** obrigatório: período, nº de sinais, taxa de acerto, retorno, drawdown, comparação com «comprar e manter».
5. **Registo:** título, descrição, tags, parâmetros ajustáveis com limites.
6. **Marketplace:** venda avulsa ou por subscrição; avaliações só de quem comprou; ranking de criadores por vendas, notas e resultados de backtest; gamificação (níveis, distintivos, desafios mensais).
7. **Monetização:** comissão por venda (proposta 20–30%), plano Criador Premium (mais publicações, destaque, estatísticas), assinatura de compradores (acesso a uma biblioteca).

### C · Gerador de Planos de Negócio
Segue o JSON enviado, com estas regras:
- dois formulários (pequeno comerciante / grande empresa) + bloco de financiamento (capital próprio, banco, misto: prazo, taxa, amortização);
- **conversa de correção** antes da geração final;
- relatório com todas as secções pedidas (plano de negócios, gestão de projetos com RACI e Gantt, impactos), **ano de referência obrigatório** e **fonte citada** em cada dado (Banco de Moçambique, INE, relatórios setoriais…);
- dado sem fonte encontrada = marcado como «estimativa» com o método usado; nunca inventado;
- extensão: ≈ 10 páginas (pequeno), ≈ 40 páginas (grande) ou a indicada;
- exportação: Word (completo, editável), PDF (pitch curto), Excel (valuation, cashflow, resultados, balanço, KPIs, financiamento, CAPEX/OPEX, gráficos automáticos);
- dados do cliente usados só com permissão explícita.
Reaproveita a área **Plano de Negócios** e o **Modelo Financeiro & DCF Hub** da Aurora.

### D · Painel de Ranking e Contratos Inteligentes (especificação de ecrã)
| Bloco | Conteúdo |
|---|---|
| Cabeçalho | título «Painel de Ranking e Contratos Inteligentes», fundo azul, texto branco |
| Ranking | tabela: Posição · Trader · Nota final · Rentabilidade · Estado; medalhas ouro/prata/bronze no top 3; filtros laterais Top 10 · Por categoria · Por rentabilidade |
| Perfil | cartão com foto, nome, nota, rentabilidade média, drawdown, consistência; botões «Ver detalhes» e «Conectar com investidor» |
| Contrato | janela «Criar contrato blockchain»: valor, % de lucro, duração, endereço da carteira; botão «Assinar contrato»; estados Ativo · Encerrado · Em verificação |
| Histórico | gráfico de linha da rentabilidade; tabela das últimas 5 operações |
| Confiança | ícones de cadeia de blocos e cadeado, «Transações verificadas e auditáveis», selo «Trader verificado» no rodapé |
| Estilo | azul, verde e cinza; ícones minimalistas; responsivo desktop e telemóvel; mesmas regras de acessibilidade da Aurora (contraste AA, teclado) |
Na F5 o contrato corre em **rede de teste**; a assinatura real só na F6.

---

## 5. Arquitetura (resumo)
- **Frontend:** a Aurora (React) ganha as novas áreas; mesmo design system.
- **Serviços:** importação e normalização · motor de score · motor de fórmulas e backtest · gerador de documentos · marketplace e pagamentos · contratos (F5+).
- **Dados:** base relacional para utilizadores, operações, indicadores e vendas; armazenamento de ficheiros para os relatórios; registo de auditoria de todas as notas e contratos.
- **IA:** usada para interpretar pedidos e redigir textos; **os números vêm sempre de cálculo determinístico**, nunca da IA.
- **Segurança:** chaves de API das corretoras só de leitura e cifradas; aprovação humana para qualquer ordem ou movimento de dinheiro.

---

## 6. Prompt Engineer — prompts com contrato e testes
Cada prompt tem: objetivo, entrada, saída em formato fixo (JSON), proibições, casos de teste e critério de aceitação. Prompt não testado = experimental.

| Prompt | Entrada | Saída fixa | Proibições | Testes / aceitação |
|---|---|---|---|---|
| **P1 · Prompt → fórmula** | pedido do utilizador | `{formula, parametros:[{nome, valor, min, max}], explicacao, ambiguidades}` | só funções da biblioteca; sem código livre; se ambíguo, perguntar | 200 pedidos (PT e EN) com resposta certa conhecida → ≥ 95% corretos; 100% das fórmulas inválidas rejeitadas |
| **P2 · Explicar o score** | métricas calculadas | texto curto: 2 forças, 2 fraquezas, 1 sugestão | não inventar números; não prometer lucros | 50 casos revistos por analista, ≥ 90% «correto e útil» |
| **P3 · Entrevista do plano de negócios** | respostas do formulário | lista de lacunas e perguntas, máx. 5 por ronda | não preencher dados em falta por adivinhação | 20 formulários incompletos → todas as lacunas detetadas |
| **P4 · Redação do plano** | dados confirmados + fontes | secções na estrutura do JSON | dado sem fonte = «estimativa»; ano de referência em cada número | 10 planos com 0 números sem origem |
| **P5 · Moderação do marketplace** | título, descrição, avaliações | aprovado / rejeitado + motivo | — | 100 casos (spam, promessas de lucro garantido) → ≥ 95% corretos |

---

## 7. Loop Engineer — ciclos com critério de saída
| Ciclo | Passos | Para quando… | Limite |
|---|---|---|---|
| **L1 · Qualidade do P1** | correr os 200 testes → analisar erros → ajustar prompt ou biblioteca → repetir | ≥ 95% corretos em 2 corridas seguidas | 5 iterações; depois escalar para revisão humana |
| **L2 · Backtest antes de publicar** | calcular → comparar com «comprar e manter» → verificar dados suficientes | resultado gravado e visível | indicador sem backtest nunca é publicado |
| **L3 · Fiabilidade do score** | recalcular com os mesmos dados → comparar → registar diferenças | 2 cálculos iguais ao cêntimo | qualquer diferença bloqueia a publicação da nota |
| **L4 · Plano de negócios** | gerar → verificar secções e fontes → pedir correção ao cliente → regenerar | todas as secções presentes e todas as fontes citadas | 3 rondas de correção |
| **L5 · Copy trading (F6)** | sinal → verificação de limites → aprovação (IA + humano) → execução → reconciliação | ordem executada e reconciliada | qualquer limite violado pára o robô e avisa |
| **L6 · Produto** | publicar → medir KPIs → entrevistar 5 utilizadores → priorizar → corrigir | KPIs da fase atingidos | revisão quinzenal |

---

## 8. Modelo de negócio e licenciamento
| Fonte de receita | Proposta | Quando |
|---|---|---|
| Score — licença anual para traders profissionais e corretoras | preço fixo anual por conta | F1 |
| Marketplace de indicadores | comissão 20–30% por venda + Criador Premium + assinatura de compradores | F3 |
| Planos de negócio | por relatório (pequeno / grande) ou assinatura para consultores | F4 |
| Contratos com investidores | taxa fixa + 5–10% sobre o lucro gerado, como pedido | F5/F6, após parecer |
| Tokenização | royalties 5–10% | só F6 com licença |
Valores finais a validar na F0 com os 30 entrevistados (disposição a pagar).

---

## 9. Equipa mínima e responsabilidades (RACI resumido)
| Papel | F1 | F2–F3 | F4 | F5–F6 |
|---|---|---|---|---|
| Dono de produto (Salomão) | A | A | A | A |
| Engenheiro full-stack (2) | R | R | R | R |
| Engenheiro de dados/quant | R | R | C | R |
| Engenheiro de prompts e avaliação | C | R | R | C |
| Designer de produto | R | R | R | R |
| Jurista (externo) | C | C | C | **A** (aprova) |
| Auditor de contratos inteligentes (externo) | — | — | — | R |
R = faz · A = aprova · C = consultado.

---

## 10. Indicadores de sucesso (KPIs)
| KPI | Meta inicial | Fase |
|---|---|---|
| Traders com nota calculada | 50 (piloto) → 500 | F1 |
| % de traders com selo Verificado | ≥ 40% | F1 |
| Indicadores criados / publicados | 300 / 60 | F2–F3 |
| Taxa de conversão do marketplace | ≥ 2% das visitas | F3 |
| Planos gerados com nota de consultor ≥ 3/4 | ≥ 80% | F4 |
| Reclamações por cálculo errado | 0 | todas |

---

## 11. Matriz de requisitos
| ID | Requisito (do pedido) | Fase | Aceitação | Estado |
|---|---|---|---|---|
| R1 | Avaliação contínua de rentabilidade, consistência e risco | F1 | nota recalculada a cada nova importação | NOT STARTED |
| R2 | Biometria | F1 (opcional) | consentimento explícito, fora da nota | NOT STARTED |
| R3 | Score imediato após upload/API | F1 | ≤ 10 s | NOT STARTED |
| R4 | Importação CSV/Excel e APIs (MT, Binance, IB, eToro, Coinbase) | F1 | acesso confirmado por API na F0 | NOT STARTED |
| R5 | Indicadores por linguagem natural | F2 | P1 ≥ 95% | NOT STARTED |
| R6 | Gráficos interativos | F2 | indicador sobre velas | NOT STARTED |
| R7 | Registo com título, descrição, tags e parâmetros | F2 | — | NOT STARTED |
| R8 | Marketplace, comunidade, ranking, gamificação | F3 | — | NOT STARTED |
| R9 | Backtest automático | F2 | L2 sempre executado | NOT STARTED |
| R10 | Monetização colaborativa | F3 | comissões e planos ativos | NOT STARTED |
| R11 | Gerador de planos (JSON) com Word/PDF/Excel e fontes | F4 | P4 = 0 números sem origem | NOT STARTED |
| R12 | Painel de ranking e contratos | F5 | ecrã conforme §4-D, testnet | NOT STARTED |
| R13 | Licenciamento fixo / royalties / misto | F5 | após parecer jurídico | BLOCKED (jurídico) |
| R14 | Copy trading automático com smart contracts | F6 | licença ou parceiro | BLOCKED (licença) |
| R15 | Tokenização do trader | F6 | licença | BLOCKED (licença) |
| R16 | Patente PCT, direitos de autor, marca | F0 | parecer de agente de propriedade industrial | NOT STARTED |

---

## 12. Próximas ações (esta semana)
1. Decidir o **país-piloto** (proposta: Moçambique, com corretoras e exchanges internacionais).
2. Marcar o **parecer jurídico** sobre tokens, copy trading e dados biométricos.
3. Lista de **20 traders e 10 investidores** para entrevistas da F0.
4. Confirmar o **acesso às APIs** de MetaTrader 5 e Binance (as mais simples para começar).
5. Aprovar este plano para iniciar a **F0**.
