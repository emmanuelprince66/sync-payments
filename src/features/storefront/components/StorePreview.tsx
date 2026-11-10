import { ShoppingBag } from 'lucide-react'
import type { StoreTheme } from '@/api/storefront'
import { initials } from '@/lib/format'

/** Live mini storefront in a phone frame, painted with the selected theme. */
export function StorePreview({ name, tagline, logo, banner, theme }: { name: string; tagline: string; logo: string; banner?: string; theme?: StoreTheme }) {
  const primary = theme?.primary ?? '#047857'
  const onPrimary = theme?.on_primary ?? '#FFFFFF'
  const surface = theme?.surface ?? '#ECFDF5'

  return <figure aria-label="Storefront preview" className="mx-auto w-full max-w-[260px]">
    <div className="overflow-hidden rounded-[26px] border-[6px] border-primary bg-white shadow-[0_18px_45px_rgba(29,38,28,.14)]">
      <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: primary, color: onPrimary }}>
        <div className="flex min-w-0 items-center gap-2">
          {logo ? <img src={logo} alt="" className="h-6 w-6 rounded-md bg-white object-cover"/> : <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 text-[9px] font-black">{initials(name || 'Store')}</span>}
          <span className="truncate text-[11px] font-extrabold">{name || 'Your store'}</span>
        </div>
        <ShoppingBag size={14}/>
      </div>
      <div className="relative h-24 overflow-hidden" style={{ backgroundColor: surface }}>
        {banner && <img src={banner} alt="" className="h-full w-full object-cover"/>}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/45 to-transparent p-3">
          <span className="line-clamp-2 text-[10px] font-extrabold leading-tight text-white">{tagline || 'Your tagline appears here'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3" style={{ backgroundColor: surface }}>
        {[0, 1].map(item => <div key={item} className="overflow-hidden rounded-lg bg-white">
          <div className="h-12 bg-[#E8EFEA]"/>
          <div className="space-y-1 p-1.5"><div className="h-1.5 w-3/4 rounded bg-[#DCE5DF]"/><div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: primary, opacity: 0.6 }}/></div>
          <div className="m-1.5 mt-0 rounded-md py-1 text-center text-[7px] font-extrabold" style={{ backgroundColor: primary, color: onPrimary }}>Add to cart</div>
        </div>)}
      </div>
    </div>
    <figcaption className="mt-2 text-center text-[10px] font-semibold text-muted-foreground">Live preview</figcaption>
  </figure>
}
