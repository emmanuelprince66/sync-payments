import { cn } from '@/lib/cn'

/**
 * The Sync Pay logo (brand asset, public/brand/). `inverse` is for dark backgrounds (sidebar, auth panel):
 * the same artwork with the dark parts turned light, so it stays readable there.
 */
export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  // Wrapped so a stretching parent (flex column) can't widen the artwork; object-contain as a backstop.
  return <span className="inline-flex shrink-0"><img src={inverse ? '/brand/lockup-on-dark.png' : '/brand/lockup.png'} alt="Sync Pay" draggable={false} className={cn('h-10 w-auto max-w-none shrink-0 select-none object-contain', className)}/></span>
}
