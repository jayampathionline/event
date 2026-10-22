import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'bw-dark' | 'bw-light' | 'classic';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isBW: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'bw-dark',
  setTheme: () => {},
  isBW: true,
  isLight: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ticketpulse_theme') as AppTheme;
      if (saved && ['bw-dark', 'bw-light', 'classic'].includes(saved)) {
        return saved;
      }
    }
    return 'bw-dark'; // Default to Black and White Dark per user request
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticketpulse_theme', newTheme);
    }
  };

  const isBW = theme === 'bw-dark' || theme === 'bw-light';
  const isLight = theme === 'bw-light';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-bw-dark', 'theme-bw-light', 'theme-classic');
    root.classList.add(`theme-${theme}`);
    if (isLight) {
      document.body.classList.remove('bg-neutral-950', 'text-neutral-100');
      document.body.classList.add('bg-white', 'text-neutral-900');
    } else {
      document.body.classList.remove('bg-white', 'text-neutral-900');
      document.body.classList.add('bg-neutral-950', 'text-neutral-100');
    }
  }, [theme, isLight]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isBW, isLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
