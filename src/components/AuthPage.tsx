import { useEffect, useActionState, useState } from 'react';
import type { ReactElement } from 'react';
import { authClient } from '../lib/auth-client';
import Brand from './Brand';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  mode: AuthMode;
}

interface AuthActionState {
  error: string;
  ok: boolean;
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

const authenticate = async (_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> => {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '');
  const isLogin = formData.get('mode') === 'login';

  const fallbackMessage = isLogin
    ? 'We couldn’t sign you in. Check your details and try again.'
    : 'We couldn’t create your account. Check your details and try again.';

  try {
    const { error } = isLogin
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name, email, password });

    if (error) {
      throw new Error(error.message || fallbackMessage);
    }
    return { error: '', ok: true };
  } catch (requestError) {
    console.error(requestError);
    const message = requestError instanceof Error && requestError.message
      ? requestError.message
      : fallbackMessage;
    return { error: message, ok: false };
  }
};

const initialAuthState: AuthActionState = { error: '', ok: false };

export default function AuthPage({ mode }: AuthPageProps): ReactElement {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, submit, isPending] = useActionState(authenticate, initialAuthState);
  const copy = authCopy[mode];

  useEffect(() => {
    if (state.ok) {
      window.location.assign('/');
    }
  }, [state.ok]);

  return (
    <div className="auth-shell">
      <Brand />
      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-heading">
          <p className="section-kicker">{copy.eyebrow}</p>
          <h1 id="auth-heading">{copy.title}</h1>
          <p className="auth-description">{copy.description}</p>
          <form className="auth-form" action={submit}>
            <input type="hidden" name="mode" value={mode} />
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
            {state.error && <p className="auth-error" role="alert">{state.error}</p>}
            <button className="submit-btn auth-submit" type="submit" disabled={isPending}>
              {isPending ? <><span className="spinner" aria-hidden="true" /> Working…</> : copy.submit}
            </button>
          </form>
          <p className="auth-switch">{copy.alternate} <a href={copy.alternateHref}>{copy.alternateAction}</a></p>
        </section>
      </main>
      <footer>PopChoice <span aria-hidden="true">•</span> made for curious movie people</footer>
    </div>
  );
}
