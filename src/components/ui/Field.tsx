import type { ReactElement, ReactNode } from 'react';

interface FieldProps {
  /** Visible label text; also labels the wrapped control implicitly. */
  label: ReactNode;
  /** Helper text rendered beneath the control. */
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Label + control + optional hint. Wrapping the control keeps the label
 * association implicit, which works for text inputs, textareas, and selects.
 */
export default function Field({ label, hint, children, className = '' }: FieldProps): ReactElement {
  return (
    <label className={['field', className].filter(Boolean).join(' ')}>
      <span>{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
