import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Which business the signed-in user is working in. Every business-scoped call is keyed on it. */
type BusinessState = {
  businessId: string | null
  setBusinessId: (id: string) => void
  clearBusinessId: () => void
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    set => ({
      businessId: null,
      setBusinessId: businessId => set({ businessId }),
      clearBusinessId: () => set({ businessId: null }),
    }),
    { name: 'syncpay-business' },
  ),
)
