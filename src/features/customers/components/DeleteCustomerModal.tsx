import { Trash2 } from 'lucide-react'
import type { Customer } from '@/api/customers'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'

type Props = { customer: Customer | null; deleting: boolean; onCancel: () => void; onConfirm: (customer: Customer) => void }

/** Sink's DeleteCustomer confirmation. */
export function DeleteCustomerModal({ customer, deleting, onCancel, onConfirm }: Props) {
  return <KitModal
    open={Boolean(customer)}
    onClose={onCancel}
    title="Delete customer"
    icon={<Trash2 size={16}/>}
    panelClassName="max-w-md"
    footer={<>
      <KitButton variant="secondary" onClick={onCancel} disabled={deleting}>Cancel</KitButton>
      <KitButton onClick={() => customer && onConfirm(customer)} loading={deleting} className="bg-[#C72D34] shadow-none hover:bg-[#A9252B]">Delete customer</KitButton>
    </>}
  >
    <p className="text-xs leading-5 text-muted-foreground">Are you sure you want to delete <span className="font-extrabold text-foreground">{customer?.name}</span>? Their record and contact details will be removed. Past payments stay in your transactions.</p>
  </KitModal>
}
