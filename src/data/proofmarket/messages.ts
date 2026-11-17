/** Demo direct messages. Fictional people; one request is a scripted scam. */
import { ME_ID } from "./seed";

export type Folder = "principal" | "geral" | "pedidos";

export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  at: number;
}

export interface Conversation {
  id: string;
  authorId?: string;
  name: string;
  initials: string;
  verified: boolean;
  folder: Folder;
  note?: string;
  unread: number;
  messages: Message[];
}

const now = Date.now();
const min = (m: number) => now - m * 60_000;

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "dm-ines",
    authorId: "ines",
    name: "Inês Tembe",
    initials: "IT",
    verified: true,
    folder: "principal",
    note: "Revisão NVDA em março",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Vi a contra-tese do Rui à minha premissa 1. Tens dados sobre os contratos de 2026?",
        at: min(2),
      },
    ],
  },
  {
    id: "dm-rui",
    authorId: "rui",
    name: "Rui Massingue",
    initials: "RM",
    verified: true,
    folder: "principal",
    note: "IPC sai dia 10",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "me",
        text: "A banda de ±3% do metical inclui as semanas de feriado?",
        at: min(80),
      },
      {
        id: "m2",
        from: "them",
        text: "Inclui. Usei a taxa de referência diária do banco central.",
        at: min(12),
      },
    ],
  },
  {
    id: "dm-clara",
    authorId: "clara",
    name: "Clara Nhantumbo",
    initials: "CN",
    verified: true,
    folder: "principal",
    unread: 0,
    messages: [
      { id: "m1", from: "me", text: "Obrigado pela fonte sobre a Tesla.", at: min(200) },
      { id: "m2", from: "them", text: "De nada. Está no contraditório da tese.", at: min(190) },
    ],
  },
  {
    id: "dm-iap",
    authorId: "iap",
    name: "Instituto Austral de Pesquisa",
    initials: "IA",
    verified: true,
    folder: "geral",
    note: "Novo relatório GNL",
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Publicámos nova evidência sobre o calendário do GNL. A tese continua inconclusiva.",
        at: min(60 * 26),
      },
    ],
  },
  {
    id: "dm-jorge",
    authorId: "jorge",
    name: "Jorge Cossa",
    initials: "JC",
    verified: true,
    folder: "geral",
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Vou rever a tese da Tesla esta semana.", at: min(60 * 48) },
    ],
  },
  {
    id: "dm-req1",
    name: "Sinais Premium MZ",
    initials: "SP",
    verified: false,
    folder: "pedidos",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Entre no meu grupo VIP. Lucro garantido de 20% por semana, envie 500 MT por M-Pesa para 84 000 0000.",
        at: min(30),
      },
    ],
  },
];

export const MY_NOTE_OWNER = ME_ID;
