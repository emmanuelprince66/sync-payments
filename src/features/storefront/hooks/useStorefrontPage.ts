import { useStorefrontProfile, useStoreThemes } from '@/api/storefront'

/** Root data for the Storefront page: the store profile (from the cached business record) and the theme list. */
export function useStorefrontPage() {
  const profile = useStorefrontProfile()
  const themes = useStoreThemes()

  return {
    profile: profile.data,
    themes: themes.data ?? [],
    isLoading: profile.isLoading,
    isError: profile.isError && !profile.data,
    retry: () => void profile.refetch(),
  }
}
