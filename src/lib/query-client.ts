import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      // Retry only network failures (once). A 4xx/5xx answer from the server won't change on retry.
      retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < 1,
    },
    mutations: { retry: false },
  },
})
