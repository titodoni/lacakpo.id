'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeKey, DEFAULT_THEME, themes } from './color-palette-engine';

// Re-export ThemeKey for convenience
export type { ThemeKey };

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  availableThemes: { key: ThemeKey; name: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'kreasilog-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage or system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null;
    if (stored && themes[stored]) {
      setThemeState(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', DEFAULT_THEME);
    }
  }, []);

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const availableThemes = Object.entries(themes).map(([key, theme]) => ({
    key: key as ThemeKey,
    name: theme.name,
  }));

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme switcher component
export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeKey)}
        className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
      >
        {availableThemes.map((t) => (
          <option key={t.key} value={t.key}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
