import type { ReactElement } from 'react';

export default function Brand(): ReactElement {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="PopChoice home">
        <img src="/assets/popcorn-logo.png" alt="" width="72" height="72" />
        <span>PopChoice</span>
      </a>
      <nav className="site-nav" aria-label="Account">
        <a href="/login">Log in</a>
        <a className="nav-action" href="/signup">Sign up</a>
      </nav>
    </header>
  );
}
