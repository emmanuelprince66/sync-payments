import { RefreshCw, ShieldAlert, TriangleAlert } from 'lucide-react'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'

/** A 403 from the invoices module (RBAC), or a load failure, shown in place of the screen's content. */
export function InvoiceAccessNotice({ forbidden, message, onRetry }: { forbidden: boolean; message: string; onRetry?: () => void }) {
  return <section className="rounded-2xl border border-border bg-white">
    {forbidden
      ? <KitEmpty icon={<ShieldAlert size={18}/>} title="You don't have access to invoices" note={message}/>
      : <KitEmpty icon={<TriangleAlert size={18}/>} title="Couldn't load invoices" note={message} action={onRetry && <KitButton variant="secondary" onClick={onRetry}><RefreshCw size={14}/> Try again</KitButton>}/>}
  </section>
}
