import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarAutoCollapse: boolean;
  setSidebarAutoCollapse: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('collaboost-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [sidebarAutoCollapse, setSidebarAutoCollapse] = useState(() => {
    const saved = localStorage.getItem('collaboost-sidebar-auto-collapse');
    return saved === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('collaboost-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('collaboost-sidebar-auto-collapse', sidebarAutoCollapse.toString());
  }, [sidebarAutoCollapse]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      sidebarAutoCollapse,
      setSidebarAutoCollapse
    }}>
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