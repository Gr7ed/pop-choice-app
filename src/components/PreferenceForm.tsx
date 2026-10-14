import { useState } from 'react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import type { PreferenceFormProps, Preferences } from '../lib/types';

const initialPreferences: Preferences = { favoriteMovie: '', mood: '', favoriteGenre: '' };

export default function PreferenceForm({ onSubmit, isLoading }: PreferenceFormProps): ReactElement {
  const [preferences, setPreferences] = useState(initialPreferences);
  const update = (field: keyof Preferences) => (event: ChangeEvent<HTMLTextAreaElement>) =>
    setPreferences((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
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
          <textarea id="favorite-movie" name="favoriteMovie" value={preferences.favoriteMovie} onChange={update('favoriteMovie')} placeholder="The Shawshank Redemption, because..." required rows={4} />
        </label>
        <label className="field">
          <span>New release or classic?</span>
          <textarea id="mood" name="mood" value={preferences.mood} onChange={update('mood')} placeholder="Something released after 2010..." required rows={4} />
        </label>
        <label className="field">
          <span>What kind of energy?</span>
          <textarea id="favorite-genre" name="favoriteGenre" value={preferences.favoriteGenre} onChange={update('favoriteGenre')} placeholder="Something silly and fun..." required rows={4} />
        </label>
      </div>
      <button className="submit-btn" type="submit" disabled={isLoading}>
        {isLoading ? <><span className="spinner" aria-hidden="true" /> Finding your films…</> : 'Find my movies'}
      </button>
    </form>
  );
}
