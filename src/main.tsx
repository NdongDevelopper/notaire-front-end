import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ToastProvider from './shared/components/ui/Toast/Toast';
import App from './App';
import { useOfflineStore } from './shared/store/offline.store';
import './styles/index.css';

/**
 * Register the same Offline-First service worker in development and production.
 *
 * We also replace the old vite-plugin-pwa/dev-sw registration when it exists.
 * This matters when the project has previously been opened with an older build:
 * an old worker can otherwise keep intercepting /dashboard/* navigations.
 */
function registerOfflineServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  void (async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations
          .filter((registration) => {
            const script = registration.active?.scriptURL
              || registration.waiting?.scriptURL
              || registration.installing?.scriptURL
              || '';
            return /dev-sw\.js|vite-plugin-pwa|workbox/i.test(script);
          })
          .map((registration) => registration.unregister()),
      );

      const registration = await navigator.serviceWorker.register('/offline-sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      await registration.update().catch(() => undefined);
    } catch (error) {
      // PWA is an enhancement. The online application must still boot if the
      // browser blocks service workers (private mode, policy, etc.).
      console.warn('Service worker Offline-First indisponible:', error);
    }
  })();
}

registerOfflineServiceWorker();

const queryClient = new QueryClient();

const OfflineInitializer = () => {
  const initOfflineMonitoring = useOfflineStore((state) => state.initOfflineMonitoring);

  useEffect(() => {
    const cleanup = initOfflineMonitoring();
    return () => {
      cleanup?.();
    };
  }, [initOfflineMonitoring]);

  return null;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <OfflineInitializer />
          <App />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
