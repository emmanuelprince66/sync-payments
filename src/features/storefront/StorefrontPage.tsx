import { KitEmpty } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { BrandingCard } from './components/BrandingCard'
import { CheckoutOptionsCard } from './components/CheckoutOptionsCard'
import { StoreDetailsCard } from './components/StoreDetailsCard'
import { StoreHoursCard } from './components/StoreHoursCard'
import { StoreLinkCard } from './components/StoreLinkCard'
import { StorefrontSkeleton } from './components/StorefrontSkeleton'
import { useStorefrontPage } from './hooks/useStorefrontPage'

/**
 * SyncShip's Settings › Storefront as a page: link (copy, QR, custom domain), branding & theme,
 * details & contact, opening/delivery days, checkout options (Akawopay, selling without stock).
 * Each card saves on its own.
 */
export default function StorefrontPage() {
  const page = useStorefrontPage()

  return <KitPage>
    <KitPageHeader eyebrow="Sell online" title="Storefront" subtitle="Your public store: link, branding, contact channels and checkout."/>
    {page.isLoading && <StorefrontSkeleton/>}
    {page.isError && <div className="rounded-xl border border-border bg-white"><KitEmpty title="We couldn’t load your store settings" note="Check your connection and try again." action={<KitButton variant="secondary" onClick={page.retry}>Try again</KitButton>}/></div>}
    {page.profile && <div className="flex flex-col gap-5">
      <StoreLinkCard profile={page.profile}/>
      <BrandingCard profile={page.profile} themes={page.themes}/>
      <StoreDetailsCard profile={page.profile}/>
      <StoreHoursCard profile={page.profile}/>
      <CheckoutOptionsCard profile={page.profile}/>
    </div>}
  </KitPage>
}
