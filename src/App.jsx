import { useState } from 'react';
import { getRecommendations } from './lib/recommendationService.js';

const initialPreferences = { favoriteMovie: '', mood: '', favoriteGenre: '' };

function Brand() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="PopChoice home">
        <img src="/assets/popcorn-logo.png" alt="" width="72" height="72" />
        <span>PopChoice</span>
      </a>
      <p className="eyebrow">Your next great watch starts here</p>
    </header>
  );
}

function PreferenceForm({ onSubmit, isLoading }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const update = (field) => (event) => setPreferences((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (event.currentTarget.checkValidity()) onSubmit(preferences);
  };

  return (
    <form className="preference-form" onSubmit={submit} aria-describedby="form-help">
      <div className="form-heading">
        <p className="section-kicker">Set the scene</p>
        <h1>What are you in the mood to watch?</h1>
        <p id="form-help">Tell us a little about your taste and we&apos;ll curate a short list worth pressing play on.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span>What&apos;s a favorite movie and why?</span>
          <textarea id="favorite-movie" name="favoriteMovie" value={preferences.favoriteMovie} onChange={update('favoriteMovie')} placeholder="The Shawshank Redemption, because..." required rows="4" />
        </label>
        <label className="field">
          <span>New release or classic?</span>
          <textarea id="mood" name="mood" value={preferences.mood} onChange={update('mood')} placeholder="Something released after 2010..." required rows="4" />
        </label>
        <label className="field">
          <span>What kind of energy?</span>
          <textarea id="favorite-genre" name="favoriteGenre" value={preferences.favoriteGenre} onChange={update('favoriteGenre')} placeholder="Something silly and fun..." required rows="4" />
        </label>
      </div>
      <button className="submit-btn" type="submit" disabled={isLoading}>
        {isLoading ? <><span className="spinner" aria-hidden="true" /> Finding your films…</> : 'Find my movies'}
      </button>
    </form>
  );
}

function MovieCard({ movie, index }) {
  return (
    <article className="movie-card">
      {movie.posterUrl ? <img className="movie-poster" src={movie.posterUrl} alt={`${movie.title} poster`} /> : <div className="poster-placeholder" aria-hidden="true">🎬</div>}
      <div className="movie-info">
        <p className="movie-number">Pick {String(index + 1).padStart(2, '0')}</p>
        <h2>{movie.title}</h2>
        <p className="movie-year">{movie.releaseYear}</p>
        <p className="movie-content">{movie.content}</p>
      </div>
    </article>
  );
}

function Results({ status, recommendations, error }) {
  if (status === 'idle') return <section className="results empty-state" aria-label="Recommendations"><span aria-hidden="true">✦</span><p>Your personalized picks will appear here.</p></section>;
  if (status === 'loading') return <section className="results empty-state" aria-live="polite"><span className="loading-orbit" aria-hidden="true" /><p>Reading your taste and searching the shelves…</p></section>;
  if (status === 'error') return <section className="results empty-state error-state" role="alert"><span aria-hidden="true">!</span><p>{error}</p><small>Check your connection or try a different set of preferences.</small></section>;
  if (!recommendations.length) return <section className="results empty-state" aria-live="polite"><span aria-hidden="true">◎</span><p>No close matches this time.</p><small>Try broadening your mood or genre.</small></section>;
  return <section className="results" aria-labelledby="results-heading"><div className="results-heading"><div><p className="section-kicker">The shortlist</p><h2 id="results-heading">Made for your movie night</h2></div><span>{recommendations.length} picks</span></div><div className="movie-grid">{recommendations.map((movie, index) => <MovieCard key={`${movie.title}-${movie.releaseYear}`} movie={movie} index={index} />)}</div></section>;
}

export default function App({ recommend = getRecommendations }) {
  const [status, setStatus] = useState('idle');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const handleSubmit = async (preferences) => {
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
