import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import Spinner from './Spinner';

type ButtonVariant = 'primary' | 'ghost';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner, disables the button, and flags it as busy. */
  loading?: boolean;
  /** Text shown while `loading` (falls back to `children`). */
  loadingLabel?: ReactNode;
  /** Stretch to the full width of the container. */
  block?: boolean;
}

/**
 * Shared button used across the app so hover, focus, disabled, and loading
 * treatments stay consistent instead of being re-declared per feature.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  block = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner /> {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
