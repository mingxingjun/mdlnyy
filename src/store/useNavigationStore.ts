import { create } from 'zustand';

type View = 'galaxy' | 'planet';

interface NavigationState {
  view: View;
  targetPlanet: string | null;
  isInitialLoad: boolean;
  warpTo: (planetPath: string) => void;
  returnToGalaxy: () => void;
  setView: (view: View) => void;
  setInitialLoadComplete: () => void;
  syncFromRoute: (path: string) => void;
}

export const PLANET_PATHS = ['/dashboard', '/ai-engine', '/my-notes', '/flow-chamber'];

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: 'galaxy',
  targetPlanet: null,
  isInitialLoad: true,

  warpTo: (planetPath: string) => {
    set({
      view: 'planet',
      targetPlanet: planetPath,
    });
  },

  returnToGalaxy: () => {
    set({
      view: 'galaxy',
      targetPlanet: null,
    });
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
          view: 'planet',
          targetPlanet: path,
        });
      }
    } else {
      if (state.view !== 'galaxy') {
        set({
          view: 'galaxy',
          targetPlanet: null,
        });
      }
    }
  },
}));
