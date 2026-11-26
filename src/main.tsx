import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { PlanGateDialog } from '@/components/ui/PlanGateDialog'
import { queryClient } from '@/lib/query-client'
import { router } from '@/routes/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}/>
      <PlanGateDialog/>
      <InstallPrompt/>
      <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Nunito, sans-serif' } }}/>
    </QueryClientProvider>
  </StrictMode>,
)
