import { useBusinessDataStore } from './business-data-store'
import { useBusinessStore } from './business-store'
import { useSelectedBankStore } from './selected-bank-store'

/**
 * Everything remembered about "the business I am working in right now".
 *
 * These stores persist to localStorage, which is per-browser, not per-user.
 * If signing out cleared only the session, the next person to sign in on the
 * same browser would inherit the previous one's business: the picker would open
 * on it and every business-scoped query would run against it. (This is the
 * "old business shows up for the new user" bug sink-inventory fixed the same way.)
 *
 * Any store added later that holds something belonging to a business rather
 * than to the browser belongs in this function.
 *
 * Callers should also clear the react-query cache (queryClient.clear()) so no
 * data fetched for the old business is shown. That isn't done here to keep the
 * stores free of a dependency on the query client.
 */
export const resetBusinessScopedStores = () => {
  for (const store of [useBusinessStore, useBusinessDataStore, useSelectedBankStore]) {
    try {
      store.persist.clearStorage()
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the in-memory reset below still applies.
    }
  }
  useBusinessStore.getState().clearBusinessId()
  useBusinessDataStore.getState().clearBusinessData()
  useSelectedBankStore.getState().clearSelectedBank()
}
