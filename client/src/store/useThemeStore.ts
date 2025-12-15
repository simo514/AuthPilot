import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================
// THEME STORE STATE
// ============================================

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  // State
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// ============================================
// THEME STORE
// ============================================

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        theme: 'system',
        sidebarCollapsed: false,
        sidebarOpen: true,

        // Actions
        setTheme: (theme) => {
          set({ theme });
        },

        toggleTheme: () => {
          const { theme } = get();
          const newTheme = theme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme });
        },

        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }));
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },

        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },
      }),
      {
        name: 'theme-storage',
      }
    )
  )
);
