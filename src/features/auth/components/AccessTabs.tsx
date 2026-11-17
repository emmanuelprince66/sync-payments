import { Icon } from '@/components/ui/Icon'
import type { AccessMode } from '../constants'
import { useAccessTabs } from '../hooks/useAccessTabs'

/** Divider + "New to Sync360 Payments? Create an account" switch link (design's .auth-divider / .auth-switch). */
export function AccessSwitch({ mode }: { mode: AccessMode }) {
  const { onChange } = useAccessTabs()
  return <>
    <div className="mb-4 mt-[22px] flex items-center text-[8px] text-[#A0A0A0] before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
      <span className="px-2.5">Secure merchant access</span>
    </div>
    <p className="text-center text-[10px] text-[#6D7176]">
      {mode === 'login' ? 'New to Sync360 Payments?' : 'Already have an account?'}
      <button type="button" onClick={() => onChange(mode === 'login' ? 'signup' : 'login')} className="ml-1 text-[10px] font-extrabold text-[#FF7F00] hover:underline">
        {mode === 'login' ? 'Create an account' : 'Sign in'}
      </button>
    </p>
  </>
}

/** Terms line (design's .auth-consent), shown as text: there is no consent field in the API. */
export function ConsentNote() {
  return <p className="text-[9px] leading-4 text-[#6D7176]">By continuing, you agree to Sync360 Payments’s Terms of Service and Privacy Policy.</p>
}

/** Design's .auth-security note. */
export function SecurityNote() {
  return <div className="mt-[22px] flex items-center justify-center gap-1.5 rounded-lg bg-[#F6F7F8] p-2.5 text-center text-[8px] text-[#777777]">
    <span className="shrink-0 text-[#1E854A]"><Icon name="shield" size={15}/></span>Your information is protected with bank-grade security.
  </div>
}
