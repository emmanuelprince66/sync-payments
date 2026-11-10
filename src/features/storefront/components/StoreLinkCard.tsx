import { Check, Copy, Download, ExternalLink, Globe, Link2, Plus, QrCode, Settings2 } from 'lucide-react'
import { QrCodeImage } from '@/components/ui/QrCode'
import type { StorefrontProfile } from '@/api/storefront'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import { channelOptions, useStoreLink, type StoreLinkModel } from '../hooks/useStoreLink'
import { CustomDomainModal } from './CustomDomainModal'
import { PillSwitch, SettingsCard } from './SettingsCard'

const domainBadge = {
  connected: { label: 'Connected', className: 'bg-[#E8F5EA] text-[#337D44]' },
  pending: { label: 'Awaiting DNS', className: 'bg-[#FFF6E4] text-[#A76700]' },
} as const

function StoreQrModal({ link }: { link: StoreLinkModel }) {
  return <KitModal
    open={link.qrDialog.isOpen}
    onClose={link.qrDialog.close}
    title={`${link.channelLabel} QR code`}
    description="Print it for your counter, packaging or flyers. Scanning opens your store."
    icon={<QrCode size={16}/>}
    panelClassName="max-w-sm"
    footer={<>
      <KitButton variant="secondary" onClick={link.copyUrl}>{link.copied ? <Check size={14}/> : <Copy size={14}/>}{link.copied ? 'Copied' : 'Copy link'}</KitButton>
      <KitButton onClick={link.downloadQr}><Download size={14}/> Download PNG</KitButton>
    </>}
  >
    <div id={link.qrId} className="mx-auto w-full max-w-[240px] rounded-2xl border border-border bg-white p-4">
      <QrCodeImage value={link.url} size={256} style={{ width: '100%', height: 'auto' }} viewBox="0 0 256 256" fgColor="#1D261C"/>
    </div>
    <p className="mt-4 text-center text-[10px] font-semibold text-muted-foreground [overflow-wrap:anywhere]">{link.displayUrl}</p>
  </KitModal>
}

export function StoreLinkCard({ profile }: { profile: StorefrontProfile }) {
  const link = useStoreLink(profile)

  return <SettingsCard icon={<Link2 size={16}/>} title="Store link" description="Where customers find you online and in person.">
    <PillSwitch label="Store channel" value={link.channel} options={channelOptions} onChange={link.setChannel}/>
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-[#F8FAF8] p-2 lg:flex-row lg:items-center lg:pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-foreground/80 lg:px-0"><Link2 size={15} className="shrink-0"/><span className="truncate text-xs font-bold">{link.displayUrl}</span></div>
      <div className="grid grid-cols-3 gap-2 lg:flex">
        <KitButton variant="secondary" onClick={link.openUrl} className="px-3"><ExternalLink size={14}/> Open</KitButton>
        <KitButton variant="secondary" onClick={link.qrDialog.open} className="px-3"><QrCode size={14}/> QR</KitButton>
        <KitButton onClick={link.copyUrl} className="px-3">{link.copied ? <Check size={14}/> : <Copy size={14}/>}{link.copied ? 'Copied' : 'Copy'}</KitButton>
      </div>
    </div>
    <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{link.hint}</p>

    <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#F4F8F5] p-4 sm:flex-row sm:items-center">
      <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-secondary sm:grid"><Globe size={16}/></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold">Custom domain</span>{link.domainStatus !== 'none' && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', domainBadge[link.domainStatus].className)}>{domainBadge[link.domainStatus].label}</span>}</div>
        <div className="mt-1 truncate text-[10px] text-muted-foreground">{link.domain || 'Use your own address, like shop.yourbusiness.com'}</div>
      </div>
      <KitButton variant="secondary" onClick={link.domainDialog.open}>{link.domain ? <Settings2 size={14}/> : <Plus size={14}/>}{link.domain ? 'Change domain' : 'Connect domain'}</KitButton>
    </div>
    <StoreQrModal link={link}/>
    <CustomDomainModal open={link.domainDialog.isOpen} onClose={link.domainDialog.close} currentDomain={link.domain}/>
  </SettingsCard>
}
