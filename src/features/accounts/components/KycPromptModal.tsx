import { ShieldCheck } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'

/** sink: shown when the business has no KYC. History stays visible; money actions need verification. */
export function KycPromptModal({ open, onClose, onVerify }: { open: boolean; onClose: () => void; onVerify: () => void }) {
  return <KitModal
    open={open}
    onClose={onClose}
    title="Complete your KYC verification"
    description="Verify your business to unlock transaction actions."
    icon={<ShieldCheck size={16}/>}
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={onClose}>Maybe later</KitButton><KitButton onClick={onVerify}><ShieldCheck size={14}/> Complete KYC</KitButton></>}
  >
    <p className="text-xs leading-5 text-muted-foreground">Your transaction history is available, but you need to complete your business KYC verification before you can transfer funds, fund an account, or use other transaction actions.</p>
  </KitModal>
}
