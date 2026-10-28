import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ThemeMode } from '../types';

export function useTheme() {
  const settings = useLiveQuery(() => db.appSettings.get('app_settings'));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('studybuddy_theme') as ThemeMode) || 'system';
  });

  // Sync with DB settings if available
  useEffect(() => {
    if (settings?.theme && settings.theme !== themeMode) {
      setThemeMode(settings.theme);
      localStorage.setItem('studybuddy_theme', settings.theme);
    }
  }, [settings?.theme]);

  // Apply class to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  const updateTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('studybuddy_theme', mode);
    await db.appSettings.update('app_settings', { theme: mode });
  }, []);

  return {
    theme: themeMode,
    setTheme: updateTheme,
  };
}
