// ─────────────────────────────────────────────────────────────────────────────
// Dual-Layer News Platform — real stories from credible outlets (linked),
// illustrated with free-licence photos from Wikimedia Commons (credited).
// Primary  : direct impact on held assets
// Secondary: regime / macro / sector signals outside the portfolio
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceBand = "high" | "medium" | "low" | "early";
export type AttentionLevel = "critical" | "high" | "moderate" | "low";
export type EventType =
  | "earnings"
  | "guidance"
  | "macro"
  | "ma"
  | "regulatory"
  | "supply"
  | "geopolitical"
  | "technical"
  | "fundamental"
  | "social";
export type Horizon = "intraday" | "1-5d" | "1-4w" | "structural";
export type EventStatus = "new" | "confirmed" | "developing" | "denied" | "closed";

export interface EvidenceLayer {
  market?: string; // price/vol/spread signal
  technical?: string; // technical signal
  fundamental?: string;
  statistical?: string;
  documentary?: string;
  social?: string;
}

export interface PrimaryNewsItem {
  id: string;
  ticker: string;
  assetName: string;
  assetClass: "equity" | "bond" | "fx" | "commodity" | "crypto" | "etf";
  sector: string;
  geography: string;
  eventType: EventType;
  status: EventStatus;
  headline: string;
  summary: string;
  timestamp: string; // ISO
  minutesAgo: number;
  impactScore: number; // 0–100
  confidenceBand: ConfidenceBand;
  attentionLevel: AttentionLevel;
  horizon: Horizon;
  priceChange: number; // %
  volumeChange: number; // % vs avg
  volChange: number; // implied vol change in pp
  evidenceLayers: EvidenceLayer;
  evidenceCount: number;
  sourceCount: number;
  tags: string[];
  source: string;
  url: string;
  image?: NewsImage;
}

export interface NewsImage {
  src: string;
  credit: string;
  license: string;
  page: string;
}

export interface SecondaryNewsItem {
  id: string;
  ticker?: string;
  assetName: string;
  theme: string;
  eventType: EventType;
  status: EventStatus;
  headline: string;
  summary: string;
  timestamp: string;
  minutesAgo: number;
  confidenceBand: ConfidenceBand;
  attentionLevel: AttentionLevel;
  horizon: Horizon;
  transmissionVector: string; // how it affects portfolio context
  regimeFlag: string;
  tags: string[];
  source: string;
  url: string;
  image?: NewsImage;
}

export interface ImpactPanelAsset {
  ticker: string;
  name: string;
  change: number;
  vol: number;
  impactScore: number;
  attentionLevel: AttentionLevel;
  relatedNewsId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTOS — Wikimedia Commons, free licences (public domain, CC0, CC BY, CC BY-SA)
// ─────────────────────────────────────────────────────────────────────────────
const C = "https://commons.wikimedia.org/wiki/File:";
const T = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";
export const PHOTOS = {
  nyse: {
    src: `${T}e/ea/NY_stock_exchange_traders_floor_LC-U9-10548-6.jpg/1920px-NY_stock_exchange_traders_floor_LC-U9-10548-6.jpg`,
    credit: "Thomas J. O'Halloran · Library of Congress",
    license: "Domínio público",
    page: `${C}NY_stock_exchange_traders_floor_LC-U9-10548-6.jpg`,
  },
  fed: {
    src: `${T}8/89/Eccles_Building_%2826088200676%29.jpg/1920px-Eccles_Building_%2826088200676%29.jpg`,
    credit: "Federal Reserve",
    license: "Domínio público",
    page: `${C}Eccles_Building_(26088200676).jpg`,
  },
  nvidia: {
    src: `${T}8/84/Nvidia_sign.jpg/1920px-Nvidia_sign.jpg`,
    credit: "Will Buckner",
    license: "CC BY 2.0",
    page: `${C}Nvidia_sign.jpg`,
  },
  lng: {
    src: `${T}d/d1/2023-05-20_01_LNG_tanker%2C_GULF_ENERGY_-_IMO_7390143.jpg/1920px-2023-05-20_01_LNG_tanker%2C_GULF_ENERGY_-_IMO_7390143.jpg`,
    credit: "Gordon Leggett",
    license: "CC BY-SA 4.0",
    page: `${C}2023-05-20_01_LNG_tanker,_GULF_ENERGY_-_IMO_7390143.jpg`,
  },
  oil: {
    src: `${T}8/83/LostHillsPumpjacksSunset.JPG/1920px-LostHillsPumpjacksSunset.JPG`,
    credit: "Arne Hückelheim",
    license: "CC BY-SA 3.0",
    page: `${C}LostHillsPumpjacksSunset.JPG`,
  },
  datacenter: {
    src: `${T}e/eb/Racks_Amravati_Data_Center.jpg/1920px-Racks_Amravati_Data_Center.jpg`,
    credit: "PiDatacenters",
    license: "CC BY-SA 4.0",
    page: `${C}Racks_Amravati_Data_Center.jpg`,
  },
  maputo: {
    src: `${T}0/07/Avenida_25_de_Setembro_Maputo_%282995080620%29.jpg/1920px-Avenida_25_de_Setembro_Maputo_%282995080620%29.jpg`,
    credit: "F Mira",
    license: "CC BY-SA 2.0",
    page: `${C}Avenida_25_de_Setembro_Maputo_(2995080620).jpg`,
  },
  metical: {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/eb/20000_meticals_Mozambique.jpg",
    credit: "Autor desconhecido",
    license: "CC0",
    page: `${C}20000_meticals_Mozambique.jpg`,
  },
} satisfies Record<string, NewsImage>;

const ago = (iso: string) => Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY NEWS — direct impact on held / watched assets
// ─────────────────────────────────────────────────────────────────────────────
export const primaryNews: PrimaryNewsItem[] = [
  {
    id: "p1",
    ticker: "NVDA",
    assetName: "NVIDIA Corp.",
    assetClass: "equity",
    sector: "Semicondutores",
    geography: "EUA",
    eventType: "earnings",
    status: "confirmed",
    headline: "Wall Street fecha misto depois dos resultados da Nvidia e das atas da Fed",
    summary:
      "A Nvidia superou as estimativas de vendas, mas a ação recuou. Os investidores pesaram ainda o tom duro das atas da Reserva Federal e preparam-se para o preço da entrada em bolsa da Anthropic.",
    timestamp: "2026-11-18T21:00:00Z",
    minutesAgo: ago("2026-11-18T21:00:00Z"),
    impactScore: 92,
    confidenceBand: "high",
    attentionLevel: "critical",
    horizon: "1-5d",
    priceChange: -2.4,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      market:
        "Nvidia −2,4% após os resultados; Dow Jones −0,8%; S&P 500 e Nasdaq quase inalterados (Reuters, 18 nov).",
      fundamental:
        "Receitas do trimestre acima do consenso; o mercado questiona a sustentabilidade do ciclo de investimento em IA.",
      documentary: "Reuters · Stephen Culp e Utkarsh Hathi, 18 nov 2026.",
    },
    evidenceCount: 3,
    sourceCount: 2,
    tags: ["Resultados", "IA", "Semicondutores", "Fed"],
    source: "Reuters",
    url: "https://www.reuters.com/business/nasdaq-futures-jump-nvidia-forecast-lifts-ai-trade-ahead-anthropic-pricing-2026-11-18/",
    image: PHOTOS.nvidia,
  },
  {
    id: "p2",
    ticker: "XOM",
    assetName: "ExxonMobil",
    assetClass: "equity",
    sector: "Energia · GNL",
    geography: "Moçambique",
    eventType: "ma",
    status: "confirmed",
    headline:
      "ExxonMobil sobe para 50% no Rovuma LNG e aponta decisão final de investimento até dezembro",
    summary:
      "Reorganização com a Eni na Área 4: a ExxonMobil duplica a participação no Rovuma LNG e a Eni concentra-se nas unidades flutuantes. O Coral Norte está 70% concluído, com arranque previsto para 2028.",
    timestamp: "2026-11-17T07:59:00Z",
    minutesAgo: ago("2026-11-17T07:59:00Z"),
    impactScore: 90,
    confidenceBand: "high",
    attentionLevel: "critical",
    horizon: "structural",
    priceChange: 0,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      fundamental:
        "Decisão final de investimento esperada até dezembro de 2026; o projeto promete mais de 100 mil milhões de dólares de valor para Moçambique e 7 000 empregos.",
      documentary:
        "O.Económico, 17 nov 2026 · Eni prevê ainda a unidade Mamba Leste (decisão em 2027) e uma central a gás (2029).",
      statistical: "Coral Norte: 70% de execução; operação prevista para 2028.",
    },
    evidenceCount: 3,
    sourceCount: 2,
    tags: ["Rovuma LNG", "Área 4", "Eni", "Gás natural"],
    source: "O.Económico",
    url: "https://www.oeconomico.com/exxonmobil-assume-50-do-rovuma-lng-e-aponta-para-decisao-de-investimento-ate-dezembro/",
    image: PHOTOS.lng,
  },
  {
    id: "p3",
    ticker: "FED",
    assetName: "Reserva Federal (EUA)",
    assetClass: "bond",
    sector: "Política monetária",
    geography: "EUA",
    eventType: "macro",
    status: "developing",
    headline:
      "Fed inclina-se para subir juros a 9 de dezembro: mercado atribui cerca de 87% a +25 pb",
    summary:
      "As atas mostram responsáveis preocupados com a inflação persistente. O mercado de futuros dá como provável uma subida de 25 pontos base; a história mostra reações mistas das ações a subidas antecipadas.",
    timestamp: "2026-11-18T19:00:00Z",
    minutesAgo: ago("2026-11-18T19:00:00Z"),
    impactScore: 88,
    confidenceBand: "medium",
    attentionLevel: "critical",
    horizon: "1-4w",
    priceChange: 0,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      market:
        "Probabilidade implícita de ~87% de subida de 25 pb na reunião de 9 de dezembro (Yahoo Finance).",
      documentary:
        "Atas da Fed publicadas a 18 nov; o governador Christopher Waller sinalizou abertura a subidas (Reuters).",
      statistical:
        "Em 2015 o S&P 500 subiu após a subida; em 2018 e 2022 caiu nas semanas seguintes.",
    },
    evidenceCount: 3,
    sourceCount: 2,
    tags: ["Juros", "Inflação", "Dólar", "Obrigações"],
    source: "Reuters · Yahoo Finance",
    url: "https://finance.yahoo.com/markets/stocks/articles/market-react-potential-fed-rate-122200823.html",
    image: PHOTOS.fed,
  },
  {
    id: "p4",
    ticker: "CL",
    assetName: "Petróleo WTI",
    assetClass: "commodity",
    sector: "Energia",
    geography: "Global",
    eventType: "supply",
    status: "confirmed",
    headline: "Petróleo cai mais de 4% com subida de inventários e dólar em máximos",
    summary:
      "As ações globais recuaram numa sessão agitada; o dólar ganhou força depois de comentários do governador da Fed Christopher Waller e o crude afundou com o aumento dos inventários.",
    timestamp: "2026-11-18T21:49:00Z",
    minutesAgo: ago("2026-11-18T21:49:00Z"),
    impactScore: 81,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "1-5d",
    priceChange: -4.0,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      market:
        "Crude −4% ou mais; índice global de ações em queda; dólar em máximos de vários meses.",
      documentary: "Reuters · Rodrigo Campos, 18 nov 2026.",
    },
    evidenceCount: 2,
    sourceCount: 1,
    tags: ["Petróleo", "Inventários", "Dólar"],
    source: "Reuters",
    url: "https://www.reuters.com/world/china/global-markets-wrapup-1-2026-11-18/",
    image: PHOTOS.oil,
  },
  {
    id: "p5",
    ticker: "IPO",
    assetName: "Anthropic",
    assetClass: "equity",
    sector: "Inteligência artificial",
    geography: "EUA",
    eventType: "fundamental",
    status: "new",
    headline: "Semana decisiva: entrada em bolsa da Anthropic testa o apetite por IA",
    summary:
      "A Morningstar destaca a estreia da Anthropic e os resultados da Nvidia como os eventos da semana. A Morgan Stanley vê oportunidade em ações de qualidade depois da correção das tecnológicas de IA.",
    timestamp: "2026-11-16T07:00:00Z",
    minutesAgo: ago("2026-11-16T07:00:00Z"),
    impactScore: 79,
    confidenceBand: "medium",
    attentionLevel: "high",
    horizon: "1-4w",
    priceChange: 0,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      fundamental: "Morgan Stanley privilegia hyperscalers e infraestrutura de IA após a correção.",
      documentary: "Morningstar · Tom Lauricella e Sarah Hansen, 16 nov 2026.",
    },
    evidenceCount: 2,
    sourceCount: 2,
    tags: ["IPO", "IA", "Tecnologia"],
    source: "Morningstar",
    url: "https://www.morningstar.com/markets/markets-brief-big-week-ahead-nvidia-report-earnings-anthropic-debut-ipo",
    image: PHOTOS.datacenter,
  },
  {
    id: "p6",
    ticker: "MZN",
    assetName: "Economia de Moçambique",
    assetClass: "fx",
    sector: "Macro",
    geography: "Moçambique",
    eventType: "macro",
    status: "confirmed",
    headline: "Standard Bank prevê crescimento de 2,3% em 2027 e pede ajustamento fiscal e cambial",
    summary:
      "O crescimento previsto fica abaixo do aumento da população (2,7%), sem subida do PIB por habitante. O banco defende consolidação orçamental e mais flexibilidade cambial para aliviar a escassez de divisas.",
    timestamp: "2026-11-06T15:20:00Z",
    minutesAgo: ago("2026-11-06T15:20:00Z"),
    impactScore: 76,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "structural",
    priceChange: 0,
    volumeChange: 0,
    volChange: 0,
    evidenceLayers: {
      fundamental:
        "PIB 2027: +2,3% vs população +2,7%; os projetos de gás são o motor de longo prazo.",
      documentary:
        "Diário Económico · Alfredo Ubisse, 6 nov 2026 (Economic Briefing do Standard Bank).",
    },
    evidenceCount: 2,
    sourceCount: 1,
    tags: ["PIB", "Metical", "Divisas", "FMI"],
    source: "Diário Económico",
    url: "https://www.diarioeconomico.co.mz/2026/11/06/economia/economic-briefing-standard-bank-anteve-ajustamento-macroeconomico-em-mocambique-em-2027/",
    image: PHOTOS.metical,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY NEWS — regime, macro and sector signals
// ─────────────────────────────────────────────────────────────────────────────
const sec = (
  id: string,
  ts: string,
  headline: string,
  summary: string,
  source: string,
  url: string,
  extra: Partial<SecondaryNewsItem> &
    Pick<SecondaryNewsItem, "theme" | "eventType" | "transmissionVector" | "regimeFlag" | "tags">,
): SecondaryNewsItem => ({
  id,
  assetName: extra.assetName ?? "Moçambique",
  status: "confirmed",
  headline,
  summary,
  timestamp: ts,
  minutesAgo: ago(ts),
  confidenceBand: "high",
  attentionLevel: "moderate",
  horizon: "1-4w",
  source,
  url,
  ...extra,
});

export const secondaryNews: SecondaryNewsItem[] = [
  sec(
    "s1",
    "2026-11-17T08:00:00Z",
    "Investimento estrangeiro cai 55,6% no segundo trimestre",
    "A queda evidencia a dependência de Moçambique dos grandes projetos de recursos naturais.",
    "O.Económico",
    "https://www.oeconomico.com/investimento-estrangeiro-cai-556-no-segundo-trimestre-e-evidencia-dependencia-dos-grandes-projectos/",
    {
      theme: "Investimento",
      eventType: "macro",
      attentionLevel: "high",
      transmissionVector: "Menos entrada de divisas pressiona o metical e a liquidez em dólares.",
      regimeFlag: "Risco cambial",
      tags: ["IDE", "Divisas"],
      image: PHOTOS.maputo,
    },
  ),
  sec(
    "s2",
    "2026-11-12T08:00:00Z",
    "Parlamento aprova relatório: gás rendeu 88,13 milhões de dólares ao Estado",
    "Receitas da exploração de gás constam do relatório aprovado pela Assembleia da República.",
    "AIM",
    "https://aimnews.org/2026/11/12/parlamento-aprova-relatorio-que-aponta-receitas-de-8813-milhoes-de-usd-com-exploracao-do-gas/",
    {
      theme: "Gás natural",
      eventType: "regulatory",
      transmissionVector: "Receitas fiscais do gás sustentam o orçamento e o fundo soberano.",
      regimeFlag: "Finanças públicas",
      tags: ["Gás", "Receitas"],
      image: PHOTOS.lng,
    },
  ),
  sec(
    "s3",
    "2026-11-02T08:00:00Z",
    "Banco de Moçambique: os grandes desafios do novo governador",
    "Inflação, câmbio e liquidez em divisas dominam a agenda da nova liderança do banco central.",
    "Diário Económico",
    "https://www.diarioeconomico.co.mz/2026/11/02/economia/banca/banco-de-mocambique-os-grandes-desafios-que-esperam-o-novo-governador/",
    {
      theme: "Banco central",
      eventType: "macro",
      attentionLevel: "high",
      transmissionVector: "Mudança na política monetária afeta taxas de juro e o metical.",
      regimeFlag: "Política monetária",
      tags: ["BdM", "Juros"],
      image: PHOTOS.metical,
    },
  ),
  sec(
    "s4",
    "2026-11-13T08:00:00Z",
    "Numerário em circulação recua em setembro e interrompe cinco meses de subida",
    "Dados do Banco de Moçambique mostram a primeira descida desde abril.",
    "Diário Económico",
    "https://www.diarioeconomico.co.mz/2026/11/13/economia/financas/bdm-numerario-em-circulacao-recua-em-setembro-e-interrompe-cinco-meses-de-subida/",
    {
      theme: "Liquidez",
      eventType: "macro",
      transmissionVector: "Menos numerário pode aliviar a pressão inflacionista.",
      regimeFlag: "Liquidez",
      tags: ["BdM", "Moeda"],
    },
  ),
  sec(
    "s5",
    "2026-11-07T08:00:00Z",
    "Jogos online: novas regras a 20 de novembro e capital mínimo de 100 milhões de meticais",
    "O regulamento dos jogos de fortuna online entra em vigor com exigências de capital mais altas.",
    "Diário Económico",
    "https://www.diarioeconomico.co.mz/2026/11/07/negocios/jogos-de-fortuna-online-novas-regras-entram-em-vigor-a-20-de-novembro-e-exigem-capital-minimo-de-100-milhoes-de-meticais/",
    {
      theme: "Regulação",
      eventType: "regulatory",
      horizon: "1-5d",
      transmissionVector: "Consolidação do setor; operadores pequenos podem sair.",
      regimeFlag: "Regulatório",
      tags: ["Regulação", "Apostas"],
    },
  ),
  sec(
    "s6",
    "2026-11-17T09:00:00Z",
    "Do gás à industrialização: Salim Valá apresenta em Luanda a visão económica até 2044",
    "A estratégia de longo prazo aposta no gás como base para a industrialização.",
    "O.Económico",
    "https://www.oeconomico.com/do-gas-a-industrializacao-salim-vala-apresenta-em-luanda-a-visao-economica-de-mocambique-ate-2044/",
    {
      theme: "Estratégia",
      eventType: "fundamental",
      horizon: "structural",
      attentionLevel: "low",
      transmissionVector: "Sinaliza prioridades de investimento público e privado.",
      regimeFlag: "Estrutural",
      tags: ["Industrialização", "2044"],
      image: PHOTOS.maputo,
    },
  ),
  sec(
    "s7",
    "2026-11-16T07:00:00Z",
    "Morgan Stanley: a correção das ações de IA é oportunidade em empresas de qualidade",
    "A casa privilegia hyperscalers e infraestrutura de IA, com o S&P 500 ainda a ganhar cerca de 11% no ano.",
    "Morningstar",
    "https://www.morningstar.com/markets/markets-brief-big-week-ahead-nvidia-report-earnings-anthropic-debut-ipo",
    {
      assetName: "Ações dos EUA",
      theme: "Estratégia de investimento",
      eventType: "fundamental",
      transmissionVector: "Rotação para qualidade dentro da tecnologia.",
      regimeFlag: "Risco de IA",
      tags: ["IA", "Qualidade"],
      image: PHOTOS.nyse,
    },
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT PANEL — only moves reported by the sources above
// ─────────────────────────────────────────────────────────────────────────────
export const impactPanelAssets: ImpactPanelAsset[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA",
    change: -2.4,
    vol: 0,
    impactScore: 92,
    attentionLevel: "critical",
    relatedNewsId: "p1",
  },
  {
    ticker: "WTI",
    name: "Petróleo",
    change: -4.0,
    vol: 0,
    impactScore: 81,
    attentionLevel: "high",
    relatedNewsId: "p4",
  },
];

// Closing moves of 18 Nov 2026 as reported by Reuters.
export const marketPulse = {
  dow: { value: "", change: -0.8, label: "Dow Jones" },
  oil: { value: "", change: -4.0, label: "Petróleo" },
  nvda: { value: "", change: -2.4, label: "Nvidia" },
};
