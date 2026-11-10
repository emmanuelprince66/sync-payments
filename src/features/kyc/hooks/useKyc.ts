import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  kycErrorMessage,
  useCorporateReview,
  useCreateKycAccount,
  useKycBankId,
  useKycStatus,
  useRefreshCorporateReview,
  useRefreshVerification,
  useUpgradeCorporateAccount,
  useUpgradeIndividualAccount,
  type CorporateReview,
  type IdentityMethod,
  type KycStatus,
} from '@/api/kyc'
import { buildCorporateUpgradeBody, buildIndividualUpgradeBody, compact, emptyCorporateDocs, emptyDirectorFiles, formatKycDate, type DirectorDetails, type DirectorErrors } from '../payload'
import { CORPORATE_DEFAULTS, ELEVEN_DIGITS, INDIVIDUAL_DEFAULTS, corporateAccountSchema, individualAccountSchema, type CorporateFormValues, type IndividualFormValues } from '../schemas'
import { CORPORATE_DOCUMENTS, DIRECTOR_DOCUMENTS, type CorporateDocKey, type DirectorDocKey } from '../tiers'

export type KycTierNumber = 1 | 2 | 3
export type CorporateTierNumber = 1 | 2

export const IDENTITY_LABELS: Record<IdentityMethod, string> = {
  nin: 'National Identity Number (NIN)',
  bvn: 'Bank Verification Number (BVN)',
}

export const IDENTITY_SHORT: Record<IdentityMethod, string> = { nin: 'NIN', bvn: 'BVN' }

export const otherIdentity = (method: IdentityMethod): IdentityMethod => (method === 'nin' ? 'bvn' : 'nin')

const EMPTY_STATUS: KycStatus = {
  bankId: null, tier: 0, tierLabel: null, accountType: null, hasNin: false, hasBvn: false, hasAddress: false, hasPin: false,
  wallet: null, completedTiers: [], corporateCompletedTiers: [], verificationStatus: null, hasStarted: false, missingIdentity: null, businessVerified: false,
}

const EMPTY_REVIEW: CorporateReview = { isPending: false, isApproved: false, isRejected: false, hasSubmitted: false, status: null, submittedAt: null, directors: [] }

/** Opens the provider's hosted wallet page returned by create_bank_account, in a new tab. */
const openWalletUrl = (url: string | null) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Port of sink-inventory's useKycHook: what the account has verified, the
 * individual and corporate forms, documents, directors and the submit logic
 * for every tier. Owned by the KYC page and handed to whichever flow renders,
 * so the account payload is read once.
 */
export const useKyc = () => {
  const status = useKycStatus()
  const corporate = useCorporateReview()
  const bankId = useKycBankId()
  const refreshVerification = useRefreshVerification()
  const refreshCorporateUpgrade = useRefreshCorporateReview()

  const createAccount = useCreateKycAccount()
  const upgradeIndividual = useUpgradeIndividualAccount()
  const upgradeCorporate = useUpgradeCorporateAccount()
  const isPending = createAccount.isPending || upgradeIndividual.isPending || upgradeCorporate.isPending

  const verification = useMemo(() => ({ ...(status.data ?? EMPTY_STATUS), isLoading: status.isLoading }), [status.data, status.isLoading])
  const corporateReview = corporate.data ?? EMPTY_REVIEW

  const individualForm = useForm<IndividualFormValues>({ resolver: zodResolver(individualAccountSchema), defaultValues: INDIVIDUAL_DEFAULTS, mode: 'onChange' })
  const corporateForm = useForm<CorporateFormValues>({ resolver: zodResolver(corporateAccountSchema), defaultValues: CORPORATE_DEFAULTS, mode: 'onChange' })

  // Tier 1 asks for one identifier, never both.
  const [identityMethod, setIdentityMethod] = useState<IdentityMethod>('nin')

  const chooseIdentityMethod = useCallback((method: IdentityMethod) => {
    setIdentityMethod(method)
    // Drop whatever was typed under the other option so it never reaches the payload.
    const other = otherIdentity(method)
    individualForm.setValue(other, '')
    individualForm.clearErrors(other)
  }, [individualForm])

  /** What Tier 2 asks for: whatever Tier 1 did not supply. */
  const tier2Identity: IdentityMethod = verification.missingIdentity ?? otherIdentity(identityMethod)

  // ─── Corporate documents ─────────────────────────────────────────────────
  const [corporateDocs, setCorporateDocs] = useState(emptyCorporateDocs)
  const [corporateDocErrors, setCorporateDocErrors] = useState<Partial<Record<CorporateDocKey, string>>>({})

  const setCorporateDoc = useCallback((key: CorporateDocKey, file: File | null) => {
    setCorporateDocs(prev => ({ ...prev, [key]: file }))
    setCorporateDocErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ─── Directors: at least one ─────────────────────────────────────────────
  const nextDirectorId = useRef(1)
  const [directors, setDirectors] = useState<DirectorDetails[]>(() => [{ id: 'director-0', name: '', files: emptyDirectorFiles() }])
  const [directorErrors, setDirectorErrors] = useState<Record<string, DirectorErrors>>({})

  const clearDirectorError = useCallback((id: string, field: keyof DirectorErrors) =>
    setDirectorErrors(prev => {
      if (!prev[id]?.[field]) return prev
      const forDirector = { ...prev[id] }
      delete forDirector[field]
      return { ...prev, [id]: forDirector }
    }), [])

  const addDirector = useCallback(() => {
    const id = `director-${nextDirectorId.current++}`
    setDirectors(prev => [...prev, { id, name: '', files: emptyDirectorFiles() }])
  }, [])

  /** The first director is the account's primary contact and cannot be removed. */
  const removeDirector = useCallback((id: string) => {
    setDirectors(prev => (prev.length === 1 ? prev : prev.filter(director => director.id !== id)))
    setDirectorErrors(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const updateDirector = useCallback((id: string, field: 'name', value: string) => {
    setDirectors(prev => prev.map(director => (director.id === id ? { ...director, [field]: value } : director)))
    clearDirectorError(id, field)
  }, [clearDirectorError])

  const updateDirectorFile = useCallback((id: string, key: DirectorDocKey, file: File | null) => {
    setDirectors(prev => prev.map(director => (director.id === id ? { ...director, files: { ...director.files, [key]: file } } : director)))
    clearDirectorError(id, key)
  }, [clearDirectorError])

  // ─── Individual validation ───────────────────────────────────────────────
  const validateTier = (tier: KycTierNumber, values: IndividualFormValues, addressMode: 'autocomplete' | 'manual') => {
    const setError = (field: keyof IndividualFormValues, message: string) => individualForm.setError(field, { type: 'manual', message })
    let ok = true

    // Name and date of birth open the account at Tier 1; once it exists they are on file.
    const opensAccount = !verification.completedTiers.includes(1)
    if (opensAccount) {
      if (!values.first_name?.trim()) { setError('first_name', 'First name is required'); ok = false }
      if (!values.last_name?.trim()) { setError('last_name', 'Last name is required'); ok = false }
      if (!values.dob) { setError('dob', 'Date of birth is required'); ok = false }
    }

    const checkIdentity = (field: IdentityMethod) => {
      if (!ELEVEN_DIGITS.test(values[field] ?? '')) {
        setError(field, `Enter the 11-digit ${IDENTITY_SHORT[field]}`)
        ok = false
      }
    }
    if (tier === 1) checkIdentity(identityMethod)
    if (tier === 2) checkIdentity(tier2Identity)

    if (tier >= 3) {
      if (!values.address?.trim()) { setError('address', 'Select your address'); ok = false }
      if (!values.state?.trim()) { setError('state', addressMode === 'autocomplete' ? 'Pick your address from the list' : 'Select your state'); ok = false }
    }
    return ok
  }

  const buildTierPayload = (tier: KycTierNumber, values: IndividualFormValues) => {
    const payload: Record<string, unknown> = { type: 'INDIVIDUAL', first_name: values.first_name, last_name: values.last_name, dob: formatKycDate(values.dob) }
    if (tier === 1) payload[identityMethod] = values[identityMethod]
    if (tier === 2) payload[tier2Identity] = values[tier2Identity]
    if (tier >= 3) {
      payload.address = values.address
      payload.city = values.city
      payload.state = values.state
    }
    return compact(payload)
  }

  /**
   * Submits one individual tier; resolves true only when the API accepted it.
   * Tier 1 opens the account (create_bank_account, the only call that takes
   * name and date of birth); Tiers 2 and 3 go to upgrade_account.
   */
  const submitTier = async (tier: KycTierNumber, addressMode: 'autocomplete' | 'manual' = 'autocomplete'): Promise<boolean> => {
    const values = individualForm.getValues()
    individualForm.clearErrors()
    if (!validateTier(tier, values, addressMode)) {
      toast.error('Check the highlighted fields and try again')
      return false
    }

    const onAccepted = (url: string | null = null) => {
      toast.success(`Tier ${tier} verification submitted`)
      refreshVerification()
      openWalletUrl(url)
      return true
    }

    if (tier === 1) {
      try {
        const response = await createAccount.mutateAsync({ ...buildTierPayload(tier, values), type: 'INDIVIDUAL' })
        toast.success('Account Created Successfully')
        return onAccepted(response.url)
      } catch (error) {
        toast.error(kycErrorMessage(error, 'Error creating account'))
        return false
      }
    }

    const body = buildIndividualUpgradeBody({
      ...(tier === 2 ? { [tier2Identity]: values[tier2Identity] } : {}),
      ...(tier === 3 ? { address: values.address } : {}),
    })
    try {
      await upgradeIndividual.mutateAsync({ bankId: bankId ?? '', body })
      return onAccepted()
    } catch (error) {
      toast.error(kycErrorMessage(error, 'Could not upgrade the account'))
      return false
    }
  }

  // ─── Corporate validation ────────────────────────────────────────────────
  const validateCorporateTier1 = (values: CorporateFormValues) => {
    let ok = true
    const required: [keyof CorporateFormValues, string][] = [
      ['firstname', 'First name is required'],
      ['lastname', 'Last name is required'],
      ['business_name', 'Business name is required'],
      ['registration_number', 'RC / BN number is required'],
      ['address', 'Business address is required'],
      ['state', 'State is required'],
      ['business_type', 'Select the business type'],
    ]
    required.forEach(([field, message]) => {
      if (!String(values[field] ?? '').trim()) {
        corporateForm.setError(field, { type: 'manual', message })
        ok = false
      }
    })
    if (!ELEVEN_DIGITS.test(values.bvn ?? '')) {
      corporateForm.setError('bvn', { type: 'manual', message: "Enter the director's 11-digit BVN" })
      ok = false
    }
    return ok
  }

  const validateCorporateTier2 = (values: CorporateFormValues) => {
    let ok = true
    if (!values.tin?.trim()) {
      corporateForm.setError('tin', { type: 'manual', message: 'Tax Identification Number is required' })
      ok = false
    }
    const docErrors: Partial<Record<CorporateDocKey, string>> = {}
    CORPORATE_DOCUMENTS.forEach(doc => {
      if (!corporateDocs[doc.key]) { docErrors[doc.key] = `${doc.label} is required`; ok = false }
    })
    setCorporateDocErrors(docErrors)

    const nextDirectorErrors: Record<string, DirectorErrors> = {}
    directors.forEach(director => {
      const errors: DirectorErrors = {}
      if (!director.name.trim()) errors.name = 'Full name is required'
      DIRECTOR_DOCUMENTS.forEach(doc => { if (!director.files[doc.key]) errors[doc.key] = 'This upload is required' })
      if (Object.keys(errors).length) { nextDirectorErrors[director.id] = errors; ok = false }
    })
    setDirectorErrors(nextDirectorErrors)
    return ok
  }

  const buildCorporatePayload = (values: CorporateFormValues) => compact({
    type: 'CORPORATE',
    bvn: values.bvn,
    firstname: values.firstname,
    lastname: values.lastname,
    dob: formatKycDate(values.dob),
    business_name: values.business_name,
    registration_number: values.registration_number,
    reg_date: formatKycDate(values.reg_date),
    address: values.address,
    state: values.state,
    // create_bank_account needs this to open a business account ("RC" or "BN").
    business_type: values.business_type,
  })

  /** Mirrors submitTier: resolves true only once the API accepted the tier. */
  const submitCorporateTier = async (tier: CorporateTierNumber): Promise<boolean> => {
    const values = corporateForm.getValues()
    corporateForm.clearErrors()

    // Only re-check Tier 1 while it is outstanding: after a reload its fields are empty and not on screen.
    const tier1OnFile = verification.corporateCompletedTiers.includes(1)
    const valid = tier === 1
      ? validateCorporateTier1(values)
      : tier1OnFile
        ? validateCorporateTier2(values)
        : [validateCorporateTier1(values), validateCorporateTier2(values)].every(Boolean)

    if (!valid) {
      toast.error('Check the highlighted fields and try again')
      return false
    }

    if (tier === 2) {
      const body = buildCorporateUpgradeBody({ tin: values.tin ?? '', documents: corporateDocs, directors })
      try {
        await upgradeCorporate.mutateAsync({ bankId: bankId ?? '', body })
        toast.success('Company documents submitted')
        refreshVerification()
        refreshCorporateUpgrade()
        return true
      } catch (error) {
        toast.error(kycErrorMessage(error, 'Could not submit the company documents'))
        return false
      }
    }

    try {
      const response = await createAccount.mutateAsync({ ...buildCorporatePayload(values), type: 'CORPORATE' })
      toast.success('Account Created Successfully')
      toast.success(`Tier ${tier} verification submitted`)
      refreshVerification()
      openWalletUrl(response.url)
      return true
    } catch (error) {
      toast.error(kycErrorMessage(error, 'Error creating account'))
      return false
    }
  }

  /** How many corporate Tier 2 documents are in; drives the checklist copy. */
  const corporateDocsCount = useMemo(() => CORPORATE_DOCUMENTS.filter(doc => corporateDocs[doc.key]).length, [corporateDocs])

  return {
    individualForm,
    corporateForm,
    submitTier,
    submitCorporateTier,
    verification,
    refreshVerification,
    corporateReview,
    refreshCorporateUpgrade,
    identityMethod,
    chooseIdentityMethod,
    tier2Identity,
    corporateDocs,
    setCorporateDoc,
    corporateDocErrors,
    corporateDocsCount,
    directors,
    directorErrors,
    addDirector,
    removeDirector,
    updateDirector,
    updateDirectorFile,
    isPending,
  }
}

export type Kyc = ReturnType<typeof useKyc>
export type Verification = Kyc['verification']
