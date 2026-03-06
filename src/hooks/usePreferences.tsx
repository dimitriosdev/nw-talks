"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  getTranslations,
  type AppTranslations,
  type Language,
  type ThemeMode,
} from "@/lib/localization";

interface PreferencesState {
  language: Language;
  setLanguage: (value: Language) => void;
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  texts: AppTranslations;
}

const STORAGE_KEY = "nw-talks-preferences";

function getStoredPreferences(): { language: Language; theme: ThemeMode } {
  if (typeof window === "undefined") {
    return { language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME };
  }

  try {
    const parsed = JSON.parse(raw) as {
      language?: Language;
      theme?: ThemeMode;
    };

    return {
      language:
        parsed.language === "el" || parsed.language === "en"
          ? parsed.language
          : DEFAULT_LANGUAGE,
      theme:
        parsed.theme === "light" || parsed.theme === "dark"
          ? parsed.theme
          : DEFAULT_THEME,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return { language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME };
  }
}

const PreferencesContext = createContext<PreferencesState>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => undefined,
  theme: DEFAULT_THEME,
  setTheme: () => undefined,
  texts: getTranslations(DEFAULT_LANGUAGE),
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Sync from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    const prefs = getStoredPreferences();
    if (prefs.language !== language) setLanguage(prefs.language);
    if (prefs.theme !== theme) setTheme(prefs.theme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, theme }),
    );
  }, [language, theme, mounted]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.classList.toggle("dark", theme === "dark");
  }, [language, theme]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      texts: getTranslations(language),
    }),
    [language, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
