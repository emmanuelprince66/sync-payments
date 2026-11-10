import { Logo } from './Logo'

/** Full-screen branded loader for route changes that need new code (e.g. right after login). */
export function AppLoader({ label = 'Loading Sync360 Payments' }: { label?: string }) {
  return <div role="status" aria-label={label} className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#F7F9F7]">
    <div className="animate-pulse"><Logo/></div>
    <span className="h-1 w-32 overflow-hidden rounded-full bg-[#E3EAE6]"><span className="block h-full w-1/2 animate-[appLoaderBar_1.1s_ease-in-out_infinite] rounded-full bg-[#529661]"/></span>
  </div>
}
