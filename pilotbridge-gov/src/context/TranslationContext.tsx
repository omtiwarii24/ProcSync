"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

type Lang = "EN" | "HI";

interface TranslationContextType {
  language: Lang;
  setLanguage: (l: Lang) => void;
  translating: boolean;
  refreshTranslation: () => void;
  mounted: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    return { language: "EN" as Lang, setLanguage: () => {}, translating: false, refreshTranslation: () => {}, mounted: true };
  }
  return ctx;
}

/**
 * Walks an element collecting unique visible text nodes worth translating.
 * Skips scripts, styles, inputs, and preserves short numeric/symbol strings.
 */
function collectStrings(root: HTMLElement): { nodes: Text[]; strings: string[] } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      const text = (node.textContent || "").trim();
      if (text.length < 2 || text.length > 300) return NodeFilter.FILTER_REJECT;
      // Skip pure numbers/punct/symbols
      if (!/[a-zA-Z\u00C0-\u024F]{2,}/.test(text)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const seen = new Set<string>();
  const nodes: Text[] = [];
  const strings: string[] = [];

  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const value = textNode.nodeValue?.trim() ?? "";
    if (value && !seen.has(value)) {
      seen.add(value);
      nodes.push(textNode);
      strings.push(value);
    }
    current = walker.nextNode();
  }

  return { nodes, strings };
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // Always start as EN so SSR output matches the first client render (no hydration mismatch)
  const [language, setLanguageState] = useState<Lang>("EN");
  const [translating, setTranslating] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Maps original English -> Hindi translation (persists across toggles)
  const cacheRef = useRef<Map<string, string>>(new Map());
  // Stores original English text so we can swap back
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const runIdRef = useRef(0);

  const applyLanguage = useCallback(async (target: Lang) => {
    const runId = ++runIdRef.current;
    const root = document.body;
    if (!root) return;

    // EN: restore originals (no API call)
    if (target === "EN") {
      const { nodes } = collectStrings(root);
      for (const node of nodes) {
        const original = originalsRef.current.get(node);
        if (original && node.nodeValue !== original) {
          node.nodeValue = original;
        }
      }
      return;
    }

    // HI: translate
    const { nodes, strings } = collectStrings(root);
    if (!strings.length) return;

    // Apply cached translations instantly
    const uncached: { node: Text; value: string }[] = [];
    for (const node of nodes) {
      const value = node.nodeValue?.trim() ?? "";
      if (!originalsRef.current.has(node)) {
        originalsRef.current.set(node, value);
      }
      const cached = cacheRef.current.get(value);
      if (cached) {
        node.nodeValue = cached;
      } else {
        uncached.push({ node, value });
      }
    }
    if (!uncached.length) return;

    setTranslating(true);
    try {
      const chunkSize = 30;
      for (let i = 0; i < uncached.length; i += chunkSize) {
        if (runIdRef.current !== runId) return;
        const chunk = uncached.slice(i, i + chunkSize);
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strings: chunk.map((c) => c.value) }),
        });
        if (!res.ok) throw new Error("translate failed");
        const data = (await res.json()) as { translations: string[] };
        chunk.forEach((c, idx) => {
          const translated = data.translations?.[idx];
          if (translated) {
            cacheRef.current.set(c.value, translated);
            if (runIdRef.current === runId) {
              c.node.nodeValue = translated;
            }
          }
        });
      }
    } catch {
      // stay in English on failure; caller shows nothing
    } finally {
      if (runIdRef.current === runId) setTranslating(false);
    }
  }, []);

  const setLanguage = useCallback(
    (next: Lang) => {
      setLanguageState(next);
      window.localStorage.setItem("procsync_lang", next);
      void applyLanguage(next);
    },
    [applyLanguage]
  );

  const refreshTranslation = useCallback(() => {
    if (language === "HI") void applyLanguage("HI");
  }, [language, applyLanguage]);

  // Restore saved language AFTER hydration completes (safe to diverge from SSR then)
  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem("procsync_lang");
    if (saved === "HI") {
      setLanguageState("HI");
      const timer = window.setTimeout(() => void applyLanguage("HI"), 800);
      return () => window.clearTimeout(timer);
    }
  }, [applyLanguage]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translating, refreshTranslation, mounted }}>
      {children}
    </TranslationContext.Provider>
  );
}
