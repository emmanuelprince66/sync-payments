import { cn } from '@/lib/cn'

const tones: Record<string, string> = {
  Active: 'bg-[#E8F5EA] text-[#337D44]',
  New: 'bg-[#E7F1FC] text-[#1C6FA8]',
  'At Risk': 'bg-[#FFF6E4] text-[#A76700]',
  Inactive: 'bg-muted text-muted-foreground',
}

/** Sink's customer status (Active / New / At Risk / Inactive). */
export function CustomerStatus({ value }: { value: string }) {
  if (!value) return <span className="text-[10px] text-muted-foreground">—</span>
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', tones[value] ?? 'bg-muted text-muted-foreground')}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{value}</span>
}
