import { create } from 'zustand';

interface NavigationState {
  currentPath: string;
  isInitialLoad: boolean;
  setCurrentPath: (path: string) => void;
  setInitialLoadComplete: () => void;
  syncFromRoute: (path: string) => void;
}

export const APP_ROUTES = [
  '/dashboard',
  '/ai-engine',
  '/my-notes',
  '/flashcards',
  '/supervisor',
  '/flow-chamber',
];

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: '/dashboard',
  isInitialLoad: true,

  setCurrentPath: (path: string) => {
    set({ currentPath: path });
  },

  setInitialLoadComplete: () => {
    set({ isInitialLoad: false });
  },

  syncFromRoute: (path: string) => {
    set({ currentPath: path });
  },
}));
