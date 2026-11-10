import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useKycStep } from '../hooks/useKycStep'

export function KycStep() {
  const { benefits, startKyc, finish } = useKycStep()
  return <>
    <div className="mt-7 rounded-3xl border border-[#DCE7E0] bg-[#F8FAF8] p-6">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E5F3E2] text-[#438352]"><Icon name="shield" size={23}/></div><div><div className="text-sm font-extrabold text-[#28483B]">Business verification</div><div className="mt-1 text-[11px] leading-5 text-[#75877E]">Verify with your NIN or BVN, or your CAC documents for a company, to increase payouts and transaction limits.</div></div></div>
      <div className="mt-5 space-y-2">{benefits.map(item => <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-[#52695D]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E0F0DE] text-[#438352]"><Icon name="check" size={11} stroke={3}/></span>{item}</div>)}</div>
    </div>
    <Button icon="shield" onClick={startKyc} className="mt-5 w-full py-3.5">Start KYC verification</Button>
    <button type="button" onClick={finish} className="mt-3 w-full text-center text-[11px] font-bold text-[#829189]">I’ll complete KYC later</button>
  </>
}
