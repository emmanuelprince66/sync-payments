import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { normalizeStoreDomain, STORE_DNS_TARGET, useSaveStorefront } from '@/api/storefront'
import { useClipboard } from '@/hooks/useClipboard'
import { domainSchema } from '../schemas'

/** Two-step custom domain flow from sink-inventory: enter the domain, then add the CNAME and save. */
export function useCustomDomain(currentDomain: string, onDone: () => void) {
  const [step, setStep] = useState<1 | 2>(1)
  const [input, setInput] = useState(currentDomain)
  const [error, setError] = useState('')
  const { copied, copy } = useClipboard(1800)
  const save = useSaveStorefront()
  const domain = normalizeStoreDomain(input)

  const continueToDns = () => {
    const result = domainSchema.safeParse(domain)
    if (!result.success) return setError(result.error.issues[0]?.message ?? 'Enter a valid domain')
    setError('')
    setInput(domain)
    setStep(2)
  }

  const submit = () =>
    save.mutate({ customDomain: domain }, {
      onSuccess: () => { toast.success('Domain saved. We’ll connect it once your DNS record is live.'); setStep(1); onDone() },
      onError: failure => toast.error(errorMessage(failure)),
    })

  return {
    step,
    input,
    setInput: (value: string) => { setInput(value); setError('') },
    error,
    domain,
    dnsTarget: STORE_DNS_TARGET,
    /** "shop" for shop.example.com, "@" for an apex domain. */
    hostLabel: domain.split('.').length > 2 ? domain.split('.').slice(0, -2).join('.') : '@',
    copied,
    copyTarget: () => copy(STORE_DNS_TARGET),
    continueToDns,
    back: () => setStep(1),
    submit,
    saving: save.isPending,
  }
}
