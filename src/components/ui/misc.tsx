import { Icon } from './Icon'

/** "← Back to wallet" style link used on sub-screens. */
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mb-5 flex items-center gap-1 text-xs font-extrabold text-[#4A7D57]"><span className="rotate-180"><Icon name="arrow" size={15}/></span>{label}</button>
}

export function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#529661] border-t-transparent"/>
  </div>
}

/** Marks a screen or card whose data is sample data because no backend endpoint exists yet. */
export function SampleDataBadge({ className = '' }: { className?: string }) {
  return <span title="No backend endpoint yet: this is sample data" className={`inline-flex items-center gap-1.5 rounded-full border border-[#F0D78C] bg-[#FFF8E1] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#8A6A12] ${className}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-[#D9A514]" aria-hidden="true"/>Sample data
  </span>
}
