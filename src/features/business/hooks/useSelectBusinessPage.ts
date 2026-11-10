import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { businessAddress, useBusinesses, type Business } from '@/api/business'
import { useDisclosure } from '@/hooks/useDisclosure'
import { initials } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth-store'
import { useBusinessStore } from '@/stores/business-store'
import { canCreateBusiness } from '@/stores/types'
import { useActivateBusiness } from './useActivateBusiness'

export type BusinessCardModel = {
  business: Business
  name: string
  initials: string
  address: string
  type: string
  isCurrent: boolean
}

/**
 * /select-business: list the user's businesses, pick one, or create one (owners only,
 * as in sink-inventory). Picking always lands on the page the user was headed to.
 */
export function useSelectBusinessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: businesses = [], isLoading, isError, refetch } = useBusinesses()
  const currentId = useBusinessStore(state => state.businessId)
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const activate = useActivateBusiness()
  const createModal = useDisclosure()

  const from = (location.state as { from?: string } | null)?.from
  const destination = from && from !== paths.selectBusiness && from !== paths.login ? from : paths.dashboard

  const enter = (business: Business) => {
    activate(business)
    navigate(destination, { replace: true })
  }

  const cards: BusinessCardModel[] = businesses.map(business => ({
    business,
    name: business.name || 'Untitled business',
    initials: initials(business.name || 'B'),
    address: businessAddress(business) || 'No address added yet',
    type: business.type,
    isCurrent: business.id === currentId,
  }))

  return {
    firstname: user?.firstname ?? '',
    cards,
    isLoading,
    isError,
    retry: () => void refetch(),
    isEmpty: !isLoading && !isError && businesses.length === 0,
    canCreate: canCreateBusiness(user?.role),
    /** Shown when the user came from inside the app ("Switch business") and can go back. */
    canGoBack: Boolean(currentId && cards.some(card => card.isCurrent)),
    goBack: () => navigate(destination, { replace: true }),
    select: enter,
    onCreated: (business: Business) => {
      createModal.close()
      enter(business)
    },
    createModal,
    logOut: () => {
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}
