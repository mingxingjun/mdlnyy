import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import SolarSystem from './SolarSystem';
import CursorGlow from './CursorGlow';
import ErrorBoundary from './ErrorBoundary';
import HUDOverlay from './HUDOverlay';
import FallbackView from './FallbackView';
import LoadingScreen from './LoadingScreen';
import { useNavigationStore, PLANET_PATHS } from '@/store/useNavigationStore';
import { isWebGLAvailable } from '@/lib/webglSupport';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = useNavigationStore((s) => s.view);
  const targetPlanet = useNavigationStore((s) => s.targetPlanet);
  const syncFromRoute = useNavigationStore((s) => s.syncFromRoute);
  const setInitialLoadComplete = useNavigationStore((s) => s.setInitialLoadComplete);

  const [isLoading, setIsLoading] = useState(true);
  const webglSupported = useMemo(() => isWebGLAvailable(), []);

  const isNavigatingRef = useRef(false);
  const initializedRef = useRef(false);
  const prevViewRef = useRef(view);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const currentState = useNavigationStore.getState();

    if (!initializedRef.current) {
      initializedRef.current = true;
      syncFromRoute(currentPath);
      setInitialLoadComplete();
      prevViewRef.current = useNavigationStore.getState().view;
      return;
    }

    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const isPlanetPath = PLANET_PATHS.includes(currentPath);
    const isCurrentlyPlanet = currentState.view === 'planet';

    if ((isPlanetPath && !isCurrentlyPlanet) || (!isPlanetPath && isCurrentlyPlanet) ||
        (isPlanetPath && currentState.targetPlanet !== currentPath)) {
      syncFromRoute(currentPath);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!initializedRef.current) {
      prevViewRef.current = view;
      return;
    }

    if (prevViewRef.current === 'warping' && view !== 'warping') {
      isNavigatingRef.current = true;
      if (view === 'planet' && targetPlanet) {
        const search = location.pathname === targetPlanet ? location.search : '';
        navigate(targetPlanet + search);
      } else if (view === 'galaxy') {
        navigate('/');
      }
    }
    prevViewRef.current = view;
  }, [view, targetPlanet, navigate, location.pathname, location.search]);

  if (!webglSupported) {
    return (
      <>
        <LoadingScreen isLoading={isLoading} />
        {!isLoading && (
          <FallbackView>
            <Outlet />
          </FallbackView>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#010308' }}>
      <LoadingScreen isLoading={isLoading} />

      {!isLoading && (
        <>
          <ErrorBoundary fallback={<FallbackView />}>
            <SolarSystem />
          </ErrorBoundary>
          <CursorGlow />
          <HUDOverlay>
            <Outlet />
          </HUDOverlay>
        </>
      )}
    </div>
  );
}
