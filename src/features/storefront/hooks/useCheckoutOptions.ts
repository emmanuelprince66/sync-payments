import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveStorefront, type StorefrontProfile } from '@/api/storefront'

/**
 * Checkout options from sink-inventory's general settings: selling beyond
 * recorded stock. Akawopay (BNPL) has its own full setup flow in features/bnpl.
 */
export function useCheckoutOptions(profile: StorefrontProfile) {
  const stock = useSaveStorefront()

  return {
    sellWithoutStock: profile.allowSalesWithoutStock,
    setSellWithoutStock: (allowSalesWithoutStock: boolean) =>
      stock.mutate({ allowSalesWithoutStock }, {
        onSuccess: () => toast.success(allowSalesWithoutStock ? 'Customers can now order beyond your stock' : 'Orders are now limited to your stock'),
        onError: error => toast.error(errorMessage(error)),
      }),
    stockSaving: stock.isPending,
  }
}
