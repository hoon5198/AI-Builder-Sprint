import React, { createContext, useContext, useMemo, useState } from 'react';
import { lightColors, darkColors, ThemeColors } from './theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const colors = mode === 'dark' ? darkColors : lightColors;
  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  const value = useMemo(() => ({ mode, colors, toggleTheme }), [mode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}