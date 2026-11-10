import { KitField } from '@/components/ui/KitForm'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { KitButton } from '@/components/ui/PaymentKit'
import { useAddBranchForm } from '../hooks/useAddBranchForm'

export function AddBranchModal({ open, onClose, defaultAccount }: { open: boolean; onClose: () => void; defaultAccount: string }) {
  const { form, submit, close, isSubmitting } = useAddBranchForm(defaultAccount, onClose)
  const { register, formState: { errors } } = form
  return <Modal open={open} onClose={close} overlayClassName="bg-primary/45 p-4 backdrop-blur-sm" panelClassName="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
    <ModalHeader title="Add branch" description="Opens a sub-account for this branch under your business." onClose={close}/>
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
      <KitField label="Branch name" placeholder="Enter branch name" error={errors.branch?.message} {...register('branch')}/>
      <KitField label="Previous account number" inputMode="numeric" placeholder="Enter previous account number" error={errors.previousAccount?.message} {...register('previousAccount')}/>
      <ModalFooter className="mt-2">
        <KitButton variant="secondary" onClick={close}>Cancel</KitButton>
        <KitButton type="submit" loading={isSubmitting}>Create branch</KitButton>
      </ModalFooter>
    </form>
  </Modal>
}
