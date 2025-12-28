import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import translations from JSON files
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import ru from '@/locales/ru.json';
import ro from '@/locales/ro.json';
import hi from '@/locales/hi.json';
import fa from '@/locales/fa.json';

// =============================================================================
// TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'orange';
export type SidebarMode = 'expanded' | 'collapsed' | 'autohide';
export type Language = 'en' | 'de' | 'es' | 'fr' | 'ru' | 'ro' | 'hi' | 'fa';

export interface AccentColorConfig {
  name: string;
  value: AccentColor;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  gradient: string;
}

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

// =============================================================================
// LANGUAGE CONFIGURATIONS
// =============================================================================

export const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
];

// =============================================================================
// TRANSLATIONS - Loaded from JSON files in src/locales/
// =============================================================================

export const translations: Record<Language, Record<string, string>> = {
  en,
  de,
  es,
  fr,
  ru,
  ro,
  hi,
  fa,
};

// =============================================================================
// ACCENT COLORS
// =============================================================================

export const accentColors: AccentColorConfig[] = [
  {
    name: 'Emerald',
    value: 'emerald',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Blue',
    value: 'blue',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#dbeafe',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Violet',
    value: 'violet',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#ede9fe',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Rose',
    value: 'rose',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: '#ffe4e6',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Amber',
    value: 'amber',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fef3c7',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Cyan',
    value: 'cyan',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: '#cffafe',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'Orange',
    value: 'orange',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: '#ffedd5',
    gradient: 'from-orange-500 to-red-600',
  },
];

// =============================================================================
// THEME STATE INTERFACE
// =============================================================================

interface ThemeState {
  // State
  themeMode: ThemeMode;
  accentColor: AccentColor;
  sidebarMode: SidebarMode;
  language: Language;
  resolvedTheme: 'light' | 'dark';
  sidebarExpanded: boolean;
  sidebarHovered: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setLanguage: (lang: Language) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setSidebarHovered: (hovered: boolean) => void;
  toggleSidebar: () => void;

  // Helpers
  getAccentConfig: () => AccentColorConfig;
  getSidebarWidth: () => number;
  t: (key: string) => string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      themeMode: 'dark',
      accentColor: 'emerald',
      sidebarMode: 'expanded',
      language: 'en',
      resolvedTheme: 'dark',
      sidebarExpanded: true,
      sidebarHovered: false,

      // Theme mode
      setThemeMode: (mode) => {
        const resolved = resolveTheme(mode);
        set({ themeMode: mode, resolvedTheme: resolved });

        // Apply to document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolved);
          root.setAttribute('data-theme', resolved);
        }
      },

      // Accent color
      setAccentColor: (color) => {
        set({ accentColor: color });

        // Apply CSS variables
        if (typeof document !== 'undefined') {
          const config = accentColors.find((c) => c.value === color);
          if (config) {
            const root = document.documentElement;
            root.style.setProperty('--accent-primary', config.primary);
            root.style.setProperty('--accent-primary-hover', config.primaryHover);
            root.style.setProperty('--accent-primary-light', config.primaryLight);
            root.setAttribute('data-accent', color);
          }
        }
      },

      // Language
      setLanguage: (lang) => {
        set({ language: lang });

        // Apply to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('lang', lang);
        }
      },

      // Sidebar mode
      setSidebarMode: (mode) => {
        set({
          sidebarMode: mode,
          sidebarExpanded: mode === 'expanded',
        });
      },

      setSidebarExpanded: (expanded) => {
        set({ sidebarExpanded: expanded });
      },

      setSidebarHovered: (hovered) => {
        const { sidebarMode } = get();
        if (sidebarMode === 'autohide') {
          set({ sidebarExpanded: hovered, sidebarHovered: hovered });
        } else {
          set({ sidebarHovered: hovered });
        }
      },

      toggleSidebar: () => {
        const { sidebarMode, sidebarExpanded } = get();
        if (sidebarMode === 'collapsed' || sidebarMode === 'expanded') {
          set({
            sidebarMode: sidebarExpanded ? 'collapsed' : 'expanded',
            sidebarExpanded: !sidebarExpanded,
          });
        }
      },

      // Helpers
      getAccentConfig: () => {
        const { accentColor } = get();
        return accentColors.find((c) => c.value === accentColor) || accentColors[0];
      },

      getSidebarWidth: () => {
        const { sidebarMode, sidebarExpanded, sidebarHovered } = get();

        if (sidebarMode === 'expanded') return 288; // 72 * 4 = w-72
        if (sidebarMode === 'collapsed') return 80; // w-20
        if (sidebarMode === 'autohide') {
          return sidebarHovered ? 288 : 0;
        }
        return sidebarExpanded ? 288 : 80;
      },

      // Translation helper
      t: (key: string) => {
        const { language } = get();
        return translations[language]?.[key] || translations['en'][key] || key;
      },
    }),
    {
      name: 'primebalance-theme',
      partialize: (state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        sidebarMode: state.sidebarMode,
        language: state.language,
      }),
    }
  )
);

// =============================================================================
// INITIALIZATION HOOK
// =============================================================================

export function initializeTheme() {
  const store = useThemeStore.getState();

  // Apply theme
  store.setThemeMode(store.themeMode);
  store.setAccentColor(store.accentColor);
  store.setLanguage(store.language);

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (store.themeMode === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        useThemeStore.setState({ resolvedTheme: resolved });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      }
    });
  }
}
