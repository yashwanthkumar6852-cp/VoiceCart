import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
export type DensityMode = 'comfortable' | 'compact';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  density: DensityMode;
  toggleDensity: () => void;
  setDensity: (density: DensityMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('voicecart_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem('voicecart_density');
      if (saved === 'comfortable' || saved === 'compact') {
        return saved;
      }
    } catch {}
    return 'compact';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem('voicecart_theme', theme);
    } catch {}
  }, [theme]);

  // Preserve system preference listener without overriding explicitly selected theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem('voicecart_theme');
        if (!saved) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch {}
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    document.documentElement.classList.remove('comfortable', 'compact');
    document.documentElement.classList.add(`density-${density}`);
    try {
      localStorage.setItem('voicecart_density', density);
    } catch {}
  }, [density]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleDensity = () => {
    setDensityState((prev) => (prev === 'compact' ? 'comfortable' : 'compact'));
  };

  const setDensity = (newDensity: DensityMode) => {
    setDensityState(newDensity);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, density, toggleDensity, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
