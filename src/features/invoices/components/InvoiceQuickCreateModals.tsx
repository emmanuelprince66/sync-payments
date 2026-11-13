import { Package, UserRoundPlus } from 'lucide-react'
import { KitModal, KitMoneyField, KitTextarea } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { Select } from '@/components/ui/Select'
import { SALES_ACCOUNTS, TAX_RATES } from '../constants'
import type { NewContactForm, NewItemForm } from '../hooks/useInvoiceQuickCreate'

export function NewContactModal({ model }: { model: NewContactForm }) {
  const { register, formState: { errors } } = model.form
  return <KitModal open={model.open} onClose={model.close} title="New contact" description="Adds a customer you can invoice. They also appear under Customers." icon={<UserRoundPlus size={16}/>} panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={model.close}>Cancel</KitButton><KitButton loading={model.submitting} onClick={model.submit}>Save contact</KitButton></>}>
    <form onSubmit={model.submit} className="flex flex-col gap-4">
      <KitField label="Contact name" autoComplete="organization" error={errors.name?.message} {...register('name')}/>
      <KitField label="Phone number" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')}/>
      <KitField label="Email (optional)" type="email" autoComplete="email" error={errors.email?.message} {...register('email')}/>
      <button type="submit" hidden aria-hidden="true" tabIndex={-1}/>
    </form>
  </KitModal>
}

export function NewItemModal({ model }: { model: NewItemForm }) {
  const { register, formState: { errors } } = model.form
  return <KitModal open={model.open} onClose={model.close} title="New item" description="Save a product or service to reuse on invoices." icon={<Package size={16}/>} panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={model.close}>Cancel</KitButton><KitButton loading={model.submitting} onClick={model.submit}>Save item</KitButton></>}>
    <form onSubmit={model.submit} className="flex flex-col gap-4">
      <KitTextarea label="Description" rows={3} placeholder="e.g. Consulting (hourly). Shown on the invoice line and in the item list" error={errors.description?.message} {...register('description')}/>
      <KitMoneyField label="Default price" symbol="₦" error={errors.price?.message} {...register('price')}/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Default tax rate" options={TAX_RATES} error={errors.taxRate?.message} {...register('taxRate')}/>
        <Select label="Account" options={SALES_ACCOUNTS} {...register('account')}/>
      </div>
      <button type="submit" hidden aria-hidden="true" tabIndex={-1}/>
    </form>
  </KitModal>
}
