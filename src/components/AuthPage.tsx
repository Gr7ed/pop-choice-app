import { useEffect, useActionState, useState } from 'react';
import type { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight, LuLock, LuMail, LuSparkles, LuUser } from 'react-icons/lu';
import { authClient } from '../lib/auth-client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, submit, isPending] = useActionState(authenticate, initialAuthState);
  const copy = authCopy[mode];

  useEffect(() => {
    if (state.ok) navigate('/', { replace: true });
  }, [state.ok, navigate]);

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <Card className="w-full max-w-md gap-0 p-6 sm:p-8" aria-labelledby="auth-heading">
        <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <LuSparkles className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-kicker text-xs">{copy.eyebrow}</p>
        <h1 id="auth-heading" className="mt-2.5 font-heading text-2xl text-foreground sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{copy.description}</p>

        <form className="mt-6 grid gap-5" action={submit}>
          <input type="hidden" name="mode" value={mode} />
          {mode === 'signup' && (
            <div className="grid gap-2">
              <Label htmlFor="auth-name">Full name</Label>
              <div className="relative">
                <LuUser className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-dim" aria-hidden="true" />
                <Input
                  id="auth-name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="auth-email">Email address</Label>
            <div className="relative">
              <LuMail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-dim" aria-hidden="true" />
              <Input
                id="auth-email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auth-password">Password</Label>
            <div className="relative">
              <LuLock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-dim" aria-hidden="true" />
              <Input
                id="auth-password"
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                required
                className="h-11 rounded-xl pl-9"
              />
            </div>
            {mode === 'signup' && <p className="text-xs text-muted-dim">Use at least 8 characters.</p>}
          </div>

          {state.error && (
            <p role="alert" className="rounded-lg border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            aria-busy={isPending || undefined}
            className="h-11 w-full rounded-full text-base"
          >
            {isPending ? 'Working…' : copy.submit}
            {!isPending && <LuArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground">
          {copy.alternate}{' '}
          <Link to={copy.alternateHref} className="font-bold text-primary hover:underline">
            {copy.alternateAction}
          </Link>
        </p>
      </Card>
    </div>
  );
}
