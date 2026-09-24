import type { NavItem } from "@/lib/types";

export const mainNavigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/decks", label: "My decks", icon: "layers" },
  { href: "/review", label: "Review", icon: "play" },
  { href: "/statistics", label: "Statistics", icon: "bar-chart" },
];

export const secondaryNavigation: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
];