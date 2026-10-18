import type { ReactElement } from 'react';

export default function SiteFooter(): ReactElement {
  return (
    <footer className="mt-16 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-center text-sm text-muted-dim sm:px-6 lg:px-8">
        PopChoice <span aria-hidden="true" className="px-1 text-primary">•</span> made for curious movie people
      </div>
    </footer>
  );
}
