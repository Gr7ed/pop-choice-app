import { useState } from 'react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { Button, Field } from './ui';
import type { PreferenceFormProps, Preferences } from '../lib/types';

const initialPreferences: Preferences = { favoriteMovie: '', mood: '', favoriteGenre: '' };

const fields = [
  {
    id: 'favorite-movie',
    name: 'favoriteMovie',
    label: 'What’s a favorite movie and why?',
    placeholder: 'The Shawshank Redemption, because...',
  },
  {
    id: 'mood',
    name: 'mood',
    label: 'New release or classic?',
    placeholder: 'Something released after 2010...',
  },
  {
    id: 'favorite-genre',
    name: 'favoriteGenre',
    label: 'What kind of energy?',
    placeholder: 'Something silly and fun...',
  },
] as const satisfies ReadonlyArray<{ id: string; name: keyof Preferences; label: string; placeholder: string }>;

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
        <h2 className="section-title section-title-lg">What are you in the mood to watch?</h2>
        <p id="form-help">Tell us a little about your taste and we&apos;ll curate a short list worth pressing play on.</p>
      </div>
      <div className="form-fields">
        {fields.map((field) => (
          <Field key={field.id} label={field.label}>
            <textarea
              id={field.id}
              name={field.name}
              value={preferences[field.name]}
              onChange={update(field.name)}
              placeholder={field.placeholder}
              required
              rows={4}
            />
          </Field>
        ))}
      </div>
      <Button type="submit" className="preference-submit" loading={isLoading} loadingLabel="Finding your films…">
        Find my movies
      </Button>
    </form>
  );
}
