import type { ReactElement, ReactNode } from 'react';

interface PageHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  /** Optional trailing content, e.g. a count or primary action. */
  action?: ReactNode;
}

export default function PageHeader({ kicker, title, description, action }: PageHeaderProps): ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <p className="text-kicker text-xs">{kicker}</p>
        <h1 className="mt-2.5 font-heading text-3xl text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
