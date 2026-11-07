import { create } from 'zustand';
import { NumberFormatMode } from '../utils/format';

export type TabId =
  | 'dashboard'
  | 'company'
  | 'market'
  | 'people'
  | 'institutions'
  | 'startups'
  | 'wife'
  | 'news'
  | 'finance'
  | 'settings';

interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface UIStore {
  activeTab: TabId;
  theme: 'dark' | 'light';
  numberFormat: NumberFormatMode;
  autoPlay: boolean;
  autoPlaySpeed: 1 | 2 | 4; // 1x, 2x, 4x
  isMoreMenuOpen: boolean;
  isFounderSetupOpen: boolean;
  toasts: Toast[];
  setActiveTab: (tab: TabId) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setNumberFormat: (mode: NumberFormatMode) => void;
  toggleAutoPlay: () => void;
  setAutoPlaySpeed: (speed: 1 | 2 | 4) => void;
  setMoreMenuOpen: (open: boolean) => void;
  setFounderSetupOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'dashboard',
  theme: 'dark',
  numberFormat: 'indian',
  autoPlay: false,
  autoPlaySpeed: 1,
  isMoreMenuOpen: false,
  isFounderSetupOpen: false,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab, isMoreMenuOpen: false }),

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setNumberFormat: (numberFormat) => set({ numberFormat }),

  toggleAutoPlay: () => set((s) => ({ autoPlay: !s.autoPlay })),

  setAutoPlaySpeed: (autoPlaySpeed) => set({ autoPlaySpeed }),

  setMoreMenuOpen: (isMoreMenuOpen) => set({ isMoreMenuOpen }),

  setFounderSetupOpen: (isFounderSetupOpen) => set({ isFounderSetupOpen }),

  showToast: (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
