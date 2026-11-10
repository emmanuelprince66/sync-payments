import { KitField, KitFormDate, KitSelect } from '@/components/ui/KitForm'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { Kyc } from '../hooks/useKyc'
import type { DirectorDetails, DirectorErrors } from '../payload'
import { BUSINESS_TYPES, CORPORATE_DOCUMENTS, DIRECTOR_DOCUMENTS, NIGERIAN_STATES, type DirectorDocKey } from '../tiers'
import { FileUploadField } from './Inputs'
import { DigitsField, Notice, SectionHeading, SubmitButton } from './KycUi'

const TODAY = new Date()
const STATE_OPTIONS = NIGERIAN_STATES.map(state => ({ value: state, label: state }))

type FormProps = { kyc: Kyc; onSubmit: () => void }

/** Corporate Tier 1: who is opening the account and which registered business it belongs to. */
export function CorporateTier1Form({ kyc, onSubmit }: FormProps) {
  const { corporateForm: form, isPending } = kyc
  const errors = form.formState.errors
  return <form noValidate className="w-full flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onSubmit() }}>
    <div className="flex flex-col gap-4">
      <SectionHeading title="Primary director" description="The director opening the account on the business's behalf."/>
      <div className="grid gap-4 sm:grid-cols-2">
        <KitField label="First name" placeholder="Enter first name" error={errors.firstname?.message} {...form.register('firstname')}/>
        <KitField label="Last name" placeholder="Enter last name" error={errors.lastname?.message} {...form.register('lastname')}/>
        <KitFormDate control={form.control} name="dob" label="Date of birth" placeholder="Select your date of birth" max={TODAY} yearJump error={errors.dob?.message}/>
        <DigitsField registration={form.register('bvn')} error={errors.bvn?.message} label="Director's BVN" placeholder="11-digit BVN"/>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <SectionHeading title="Business details" description="These must match the records held at CAC."/>
      <KitField label="Registered business name" placeholder="Enter your business name" error={errors.business_name?.message} {...form.register('business_name')}/>
      <KitSelect label="Business type" placeholder="Select business type" options={BUSINESS_TYPES} error={errors.business_type?.message} {...form.register('business_type')}/>
      <div className="grid gap-4 sm:grid-cols-2">
        <KitField label="RC / BN number" placeholder="Enter your registration number" error={errors.registration_number?.message} {...form.register('registration_number')}/>
        <KitFormDate control={form.control} name="reg_date" label="Registration date" placeholder="Select the registration date" max={TODAY} yearJump error={errors.reg_date?.message}/>
      </div>
      <KitField label="Business address" placeholder="Enter business address" error={errors.address?.message} {...form.register('address')}/>
      <KitSelect label="State" placeholder="Select state" options={STATE_OPTIONS} error={errors.state?.message} {...form.register('state')}/>
    </div>

    <Notice title="After Tier 1">The account opens on a ₦100,000 daily limit. Tier 2 adds your CAC documents and director records to lift it.</Notice>

    <SubmitButton pending={isPending}>Submit Tier 1 verification</SubmitButton>
  </form>
}

type DirectorCardProps = {
  director: DirectorDetails
  index: number
  canRemove: boolean
  errors?: DirectorErrors
  onNameChange: (value: string) => void
  onFileChange: (key: DirectorDocKey, file: File | null) => void
  onRemove: () => void
}

/** One director's record: their name and the two documents the endpoint takes for them. */
export function DirectorCard({ director, index, canRemove, errors, onNameChange, onFileChange, onRemove }: DirectorCardProps) {
  const uploaded = DIRECTOR_DOCUMENTS.filter(doc => director.files[doc.key]).length
  const complete = uploaded === DIRECTOR_DOCUMENTS.length && Boolean(director.name.trim())
  const hasErrors = Boolean(errors && Object.keys(errors).length)
  return <div className={cn('rounded-2xl border bg-white p-4 sm:p-5', hasErrors ? 'border-[#C72D34]/40' : 'border-border')}>
    <header className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', complete ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground')}><Icon name={complete ? 'check' : 'user'} size={15}/></span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-foreground">Director {index + 1}{index === 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-secondary">Primary</span>}</p>
          <p className="text-[10px] text-muted-foreground">{uploaded} of {DIRECTOR_DOCUMENTS.length} documents uploaded</p>
        </div>
      </div>
      {canRemove && <button type="button" onClick={onRemove} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-[#C72D34] transition-colors hover:bg-[#FFF0EE]"><Icon name="trash" size={14}/>Remove</button>}
    </header>
    <KitField label="Full name *" id={`${director.id}-name`} placeholder="Enter the director's full name" value={director.name} onChange={event => onNameChange(event.target.value)} error={errors?.name}/>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {DIRECTOR_DOCUMENTS.map(doc => <FileUploadField key={doc.key} compact id={`${director.id}-${doc.key}`} label={doc.label} hint={doc.hint} accept={doc.accept} value={director.files[doc.key]} onChange={file => onFileChange(doc.key, file)} error={errors?.[doc.key]}/>)}
    </div>
  </div>
}

/** Corporate Tier 2: the TIN, the company's legal filings, and a record for every director. */
export function CorporateTier2Form({ kyc, onSubmit }: FormProps) {
  const { corporateForm: form, isPending, corporateDocs, setCorporateDoc, corporateDocErrors, corporateDocsCount, directors, directorErrors, addDirector, removeDirector, updateDirector, updateDirectorFile } = kyc
  const errors = form.formState.errors
  return <form noValidate className="w-full flex flex-col gap-8" onSubmit={event => { event.preventDefault(); onSubmit() }}>
    <div className="flex flex-col gap-4">
      <SectionHeading title="Tax" description="The business's tax identification number."/>
      <KitField label="Tax Identification Number (TIN)" placeholder="Enter TIN" error={errors.tin?.message} {...form.register('tin')}/>
    </div>

    <div className="flex flex-col gap-4">
      <SectionHeading title="Company documents" description="Clear scans or photos — every page must be readable." meta={`${corporateDocsCount} of ${CORPORATE_DOCUMENTS.length} uploaded`}/>
      <div className="grid gap-4 sm:grid-cols-2">
        {CORPORATE_DOCUMENTS.map(doc => <FileUploadField key={doc.key} id={`corporate-${doc.key}`} label={doc.label} hint={doc.hint} accept={doc.accept} value={corporateDocs[doc.key]} onChange={file => setCorporateDoc(doc.key, file)} error={corporateDocErrors[doc.key]}/>)}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <SectionHeading title="Director details" description="Every director on the CAC filing needs their own record. At least one is required." meta={`${directors.length} ${directors.length === 1 ? 'director' : 'directors'}`}/>
      <div className="flex flex-col gap-4">
        {directors.map((director, index) => <DirectorCard
          key={director.id}
          director={director}
          index={index}
          canRemove={directors.length > 1}
          errors={directorErrors[director.id]}
          onNameChange={value => updateDirector(director.id, 'name', value)}
          onFileChange={(key, file) => updateDirectorFile(director.id, key, file)}
          onRemove={() => removeDirector(director.id)}
        />)}
      </div>
      <button type="button" onClick={addDirector} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-secondary text-xs font-extrabold text-secondary transition-colors hover:bg-[#F4FAF5]"><Icon name="plus" size={16}/>Add director</button>
    </div>

    <Notice>Document review usually takes 1–3 business days. You keep your Tier 1 limit while the review is running, and we will email every director listed here if anything needs re-uploading.</Notice>

    <SubmitButton pending={isPending}>Submit Tier 2 verification</SubmitButton>
  </form>
}
