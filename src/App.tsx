import { useState } from 'react';
import { getRecommendations } from './lib/recommendationService';
import Brand from './components/Brand';
import PreferenceForm from './components/PreferenceForm';
import Results from './components/Results';
import AuthPage from './components/AuthPage';
import type { AppProps, MovieRecommendation, Preferences, RecommendationStatus } from './lib/types';

export default function App({ recommend = getRecommendations }: AppProps) {
  const path = window.location.pathname;
  if (path === '/login') return <AuthPage mode="login" />;
  if (path === '/signup' || path === '/sign-up') return <AuthPage mode="signup" />;
  return <RecommendationApp recommend={recommend} />;
}

function RecommendationApp({ recommend }: Required<AppProps>) {
  const [status, setStatus] = useState<RecommendationStatus>('idle');
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [error, setError] = useState('');
  const handleSubmit = async (preferences: Preferences) => {
    setStatus('loading');
    setError('');
    try {
      setRecommendations(await recommend(preferences));
      setStatus('success');
    } catch (requestError) {
      console.error(requestError);
      setStatus('error');
      setError('We couldn’t find your recommendations right now.');
    }
  };
  return <div className="app-shell"><Brand /><main className="main-content"><PreferenceForm onSubmit={handleSubmit} isLoading={status === 'loading'} /><Results status={status} recommendations={recommendations} error={error} /></main><footer>PopChoice <span aria-hidden="true">•</span> made for curious movie people</footer></div>;
}
