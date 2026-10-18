import type { ReactElement } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button } from './ui/button';
import type { PaginationProps } from '../lib/types';

/**
 * Previous/next controls with a live page count. TMDB's discover responses
 * only expose sequential pages, so stepping one at a time is enough.
 */
export default function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps): ReactElement {
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <LuChevronLeft aria-hidden="true" /> Previous
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page <span className="font-bold text-foreground">{page}</span> of {lastPage}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next <LuChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
