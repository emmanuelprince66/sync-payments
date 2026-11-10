import { KitField, KitFormDate, KitSelect } from '@/components/ui/KitForm'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useAddressField } from '../hooks/useAddressField'
import { IDENTITY_LABELS, IDENTITY_SHORT, otherIdentity, type Kyc } from '../hooks/useKyc'
import { NIGERIAN_STATES } from '../tiers'
import { IdentityMethodPicker } from './Inputs'
import { CapturedSummary, DigitsField, Notice, SectionHeading, SubmitButton } from './KycUi'

const TODAY = new Date()

type FormProps = { kyc: Kyc; onSubmit: () => void }

/** Tier 1 opens the account on one identifier: NIN or BVN, never both. */
export function Tier1Form({ kyc, onSubmit }: FormProps) {
  const { individualForm: form, identityMethod, chooseIdentityMethod, isPending } = kyc
  const errors = form.formState.errors
  return <form noValidate className="w-full flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onSubmit() }}>
    <div className="flex flex-col gap-4">
      <SectionHeading title="Personal details"/>
      <div className="grid gap-4 sm:grid-cols-2">
        <KitField label="First name" placeholder="Enter first name" autoComplete="given-name" error={errors.first_name?.message} {...form.register('first_name')}/>
        <KitField label="Last name" placeholder="Enter last name" autoComplete="family-name" error={errors.last_name?.message} {...form.register('last_name')}/>
      </div>
      <KitFormDate control={form.control} name="dob" label="Date of birth" placeholder="Select your date of birth" max={TODAY} yearJump error={errors.dob?.message}/>
    </div>

    <div className="flex flex-col gap-4">
      <SectionHeading title="Identity" description="Verify with one of these to start. Tier 2 asks for the other."/>
      <IdentityMethodPicker value={identityMethod} onChange={chooseIdentityMethod}/>
      <DigitsField key={identityMethod} registration={form.register(identityMethod)} error={errors[identityMethod]?.message} label={IDENTITY_LABELS[identityMethod]} placeholder={`Enter your 11-digit ${IDENTITY_SHORT[identityMethod]}`}/>
    </div>

    <Notice title="After Tier 1">
      You can start using the account straight away, or continue to Tier 2 — which asks for your {IDENTITY_SHORT[otherIdentity(identityMethod)]} — for a higher daily limit.
    </Notice>

    <SubmitButton pending={isPending}>Submit Tier 1 verification</SubmitButton>
  </form>
}

/** Tier 2 completes the pair: it asks for whichever number is not on file yet. */
export function Tier2Form({ kyc, onSubmit }: FormProps) {
  const { individualForm: form, tier2Identity, verification, isPending } = kyc
  const errors = form.formState.errors
  const onFile = otherIdentity(tier2Identity)
  const onFileVerified = onFile === 'nin' ? verification.hasNin : verification.hasBvn
  return <form noValidate className="w-full flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onSubmit() }}>
    <div className="flex items-center gap-3 rounded-2xl border border-secondary/25 bg-[#F4FAF5] p-4">
      <span className="shrink-0 text-secondary"><Icon name="check" size={18} stroke={2.4}/></span>
      <div className="text-xs leading-5">
        <p className="text-[13px] font-extrabold text-secondary">{IDENTITY_SHORT[onFile]} verified</p>
        <p className="text-muted-foreground">{onFileVerified
          ? `Your ${IDENTITY_SHORT[onFile]} cleared at Tier 1. Add your ${IDENTITY_SHORT[tier2Identity]} to finish Tier 2.`
          : `Submitted at Tier 1. Add your ${IDENTITY_SHORT[tier2Identity]} to finish Tier 2.`}</p>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <SectionHeading title={`Add your ${IDENTITY_SHORT[tier2Identity]}`} description="This is the only thing Tier 2 still needs."/>
      <DigitsField key={tier2Identity} registration={form.register(tier2Identity)} error={errors[tier2Identity]?.message} label={IDENTITY_LABELS[tier2Identity]} placeholder={`Enter your 11-digit ${IDENTITY_SHORT[tier2Identity]}`}/>
    </div>

    <Notice>Both numbers are checked against government databases. Neither is ever shown in full anywhere in the app.</Notice>

    <SubmitButton pending={isPending}>Submit Tier 2 verification</SubmitButton>
  </form>
}

/** Tier 3 is the residential address. No document upload: upgrade_account takes one address string. */
export function Tier3Form({ kyc, onSubmit }: { kyc: Kyc; onSubmit: (mode: 'autocomplete' | 'manual') => void }) {
  const { individualForm: form, verification, isPending } = kyc
  const address = useAddressField(kyc)
  const errors = form.formState.errors
  const autocomplete = address.mode === 'autocomplete'

  return <form noValidate className="w-full flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onSubmit(address.mode) }}>
    <CapturedSummary items={[
      { label: 'NIN', value: verification.hasNin ? 'Verified' : '—' },
      { label: 'BVN', value: verification.hasBvn ? 'Verified' : '—' },
      { label: 'Tier', value: verification.tierLabel ?? `Tier ${verification.tier}` },
    ]}/>

    <div className="flex flex-col gap-4">
      <SectionHeading
        title="Street address"
        description={autocomplete
          ? 'Start typing and pick your address from the list — the suggestion is what confirms the city and state we send.'
          : 'Enter your residential address, then pick your state.'}
      />

      <div className="relative">
        <label className="block" htmlFor="kyc-address">
          <span className="mb-1.5 block text-[10px] font-extrabold text-foreground">Residential address</span>
          <span className={cn('flex min-h-11 items-start gap-2 rounded-xl border border-border bg-[#F8FAF8] px-3 py-3 transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10', errors.address && 'border-[#C72D34]')}>
            <span className="mt-0.5 text-muted-foreground"><Icon name="location" size={16}/></span>
            <textarea
              id="kyc-address"
              rows={2}
              value={address.query}
              onChange={event => address.type(event.target.value)}
              onBlur={() => window.setTimeout(address.close, 150)}
              onKeyDown={event => { if (event.key === 'Escape') address.close() }}
              placeholder={autocomplete ? 'Start typing your address...' : 'House number, street, area'}
              aria-invalid={errors.address ? true : undefined}
              autoComplete="street-address"
              className="min-w-0 flex-1 resize-none bg-transparent text-xs font-bold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground"
            />
            {autocomplete && address.hasCoordinates && <span className="mt-0.5 text-secondary" title="Address confirmed"><Icon name="check" size={16} stroke={2.6}/></span>}
          </span>
        </label>
        {address.open && <ul role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_50px_rgba(9,38,28,.16)]">
          {address.searching && address.suggestions.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">Searching…</li>}
          {!address.searching && address.suggestions.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">No matching addresses</li>}
          {address.suggestions.map(suggestion => <li key={suggestion.id}>
            <button type="button" role="option" aria-selected={false} onMouseDown={event => event.preventDefault()} onClick={() => address.choose(suggestion)} className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent">
              <span className="mt-0.5 text-secondary"><Icon name="location" size={15}/></span>
              <span className="min-w-0"><span className="block truncate text-xs font-bold text-foreground">{suggestion.address || suggestion.label}</span><span className="block truncate text-[10px] text-muted-foreground">{[suggestion.city, suggestion.state].filter(Boolean).join(', ')}</span></span>
            </button>
          </li>)}
        </ul>}
        {errors.address && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#C72D34]">{errors.address.message}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {autocomplete
          ? <>
            <KitField label="City" readOnly placeholder="Filled in when you pick an address" {...form.register('city')}/>
            <KitField label="State" readOnly placeholder="Filled in when you pick an address" error={errors.state?.message} {...form.register('state')}/>
          </>
          : <>
            <KitField label="City" placeholder="Enter your city" autoComplete="address-level2" {...form.register('city')}/>
            <KitSelect label="State" placeholder="Select state" options={NIGERIAN_STATES.map(state => ({ value: state, label: state }))} error={errors.state?.message} {...form.register('state')}/>
          </>}
      </div>
    </div>

    <Notice>Your address is checked against the details already on file. You keep your Tier 2 limit while that runs.</Notice>

    <SubmitButton pending={isPending}>Submit Tier 3 verification</SubmitButton>
  </form>
}
