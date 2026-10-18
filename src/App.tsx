import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import SiteFooter from './components/layout/site-footer';
import SiteHeader from './components/layout/site-header';
import Spinner from './components/ui/spinner';
import { LibraryProvider } from './lib/library-context';
import { getRecommendations } from './lib/recommendationService';
import type { AppProps } from './lib/types';

// Route-level splitting keeps the initial shell small; each page (and its
// dialogs, filters, and forms) loads when the visitor navigates to it.
const AuthPage = lazy(() => import('./components/AuthPage'));
const DiscoverPage = lazy(() => import('./pages/discover-page'));
const FavoritesPage = lazy(() => import('./pages/favorites-page'));
const HomePage = lazy(() => import('./pages/home-page'));
const MyListsPage = lazy(() => import('./pages/my-lists-page'));
const NotFoundPage = lazy(() => import('./pages/not-found-page'));

function RouteFallback(): ReactElement {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center gap-3">
      <Spinner className="size-5 text-primary" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

/**
 * App shell: a shared header/footer around the routed pages. The library
 * provider wraps everything so favorites and lists stay in sync across routes.
 */
export default function App({ recommend = getRecommendations }: AppProps): ReactElement {
  return (
    <LibraryProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage recommend={recommend} />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/mylists" element={<MyListsPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/signin" element={<Navigate to="/login" replace />} />
              <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
              <Route path="/sign-in" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </LibraryProvider>
  );
}
