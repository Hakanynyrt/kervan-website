import type { ComponentType, SVGProps } from 'react';
import { cn } from '../lib/cn.js';

interface Props {
  /** SVG component (e.g. `(props) => <svg>…</svg>`) */
  as: ComponentType<SVGProps<SVGSVGElement>>;
  size?: number | string;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

/** Inline SVG slot. Sets currentColor + 1em sizing by default so it inherits
 *  surrounding text's color and size. Pass an explicit `size` to override. */
export function Icon({ as: Svg, size = '1em', className, ...aria }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      className={cn('inline-block fill-current', className)}
      aria-hidden={aria['aria-label'] ? undefined : aria['aria-hidden'] ?? true}
      aria-label={aria['aria-label']}
      role={aria['aria-label'] ? 'img' : undefined}
    />
  );
}
