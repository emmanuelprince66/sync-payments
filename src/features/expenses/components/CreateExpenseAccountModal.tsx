import { Building2, Check, Copy, Layers, ShieldCheck, Users, Wallet } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { EXPENSE_PREFIX, useCreateExpenseAccount, type CreateExpenseAccountModel } from '../hooks/useCreateExpenseAccount'

const BENEFITS = [
  { icon: Wallet, text: 'Manage business expenses from one dedicated account.' },
  { icon: ShieldCheck, text: 'Control team spending by setting spending rules and permissions.' },
  { icon: Layers, text: 'Track operational spending and know where your business money is going.' },
  { icon: Building2, text: 'Separate expenses from your main business funds for better financial control.' },
  { icon: Users, text: 'Give your team access to approved funds without giving up control of your business finances.' },
]

const caption = 'text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground'

function Intro() {
  return <div className="flex flex-col gap-5">
    <p className="text-xs leading-5 text-muted-foreground">Create a dedicated account for managing your business expenses and operational spending.</p>
    <div>
      <p className={caption}>With your expense account, you can</p>
      <ul className="mt-3 flex flex-col gap-3">
        {BENEFITS.map(({ icon: Icon, text }) => <li key={text} className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-secondary"><Icon size={14}/></span>
          <span className="text-xs leading-5 text-foreground/80">{text}</span>
        </li>)}
      </ul>
    </div>
  </div>
}

function Setup({ model }: { model: CreateExpenseAccountModel }) {
  return <form onSubmit={event => { event.preventDefault(); model.submit() }} noValidate className="flex flex-col gap-5">
    <p className="text-xs leading-5 text-muted-foreground">Choose the business account you want to fund this expense account from, then give it a name.</p>
    <div>
      {model.fundingLoading
        ? <Skeleton className="h-11 w-full rounded-xl"/>
        : model.fundingOptions.length === 0
          ? <p className="rounded-xl bg-[#FFF6E4] px-3.5 py-3 text-[11px] leading-4 text-[#A76700]">No business bank account found. An expense account has to be funded from one, so open your main account first (Accounts › KYC).</p>
          : <KitSelect label="Fund from" placeholder="Select bank account" options={model.fundingOptions} value={model.fundFrom} onChange={event => model.setFundFrom(event.target.value)}/>}
      <p className="mt-1.5 text-[10px] text-muted-foreground">An existing Sync360 business bank account.</p>
    </div>
    <div>
      <label htmlFor="expense-account-name" className="mb-1.5 block text-[10px] font-extrabold">Expense account name</label>
      {/* The prefix sits inside the field, so the whole name is visible while it's typed. */}
      <div className="flex h-11 items-stretch overflow-hidden rounded-xl border border-border bg-[#F8FAF8] focus-within:border-secondary">
        <span className="flex shrink-0 items-center border-r border-border bg-muted px-3 text-xs font-extrabold text-foreground/75">{EXPENSE_PREFIX}</span>
        <input id="expense-account-name" value={model.name} onChange={event => model.setName(event.target.value)} placeholder="Operations, Marketing, Staff…" className="min-w-0 flex-1 bg-transparent px-3 text-xs font-bold outline-none"/>
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">Name it after what the money is for. Every expense account starts with “{EXPENSE_PREFIX}”.</p>
    </div>
    <p className="rounded-xl bg-accent px-3.5 py-3 text-[11px] leading-4 text-foreground/75">
      {model.preview ? <>This account will show on transactions and transfers as <b className="text-foreground">{model.preview}</b>.</> : 'Your expense account name is used in the account name shown on transactions and transfers.'}
    </p>
    {model.error && <p role="alert" className="rounded-lg bg-[#FDEAEA] px-3 py-2 text-[11px] font-bold text-[#C72D34]">{model.error}</p>}
    <button type="submit" hidden aria-hidden="true"/>
  </form>
}

function Done({ model }: { model: CreateExpenseAccountModel }) {
  return <div className="flex flex-col gap-5">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-secondary"><Check size={18}/></span>
      <p className="text-xs leading-5 text-muted-foreground">Your expense account has been created.</p>
    </div>
    <div className="flex flex-col gap-2">
      {model.details.map(row => <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
        <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{row.label}</p><p className={cn('mt-0.5 truncate text-sm font-extrabold', row.mono && 'font-mono tracking-wider')}>{row.value}</p></div>
        {row.value !== '—' && <button type="button" aria-label={`Copy ${row.label.toLowerCase()}`} onClick={() => model.copy(row.label, row.value)} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"><Copy size={14}/></button>}
      </div>)}
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Fund it by transfer to this number, then use it to pay for business expenses.</p>
  </div>
}

/** sink's three-step "Create Expense Management Account": intro → fund from + name → the new account's details. */
export function CreateExpenseAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const model = useCreateExpenseAccount(onClose)
  const footer = model.step === 'intro'
    ? <><KitButton variant="secondary" onClick={model.close}>Cancel</KitButton><KitButton onClick={model.next}>Continue</KitButton></>
    : model.step === 'setup'
      ? <><KitButton variant="secondary" onClick={model.back} disabled={model.submitting}>Back</KitButton><KitButton onClick={model.submit} loading={model.submitting} disabled={!model.canSubmit}>Create expense account</KitButton></>
      : <KitButton onClick={model.close} className="w-full">Done</KitButton>

  return <KitModal open={open} onClose={model.submitting ? () => undefined : model.close} title={model.title} icon={<Wallet size={16}/>} panelClassName="max-w-md" footer={footer}>
    {model.step === 'intro' && <Intro/>}
    {model.step === 'setup' && <Setup model={model}/>}
    {model.step === 'done' && <Done model={model}/>}
  </KitModal>
}
