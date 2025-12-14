'use client';

import { useEffect } from 'react';
import { useThemeStore, initializeTheme } from '@/store/theme-store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, accentColor, resolvedTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on mount
    initializeTheme();
  }, []);

  // Re-apply theme when it changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    
    // Apply accent color
    root.setAttribute('data-accent', accentColor);
  }, [resolvedTheme, accentColor]);

  return <>{children}</>;
}
