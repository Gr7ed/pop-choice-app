import { useState } from 'react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { LuSparkles, LuWand } from 'react-icons/lu';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
    <form className="grid gap-8" onSubmit={submit} aria-describedby="form-help">
      <div className="max-w-3xl">
        <p className="text-kicker text-xs">Set the scene</p>
        <h2 className="mt-2.5 mb-3 font-heading text-3xl text-foreground sm:text-4xl">
          What are you in the mood to watch?
        </h2>
        <p id="form-help" className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Tell us a little about your taste and we&apos;ll curate a short list worth pressing play on.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        {fields.map((field) => (
          <div key={field.id} className="grid content-start gap-2.5">
            <Label htmlFor={field.id} className="text-base text-foreground">
              {field.label}
            </Label>
            <Textarea
              id={field.id}
              name={field.name}
              value={preferences[field.name]}
              onChange={update(field.name)}
              placeholder={field.placeholder}
              required
              rows={4}
              className="min-h-34 rounded-xl border-border bg-card px-4 py-4 text-base leading-relaxed"
            />
          </div>
        ))}
      </div>

      <Button type="submit" size="lg" disabled={isLoading} aria-busy={isLoading || undefined} className="h-12 w-fit min-w-48 rounded-full px-8 text-base">
        {isLoading ? (
          <>
            <LuSparkles className="size-4 animate-pulse" aria-hidden="true" /> Finding your films…
          </>
        ) : (
          <>
            <LuWand className="size-4" aria-hidden="true" /> Find my movies
          </>
        )}
      </Button>
    </form>
  );
}
