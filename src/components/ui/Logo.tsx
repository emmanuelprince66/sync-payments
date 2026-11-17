import { cn } from '@/lib/cn'

/** Sync360 Payments logo, from the design. `inverse` is for dark backgrounds. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className={cn('relative grid h-9 w-9 place-items-center rounded-xl shadow-sm', inverse ? 'bg-[#3A3A3A] text-white' : 'bg-primary text-primary-foreground')}>
      <div className="h-4 w-4 rotate-45 rounded-[4px] border-2 border-white"/>
      <div className="absolute h-1.5 w-1.5 rounded-full bg-secondary"/>
    </div>
    <div>
      <div className={cn('text-[17px] font-extrabold leading-none tracking-[-0.04em]', inverse ? 'text-white' : 'text-foreground')}>Sync360</div>
      <div className={cn('mt-1 text-[8px] font-extrabold uppercase tracking-[0.24em]', inverse ? 'text-secondary' : 'text-brand')}>Payments</div>
    </div>
  </div>
}
