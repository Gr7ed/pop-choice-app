import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import Brand from './Brand';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  mode: AuthMode;
}

interface AuthErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

const authCopy = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Pick up where you left off.',
    description: 'Sign in to keep your movie discoveries in one place.',
    submit: 'Sign in',
    alternate: 'Need an account?',
    alternateAction: 'Create one',
    alternateHref: '/signup',
  },
  signup: {
    eyebrow: 'Join PopChoice',
    title: 'Make every movie night count.',
    description: 'Create an account to save your taste and revisit your favorite picks.',
    submit: 'Create account',
    alternate: 'Already have an account?',
    alternateAction: 'Sign in',
    alternateHref: '/login',
  },
} as const;

export default function AuthPage({ mode }: AuthPageProps): ReactElement {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const copy = authCopy[mode];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/sign-in/email' : '/api/auth/sign-up/email';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const body = await response.json() as AuthErrorResponse;
      if (!response.ok) {
        throw new Error(body.error?.message || body.message || 'Authentication failed.');
      }
      window.location.assign('/');
    } catch (requestError) {
      console.error(requestError);
      setError(mode === 'login' ? 'We couldn’t sign you in. Check your details and try again.' : 'We couldn’t create your account. Check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Brand />
      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-heading">
          <p className="section-kicker">{copy.eyebrow}</p>
          <h1 id="auth-heading">{copy.title}</h1>
          <p className="auth-description">{copy.description}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
              {mode === 'signup' && <small className="field-hint">Use at least 8 characters.</small>}
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="submit-btn auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? <><span className="spinner" aria-hidden="true" /> Working…</> : copy.submit}
            </button>
          </form>
          <p className="auth-switch">{copy.alternate} <a href={copy.alternateHref}>{copy.alternateAction}</a></p>
        </section>
      </main>
      <footer>PopChoice <span aria-hidden="true">•</span> made for curious movie people</footer>
    </div>
  );
}
