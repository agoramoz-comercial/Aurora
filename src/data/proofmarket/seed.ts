/**
 * ProofMarket demo data. Authors are fictional and every thesis is marked as
 * demonstration content in the UI. Sources point to the real institutional
 * pages of each entity; titles describe the page, not invented documents.
 */
import { DAY, iso } from "@/lib/proofmarket/rules";
import type { Author, Conflict, Entity, ReactionId, Thesis } from "./types";

const now = Date.now();
const d = (offsetDays: number) => iso(now + offsetDays * DAY);

export const ME_ID = "me";

export const ENTITIES: Entity[] = [
  { id: "nvda", name: "NVIDIA", kind: "empresa", code: "NVDA", market: "NASDAQ", official: true },
  { id: "aapl", name: "Apple", kind: "empresa", code: "AAPL", market: "NASDAQ", official: true },
  {
    id: "aple",
    name: "Apple Hospitality REIT",
    kind: "empresa",
    code: "APLE",
    market: "NYSE",
    official: true,
  },
  {
    id: "msft",
    name: "Microsoft",
    kind: "empresa",
    code: "MSFT",
    market: "NASDAQ",
    official: true,
  },
  { id: "tsla", name: "Tesla", kind: "empresa", code: "TSLA", market: "NASDAQ", official: true },
  { id: "amzn", name: "Amazon", kind: "empresa", code: "AMZN", market: "NASDAQ", official: true },
  {
    id: "googl",
    name: "Alphabet",
    kind: "empresa",
    code: "GOOGL",
    market: "NASDAQ",
    official: true,
  },
  {
    id: "mzn",
    name: "Metical (MZN/USD)",
    kind: "ativo",
    code: "MZN",
    market: "Câmbio",
    official: true,
  },
  { id: "mimo", name: "Taxa MIMO do Banco de Moçambique", kind: "tema", official: true },
  { id: "infl-mz", name: "Inflação em Moçambique", kind: "tema", official: true },
  { id: "gnl", name: "Gás natural liquefeito (GNL) em Moçambique", kind: "setor", official: true },
  { id: "banca-mz", name: "Setor bancário moçambicano", kind: "setor", official: true },
  { id: "divida-mz", name: "Dívida pública de Moçambique", kind: "tema", official: true },
];

const E = (id: string) => ENTITIES.find((e) => e.id === id)!;

const fc = (domain: string, list: [number, 0 | 1][]) =>
  list.map(([p, outcome]) => ({ domain, p, outcome }));

export const AUTHORS: Author[] = [
  {
    id: ME_ID,
    name: "Você",
    handle: "@voce",
    initials: "EU",
    level: "N2",
    verifiedWhat: "Identidade pessoal (demonstração)",
    verifiedBy: "Equipa de verificação ProofMarket",
    verifiedAt: d(-40),
    limits: "Confirma quem é. Não confirma formação, licença nem competência.",
    domains: [],
    forecasts: [],
  },
  {
    id: "ines",
    name: "Inês Tembe",
    handle: "@ines.tembe",
    initials: "IT",
    level: "N4",
    verifiedWhat: "Credencial profissional em análise financeira",
    verifiedBy: "Consulta ao emissor da credencial",
    verifiedAt: d(-210),
    validUntil: d(520),
    limits: "Confirma a credencial e a sua validade. Não confirma que as teses estão certas.",
    declared: "Analista de ações tecnológicas",
    domains: ["Tecnologia", "Semicondutores"],
    forecasts: fc("Tecnologia · 1–3 anos", [
      [0.7, 1],
      [0.6, 1],
      [0.8, 1],
      [0.3, 0],
      [0.65, 0],
      [0.75, 1],
      [0.55, 1],
      [0.4, 0],
      [0.7, 1],
      [0.6, 0],
      [0.8, 1],
      [0.35, 0],
      [0.7, 1],
      [0.6, 1],
    ]),
  },
  {
    id: "rui",
    name: "Rui Massingue",
    handle: "@rui.massingue",
    initials: "RM",
    level: "N3",
    verifiedWhat: "Vínculo profissional a uma instituição financeira",
    verifiedBy: "Email do domínio do empregador + documento",
    verifiedAt: d(-120),
    limits: "Confirma onde trabalha. Não fala em nome do empregador nem confirma competência.",
    declared: "Economista, mercados de câmbio",
    domains: ["Macro Moçambique", "Câmbio"],
    forecasts: fc("Macro MZ · 3–12 meses", [
      [0.6, 1],
      [0.7, 1],
      [0.4, 0],
      [0.55, 0],
      [0.8, 1],
      [0.3, 0],
      [0.65, 1],
      [0.6, 1],
      [0.45, 1],
      [0.7, 0],
      [0.75, 1],
    ]),
  },
  {
    id: "clara",
    name: "Clara Nhantumbo",
    handle: "@clara.n",
    initials: "CN",
    level: "N2",
    verifiedWhat: "Identidade pessoal",
    verifiedBy: "Fornecedor de verificação de identidade",
    verifiedAt: d(-60),
    limits: "Confirma quem é. Não confirma formação, licença nem competência.",
    declared: "Investidora particular",
    domains: ["Consumo", "Tecnologia"],
    forecasts: fc("Tecnologia · 3–12 meses", [
      [0.7, 1],
      [0.6, 0],
      [0.8, 1],
      [0.5, 1],
    ]),
  },
  {
    id: "jorge",
    name: "Jorge Cossa",
    handle: "@jorge.cossa",
    initials: "JC",
    level: "N2",
    verifiedWhat: "Identidade pessoal",
    verifiedBy: "Fornecedor de verificação de identidade",
    verifiedAt: d(-30),
    limits: "Confirma quem é. Não confirma formação, licença nem competência.",
    declared: "Criador de conteúdo financeiro",
    domains: ["Automóvel", "Energia"],
    forecasts: fc("Automóvel · 3–12 meses", [
      [0.9, 0],
      [0.85, 1],
      [0.9, 0],
      [0.8, 0],
      [0.95, 1],
      [0.7, 0],
    ]),
  },
  {
    id: "iap",
    name: "Instituto Austral de Pesquisa",
    handle: "@instituto.austral",
    initials: "IA",
    level: "N5",
    verifiedWhat: "Organização com existência legal e representante autorizado",
    verifiedBy: "Domínio oficial + certidão + revisão humana",
    verifiedAt: d(-300),
    limits: "Confirma a organização. Não valida o conteúdo das teses.",
    domains: ["Energia", "Dívida pública"],
    forecasts: fc("Energia · 1–3 anos", [
      [0.6, 1],
      [0.5, 0],
      [0.7, 1],
      [0.4, 0],
      [0.65, 1],
      [0.55, 1],
      [0.6, 0],
      [0.7, 1],
      [0.35, 0],
      [0.6, 1],
      [0.5, 1],
      [0.45, 0],
    ]),
  },
];

const noConflict = (at: string): Conflict => ({
  position: "nenhuma",
  remunerated: false,
  sponsor: "",
  relation: "",
  declaredAt: at,
});
const reactions = (
  a: number,
  b: number,
  c: number,
  e: number,
  f: number,
  g: number,
): Record<ReactionId, number> => ({
  evidencia_util: a,
  premissa_questionavel: b,
  quero_fonte: c,
  risco_subestimado: e,
  explicacao_clara: f,
  necessita_atualizacao: g,
});

export const SEED_THESES: Thesis[] = [
  {
    id: "THS-0101",
    authorId: "ines",
    entity: E("nvda"),
    kind: "valuation",
    stance: "condicional",
    horizon: "1-3a",
    risk: "elevado",
    status: "ativa",
    publishedAt: d(-18),
    reviewDue: d(347),
    counterOpen: true,
    tags: ["Semicondutores", "IA", "Capex"],
    reactionCounts: reactions(42, 11, 3, 9, 27, 1),
    events: [],
    reviews: [],
    versions: [
      {
        version: "1.0",
        date: d(-18),
        claim:
          "A receita de centros de dados da NVIDIA cresce acima de 25% ao ano até ao fim de 2027 se o investimento em IA dos grandes clientes não abrandar.",
        mechanism:
          "Se os quatro maiores clientes de cloud mantiverem o investimento em infraestrutura de IA, então a procura por aceleradores continua acima da oferta, porque a capacidade de produção avançada e de memória ainda é o limite.",
        assumptions: [
          "O investimento anual dos grandes clientes de cloud não cai mais de 10%.",
          "Não surge restrição adicional de exportação que retire mais de 15% da receita.",
          "Concorrentes não ganham mais de 10 pontos de quota em 12 meses.",
        ],
        risks: [
          "Concentração de clientes",
          "Ciclo de stock nos clientes",
          "Restrições de exportação",
        ],
        counterHypothesis:
          "Os grandes clientes podem estar a antecipar compras e criar um ciclo de excesso de capacidade em 2027.",
        invalidation:
          "Esta tese é falsa se a receita de centros de dados de 2027 crescer menos de 15% face a 2026 no relatório anual.",
        scenarios: [
          { kind: "base", probability: 55, outcome: "Crescimento entre 25% e 35% ao ano." },
          {
            kind: "positivo",
            probability: 20,
            outcome: "Crescimento acima de 35% com margens estáveis.",
          },
          {
            kind: "adverso",
            probability: 25,
            outcome: "Crescimento abaixo de 15% por ciclo de stock.",
          },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores: resultados trimestrais",
            publisher: "NVIDIA",
            url: "https://investor.nvidia.com/",
            date: d(-25),
            kind: "primaria",
          },
          {
            id: "s2",
            title: "Relações com investidores: relatórios anuais",
            publisher: "Microsoft",
            url: "https://www.microsoft.com/en-us/investor",
            date: d(-40),
            kind: "oficial",
          },
          {
            id: "s3",
            title: "Relações com investidores",
            publisher: "Alphabet",
            url: "https://abc.xyz/investor/",
            date: d(-35),
            kind: "oficial",
          },
        ],
        conflict: {
          position: "longa",
          remunerated: false,
          sponsor: "",
          relation: "",
          declaredAt: d(-18),
        },
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0102",
    authorId: "rui",
    entity: E("mzn"),
    kind: "macro",
    stance: "neutra",
    horizon: "3-12m",
    risk: "moderado",
    status: "ativa",
    publishedAt: d(-9),
    reviewDue: d(170),
    counterOpen: true,
    tags: ["Câmbio", "Reservas", "Moçambique"],
    reactionCounts: reactions(31, 6, 2, 4, 19, 0),
    events: [],
    reviews: [],
    versions: [
      {
        version: "1.0",
        date: d(-9),
        claim:
          "O metical mantém-se numa banda de ±3% face ao dólar nos próximos 6 meses, salvo choque nas receitas de exportação.",
        mechanism:
          "Se as reservas internacionais cobrirem mais de 4 meses de importações, então o banco central consegue suavizar pressões, porque tem margem para intervir sem esgotar reservas.",
        assumptions: [
          "As reservas internacionais ficam acima de 4 meses de importações.",
          "Não há queda superior a 20% nas receitas de exportação de carvão e alumínio.",
        ],
        risks: ["Choque nos preços de matérias-primas", "Atraso em desembolsos externos"],
        counterHypothesis:
          "A estabilidade pode refletir racionamento de divisas e não equilíbrio, o que esconde pressão acumulada.",
        invalidation:
          "Esta tese é falsa se a taxa de referência MZN/USD sair da banda de ±3% em qualquer mês até à data de revisão.",
        scenarios: [
          { kind: "base", probability: 65, outcome: "Variação dentro de ±3%." },
          {
            kind: "positivo",
            probability: 10,
            outcome: "Apreciação ligeira com entrada de investimento.",
          },
          {
            kind: "adverso",
            probability: 25,
            outcome: "Depreciação acima de 3% por choque externo.",
          },
        ],
        sources: [
          {
            id: "s1",
            title: "Estatísticas e taxas de câmbio de referência",
            publisher: "Banco de Moçambique",
            url: "https://www.bancomoc.mz/",
            date: d(-10),
            kind: "oficial",
          },
          {
            id: "s2",
            title: "Estatísticas do comércio externo",
            publisher: "Instituto Nacional de Estatística",
            url: "https://www.ine.gov.mz/",
            date: d(-30),
            kind: "oficial",
          },
        ],
        conflict: noConflict(d(-9)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0103",
    authorId: "jorge",
    entity: E("tsla"),
    kind: "resultados",
    stance: "positiva",
    horizon: "3-12m",
    risk: "especulativo",
    status: "ativa",
    publishedAt: d(-200),
    reviewDue: d(-34),
    counterOpen: true,
    tags: ["Automóvel", "Robotáxi"],
    reactionCounts: reactions(8, 24, 17, 21, 5, 30),
    events: [
      { date: d(-60), text: "A empresa adiou o calendário de um produto citado na premissa 1." },
    ],
    reviews: [],
    versions: [
      {
        version: "1.0",
        date: d(-200),
        claim:
          "As entregas da Tesla crescem acima de 30% em 12 meses graças ao lançamento de um modelo mais barato.",
        mechanism:
          "Se o modelo de entrada for lançado no prazo anunciado, então o mercado endereçável aumenta, porque o preço fica abaixo da média dos elétricos concorrentes.",
        assumptions: [
          "O modelo de entrada é lançado no prazo anunciado.",
          "Os incentivos fiscais mantêm-se nos principais mercados.",
        ],
        risks: ["Atrasos de produção", "Guerra de preços na China"],
        counterHypothesis:
          "A procura pode estar limitada por concorrência chinesa e não pelo preço.",
        invalidation:
          "Esta tese é falsa se as entregas anuais crescerem menos de 10% no relatório do ano.",
        scenarios: [
          { kind: "base", probability: 50, outcome: "Crescimento entre 20% e 30%." },
          { kind: "positivo", probability: 30, outcome: "Crescimento acima de 30%." },
          { kind: "adverso", probability: 20, outcome: "Crescimento abaixo de 10%." },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores: entregas e produção",
            publisher: "Tesla",
            url: "https://ir.tesla.com/",
            date: d(-205),
            kind: "primaria",
          },
        ],
        conflict: noConflict(d(-200)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0104",
    authorId: "ines",
    entity: E("msft"),
    kind: "regulacao",
    stance: "negativa",
    horizon: "3-12m",
    risk: "moderado",
    status: "concluida",
    publishedAt: d(-400),
    reviewDue: d(-35),
    counterOpen: true,
    tags: ["Regulação", "Cloud", "UE"],
    reactionCounts: reactions(26, 3, 1, 2, 18, 0),
    events: [],
    reviews: [
      {
        date: d(-33),
        decision: "concluir",
        justification:
          "A decisão regulatória saiu dentro do horizonte com a coima esperada. O cenário base confirmou-se e as premissas 1 e 2 verificaram-se nos documentos oficiais.",
        onTime: true,
      },
    ],
    versions: [
      {
        version: "1.0",
        date: d(-400),
        claim:
          "A Microsoft recebe uma decisão regulatória europeia sobre cloud com impacto inferior a 1% da receita anual em 12 meses.",
        mechanism:
          "Se a investigação seguir o padrão de casos anteriores, então a decisão termina em compromissos e coima limitada, porque o regulador privilegia remédios comportamentais.",
        assumptions: [
          "O processo segue o calendário publicado.",
          "Não há abertura de nova investigação ligada.",
        ],
        risks: ["Nova queixa de concorrentes", "Mudança de liderança no regulador"],
        counterHypothesis:
          "A pressão política pode levar a remédios estruturais mais caros do que o histórico sugere.",
        invalidation:
          "Esta tese é falsa se a coima ou os remédios custarem mais de 1% da receita anual de 2026.",
        scenarios: [
          { kind: "base", probability: 60, outcome: "Compromissos e coima abaixo de 1%." },
          { kind: "positivo", probability: 25, outcome: "Arquivamento sem coima." },
          { kind: "adverso", probability: 15, outcome: "Remédios estruturais." },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores",
            publisher: "Microsoft",
            url: "https://www.microsoft.com/en-us/investor",
            date: d(-405),
            kind: "primaria",
          },
        ],
        conflict: noConflict(d(-400)),
        changeNote: "Publicação inicial.",
        material: true,
      },
      {
        version: "1.1",
        date: d(-150),
        claim:
          "A Microsoft recebe uma decisão regulatória europeia sobre cloud com impacto inferior a 1% da receita anual em 12 meses.",
        mechanism:
          "Se a investigação seguir o padrão de casos anteriores, então a decisão termina em compromissos e coima limitada, porque o regulador privilegia remédios comportamentais.",
        assumptions: [
          "O processo segue o calendário publicado.",
          "Não há abertura de nova investigação ligada.",
        ],
        risks: ["Nova queixa de concorrentes", "Mudança de liderança no regulador"],
        counterHypothesis:
          "A pressão política pode levar a remédios estruturais mais caros do que o histórico sugere.",
        invalidation:
          "Esta tese é falsa se a coima ou os remédios custarem mais de 1% da receita anual de 2026.",
        scenarios: [
          { kind: "base", probability: 60, outcome: "Compromissos e coima abaixo de 1%." },
          { kind: "positivo", probability: 25, outcome: "Arquivamento sem coima." },
          { kind: "adverso", probability: 15, outcome: "Remédios estruturais." },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores",
            publisher: "Microsoft",
            url: "https://www.microsoft.com/en-us/investor",
            date: d(-405),
            kind: "primaria",
          },
        ],
        conflict: noConflict(d(-400)),
        changeNote: "Correção menor: referência ao ano fiscal corrigida de 2025 para 2026.",
        material: false,
      },
    ],
  },
  {
    id: "THS-0105",
    authorId: "rui",
    entity: E("mimo"),
    kind: "macro",
    stance: "condicional",
    horizon: "1-3a",
    risk: "moderado",
    status: "ativa",
    publishedAt: d(-4),
    reviewDue: d(400),
    counterOpen: true,
    tags: ["Política monetária", "Inflação", "Moçambique"],
    reactionCounts: reactions(15, 4, 6, 3, 12, 0),
    events: [],
    reviews: [],
    versions: [
      {
        version: "1.0",
        date: d(-4),
        claim:
          "Se a inflação anual ficar abaixo de 5% durante dois trimestres seguidos, a taxa MIMO desce pelo menos 150 pontos base até ao fim de 2027.",
        mechanism:
          "Se a inflação se mantiver baixa, então o comité de política monetária ganha espaço para cortes, porque a taxa real fica muito acima do necessário para ancorar expectativas.",
        assumptions: [
          "A inflação anual fica abaixo de 5% em dois trimestres seguidos.",
          "O metical não deprecia mais de 5% no período.",
        ],
        risks: ["Choque nos preços de alimentos", "Pressão orçamental e emissão de dívida interna"],
        counterHypothesis:
          "O banco central pode manter a taxa alta para atrair procura por dívida interna, mesmo com inflação baixa.",
        invalidation:
          "Esta tese é falsa se, cumprida a condição de inflação, a taxa MIMO descer menos de 150 pb até 31 de dezembro de 2027.",
        scenarios: [
          { kind: "base", probability: 50, outcome: "Cortes acumulados entre 150 e 300 pb." },
          { kind: "positivo", probability: 15, outcome: "Cortes acima de 300 pb." },
          { kind: "adverso", probability: 35, outcome: "Cortes abaixo de 150 pb ou nenhum." },
        ],
        sources: [
          {
            id: "s1",
            title: "Comunicados do Comité de Política Monetária",
            publisher: "Banco de Moçambique",
            url: "https://www.bancomoc.mz/",
            date: d(-6),
            kind: "oficial",
          },
          {
            id: "s2",
            title: "Índice de preços no consumidor",
            publisher: "Instituto Nacional de Estatística",
            url: "https://www.ine.gov.mz/",
            date: d(-12),
            kind: "oficial",
          },
        ],
        conflict: noConflict(d(-4)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0106",
    authorId: "iap",
    entity: E("gnl"),
    kind: "risco",
    stance: "negativa",
    horizon: "1-3a",
    risk: "elevado",
    status: "inconclusiva",
    publishedAt: d(-500),
    reviewDue: d(-70),
    counterOpen: true,
    tags: ["Energia", "Cabo Delgado", "Investimento externo"],
    reactionCounts: reactions(19, 7, 2, 5, 11, 2),
    events: [],
    reviews: [
      {
        date: d(-66),
        decision: "inconclusiva",
        justification:
          "O calendário oficial mudou duas vezes e os dados de produção ainda não foram publicados. Não há evidência suficiente para concluir em nenhum sentido; reabrimos com nova tese quando houver dados auditados.",
        onTime: true,
      },
    ],
    versions: [
      {
        version: "1.0",
        date: d(-500),
        claim:
          "O arranque comercial de um dos grandes projetos de GNL atrasa mais de 12 meses face ao calendário de 2025.",
        mechanism:
          "Se as condições de segurança não permitirem retomar obras em pleno, então o calendário escorrega, porque os empreiteiros só remobilizam com garantias.",
        assumptions: [
          "As obras não retomam em pleno nos 6 meses seguintes.",
          "Não há mudança de operador.",
        ],
        risks: ["Mudança rápida nas condições de segurança", "Renegociação de contratos"],
        counterHypothesis:
          "O operador pode acelerar com equipas adicionais e recuperar parte do atraso.",
        invalidation:
          "Esta tese é falsa se o arranque comercial acontecer até 12 meses depois do calendário de 2025.",
        scenarios: [
          { kind: "base", probability: 55, outcome: "Atraso entre 12 e 24 meses." },
          { kind: "positivo", probability: 15, outcome: "Atraso inferior a 12 meses." },
          { kind: "adverso", probability: 30, outcome: "Atraso superior a 24 meses." },
        ],
        sources: [
          {
            id: "s1",
            title: "Informação pública do setor",
            publisher: "Instituto Nacional de Petróleo",
            url: "https://www.inp.gov.mz/",
            date: d(-505),
            kind: "oficial",
          },
        ],
        conflict: noConflict(d(-500)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0107",
    authorId: "clara",
    entity: E("aapl"),
    kind: "resultados",
    stance: "positiva",
    horizon: "3-12m",
    risk: "moderado",
    status: "invalidada",
    publishedAt: d(-380),
    reviewDue: d(-15),
    counterOpen: true,
    tags: ["Serviços", "Consumo"],
    reactionCounts: reactions(12, 5, 4, 3, 9, 0),
    events: [],
    reviews: [
      {
        date: d(-12),
        decision: "invalidar",
        justification:
          "A receita de serviços cresceu 9%, abaixo do limiar de 12% que defini. A premissa sobre preços de subscrição falhou. Mantenho o histórico para quem quiser ver o raciocínio.",
        onTime: true,
      },
    ],
    versions: [
      {
        version: "1.0",
        date: d(-380),
        claim:
          "A receita de serviços da Apple cresce acima de 12% no próximo ano fiscal por subida de preços de subscrição.",
        mechanism:
          "Se os preços de subscrição subirem sem perda relevante de utilizadores, então a receita de serviços acelera, porque a base instalada é grande e pouco sensível a preço.",
        assumptions: [
          "Subida de preços de pelo menos 10% nos principais serviços.",
          "Cancelamentos abaixo de 3%.",
        ],
        risks: ["Decisões regulatórias sobre lojas de apps", "Saturação de subscrições"],
        counterHypothesis:
          "A regulação das lojas de apps pode reduzir comissões e anular o efeito dos preços.",
        invalidation:
          "Esta tese é falsa se a receita de serviços crescer menos de 12% no relatório anual.",
        scenarios: [
          { kind: "base", probability: 55, outcome: "Crescimento entre 12% e 15%." },
          { kind: "positivo", probability: 15, outcome: "Crescimento acima de 15%." },
          { kind: "adverso", probability: 30, outcome: "Crescimento abaixo de 12%." },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores: resultados",
            publisher: "Apple",
            url: "https://investor.apple.com/",
            date: d(-385),
            kind: "primaria",
          },
        ],
        conflict: noConflict(d(-380)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
  {
    id: "THS-0108",
    authorId: ME_ID,
    entity: E("amzn"),
    kind: "valuation",
    stance: "positiva",
    horizon: "3-12m",
    risk: "moderado",
    status: "ativa",
    publishedAt: d(-180),
    reviewDue: d(-1),
    counterOpen: true,
    tags: ["Cloud", "Margens"],
    reactionCounts: reactions(6, 2, 1, 1, 4, 0),
    events: [],
    reviews: [],
    versions: [
      {
        version: "1.0",
        date: d(-180),
        claim:
          "A margem operacional do negócio de cloud da Amazon fica acima de 30% em cada trimestre dos próximos 6 meses.",
        mechanism:
          "Se a procura por capacidade de IA continuar a crescer, então a utilização dos centros de dados sobe, porque o custo fixo já investido é diluído por mais clientes.",
        assumptions: [
          "A utilização dos centros de dados não cai.",
          "Os preços médios por cliente não descem mais de 5%.",
        ],
        risks: ["Guerra de preços entre clouds", "Depreciação acelerada de equipamento"],
        counterHypothesis:
          "A depreciação dos novos investimentos em IA pode comprimir margens mais depressa do que a receita cresce.",
        invalidation:
          "Esta tese é falsa se a margem operacional do segmento de cloud ficar abaixo de 30% em qualquer trimestre do período.",
        scenarios: [
          { kind: "base", probability: 60, outcome: "Margens entre 30% e 35%." },
          { kind: "positivo", probability: 15, outcome: "Margens acima de 35%." },
          { kind: "adverso", probability: 25, outcome: "Margens abaixo de 30%." },
        ],
        sources: [
          {
            id: "s1",
            title: "Relações com investidores: resultados trimestrais",
            publisher: "Amazon",
            url: "https://ir.aboutamazon.com/",
            date: d(-185),
            kind: "primaria",
          },
        ],
        conflict: noConflict(d(-180)),
        changeNote: "Publicação inicial.",
        material: true,
      },
    ],
  },
];

export const SEED_COUNTERS = [
  {
    id: "CTR-0201",
    thesisId: "THS-0101",
    authorId: "rui",
    targetKind: "premissa" as const,
    targetText: "O investimento anual dos grandes clientes de cloud não cai mais de 10%.",
    targetVersion: "1.0",
    type: "confundidor" as const,
    body: "Parte do investimento dos grandes clientes é antecipação de capacidade para contratos que ainda não geram receita. Se esses contratos atrasarem, o investimento pode cair mais de 10% sem qualquer mudança na procura final por IA.",
    alternative:
      "Se a receita de IA dos clientes de cloud crescer abaixo do investimento durante dois trimestres, então haverá pausa nas encomendas.",
    wouldChange:
      "Ver a receita de IA dos três maiores clientes de cloud a crescer ao mesmo ritmo do investimento.",
    date: d(-10),
    status: "respondida" as const,
    answer: {
      text: "Aceito o confundidor. Acrescento na próxima revisão um indicador da relação entre receita de IA e investimento.",
      stance: "corrijo" as const,
      date: d(-8),
    },
  },
  {
    id: "CTR-0202",
    thesisId: "THS-0103",
    authorId: "clara",
    targetKind: "afirmacao" as const,
    targetText:
      "As entregas da Tesla crescem acima de 30% em 12 meses graças ao lançamento de um modelo mais barato.",
    targetVersion: "1.0",
    type: "evidencia_contraria" as const,
    body: "O calendário do modelo de entrada foi adiado, como mostra o evento material registado. A premissa 1 deixou de se verificar e a tese não foi revista dentro do prazo.",
    alternative:
      "Se o modelo de entrada só chegar no ano seguinte, então o crescimento de entregas fica abaixo de 10%.",
    wouldChange: "Um anúncio oficial com data de produção confirmada dentro do horizonte.",
    source: {
      id: "cs1",
      title: "Relações com investidores: entregas e produção",
      publisher: "Tesla",
      url: "https://ir.tesla.com/",
      date: d(-58),
      kind: "primaria" as const,
    },
    date: d(-50),
    status: "publicada" as const,
  },
];
