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
    const saved = localStorage.getItem('voicecart_theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to dark mode for the premium neon voice aesthetic
    return 'dark';
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    const saved = localStorage.getItem('voicecart_density');
    if (saved === 'comfortable' || saved === 'compact') {
      return saved;
    }
    return 'compact'; // Default to compact screen layout
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('voicecart_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    document.documentElement.classList.remove('comfortable', 'compact');
    document.documentElement.classList.add(`density-${density}`);
    localStorage.setItem('voicecart_density', density);
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
