import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useKycStep } from '../hooks/useKycStep'

export function KycStep() {
  const { benefits, startKyc, finish } = useKycStep()
  return <>
    <div className="mt-7 rounded-3xl border border-[#D9DADE] bg-[#FAFAFA] p-6">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1E4] text-[#AD5300]"><Icon name="shield" size={23}/></div><div><div className="text-[11px] font-extrabold text-[#474747]">Business verification</div><div className="mt-1 text-[11px] leading-5 text-[#6D7176]">Verify with your NIN or BVN, or your CAC documents for a company, to increase payouts and transaction limits.</div></div></div>
      <div className="mt-5 space-y-2">{benefits.map(item => <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-[#555555]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF1E4] text-[#AD5300]"><Icon name="check" size={11} stroke={3}/></span>{item}</div>)}</div>
    </div>
    <Button icon="shield" onClick={startKyc} className="mt-5 min-h-[38px] w-full rounded-lg py-0 text-[11px] font-bold shadow-none">Start KYC verification</Button>
    <button type="button" onClick={finish} className="mt-3 w-full text-center text-[11px] font-bold text-[#6D7176]">I’ll complete KYC later</button>
  </>
}
