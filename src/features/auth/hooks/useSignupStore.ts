import { create } from 'zustand'

/** Credentials captured at signup, kept in memory only so we can verify the phone and sign in afterwards. */
type SignupDraft = { phone: string; email: string; password: string }

type SignupStore = {
  draft: SignupDraft | null
  setDraft: (draft: SignupDraft) => void
  clear: () => void
}

export const useSignupStore = create<SignupStore>()(set => ({
  draft: null,
  setDraft: draft => set({ draft }),
  clear: () => set({ draft: null }),
}))
