import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { usePendingApprovalCount } from '@/api/expenses'
import { kycProgress, useKycStatus } from '@/api/kyc'
import { useUnreadNotifications } from '@/api/notifications'
import { formatLongDate, initials } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useUiStore } from '@/stores/ui-store'

const SUPPORT_EMAIL = 'support@sync360.africa'

const resolveUserName = (user: AuthUser | null | undefined) => {
  const fromNameParts = [user?.firstname, user?.lastname].filter(Boolean).join(' ')
  if (fromNameParts) return fromNameParts
  return user?.fullName || user?.name || user?.email?.split('@')[0] || ''
}

const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', 'ADMIN-ATTENDANT': 'Admin', ATTENDANT: 'Attendant', PHARMACIST: 'Pharmacist', ACCOUNTANT: 'Accountant', 'INVENTORY-MANAGER': 'Inventory manager', 'PRODUCTION-MANAGER': 'Production manager' }

/** Open state for the phone/tablet slide-in sidebar. */
export function useMobileSidebar() {
  const open = useUiStore(state => state.mobileNavOpen)
  const setOpen = useUiStore(state => state.setMobileNavOpen)
  const close = useCallback(() => setOpen(false), [setOpen])
  return { open, close, openMenu: () => setOpen(true) }
}

/** Verification progress for the sidebar card, read from the shared wallet payload. */
function useVerification() {
  const { data: kyc } = useKycStatus()
  const { percent, complete } = kycProgress(kyc)
  return { loaded: Boolean(kyc), tier: kyc?.tier ?? 0, percent, complete }
}

/** Sidebar data: approval badge, verification card, account block. */
export function useSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const business = useBusinessDataStore(state => state.businessData)
  const pendingApprovals = usePendingApprovalCount()
  const verification = useVerification()
  const { close } = useMobileSidebar()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const fullName = resolveUserName(user)
  const go = (to: string, state?: unknown) => { setMenuOpen(false); close(); navigate(to, { state }) }

  return {
    pendingApprovals,
    verification,
    fullName: fullName || 'User',
    email: user?.email ?? '',
    roleLabel: (user?.role && ROLE_LABELS[user.role]) || 'Member',
    businessName: business?.name || 'Your business',
    userInitials: initials(fullName || business?.name || 'U'),
    menuOpen,
    toggleMenu: () => setMenuOpen(open => !open),
    closeMenu,
    /** PIN and account rules live on Accounts. */
    openSettings: () => go(`${paths.accounts}?action=rules`),
    goToKyc: () => go(paths.kyc),
    openHelp: () => { setMenuOpen(false); window.location.href = `mailto:${SUPPORT_EMAIL}` },
    /** The picker clears the old business's data only if a different one is chosen. */
    switchBusiness: () => go(paths.selectBusiness, { from: pathname }),
    signOut: () => {
      setMenuOpen(false)
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}

/** Everything the top bar and its profile menu show and do (same as sync-shipping's useTopBar). */
export function useTopbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const business = useBusinessDataStore(state => state.businessData)
  const { data: kyc } = useKycStatus()
  const { data: unread = 0 } = useUnreadNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const fullName = resolveUserName(user)
  const firstName = user?.firstname || user?.name?.split(/\s+/)[0] || fullName.split(/\s+/)[0] || ''
  const tier = kyc?.tier ?? 0

  return {
    firstName,
    fullName,
    email: user?.email ?? '',
    initials: initials(fullName || business?.name || 'U'),
    roleLabel: (user?.role && ROLE_LABELS[user.role]) || 'Member',
    businessName: business?.name ?? '',
    date: formatLongDate(),
    unread,
    /** Header badge, shown once KYC status has loaded. */
    verification: kyc ? { text: tier > 0 ? 'Verified' : 'Pending KYC', ok: tier > 0 } : null,
    kycBadge: kyc ? { text: tier > 0 ? `Tier ${tier}` : 'Not started', ok: tier > 0 } : undefined,
    menuOpen,
    toggleMenu: () => setMenuOpen(open => !open),
    closeMenu,
    goToKyc: () => { setMenuOpen(false); navigate(paths.kyc) },
    /** The picker clears the old business's data only if a different one is chosen. */
    switchBusiness: () => { setMenuOpen(false); navigate(paths.selectBusiness, { state: { from: pathname } }) },
    openHelp: () => { setMenuOpen(false); window.location.href = `mailto:${SUPPORT_EMAIL}` },
    signOut: () => {
      setMenuOpen(false)
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}
