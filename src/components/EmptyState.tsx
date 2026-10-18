import type { AriaRole, ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
  className,
}: EmptyStateProps): ReactElement {
  return (
    <section
      role={role}
      aria-live={live}
      aria-busy={busy || undefined}
      aria-label={label}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center',
        tone === 'error' && 'border-destructive/40 bg-destructive/5',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-12 place-items-center rounded-full bg-primary/10 text-xl text-primary',
          tone === 'error' && 'bg-destructive/10 text-destructive',
        )}
      >
        {icon}
      </span>
      <p className="font-heading text-lg text-foreground">{children}</p>
      {hint && <small className="text-sm text-muted-dim">{hint}</small>}
    </section>
  );
}
