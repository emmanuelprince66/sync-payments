import { Store } from 'lucide-react'
import type { StorefrontProfile } from '@/api/storefront'
import { KitTextarea } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { useStoreDetailsForm } from '../hooks/useStoreDetailsForm'
import { CardActions, SettingsCard } from './SettingsCard'

const group = 'mb-3 mt-6 text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground'
const grid = 'grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2'

export function StoreDetailsCard({ profile }: { profile: StorefrontProfile }) {
  const form = useStoreDetailsForm(profile)
  const { register, errors } = form

  return <SettingsCard icon={<Store size={16}/>} title="Store details & contact" description="What customers see on your store, and how they reach you about orders.">
    <form onSubmit={form.onSubmit} noValidate>
      <div className={grid}>
        <KitField label="Store name" error={errors.name?.message} {...register('name')}/>
        <KitSelect label="Business sector" options={form.sectors.map(value => ({ value, label: value }))} error={errors.sector?.message} {...register('sector')}/>
        <KitField className="md:col-span-2" label="Tagline" placeholder="e.g. Everyday pieces, thoughtfully selected." error={errors.tagline?.message} {...register('tagline')}/>
        <KitTextarea className="md:col-span-2" label="About your store" rows={4} placeholder="Tell customers what you sell and what makes you different." error={errors.description?.message} {...register('description')}/>
      </div>

      <div className={group}>Contact channels</div>
      <div className={grid}>
        <KitField label="Store phone number" type="tel" placeholder="+2348012345678" error={errors.phone?.message} {...register('phone')}/>
        <KitField label="WhatsApp number" type="tel" placeholder="+2348012345678" error={errors.whatsapp?.message} {...register('whatsapp')}/>
        <KitField className="md:col-span-2" label="Store email" type="email" placeholder="hello@yourstore.com" error={errors.email?.message} {...register('email')}/>
      </div>

      <div className={group}>Address & currency</div>
      <div className={grid}>
        <KitField className="md:col-span-2" label="Street address" error={errors.street?.message} {...register('street')}/>
        <KitField label="City" error={errors.city?.message} {...register('city')}/>
        <KitField label="State" error={errors.state?.message} {...register('state')}/>
        <KitField label="Country" error={errors.country?.message} {...register('country')}/>
        <div className="grid grid-cols-2 gap-3">
          <KitField label="Zip code" placeholder="Optional" error={errors.zipCode?.message} {...register('zipCode')}/>
          <KitSelect label="Currency" options={form.currencies.map(value => ({ value, label: value }))} {...register('currency')}/>
        </div>
      </div>
      <CardActions type="submit" dirty={form.dirty} saving={form.saving} onReset={form.reset} saveLabel="Save details"/>
    </form>
  </SettingsCard>
}
