import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useKycStatus } from '@/api/kyc'
import { useBusinessBanks } from '@/api/transactions'
import { useChangePin, useRequestPinReset, useResetPin, useSetPin, useVerifyPinReset } from '@/api/wallet'
import { changePinSchema, resetPinSchema, setPinSchema, verifyResetSchema, type ChangePinValues, type ResetPinValues, type SetPinValues, type VerifyResetValues } from '../schemas'

export type PinView = 'set' | 'change' | 'forgot'
export type ResetStep = 'request' | 'verify' | 'reset'

/** Transaction PIN: set, change, and the emailed reset (sink: Pin, ChangePin, ForgetPin, usePinHook). */
export function usePinManager(onClose: () => void) {
  const { businessId } = useBusinessBanks()
  const kyc = useKycStatus()
  const hasPin = kyc.data?.hasPin ?? false
  const [chosenView, setView] = useState<PinView | null>(null)
  const [resetStep, setResetStep] = useState<ResetStep>('request')
  const [uid64, setUid64] = useState('')

  const setForm = useForm<SetPinValues>({ resolver: zodResolver(setPinSchema), defaultValues: { pin: '', confirmPin: '' } })
  const changeForm = useForm<ChangePinValues>({ resolver: zodResolver(changePinSchema), defaultValues: { oldPin: '', newPin: '' } })
  const verifyForm = useForm<VerifyResetValues>({ resolver: zodResolver(verifyResetSchema), defaultValues: { token: '' } })
  const resetForm = useForm<ResetPinValues>({ resolver: zodResolver(resetPinSchema), defaultValues: { newPin: '' } })

  const setPin = useSetPin()
  const changePin = useChangePin()
  const requestReset = useRequestPinReset()
  const verifyReset = useVerifyPinReset()
  const resetPin = useResetPin()

  const fail = (fallback: string) => (failure: unknown) => toast.error(errorMessage(failure, fallback))

  const close = () => {
    setForm.reset(); changeForm.reset(); verifyForm.reset(); resetForm.reset()
    setView(null); setResetStep('request'); setUid64('')
    onClose()
  }

  const done = (message: string) => () => {
    toast.success(message)
    kyc.refetch()
    close()
  }

  const withBusiness = (run: (id: string) => void) => {
    if (!businessId) { toast.error('Select a business first'); return }
    run(businessId)
  }

  return {
    hasPin,
    view: chosenView ?? (hasPin ? 'change' : 'set'),
    setView: (view: PinView) => { setView(view); setResetStep('request') },
    resetStep,
    setForm,
    changeForm,
    verifyForm,
    resetForm,
    submitSet: setForm.handleSubmit(values => withBusiness(id => setPin.mutate({ businessId: id, pin: values.pin }, { onSuccess: done('Transaction PIN created'), onError: fail('Could not create your PIN') }))),
    submitChange: changeForm.handleSubmit(values => withBusiness(id => changePin.mutate({ businessId: id, oldPin: values.oldPin, newPin: values.newPin }, { onSuccess: done('Transaction PIN changed'), onError: fail('Could not change your PIN') }))),
    sendCode: () => withBusiness(id => requestReset.mutate({ businessId: id }, {
      onSuccess: () => { toast.success('We emailed you a reset code'); setResetStep('verify') },
      onError: fail('Could not send the reset code'),
    })),
    submitVerify: verifyForm.handleSubmit(values => withBusiness(id => verifyReset.mutate({ businessId: id, token: values.token }, {
      onSuccess: uid => { setUid64(uid); setResetStep('reset') },
      onError: fail('That code did not work'),
    }))),
    submitReset: resetForm.handleSubmit(values => withBusiness(id => resetPin.mutate({ businessId: id, uid64, pin: values.newPin }, { onSuccess: done('Transaction PIN reset'), onError: fail('Could not reset your PIN') }))),
    busy: setPin.isPending || changePin.isPending || requestReset.isPending || verifyReset.isPending || resetPin.isPending,
    close,
  }
}
