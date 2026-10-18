import type { AriaRole, ReactElement, ReactNode } from 'react';

interface EmptyStateProps {
  /** Decorative glyph or spinner shown above the message. */
  icon: ReactNode;
  /** Primary message. */
  children: ReactNode;
  /** Optional secondary guidance. */
  hint?: ReactNode;
  tone?: 'default' | 'error';
  /** Pass `alert` for errors, `status` for async updates, or omit for static copy. */
  role?: AriaRole;
  live?: 'off' | 'polite' | 'assertive';
  busy?: boolean;
  label?: string;
  className?: string;
}

/**
 * Single presentation for the idle / loading / error / empty surfaces so their
 * markup and ARIA wiring stay consistent everywhere they appear.
 */
export default function EmptyState({
  icon,
  children,
  hint,
  tone = 'default',
  role,
  live,
  busy,
  label,
  className = '',
}: EmptyStateProps): ReactElement {
  const classes = ['empty-state', tone === 'error' ? 'error-state' : '', className].filter(Boolean).join(' ');
  return (
    <section className={classes} role={role} aria-live={live} aria-busy={busy || undefined} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <p>{children}</p>
      {hint && <small>{hint}</small>}
    </section>
  );
}
