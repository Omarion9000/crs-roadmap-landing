"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem("crs_ui_lang");
    return v === "en" || v === "es" ? v : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem("crs_ui_lang", next);
      // Set a cookie so server components can read it on next navigation
      document.cookie = `crs_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      // Dispatch event for any legacy listeners (SimulatorMVP, etc.)
      window.dispatchEvent(new CustomEvent("crs-ui-lang-change", { detail: next }));
    } catch {
      // ignore storage/cookie failures
    }
  }, []);

  // Sync when another tab or legacy component fires the event
  useEffect(() => {
    const handler = (e: Event) => {
      const next =
        e instanceof CustomEvent && (e.detail === "en" || e.detail === "es")
          ? (e.detail as Lang)
          : null;
      if (next) setLangState(next);
    };
    window.addEventListener("crs-ui-lang-change", handler);
    return () => window.removeEventListener("crs-ui-lang-change", handler);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string =>
      (translations[lang] as Record<string, string>)[key] ??
      (translations.en as Record<string, string>)[key] ??
      key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
