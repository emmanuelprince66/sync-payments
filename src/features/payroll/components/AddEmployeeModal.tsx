import { KitField, KitSelect } from '@/components/ui/KitForm'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { KitButton } from '@/components/ui/PaymentKit'
import { useAddEmployeeForm } from '../hooks/useAddEmployeeForm'
import { EMPLOYMENT_TYPES } from '../schemas'

export function AddEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { form, submit, close, isSubmitting } = useAddEmployeeForm(onClose)
  const { register, formState: { errors } } = form
  return <Modal open={open} onClose={close} overlayClassName="bg-primary/45 p-4 backdrop-blur-sm" panelClassName="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
    <ModalHeader title="Add employee" description="Added to this session’s payroll for review." onClose={close}/>
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
      <KitField label="Full name" error={errors.name?.message} {...register('name')}/>
      <KitField label="Role" error={errors.role?.message} {...register('role')}/>
      <KitField label="Bank account" placeholder="Zenith •• 0281" error={errors.account?.message} {...register('account')}/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KitField label="Gross pay" inputMode="decimal" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })}/>
        <KitSelect label="Pay type" {...register('type')}>{EMPLOYMENT_TYPES.map(type => <option key={type}>{type}</option>)}</KitSelect>
      </div>
      <ModalFooter className="mt-2">
        <KitButton variant="secondary" onClick={close}>Cancel</KitButton>
        <KitButton type="submit" loading={isSubmitting}>Add employee</KitButton>
      </ModalFooter>
    </form>
  </Modal>
}
