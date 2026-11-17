import { cn } from '@/lib/cn'

/** Settled reads as done; a retry is the only stage that has actually gone wrong, so it stands out. */
const STAGE_TONES: Record<string, string> = {
  SETTLED: 'bg-[#E8F7EF] text-[#187A42]',
  PROCESSING_PAYOUT: 'bg-[#E8F2FF] text-[#1367D8]',
  FAILED_RETRYING: 'bg-[#FFF0F0] text-[#C72D34]',
  AWAITING_SETTLEMENT: 'bg-[#FFF7DF] text-[#8F5F00]',
}

/** Payout stage of one Akawopay settlement; the full description rides on the tooltip. */
export function BnplStageBadge({ stage, label, description }: { stage: string; label: string; description?: string }) {
  return <span title={description} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', STAGE_TONES[stage.toUpperCase()] ?? 'bg-muted text-muted-foreground')}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{label}</span>
}
