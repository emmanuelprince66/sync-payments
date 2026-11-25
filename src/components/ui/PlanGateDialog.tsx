import { Crown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PLAN_GATE_COPY, usePlanGateStore } from '@/stores/plan-gate-store'

/**
 * Opens whenever the API refuses something for plan reasons (stores/plan-gate-store), e.g. creating
 * another business on a plan that allows one. Mounted once at the root, like sink's SubscriptionModal.
 */
export function PlanGateDialog() {
  const kind = usePlanGateStore(state => state.kind)
  const close = usePlanGateStore(state => state.close)
  if (!kind) return null
  const copy = PLAN_GATE_COPY[kind]
  return <Modal open onClose={close} title={copy.title} panelClassName="w-full max-w-[400px] rounded-[22px] bg-white p-6 text-center shadow-2xl">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FFF8E1] text-[#8A6A12]"><Crown size={22}/></span>
    <h2 className="mt-4 text-lg font-extrabold text-[#1E1E1E]">{copy.title}</h2>
    <p className="mt-2 text-sm leading-6 text-[#6D7176]">{copy.message}</p>
      <p className="mt-3 text-xs font-semibold text-[#8A6A12]">Plans are managed from your Sync360 account. The business owner can upgrade there.</p>
    <div className="mt-6 flex gap-2">
      <button type="button" onClick={close} className="h-11 flex-1 rounded-xl border border-[#E4E6E8] px-4 text-sm font-extrabold text-[#1E1E1E] hover:bg-[#F6F7F8]">Not now</button>

    </div>
  </Modal>
}
