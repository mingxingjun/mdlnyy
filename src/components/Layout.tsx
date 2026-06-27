import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import HUDOverlay from './HUDOverlay';
import FallbackView from './FallbackView';

export default function Layout() {
  const location = useLocation();

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
