import type { Deck } from "@/lib/types";

export const demoDecks: Deck[] = [
  {
    id: "english-b2",
    name: "English B2",
    description: "Vocabulary and useful expressions",
    cards: 1240,
    due: 42,
    newCards: 18,
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "informatics",
    name: "Informatics",
    description: "Algorithms, databases and programming",
    cards: 860,
    due: 27,
    newCards: 12,
    color: "bg-sky-100 text-sky-700",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    description: "Formulas and problem-solving concepts",
    cards: 540,
    due: 16,
    newCards: 8,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "biology",
    name: "Biology",
    description: "Core concepts and terminology",
    cards: 390,
    due: 9,
    newCards: 5,
    color: "bg-violet-100 text-violet-700",
  },
];