import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  effective: EffectiveTheme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'bookwise-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveEffective(theme: Theme): EffectiveTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system',
  );
  const [effective, setEffective] = useState<EffectiveTheme>(() => resolveEffective(theme));

  useEffect(() => {
    const applied = resolveEffective(theme);
    setEffective(applied);
    document.documentElement.classList.toggle('dark', applied === 'dark');

    if (theme !== 'system') return;
    // Acompanha mudancas do sistema quando no modo automatico.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const next = systemPrefersDark() ? 'dark' : 'light';
      setEffective(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, effective, setTheme }),
    [theme, effective],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
