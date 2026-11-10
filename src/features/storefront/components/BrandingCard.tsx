import { Check, ImagePlus, Palette, Trash2 } from 'lucide-react'
import type { StorefrontProfile, StoreTheme } from '@/api/storefront'
import { FilePicker } from '@/components/ui/common'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useBranding } from '../hooks/useBranding'
import { CardActions, SettingsCard } from './SettingsCard'
import { StorePreview } from './StorePreview'

const label = 'text-[10px] font-extrabold text-foreground'

export function BrandingCard({ profile, themes }: { profile: StorefrontProfile; themes: StoreTheme[] }) {
  const branding = useBranding(profile, themes)

  return <SettingsCard icon={<Palette size={16}/>} title="Branding" description="Your logo, banners and brand colour across the storefront and checkout.">
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <div className={cn(label, 'mb-1.5')}>Logo</div>
          <FilePicker accept="image/*" onFile={branding.pickLogo} className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-[#F8FAF8] p-4 transition hover:border-secondary">
            {branding.logo
              ? <img src={branding.logo} alt="Store logo" className="h-14 w-14 shrink-0 rounded-xl object-cover"/>
              : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-sm font-black text-secondary">{initials(profile.name || 'Store')}</span>}
            <span className="min-w-0"><span className="block text-xs font-extrabold">{branding.logo ? 'Change logo' : 'Upload your logo'}</span><span className="mt-1 block text-[10px] text-muted-foreground">Square PNG or JPG · up to 5 MB</span></span>
          </FilePicker>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className={label}>Homepage banners</span><span className="text-[10px] font-bold text-muted-foreground">{branding.banners.length}/{branding.maxBanners}</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {branding.banners.map((banner, index) => <div key={banner.id} className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-[#F3F7F4]">
              <img src={banner.url} alt={`Banner ${index + 1}`} className="h-full w-full object-cover"/>
              {banner.file && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[8px] font-extrabold text-secondary shadow-sm">New</span>}
              <button type="button" onClick={() => branding.removeBanner(banner.id)} aria-label={`Remove banner ${index + 1}`} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-[#C72D34] shadow-sm hover:bg-white"><Trash2 size={13}/></button>
            </div>)}
            {branding.canAddBanner && <FilePicker accept="image/*" onFile={branding.addBanner} className="flex aspect-[16/9] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-[#F8FAF8] text-muted-foreground transition hover:border-secondary hover:text-secondary">
              <ImagePlus size={18}/><span className="text-[10px] font-bold">Add banner</span>
            </FilePicker>}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Wide images (1200 × 600) look best. They rotate at the top of your store.</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><span className={label}>Brand colour</span><span className="text-[10px] font-bold text-muted-foreground">{branding.activeTheme?.label ?? branding.theme}</span></div>
          <div role="radiogroup" aria-label="Brand colour" className="grid grid-cols-6 gap-2.5 sm:grid-cols-11">
            {themes.map(theme => {
              const selected = theme.primary.toLowerCase() === branding.theme.toLowerCase()
              return <button key={theme.key} type="button" role="radio" aria-checked={selected} aria-label={theme.label} title={theme.label} onClick={() => branding.selectTheme(theme)} className={cn('grid aspect-square place-items-center rounded-full transition', selected ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105')} style={{ backgroundColor: theme.primary, color: theme.on_primary }}>
                {selected && <Check size={14} strokeWidth={3}/>}
              </button>
            })}
          </div>
        </div>
      </div>
      <StorePreview name={profile.name} tagline={profile.tagline} logo={branding.logo} banner={branding.banners[0]?.url} theme={branding.activeTheme}/>
    </div>
    <CardActions dirty={branding.dirty} saving={branding.saving} onReset={branding.reset} onSave={branding.submit} saveLabel="Save branding"/>
  </SettingsCard>
}
