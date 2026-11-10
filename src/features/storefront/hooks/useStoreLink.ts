import { useId, useState } from 'react'
import { toast } from 'sonner'
import { getStoreUrl, type StoreChannel, type StorefrontProfile } from '@/api/storefront'
import { useClipboard } from '@/hooks/useClipboard'
import { useDisclosure } from '@/hooks/useDisclosure'

export const channelOptions = [
  { value: 'OUTSTORE', label: 'Online store' },
  { value: 'INSTORE', label: 'In-store' },
] as const satisfies readonly { value: StoreChannel; label: string }[]

const channelHint: Record<StoreChannel, string> = {
  OUTSTORE: 'Share on WhatsApp, Instagram and your bio. Customers browse, pay and arrange delivery.',
  INSTORE: 'For walk-in customers. Print it as a QR code at your counter to take orders in person.',
}

const QR_EXPORT_SIZE = 1024

/** Draws the on-screen QR (an SVG) onto a white canvas and downloads it as a PNG. */
const downloadSvgAsPng = (svg: SVGSVGElement, filename: string) => new Promise<void>((resolve, reject) => {
  const markup = new XMLSerializer().serializeToString(svg)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    const padding = QR_EXPORT_SIZE / 16
    canvas.width = QR_EXPORT_SIZE + padding * 2
    canvas.height = QR_EXPORT_SIZE + padding * 2
    const context = canvas.getContext('2d')
    if (!context) return reject(new Error('Canvas unavailable'))
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, padding, padding, QR_EXPORT_SIZE, QR_EXPORT_SIZE)
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
    resolve()
  }
  image.onerror = () => reject(new Error('Could not draw the QR code'))
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
})

/** Store link card: channel switch, copy/open, QR code, and the custom-domain dialog. */
export function useStoreLink(profile: StorefrontProfile) {
  const [channel, setChannel] = useState<StoreChannel>('OUTSTORE')
  const { copied, copy } = useClipboard()
  const domainDialog = useDisclosure()
  const qrDialog = useDisclosure()
  /** The QR container's DOM id: the download reads the rendered SVG from it. */
  const qrId = `store-qr-${useId().replace(/:/g, '')}`
  const url = getStoreUrl(profile, channel)

  const domainStatus: 'none' | 'connected' | 'pending' = !profile.customDomain ? 'none' : profile.customDomainApproved ? 'connected' : 'pending'

  return {
    channel,
    setChannel,
    channelLabel: channelOptions.find(option => option.value === channel)?.label ?? '',
    url,
    displayUrl: url.replace(/^https?:\/\//, ''),
    hint: channelHint[channel],
    copied,
    copyUrl: () => copy(url),
    openUrl: () => window.open(url, '_blank', 'noopener,noreferrer'),
    qrDialog,
    qrId,
    downloadQr: () => {
      const svg = document.getElementById(qrId)?.querySelector('svg')
      if (!svg) return
      const slug = (profile.storeSlug || 'store').replace(/[^a-z0-9-]/gi, '')
      downloadSvgAsPng(svg, `${slug}-${channel === 'INSTORE' ? 'in-store' : 'online'}-qr.png`).catch(() => toast.error('Could not download the QR code. Try again.'))
    },
    domain: profile.customDomain,
    domainStatus,
    domainDialog,
  }
}

export type StoreLinkModel = ReturnType<typeof useStoreLink>
