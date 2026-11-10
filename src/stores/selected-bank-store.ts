import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Which of the business's bank accounts the wallet screens point at (ported
 * from sink-inventory's useSelectedBankStore). Every wallet call is keyed on a
 * bank id rather than the business, so this decides which wallet is read and
 * which one a withdrawal leaves from. Null means "use the primary account".
 */
type SelectedBankState = {
  selectedBankId: string | null
  setSelectedBankId: (id: string | null) => void
  clearSelectedBank: () => void
}

export const useSelectedBankStore = create<SelectedBankState>()(
  persist(
    set => ({
      selectedBankId: null,
      setSelectedBankId: selectedBankId => set({ selectedBankId }),
      clearSelectedBank: () => set({ selectedBankId: null }),
    }),
    { name: 'syncpay-selected-bank' },
  ),
)
