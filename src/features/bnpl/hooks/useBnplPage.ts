import { useStorefrontProfile } from '@/api/storefront'

/** BNPL page root: whether Akawopay is on (business.enable_bnpl, from the cached business record). */
export function useBnplPage() {
  const profile = useStorefrontProfile()
  return {
    isLoading: profile.isLoading,
    active: profile.data?.enableBnpl ?? false,
  }
}
