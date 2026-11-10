import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageLoader } from '@/components/ui/misc'
import { usePreloadAppShell } from '@/routes/usePreloadAppShell'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** The design's shell: sidebar + scrolling column with the top bar stuck to its top. */
export function AppLayout() {
  // Users who arrive already signed in skip the login page, so warm the other pages here too.
  usePreloadAppShell()
  return <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground">
    <Sidebar/>
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
      <Topbar/>
      <main><Suspense fallback={<PageLoader/>}><Outlet/></Suspense></main>
    </div>
  </div>
}
