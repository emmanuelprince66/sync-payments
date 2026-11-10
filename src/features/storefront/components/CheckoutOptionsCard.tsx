import { CreditCard } from 'lucide-react'
import type { StorefrontProfile } from '@/api/storefront'
import { Toggle } from '@/components/ui/Toggle'
import { BnplCard } from '@/features/bnpl/components/BnplCard'
import { useCheckoutOptions } from '../hooks/useCheckoutOptions'
import { SettingsCard } from './SettingsCard'

function OptionRow({ title, description, enabled, onChange, busy }: { title: string; description: string; enabled: boolean; onChange: (value: boolean) => void; busy: boolean }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
    <div className="min-w-0"><p className="text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{description}</p></div>
    <div className={busy ? 'pointer-events-none opacity-50' : undefined} aria-busy={busy || undefined}><Toggle label={title} enabled={enabled} onChange={onChange}/></div>
  </div>
}

export function CheckoutOptionsCard({ profile }: { profile: StorefrontProfile }) {
  const options = useCheckoutOptions(profile)

  return <SettingsCard icon={<CreditCard size={16}/>} title="Checkout options" description="How customers can pay and order from your store.">
    <div className="flex flex-col gap-3">
      <BnplCard active={profile.enableBnpl}/>
      <OptionRow title="Sell without stock" description="Allow orders even when an item’s recorded stock is 0. Useful for made-to-order or pre-order items." enabled={options.sellWithoutStock} onChange={options.setSellWithoutStock} busy={options.stockSaving}/>
    </div>
  </SettingsCard>
}
