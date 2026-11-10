import { cn } from '@/lib/cn'

export function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (enabled: boolean) => void; label?: string }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={() => onChange(!enabled)} className={cn('flex h-6 w-11 items-center rounded-full p-0.5 transition', enabled ? 'justify-end bg-[#529661]' : 'justify-start bg-[#D7E0DB]')}>
    <span className="h-5 w-5 rounded-full bg-white shadow"/>
  </button>
}
