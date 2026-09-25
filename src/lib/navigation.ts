import type {NavItem} from "@/lib/types";
export const mainNavigation:NavItem[]=[
 {href:"/dashboard",label:"Dashboard",icon:"home"},
 {href:"/decks",label:"My decks",icon:"layers"},
 {href:"/review",label:"Review",icon:"play"},
 {href:"/statistics",label:"Statistics",icon:"bar-chart"}
];
export const secondaryNavigation:NavItem[]=[
 {href:"/explore",label:"Public decks",icon:"layers"},
 {href:"/collections",label:"Collections",icon:"layers"},
 {href:"/import",label:"Import",icon:"settings"},
 {href:"/export",label:"Export",icon:"settings"},
 {href:"/settings/profile",label:"Profile",icon:"settings"},
 {href:"/settings/review",label:"Review settings",icon:"settings"},
 {href:"/settings/sync",label:"Sync",icon:"settings"},
 {href:"/settings/moderation",label:"Moderation",icon:"settings"},
 {href:"/settings/workspace",label:"Workspace",icon:"settings"},
 {href:"/settings",label:"Settings",icon:"settings"}
];