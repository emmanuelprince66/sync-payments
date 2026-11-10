import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { MAX_BANNERS, themeForHex, useSaveStorefront, type StorefrontProfile, type StoreTheme } from '@/api/storefront'

export type BannerItem = { id: string; url: string; file?: File }

const MAX_IMAGE_MB = 5

const validImage = (file: File) => {
  if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return false }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`Images must be ${MAX_IMAGE_MB} MB or smaller.`); return false }
  return true
}

/**
 * Logo, banners and brand colour. New files are previewed with object URLs
 * (revoked on unmount) and only sent on save; banners are only sent when the
 * merchant touched them, so a theme change never clears saved banners.
 */
export function useBranding(profile: StorefrontProfile, themes: StoreTheme[]) {
  const [logo, setLogo] = useState<{ url: string; file?: File }>({ url: profile.logo })
  const [banners, setBanners] = useState<BannerItem[]>(() => profile.banners.map(url => ({ id: url, url })))
  const [bannersDirty, setBannersDirty] = useState(false)
  const [theme, setTheme] = useState(profile.theme)
  const objectUrls = useRef<string[]>([])
  const save = useSaveStorefront()

  useEffect(() => () => objectUrls.current.forEach(url => URL.revokeObjectURL(url)), [])

  const preview = (file: File) => {
    const url = URL.createObjectURL(file)
    objectUrls.current.push(url)
    return url
  }

  const pickLogo = (file: File) => { if (validImage(file)) setLogo({ url: preview(file), file }) }

  const addBanner = (file: File) => {
    if (banners.length >= MAX_BANNERS) return toast.error(`You can add up to ${MAX_BANNERS} banners.`)
    if (!validImage(file)) return
    setBanners(current => [...current, { id: `new-${crypto.randomUUID()}`, url: preview(file), file }])
    setBannersDirty(true)
  }

  const removeBanner = (id: string) => { setBanners(current => current.filter(item => item.id !== id)); setBannersDirty(true) }

  const dirty = Boolean(logo.file) || bannersDirty || theme.toLowerCase() !== profile.theme.toLowerCase()
  const activeTheme = themeForHex(theme, themes) ?? themes[0]

  const reset = () => {
    setLogo({ url: profile.logo })
    setBanners(profile.banners.map(url => ({ id: url, url })))
    setBannersDirty(false)
    setTheme(profile.theme)
  }

  const submit = () =>
    save.mutate({
      theme,
      logoFile: logo.file,
      banners: bannersDirty ? { keep: banners.filter(item => !item.file).map(item => item.url), add: banners.flatMap(item => (item.file ? [item.file] : [])) } : undefined,
    }, {
      onSuccess: () => { toast.success('Branding updated'); setBannersDirty(false); setLogo(current => ({ url: current.url })) },
      onError: error => toast.error(errorMessage(error)),
    })

  return {
    logo: logo.url,
    pickLogo,
    banners,
    canAddBanner: banners.length < MAX_BANNERS,
    maxBanners: MAX_BANNERS,
    addBanner,
    removeBanner,
    theme,
    activeTheme,
    selectTheme: (value: StoreTheme) => setTheme(value.primary),
    dirty,
    reset,
    submit,
    saving: save.isPending,
  }
}
