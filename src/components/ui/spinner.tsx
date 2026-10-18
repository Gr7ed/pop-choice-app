import { LuLoaderCircle } from 'react-icons/lu';
import { cn } from '@/lib/utils';

/**
 * Decorative loading indicator. The surrounding control or live region owns the
 * accessible status text, so the spinner stays hidden from assistive tech.
 */
export default function Spinner({ className }: { className?: string }) {
  return <LuLoaderCircle aria-hidden="true" className={cn('size-4 shrink-0 animate-spin', className)} />;
}
