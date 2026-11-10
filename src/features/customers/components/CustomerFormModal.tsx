import { CircleAlert, UserCheck, UserPlus, UserRoundPen } from 'lucide-react'
import type { Customer } from '@/api/customers'
import { KitModal, KitTextarea } from '@/components/ui/KitExtras'
import { KitDateField, KitField, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { useCustomerForm } from '../hooks/useCustomerForm'

type Props = { open: boolean; customer: Customer | null; onClose: (saved?: Customer) => void }

/** Add or edit a customer (sink's AddCustomer / EditCustomer). */
export function CustomerFormModal({ open, customer, onClose }: Props) {
  return <KitModal
    open={open}
    onClose={() => onClose()}
    title={customer ? 'Edit customer' : 'Add customer'}
    description={customer ? 'Update this customer’s contact details and address.' : 'Only a name and phone number are required.'}
    icon={customer ? <UserRoundPen size={16}/> : <UserPlus size={16}/>}
    panelClassName="max-w-lg"
    bodyClassName="p-0"
  >
    {/* Mounted per opening, so each form starts from the saved values. */}
    {open && <CustomerForm key={customer?.id ?? 'new'} customer={customer} onClose={onClose}/>}
  </KitModal>
}

function CustomerForm({ customer, onClose }: { customer: Customer | null; onClose: (saved?: Customer) => void }) {
  const form = useCustomerForm(customer, onClose)
  const { register, errors } = form

  return <form onSubmit={form.onSubmit} noValidate className="flex flex-col">
    <div className="flex flex-col gap-4 p-6">
      <KitField label="Name" placeholder="Customer name" autoComplete="off" error={errors.name?.message} {...register('name')}/>
      <div>
        <KitField label="Phone number" type="tel" inputMode="tel" placeholder="08012345678" autoComplete="off" error={errors.phone?.message} {...register('phone')}/>
        {form.isCheckingPhone && <p className="mt-1 text-[10px] text-muted-foreground">Checking for an existing customer…</p>}
      </div>

      {form.phoneMatches.length > 0 && <div className="rounded-xl border border-[#BFD7EE] bg-[#F1F7FD] p-3">
        <p className="flex items-center gap-2 text-[11px] font-extrabold text-[#1C6FA8]"><UserCheck size={14} className="shrink-0"/>{form.phoneMatches.length === 1 ? 'This number is already on file' : `${form.phoneMatches.length} customers have this number`}</p>
        <div className="mt-2 flex flex-col gap-2">
          {form.phoneMatches.map(match => <div key={match.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{match.name}</p><p className="truncate text-[10px] text-muted-foreground">{match.phone}{match.email ? ` · ${match.email}` : ''}</p></div>
            <KitButton variant="secondary" className="px-3 py-1.5 text-[10px]" onClick={() => form.fillFrom(match)}>Fill in details</KitButton>
          </div>)}
        </div>
      </div>}

      <KitField label="Email (optional)" type="email" placeholder="name@example.com" autoComplete="off" error={errors.email?.message} {...register('email')}/>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <KitSelect label="Gender (optional)" placeholder="Select gender" options={form.genderOptions} error={errors.gender?.message} {...register('gender')}/>
        <KitDateField label="Date of birth (optional)" value={form.dateOfBirth} onChange={form.setDateOfBirth} placeholder="Select date" max={new Date()} yearJump/>
      </div>

      <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground">Address (optional)</div>
      <KitTextarea label="Street address" rows={2} placeholder="e.g. 22 Awolowo Road" error={errors.address?.message} {...register('address')}/>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <KitSelect label="State" placeholder="Select state" options={form.stateOptions} error={errors.state?.message} {...register('state')}/>
        <KitField label="City" placeholder="e.g. Ikeja" error={errors.city?.message} {...register('city')}/>
      </div>
      {form.isEditing && <KitField label="Address phone" type="tel" placeholder="Delivery contact number" error={errors.addressPhone?.message} {...register('addressPhone')}/>}

      {!form.isEditing && <div className="flex items-start gap-2.5 rounded-xl border border-[#BFD7EE] bg-[#F1F7FD] p-3 text-[11px] font-semibold leading-4 text-[#1C6FA8]">
        <CircleAlert size={15} className="mt-0.5 shrink-0"/>Ask your customers for permission before you subscribe them to marketing emails or SMS.
      </div>}
    </div>
    <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-white px-6 py-4">
      <KitButton variant="secondary" onClick={() => onClose()}>Cancel</KitButton>
      <KitButton type="submit" loading={form.isSubmitting}>{form.isEditing ? 'Save changes' : 'Add customer'}</KitButton>
    </div>
  </form>
}
