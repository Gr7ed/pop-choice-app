import { authClient } from './auth-client';
import type { AuthUser } from './auth-client';

export interface SessionState {
  user: AuthUser | null;
  isAuthed: boolean;
  isPending: boolean;
}

/**
 * Thin, typed wrapper over Better Auth's React session hook so components read
 * a single shape instead of digging through `data?.user?.id` repeatedly.
 */
export function useSession(): SessionState {
  const { data, isPending } = authClient.useSession();
  const user = data?.user ?? null;
  return { user, isAuthed: Boolean(user), isPending };
}
