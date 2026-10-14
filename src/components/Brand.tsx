import type { ReactElement } from 'react';

export default function Brand(): ReactElement {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="PopChoice home">
        <img src="/assets/popcorn-logo.png" alt="" width="72" height="72" />
        <span>PopChoice</span>
      </a>
      <p className="eyebrow">Your next great watch starts here</p>
    </header>
  );
}
