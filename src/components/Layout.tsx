import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary';
import HUDOverlay from './HUDOverlay';
import FallbackView from './FallbackView';
import { useNavigationStore, PLANET_PATHS } from '@/store/useNavigationStore';

export default function Layout() {
  const location = useLocation();
  const syncFromRoute = useNavigationStore((s) => s.syncFromRoute);
  const setInitialLoadComplete = useNavigationStore((s) => s.setInitialLoadComplete);
  const initializedRef = useRef(false);

  useEffect(() => {
    const currentPath = location.pathname;
    if (!initializedRef.current) {
      initializedRef.current = true;
      syncFromRoute(currentPath);
      setInitialLoadComplete();
      return;
    }
    if (PLANET_PATHS.includes(currentPath) || currentPath === '/') {
      syncFromRoute(currentPath);
    }
  }, [location.pathname, syncFromRoute, setInitialLoadComplete]);

  return (
    <div className="fixed inset-0 overflow-auto" style={{ background: '#010308' }}>
      <ErrorBoundary
        resetKeys={[location.pathname]}
        fallback={
          <FallbackView>
            <Outlet />
          </FallbackView>
        }
      >
        <HUDOverlay>
          <Outlet />
        </HUDOverlay>
      </ErrorBoundary>
    </div>
  );
}
