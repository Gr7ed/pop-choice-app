import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  fetchOptions: {
    credentials: 'include',
  },
});

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = AuthSession['user'];
