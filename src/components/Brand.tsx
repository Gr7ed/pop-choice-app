import type { ReactElement } from 'react';
import { authClient } from '../lib/auth-client';
import { useSession } from '../lib/useSession';

export default function Brand(): ReactElement {
  const { user } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.assign('/');
  };

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="PopChoice home">
        <img src="/assets/popcorn-logo.png" alt="" width="72" height="72" />
        <span>PopChoice</span>
      </a>
      <nav className="site-nav" aria-label="Account">
        {user ? (
          <>
            <span className="nav-user" title={user.email}>{user.name || user.email}</span>
            <button type="button" className="nav-action" onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <a href="/login">Log in</a>
            <a className="nav-action" href="/signup">Sign up</a>
          </>
        )}
      </nav>
    </header>
  );
}
