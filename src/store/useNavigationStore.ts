import { create } from 'zustand';

type View = 'galaxy' | 'warping' | 'planet';

interface NavigationState {
  view: View;
  targetPlanet: string | null;
  warpProgress: number;
  isReturning: boolean;
  isInitialLoad: boolean;
  warpTo: (planetPath: string, animate?: boolean) => void;
  returnToGalaxy: (animate?: boolean) => void;
  setWarpProgress: (p: number) => void;
  setView: (view: View) => void;
  setInitialLoadComplete: () => void;
  syncFromRoute: (path: string) => void;
}

export const PLANET_PATHS = ['/dashboard', '/ai-engine', '/my-notes', '/flow-chamber'];

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: 'galaxy',
  targetPlanet: null,
  warpProgress: 0,
  isReturning: false,
  isInitialLoad: true,

  warpTo: (planetPath: string, animate = true) => {
    if (animate) {
      set({
        view: 'warping',
        targetPlanet: planetPath,
        warpProgress: 0,
        isReturning: false,
      });
    } else {
      set({
        view: 'planet',
        targetPlanet: planetPath,
        warpProgress: 1,
        isReturning: false,
      });
    }
  },

  returnToGalaxy: (animate = true) => {
    if (animate) {
      set({
        view: 'warping',
        warpProgress: 1,
        isReturning: true,
      });
    } else {
      set({
        view: 'galaxy',
        targetPlanet: null,
        warpProgress: 0,
        isReturning: false,
      });
    }
  },

  setWarpProgress: (p: number) => {
    set({ warpProgress: Math.max(0, Math.min(1, p)) });
  },

  setView: (view: View) => {
    set({ view });
  },

  setInitialLoadComplete: () => {
    set({ isInitialLoad: false });
  },

  syncFromRoute: (path: string) => {
    const state = get();
    const isPlanetPath = PLANET_PATHS.includes(path);

    if (isPlanetPath) {
      if (state.targetPlanet !== path || state.view !== 'planet') {
        set({
          view: state.isInitialLoad ? 'planet' : 'warping',
          targetPlanet: path,
          warpProgress: state.isInitialLoad ? 1 : 0,
          isReturning: false,
        });
      }
    } else {
      if (state.view !== 'galaxy') {
        set({
          view: state.isInitialLoad ? 'galaxy' : 'warping',
          targetPlanet: null,
          warpProgress: state.isInitialLoad ? 0 : 1,
          isReturning: true,
        });
      }
    }
  },
}));
