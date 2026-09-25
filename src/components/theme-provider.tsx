"use client";
import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from "react";

export type ThemeMode="light"|"dark"|"system";
type ThemeContextValue={theme:ThemeMode;setTheme:(theme:ThemeMode)=>void};

const ThemeContext=createContext<ThemeContextValue|null>(null);

function readTheme():ThemeMode{
 if(typeof window==="undefined")return "system";
 const saved=window.localStorage.getItem("shyraq-theme");
 return saved==="light"||saved==="dark"||saved==="system"?saved:"system";
}
function applyTheme(theme:ThemeMode){
 const root=document.documentElement;
 const dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
 root.classList.toggle("dark",dark);
 root.style.colorScheme=dark?"dark":"light";
}
export function ThemeProvider({children}:{children:ReactNode}){
 const [theme,setThemeState]=useState<ThemeMode>("system");
 useEffect(()=>{
  const next=readTheme();setThemeState(next);applyTheme(next);
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const onChange=()=>{if(readTheme()==="system")applyTheme("system");};
  media.addEventListener("change",onChange);
  return()=>media.removeEventListener("change",onChange);
 },[]);
 useEffect(()=>{if(typeof window==="undefined")return;window.localStorage.setItem("shyraq-theme",theme);applyTheme(theme);},[theme]);
 const value=useMemo(()=>({theme,setTheme:setThemeState}),[theme]);
 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(){
 const value=useContext(ThemeContext);if(!value)throw new Error("useTheme must be used inside ThemeProvider");return value;
}
