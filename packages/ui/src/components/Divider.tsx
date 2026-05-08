import { cn } from '../lib/cn.js';

interface Props {
  inset?: boolean;
  vertical?: boolean;
  className?: string;
}

export function Divider({ inset = false, vertical = false, className }: Props) {
  if (vertical) {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn('inline-block w-px self-stretch bg-hair', inset && 'my-2', className)}
      />
    );
  }
  return (
    <hr
      className={cn(
        'border-0 h-px bg-hair w-full',
        inset && 'mx-6 md:mx-8 w-[calc(100%-3rem)] md:w-[calc(100%-4rem)]',
        className,
      )}
    />
  );
}
