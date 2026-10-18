import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import AuthPage from './components/AuthPage';
import SiteFooter from './components/layout/site-footer';
import SiteHeader from './components/layout/site-header';
import FavoritesPage from './pages/favorites-page';
import HomePage from './pages/home-page';
import MyListsPage from './pages/my-lists-page';
import NotFoundPage from './pages/not-found-page';
import { LibraryProvider } from './lib/library-context';
import { getRecommendations } from './lib/recommendationService';
import type { AppProps } from './lib/types';

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
          <Routes>
            <Route path="/" element={<HomePage recommend={recommend} />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/mylists" element={<MyListsPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </LibraryProvider>
  );
}
