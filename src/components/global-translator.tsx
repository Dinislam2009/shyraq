"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";

import {extendedTranslations} from "@/lib/i18n-catalog";

type TranslationLookup=Record<string,{kk:string;ru:string;en:string}>;
const translationLookup=extendedTranslations as TranslationLookup;
function normalize(s: string) { return s.replace(/\s+/g, " ").trim(); }

function dynamicTranslation(raw: string, locale: "kk" | "ru" | "en") {
  let m = raw.match(/^(\d+) (cards|карта|карточек|карт)$/); if (m) return `${m[1]} ${locale === "kk" ? "карта" : locale === "ru" ? "карточек" : "cards"}`;
  m = raw.match(/^(\d+) (reviews|қайталау|повторений)$/); if (m) return `${m[1]} ${locale === "kk" ? "қайталау" : locale === "ru" ? "повторений" : "reviews"}`;
  m = raw.match(/^(\d+) (responses recorded|жауап тіркелді|ответов записано)$/); if (m) return `${m[1]} ${locale === "kk" ? "жауап тіркелді" : locale === "ru" ? "ответов записано" : "responses recorded"}`;
  m = raw.match(/^(\d+) (min|мин)$/); if (m) return `${m[1]} ${locale === "kk" || locale === "ru" ? "мин" : "min"}`;
  m = raw.match(/^(\d+) visible of (\d+)\. Search, filter and edit without leaving the deck\.$/); if (m) return locale === "kk" ? `${m[1]} көрінуде, барлығы ${m[2]}. Колодадан шықпай іздеңіз, сүзіңіз және өңдеңіз.` : locale === "ru" ? `${m[1]} отображается из ${m[2]}. Ищите, фильтруйте и редактируйте, не покидая колоду.` : raw;
  return null;
}

export function GlobalTranslator() {
  const { locale } = useI18n();
  useEffect(() => {
    const reverse = new Map<string,string>();
    Object.entries(extendedTranslations).forEach(([key,value]) => {
      reverse.set(key,key);
      reverse.set(value.kk,key);
      reverse.set(value.ru,key);
      reverse.set(value.en,key);
    });

    const translateTextNode = (node: Node) => {
      if (!node.parentElement) return;
      const parent = node.parentElement;
      if (
        parent.closest(
          'input,textarea,pre,code,[contenteditable="true"],[data-shyraq-i18n-ignore],.shyraq-anki-template'
        )
      ) return;
      const raw = normalize(node.textContent || "");
      if (!raw) return;
      const key = reverse.get(raw);
      const next = key ? translationLookup[key][locale] : dynamicTranslation(raw, locale);
      if (next && node.textContent !== next) node.textContent = next;
    };

    const translateRoot = (root: ParentNode) => {
      const selector = "[data-shyraq-i18n],input[placeholder],textarea[placeholder]";
      root.querySelectorAll?.(selector).forEach(node => {
        const element = node as HTMLElement & HTMLInputElement;
        if (element.hasAttribute("data-shyraq-i18n-ignore")) return;
        if (element.hasAttribute("data-shyraq-i18n")) {
          const key = element.getAttribute("data-shyraq-i18n");
          if (key && translationLookup[key]) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const textNodes: Node[] = [];
            let textNode: Node | null;
            while ((textNode = walker.nextNode())) textNodes.push(textNode);
            const lastText = textNodes.at(-1);
            if (lastText) lastText.textContent = translationLookup[key][locale];
          }
        }
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          const raw = element.getAttribute("data-shyraq-placeholder") || element.getAttribute("placeholder") || "";
          const key = reverse.get(raw);
          if (key) {
            element.setAttribute("data-shyraq-placeholder", key);
            element.setAttribute("placeholder", translationLookup[key][locale]);
          }
        }
      });
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateTextNode(node);
    };

    translateRoot(document.body);
    let frame = 0;
    const pendingRoots = new Set<Node>();
    const flush = () => {
      frame = 0;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      roots.forEach(root => {
        if (root instanceof CharacterData) translateTextNode(root);
        else translateRoot(root as ParentNode);
      });
    };
    const schedule = (root: Node) => {
      pendingRoots.add(root);
      if (!frame) frame = window.requestAnimationFrame(flush);
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          schedule(mutation.target);
        } else {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) schedule(node);
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [locale]);
  return null;
}
