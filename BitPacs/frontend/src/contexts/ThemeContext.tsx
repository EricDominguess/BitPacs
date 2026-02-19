import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  // Novos campos para animação
  enableAnimations: boolean;
  toggleAnimations: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // 1. Lógica do Tema (Mantida igual)
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('bitpacs-theme');
    return (stored as Theme) || 'light';
  });

  // 2. Lógica das Animações (Nova)
  const [enableAnimations, setEnableAnimations] = useState(() => {
    const stored = localStorage.getItem('bitpacs-animations');
    // Padrão é true (ligado) se não tiver nada salvo
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('bitpacs-theme', theme);
    
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Efeito "Kill Switch" para Animações
  useEffect(() => {
    localStorage.setItem('bitpacs-animations', String(enableAnimations));
    const body = document.body;
    
    if (!enableAnimations) {
      body.classList.add('disable-animations'); // Adiciona a classe matadora
    } else {
      body.classList.remove('disable-animations');
    }
  }, [enableAnimations]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleAnimations = () => {
    setEnableAnimations(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, enableAnimations, toggleAnimations }}>
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