import { SegmentedTabs } from '@/components/ui/common'
import type { AccessMode } from '../constants'
import { useAccessTabs } from '../hooks/useAccessTabs'

/** Log in / Create account switcher. */
export function AccessTabs({ mode }: { mode: AccessMode }) {
  const { options, onChange } = useAccessTabs()
  return <SegmentedTabs
    value={mode}
    onChange={onChange}
    options={options}
    className="mt-7 grid grid-cols-2 rounded-xl bg-[#EFF4F1] p-1"
    buttonClassName="rounded-lg py-2.5 text-xs font-extrabold transition"
    inactiveClassName="text-[#7A8B82]"
  />
}

export function SecurityNote() {
  return <div className="mt-6 flex items-center gap-3 text-[10px] text-[#8A9992]"><span className="h-px flex-1 bg-[#E2E9E5]"/><span>Protected by bank-grade security</span><span className="h-px flex-1 bg-[#E2E9E5]"/></div>
}
