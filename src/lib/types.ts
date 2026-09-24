export type Deck = {
  id: string;
  name: string;
  description: string;
  cards: number;
  due: number;
  newCards: number;
  color: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "layers" | "play" | "bar-chart" | "settings";
};