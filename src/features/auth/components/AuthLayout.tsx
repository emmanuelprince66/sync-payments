import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { SETUP_STAGES } from '../constants'
import { AuthVisual } from './AuthVisual'

type AuthLayoutProps = {
  /** Index into the 3 onboarding steps, or -1 to hide the progress bar. */
  setupStep: number
  heading: string
  subtitle: string
  /** Center the logo, heading and subtitle (login and signup). */
  centered?: boolean
  children: ReactNode
}

export function AuthLayout({ setupStep, heading, subtitle, centered = false, children }: AuthLayoutProps) {
  return <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
    <AuthVisual/>
    {/* Auto margins center the form both ways and never clip it when it is taller than the screen. */}
    <main className="flex min-h-screen w-full min-w-0 flex-col px-5 py-10 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="m-auto w-full max-w-md">
        <div className={cn('mb-9 lg:hidden', centered && 'flex justify-center')}><Logo/></div>
        {setupStep >= 0 && <div className="mb-7">
          <div className="flex gap-2">{SETUP_STAGES.map((item, index) => <span key={item} className={cn('h-1.5 flex-1 rounded-full', index <= setupStep ? 'bg-[#529661]' : 'bg-[#E3EAE6]')}/>)}</div>
          <div className="mt-2 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#829189]">Account setup · Step {setupStep + 1} of 3</div>
        </div>}
        <div className={cn(centered && 'text-center')}><h1 className="text-[28px] font-black tracking-[-.8px] text-[#09261C]">{heading}</h1><div className="mt-2 text-sm leading-6 text-[#74857C]">{subtitle}</div></div>
        {children}
        <div className="mt-8 text-center text-[10px] leading-5 text-[#96A39D]">By continuing, you agree to Sync360 Payments’s Terms of Service and Privacy Policy.</div>
      </div>
    </main>
  </div>
}
