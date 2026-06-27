import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const VALID_THEMES: readonly Theme[] = ['light', 'dark'];

function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem('theme');
    return saved && VALID_THEMES.includes(saved as Theme) ? (saved as Theme) : null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = readSavedTheme();
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage unavailable or quota exceeded - silently degrade
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
} 