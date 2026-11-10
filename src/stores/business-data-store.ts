import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Snapshot of the selected business, so the sidebar and header can show it without refetching. */
export type SelectedBusiness = {
  id: string
  name: string
  logo: string
  type: string
  address: string
  /** Owner's name, when the API includes it. */
  owner: string
  /** ISO currency code from the business, e.g. NGN. */
  currency?: string
}

type BusinessDataState = {
  businessData: SelectedBusiness | null
  setBusinessData: (data: SelectedBusiness) => void
  clearBusinessData: () => void
}

export const useBusinessDataStore = create<BusinessDataState>()(
  persist(
    set => ({
      businessData: null,
      setBusinessData: businessData => set({ businessData }),
      clearBusinessData: () => set({ businessData: null }),
    }),
    { name: 'syncpay-business-data' },
  ),
)
