/**
 * marketplaceData.ts — Ollympius Private Collection.
 *
 * Seed catalogue for the luxury marketplace (cars, real estate, jewellery &
 * watches, fashion, private events, yachts and private jets). Prices in USD.
 * Photography is loaded from Unsplash; every card falls back to generated art
 * when an image cannot load.
 */

export type Category = "cars" | "homes" | "jewelry" | "fashion" | "tickets" | "yachts" | "jets";

export type Condition = "Novo" | "Como novo" | "Excelente" | "Muito bom" | "Coleção";

export interface ListingSpec {
  label: string;
  value: string;
}

export interface Seller {
  name: string;
  verified: boolean;
  rating: number; // 0–5
  sales: number;
  since: number; // year
}

export interface Listing {
  id: string;
  category: Category;
  title: string;
  brand: string;
  subtitle: string;
  description: string;
  priceUsd: number;
  location: string;
  images: string[];
  /** First three specs are shown on cards. */
  specs: ListingSpec[];
  seller: Seller;
  condition: Condition;
  featured?: boolean;
  tags: string[];
  listedAt: string; // ISO date
  views: number;
  watchers: number;
  /** Tickets / events only. */
  eventDate?: string;
  stock?: number;
  /** Created by the current user through "Anunciar ativo". */
  mine?: boolean;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  singular: string;
  /** Tint used by the image fallback and category badge. */
  color: string;
  /** Spec fields asked for by the sell wizard. */
  specFields: string[];
  /** Verb for the primary non-offer action. */
  reserveLabel: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "cars",
    label: "Carros de luxo",
    singular: "Automóvel",
    color: "#f87171",
    specFields: ["Ano", "Quilómetros", "Potência", "0–100 km/h"],
    reserveLabel: "Agendar test drive",
  },
  {
    id: "homes",
    label: "Imobiliário",
    singular: "Propriedade",
    color: "#4ade80",
    specFields: ["Área", "Quartos", "Casas de banho", "Terreno"],
    reserveLabel: "Agendar visita privada",
  },
  {
    id: "jewelry",
    label: "Joias & Relógios",
    singular: "Peça",
    color: "#fbbf24",
    specFields: ["Material", "Quilates / Calibre", "Certificação", "Ano"],
    reserveLabel: "Pedir visualização",
  },
  {
    id: "fashion",
    label: "Moda & Alta costura",
    singular: "Peça",
    color: "#c084fc",
    specFields: ["Maison", "Tamanho", "Material", "Ano"],
    reserveLabel: "Reservar peça",
  },
  {
    id: "tickets",
    label: "Eventos exclusivos",
    singular: "Experiência",
    color: "#2dd4bf",
    specFields: ["Data", "Local", "Acesso", "Inclui"],
    reserveLabel: "Reservar lugares",
  },
  {
    id: "yachts",
    label: "Iates",
    singular: "Iate",
    color: "#38bdf8",
    specFields: ["Comprimento", "Cabines", "Velocidade máx.", "Ano"],
    reserveLabel: "Agendar sea trial",
  },
  {
    id: "jets",
    label: "Jatos privados",
    singular: "Aeronave",
    color: "#a5b4fc",
    specFields: ["Alcance", "Passageiros", "Horas de voo", "Ano"],
    reserveLabel: "Agendar inspeção",
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  Category,
  CategoryMeta
>;

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const S = {
  maison: {
    name: "Maison Lusitânia Private Office",
    verified: true,
    rating: 4.9,
    sales: 212,
    since: 2014,
  },
  atlas: { name: "Atlas Motors Heritage", verified: true, rating: 4.8, sales: 148, since: 2011 },
  meridian: { name: "Meridian Estates", verified: true, rating: 4.7, sales: 96, since: 2016 },
  azure: { name: "Azure Yachting Brokers", verified: true, rating: 4.9, sales: 64, since: 2009 },
  skyline: {
    name: "Skyline Aviation Partners",
    verified: true,
    rating: 4.8,
    sales: 41,
    since: 2012,
  },
  vault: { name: "The Vault Geneva", verified: true, rating: 5, sales: 327, since: 2008 },
  atelier: { name: "Atelier Rive Gauche", verified: true, rating: 4.6, sales: 530, since: 2017 },
  backstage: { name: "Backstage Concierge", verified: true, rating: 4.8, sales: 1204, since: 2015 },
  private: { name: "Colecionador privado", verified: false, rating: 4.4, sales: 7, since: 2022 },
} satisfies Record<string, Seller>;

export const SEED_LISTINGS: Listing[] = [
  /* ── Cars ─────────────────────────────────────────────────────────── */
  {
    id: "car-1",
    category: "cars",
    brand: "Ferrari",
    title: "Ferrari SF90 Stradale Assetto Fiorano",
    subtitle: "Híbrido plug-in · 1.000 cv · pintura Rosso Corsa",
    description:
      "Unidade com pack Assetto Fiorano, jantes em fibra de carbono e escape em titânio. Histórico de manutenção oficial completo, garantia de fábrica até 2027.",
    priceUsd: 685_000,
    location: "Mónaco",
    images: [u("1583121274602-3e2820c69888"), u("1503376780353-7e6692767b70")],
    specs: [
      { label: "Ano", value: "2024" },
      { label: "Quilómetros", value: "1.850 km" },
      { label: "Potência", value: "1.000 cv" },
      { label: "0–100 km/h", value: "2,5 s" },
    ],
    seller: S.atlas,
    condition: "Como novo",
    featured: true,
    tags: ["híbrido", "V8", "garantia"],
    listedAt: "2026-09-18",
    views: 4820,
    watchers: 312,
  },
  {
    id: "car-2",
    category: "cars",
    brand: "Rolls-Royce",
    title: "Rolls-Royce Spectre",
    subtitle: "Coupé 100% elétrico · Starlight Headliner",
    description:
      "Primeiro Rolls-Royce elétrico, especificação Bespoke com interior em pele Arctic White e 4.796 estrelas de fibra ótica. Entrega com carregador de parede.",
    priceUsd: 520_000,
    location: "Londres",
    images: [u("1606664515524-ed2f786a0bd6"), u("1544636331-e26879cd4d9b")],
    specs: [
      { label: "Ano", value: "2025" },
      { label: "Quilómetros", value: "620 km" },
      { label: "Potência", value: "585 cv" },
      { label: "0–100 km/h", value: "4,5 s" },
    ],
    seller: S.atlas,
    condition: "Novo",
    tags: ["elétrico", "bespoke"],
    listedAt: "2026-09-22",
    views: 2310,
    watchers: 188,
  },
  {
    id: "car-3",
    category: "cars",
    brand: "Porsche",
    title: "Porsche 911 GT3 RS Weissach",
    subtitle: "Pacote Weissach · caixa PDK · Shark Blue",
    description:
      "Configuração de pista com gaiola em magnésio, travões carbono-cerâmicos e jantes forjadas. Nunca utilizado em circuito.",
    priceUsd: 395_000,
    location: "Estugarda",
    images: [u("1503376780353-7e6692767b70"), u("1492144534655-ae79c964c9d7")],
    specs: [
      { label: "Ano", value: "2024" },
      { label: "Quilómetros", value: "3.200 km" },
      { label: "Potência", value: "525 cv" },
      { label: "0–100 km/h", value: "3,2 s" },
    ],
    seller: S.private,
    condition: "Excelente",
    tags: ["pista", "manual de serviço"],
    listedAt: "2026-09-10",
    views: 3150,
    watchers: 241,
  },
  {
    id: "car-4",
    category: "cars",
    brand: "Lamborghini",
    title: "Lamborghini Revuelto",
    subtitle: "V12 híbrido · 1.015 cv · Verde Mantis",
    description:
      "Sucessor do Aventador com três motores elétricos e V12 atmosférico. Interior Sportivo em Alcantara, lift dianteiro e sistema de som Sensonum.",
    priceUsd: 610_000,
    location: "Dubai",
    images: [u("1544636331-e26879cd4d9b"), u("1617814076367-b759c7d7e738")],
    specs: [
      { label: "Ano", value: "2025" },
      { label: "Quilómetros", value: "950 km" },
      { label: "Potência", value: "1.015 cv" },
      { label: "0–100 km/h", value: "2,5 s" },
    ],
    seller: S.atlas,
    condition: "Como novo",
    tags: ["V12", "híbrido"],
    listedAt: "2026-09-25",
    views: 1980,
    watchers: 164,
  },

  /* ── Homes ────────────────────────────────────────────────────────── */
  {
    id: "home-1",
    category: "homes",
    brand: "Meridian Estates",
    title: "Villa contemporânea sobre o mar",
    subtitle: "Comporta · 7 suites · piscina infinita",
    description:
      "Arquitetura assinada, 1,2 ha de pinhal com acesso direto à praia. Casa de hóspedes, spa privado, adega climatizada e domótica integral.",
    priceUsd: 14_800_000,
    location: "Comporta, Portugal",
    images: [u("1613490493576-7fde63acd811"), u("1512917774080-9991f1c4c750")],
    specs: [
      { label: "Área", value: "1.150 m²" },
      { label: "Quartos", value: "7 suites" },
      { label: "Casas de banho", value: "9" },
      { label: "Terreno", value: "12.000 m²" },
    ],
    seller: S.meridian,
    condition: "Novo",
    featured: true,
    tags: ["frente-mar", "piscina", "spa"],
    listedAt: "2026-09-02",
    views: 6120,
    watchers: 402,
  },
  {
    id: "home-2",
    category: "homes",
    brand: "Meridian Estates",
    title: "Penthouse Central Park South",
    subtitle: "Manhattan · terraço 360° · elevador privado",
    description:
      "Triplex no 74.º andar com vistas diretas sobre o Central Park, pé-direito de 5 m na sala principal e serviços de hotel de cinco estrelas.",
    priceUsd: 38_500_000,
    location: "Nova Iorque, EUA",
    images: [u("1600596542815-ffad4c1539a9"), u("1600585154340-be6161a56a0c")],
    specs: [
      { label: "Área", value: "1.020 m²" },
      { label: "Quartos", value: "5" },
      { label: "Casas de banho", value: "7" },
      { label: "Terreno", value: "Terraço 240 m²" },
    ],
    seller: S.meridian,
    condition: "Excelente",
    tags: ["penthouse", "concierge"],
    listedAt: "2026-08-28",
    views: 8450,
    watchers: 511,
  },
  {
    id: "home-3",
    category: "homes",
    brand: "Colecionador privado",
    title: "Chalet ski-in/ski-out",
    subtitle: "Courchevel 1850 · piscina interior · cinema",
    description:
      "Chalet em pedra e carvalho com acesso direto às pistas, piscina interior, hammam, sala de cinema e apartamento de staff independente.",
    priceUsd: 22_000_000,
    location: "Courchevel, França",
    images: [u("1600585154340-be6161a56a0c"), u("1613490493576-7fde63acd811")],
    specs: [
      { label: "Área", value: "860 m²" },
      { label: "Quartos", value: "6" },
      { label: "Casas de banho", value: "8" },
      { label: "Terreno", value: "1.400 m²" },
    ],
    seller: S.private,
    condition: "Muito bom",
    tags: ["montanha", "ski"],
    listedAt: "2026-09-14",
    views: 2980,
    watchers: 207,
  },
  {
    id: "home-4",
    category: "homes",
    brand: "Meridian Estates",
    title: "Moradia com ilha privada",
    subtitle: "Bazaruto · heliporto · marina própria",
    description:
      "Propriedade eco-luxo numa ilha privada do arquipélago de Bazaruto, com energia solar, dessalinização, heliporto e marina para iates até 40 m.",
    priceUsd: 9_600_000,
    location: "Bazaruto, Moçambique",
    images: [u("1512917774080-9991f1c4c750"), u("1600596542815-ffad4c1539a9")],
    specs: [
      { label: "Área", value: "740 m²" },
      { label: "Quartos", value: "5 bungalows" },
      { label: "Casas de banho", value: "6" },
      { label: "Terreno", value: "Ilha 18 ha" },
    ],
    seller: S.meridian,
    condition: "Excelente",
    tags: ["ilha", "eco-luxo", "heliporto"],
    listedAt: "2026-09-20",
    views: 3890,
    watchers: 295,
  },

  /* ── Jewelry & watches ────────────────────────────────────────────── */
  {
    id: "jew-1",
    category: "jewelry",
    brand: "Patek Philippe",
    title: "Patek Philippe Nautilus 5711/1A-018",
    subtitle: "Mostrador Tiffany Blue · edição final",
    description:
      "Uma das 170 unidades da edição co-assinada com a Tiffany & Co. Caixa e papéis originais, fatura de compra e extrato dos arquivos Patek.",
    priceUsd: 3_250_000,
    location: "Genebra",
    images: [u("1523170335258-f5ed11844a49"), u("1587836374828-4dbafa94cf0e")],
    specs: [
      { label: "Material", value: "Aço" },
      { label: "Quilates / Calibre", value: "Cal. 26-330 S C" },
      { label: "Certificação", value: "Extrato de arquivo" },
      { label: "Ano", value: "2021" },
    ],
    seller: S.vault,
    condition: "Coleção",
    featured: true,
    tags: ["edição limitada", "full set"],
    listedAt: "2026-09-12",
    views: 9120,
    watchers: 880,
  },
  {
    id: "jew-2",
    category: "jewelry",
    brand: "Mikimoto",
    title: "Colar Mikimoto pérolas South Sea",
    subtitle: "Pérolas douradas 13–15 mm · fecho em diamante",
    description:
      "Fiada única de 33 pérolas South Sea douradas de qualidade AAA, graduadas de 13 a 15 mm, com fecho em ouro 18 k e diamantes. Certificado e estojo Mikimoto.",
    priceUsd: 380_000,
    location: "Tóquio",
    images: [u("1515562141207-7a88fb7ce338"), u("1599643478518-a784e5dc4c8f")],
    specs: [
      { label: "Material", value: "Ouro 18 k" },
      { label: "Quilates / Calibre", value: "Pérolas 13–15 mm" },
      { label: "Certificação", value: "Mikimoto" },
      { label: "Ano", value: "2025" },
    ],
    seller: S.vault,
    condition: "Novo",
    tags: ["pérolas", "South Sea"],
    listedAt: "2026-09-19",
    views: 4310,
    watchers: 377,
  },
  {
    id: "jew-3",
    category: "jewelry",
    brand: "Audemars Piguet",
    title: "Royal Oak Perpetual Calendar",
    subtitle: "Cerâmica preta · 41 mm",
    description:
      "Calendário perpétuo com fase lunar astronómica, caixa e bracelete em cerâmica preta. Full set com garantia internacional ativa.",
    priceUsd: 265_000,
    location: "Zurique",
    images: [u("1587836374828-4dbafa94cf0e"), u("1523170335258-f5ed11844a49")],
    specs: [
      { label: "Material", value: "Cerâmica" },
      { label: "Quilates / Calibre", value: "Cal. 5134" },
      { label: "Certificação", value: "Garantia AP" },
      { label: "Ano", value: "2023" },
    ],
    seller: S.vault,
    condition: "Como novo",
    tags: ["complicação", "full set"],
    listedAt: "2026-09-23",
    views: 2780,
    watchers: 219,
  },
  {
    id: "jew-4",
    category: "jewelry",
    brand: "Cartier",
    title: "Colar Panthère esmeraldas",
    subtitle: "Haute Joaillerie · ouro branco 18 k",
    description:
      "Peça única da coleção Panthère com esmeraldas da Colômbia, ónix e 1.214 diamantes. Estojo e certificado Cartier.",
    priceUsd: 890_000,
    location: "Paris",
    images: [u("1599643478518-a784e5dc4c8f"), u("1515562141207-7a88fb7ce338")],
    specs: [
      { label: "Material", value: "Ouro branco 18 k" },
      { label: "Quilates / Calibre", value: "22,4 ct total" },
      { label: "Certificação", value: "Cartier" },
      { label: "Ano", value: "2022" },
    ],
    seller: S.maison,
    condition: "Excelente",
    tags: ["peça única", "esmeralda"],
    listedAt: "2026-09-05",
    views: 3560,
    watchers: 262,
  },

  /* ── Fashion ──────────────────────────────────────────────────────── */
  {
    id: "fas-1",
    category: "fashion",
    brand: "Hermès",
    title: "Birkin 25 Himalaya",
    subtitle: "Crocodilo Niloticus · ferragens em ouro branco e diamantes",
    description:
      "A mala mais cobiçada do mundo, com acabamento Himalaya e fecho em ouro branco 18 k com diamantes. Estado de coleção, nunca usada.",
    priceUsd: 420_000,
    location: "Paris",
    images: [u("1584917865442-de89df76afd3"), u("1490481651871-ab68de25d43d")],
    specs: [
      { label: "Maison", value: "Hermès" },
      { label: "Tamanho", value: "25 cm" },
      { label: "Material", value: "Crocodilo" },
      { label: "Ano", value: "2023" },
    ],
    seller: S.atelier,
    condition: "Coleção",
    featured: true,
    tags: ["icónica", "diamantes"],
    listedAt: "2026-09-16",
    views: 7240,
    watchers: 645,
  },
  {
    id: "fas-2",
    category: "fashion",
    brand: "Chanel",
    title: "Casaco Haute Couture em tweed bordado",
    subtitle: "Coleção Outono/Inverno · peça de passerelle",
    description:
      "Look 12 do desfile de Alta Costura, bordado à mão pela Maison Lesage durante 640 horas. Tamanho 36 com ajustes incluídos.",
    priceUsd: 68_000,
    location: "Milão",
    images: [u("1591047139829-d91aecb6caea"), u("1490481651871-ab68de25d43d")],
    specs: [
      { label: "Maison", value: "Chanel" },
      { label: "Tamanho", value: "FR 36" },
      { label: "Material", value: "Tweed · bordado Lesage" },
      { label: "Ano", value: "2025" },
    ],
    seller: S.atelier,
    condition: "Novo",
    tags: ["alta costura", "passerelle"],
    listedAt: "2026-09-21",
    views: 1840,
    watchers: 133,
  },
  {
    id: "fas-3",
    category: "fashion",
    brand: "Christian Louboutin",
    title: "Scarpin So Kate Strass",
    subtitle: "Edição cristais Swarovski · 120 mm",
    description:
      "Edição limitada coberta de cristais aplicados à mão. Par número 43 de 100, com caixa e sacos de pó originais.",
    priceUsd: 9_800,
    location: "Lisboa",
    images: [u("1543163521-1bf539c55dd2")],
    specs: [
      { label: "Maison", value: "Louboutin" },
      { label: "Tamanho", value: "EU 38" },
      { label: "Material", value: "Cristais Swarovski" },
      { label: "Ano", value: "2024" },
    ],
    seller: S.private,
    condition: "Como novo",
    tags: ["edição limitada"],
    listedAt: "2026-09-24",
    views: 960,
    watchers: 71,
  },
  {
    id: "fas-4",
    category: "fashion",
    brand: "Loro Piana",
    title: "Guarda-roupa Vicuña sob medida",
    subtitle: "Sobretudo + fato · alfaiataria napolitana",
    description:
      "Conjunto em vicunha pura, a fibra mais rara do mundo, confecionado à medida em Nápoles. Inclui três provas no local do comprador.",
    priceUsd: 115_000,
    location: "Nápoles",
    images: [u("1490481651871-ab68de25d43d"), u("1591047139829-d91aecb6caea")],
    specs: [
      { label: "Maison", value: "Loro Piana" },
      { label: "Tamanho", value: "Sob medida" },
      { label: "Material", value: "Vicunha 100%" },
      { label: "Ano", value: "2026" },
    ],
    seller: S.atelier,
    condition: "Novo",
    tags: ["bespoke", "vicunha"],
    listedAt: "2026-09-09",
    views: 1320,
    watchers: 98,
  },

  /* ── Tickets & exclusive events ───────────────────────────────────── */
  {
    id: "tix-1",
    category: "tickets",
    brand: "Formula 1",
    title: "Monaco Grand Prix · Paddock Club",
    subtitle: "Fim de semana completo · pit lane walk · iate na Port Hercule",
    description:
      "Acesso de três dias ao Paddock Club com vista para a reta da meta, pit lane walk, encontro com piloto e receção a bordo de um iate de 60 m.",
    priceUsd: 18_500,
    location: "Mónaco",
    images: [u("1617814076367-b759c7d7e738"), u("1540039155733-5bb30b53aa14")],
    specs: [
      { label: "Data", value: "22–24 mai 2027" },
      { label: "Local", value: "Circuit de Monaco" },
      { label: "Acesso", value: "Paddock Club" },
      { label: "Inclui", value: "Hospitalidade + iate" },
    ],
    seller: S.backstage,
    condition: "Novo",
    featured: true,
    tags: ["F1", "hospitalidade"],
    listedAt: "2026-09-26",
    views: 5410,
    watchers: 690,
    eventDate: "2027-05-22T12:00:00Z",
    stock: 6,
  },
  {
    id: "tix-2",
    category: "tickets",
    brand: "Met Gala",
    title: "Met Gala · mesa patrocinada",
    subtitle: "Convite para 2 · passadeira vermelha · jantar de gala",
    description:
      "Lugares numa mesa patrocinada da gala anual do Costume Institute, com styling consultivo e transporte em limusina. Sujeito a aprovação do comité.",
    priceUsd: 150_000,
    location: "Nova Iorque",
    images: [u("1514525253161-7a46d19cd819"), u("1470229722913-7c0e2dbbafd3")],
    specs: [
      { label: "Data", value: "3 mai 2027" },
      { label: "Local", value: "Metropolitan Museum" },
      { label: "Acesso", value: "Gala + jantar" },
      { label: "Inclui", value: "Styling + limusina" },
    ],
    seller: S.backstage,
    condition: "Novo",
    tags: ["gala", "moda"],
    listedAt: "2026-09-15",
    views: 6980,
    watchers: 812,
    eventDate: "2027-05-03T23:00:00Z",
    stock: 2,
  },
  {
    id: "tix-3",
    category: "tickets",
    brand: "Coldplay",
    title: "Concerto privado · camarote Sky Suite",
    subtitle: "Estádio · 12 lugares · catering Michelin",
    description:
      "Camarote privado com 12 lugares, bar aberto, menu de chef com estrela Michelin e acesso a soundcheck antes do espetáculo.",
    priceUsd: 42_000,
    location: "Wembley, Londres",
    images: [u("1470229722913-7c0e2dbbafd3"), u("1540039155733-5bb30b53aa14")],
    specs: [
      { label: "Data", value: "14 ago 2027" },
      { label: "Local", value: "Wembley Stadium" },
      { label: "Acesso", value: "Sky Suite · 12 pax" },
      { label: "Inclui", value: "Soundcheck + catering" },
    ],
    seller: S.backstage,
    condition: "Novo",
    tags: ["concerto", "camarote"],
    listedAt: "2026-09-22",
    views: 3120,
    watchers: 402,
    eventDate: "2027-08-14T19:30:00Z",
    stock: 3,
  },
  {
    id: "tix-4",
    category: "tickets",
    brand: "UEFA",
    title: "Final da Champions League · Skybox",
    subtitle: "Camarote VIP · encontro com lendas do futebol",
    description:
      "Lugares em skybox na final, com hospitalidade premium, meet & greet com antigos campeões e transfer privado desde o hotel.",
    priceUsd: 24_500,
    location: "Madrid",
    images: [u("1540039155733-5bb30b53aa14"), u("1470229722913-7c0e2dbbafd3")],
    specs: [
      { label: "Data", value: "29 mai 2027" },
      { label: "Local", value: "Estadio Metropolitano" },
      { label: "Acesso", value: "Skybox VIP" },
      { label: "Inclui", value: "Meet & greet + transfer" },
    ],
    seller: S.backstage,
    condition: "Novo",
    tags: ["futebol", "final"],
    listedAt: "2026-09-18",
    views: 4470,
    watchers: 533,
    eventDate: "2027-05-29T19:00:00Z",
    stock: 8,
  },

  /* ── Yachts ───────────────────────────────────────────────────────── */
  {
    id: "yacht-1",
    category: "yachts",
    brand: "Feadship",
    title: 'Feadship 88 m · "Aurora Blue"',
    subtitle: "Superiate · heliporto · beach club",
    description:
      "Superiate holandês com casco em aço e superestrutura em alumínio, 12 hóspedes em 6 suites, beach club com piscina, spa e heliporto certificado.",
    priceUsd: 215_000_000,
    location: "Antibes",
    images: [u("1569263979104-865ab7cd8d13"), u("1567899378494-47b22a2ae96a")],
    specs: [
      { label: "Comprimento", value: "88 m" },
      { label: "Cabines", value: "6 suites" },
      { label: "Velocidade máx.", value: "17 nós" },
      { label: "Ano", value: "2023" },
    ],
    seller: S.azure,
    condition: "Excelente",
    featured: true,
    tags: ["superiate", "heliporto"],
    listedAt: "2026-08-30",
    views: 7820,
    watchers: 468,
  },
  {
    id: "yacht-2",
    category: "yachts",
    brand: "Riva",
    title: "Riva 110' Dolcevita",
    subtitle: "Flybridge · interior Officina Italiana Design",
    description:
      "Iate icónico italiano em fibra com 4 cabines, garagem para tender e jet-ski, e interior em nogueira e pele. Um único proprietário.",
    priceUsd: 14_900_000,
    location: "Porto Cervo",
    images: [u("1567899378494-47b22a2ae96a"), u("1569263979104-865ab7cd8d13")],
    specs: [
      { label: "Comprimento", value: "33,5 m" },
      { label: "Cabines", value: "4" },
      { label: "Velocidade máx.", value: "26 nós" },
      { label: "Ano", value: "2022" },
    ],
    seller: S.azure,
    condition: "Excelente",
    tags: ["flybridge", "italiano"],
    listedAt: "2026-09-11",
    views: 3240,
    watchers: 219,
  },
  {
    id: "yacht-3",
    category: "yachts",
    brand: "Sunreef",
    title: "Sunreef 80 Eco",
    subtitle: "Catamarã solar-elétrico · autonomia oceânica",
    description:
      "Catamarã de luxo com painéis solares integrados no casco, propulsão elétrica silenciosa e alcance transatlântico. Ideal para charter sustentável.",
    priceUsd: 9_400_000,
    location: "Maldivas",
    images: [u("1540946485063-a40da27545f8"), u("1569263979104-865ab7cd8d13")],
    specs: [
      { label: "Comprimento", value: "24 m" },
      { label: "Cabines", value: "5" },
      { label: "Velocidade máx.", value: "15 nós" },
      { label: "Ano", value: "2025" },
    ],
    seller: S.azure,
    condition: "Novo",
    tags: ["solar", "catamarã"],
    listedAt: "2026-09-24",
    views: 2150,
    watchers: 176,
  },

  /* ── Private jets ─────────────────────────────────────────────────── */
  {
    id: "jet-1",
    category: "jets",
    brand: "Gulfstream",
    title: "Gulfstream G700",
    subtitle: "Ultra long range · 5 áreas de cabine",
    description:
      "A maior cabine da categoria, com suite principal, chuveiro, cozinha de chef e 20 janelas panorâmicas. Programa de manutenção RSG incluído.",
    priceUsd: 78_000_000,
    location: "Farnborough",
    images: [u("1540962351504-03099e0a754b"), u("1583416750470-965b2707b355")],
    specs: [
      { label: "Alcance", value: "13.890 km" },
      { label: "Passageiros", value: "19" },
      { label: "Horas de voo", value: "410 h" },
      { label: "Ano", value: "2024" },
    ],
    seller: S.skyline,
    condition: "Como novo",
    featured: true,
    tags: ["ULR", "suite"],
    listedAt: "2026-09-07",
    views: 5980,
    watchers: 384,
  },
  {
    id: "jet-2",
    category: "jets",
    brand: "Bombardier",
    title: "Bombardier Global 8000",
    subtitle: "O jato executivo mais rápido · Mach 0.94",
    description:
      "Cabine Nuage com cadeiras de gravidade zero e altitude de cabine de 2.900 ft. Interior personalizado com escritório e quarto.",
    priceUsd: 81_500_000,
    location: "Genebra",
    images: [u("1583416750470-965b2707b355"), u("1474302770737-173ee21bab63")],
    specs: [
      { label: "Alcance", value: "14.800 km" },
      { label: "Passageiros", value: "17" },
      { label: "Horas de voo", value: "120 h" },
      { label: "Ano", value: "2025" },
    ],
    seller: S.skyline,
    condition: "Novo",
    tags: ["Mach 0.94", "Nuage"],
    listedAt: "2026-09-19",
    views: 4120,
    watchers: 297,
  },
  {
    id: "jet-3",
    category: "jets",
    brand: "Dassault",
    title: "Falcon 6X",
    subtitle: "Cabine mais larga · pista curta",
    description:
      "Tri-zona com teto de vidro (Skylight), cabine de 1,98 m de altura e capacidade de operar em aeroportos de pista curta como London City.",
    priceUsd: 47_000_000,
    location: "Paris Le Bourget",
    images: [u("1474302770737-173ee21bab63"), u("1540962351504-03099e0a754b")],
    specs: [
      { label: "Alcance", value: "10.186 km" },
      { label: "Passageiros", value: "16" },
      { label: "Horas de voo", value: "640 h" },
      { label: "Ano", value: "2023" },
    ],
    seller: S.skyline,
    condition: "Excelente",
    tags: ["pista curta", "Skylight"],
    listedAt: "2026-09-03",
    views: 2760,
    watchers: 188,
  },
];
