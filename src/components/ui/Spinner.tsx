import type { ReactElement } from 'react';

type SpinnerVariant = 'inline' | 'orbit';

interface SpinnerProps {
  /** `orbit` is the larger standalone loader used in empty/loading states. */
  variant?: SpinnerVariant;
  className?: string;
}

/**
 * Decorative loading indicator. The surrounding control or live region is
 * responsible for the accessible status text, so the spinner stays hidden
 * from assistive technology to avoid duplicate announcements.
 */
export default function Spinner({ variant = 'inline', className = '' }: SpinnerProps): ReactElement {
  const classes = [variant === 'orbit' ? 'loading-orbit' : 'spinner', className].filter(Boolean).join(' ');
  return <span className={classes} aria-hidden="true" />;
}
