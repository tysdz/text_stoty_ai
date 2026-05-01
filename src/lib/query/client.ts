import { QueryClient } from '@tanstack/react-query'

/**
 * localized text QueryClient Config
 * localized text
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // localized text 5 localized text，localized text
            staleTime: 5000,
            // localized text 10 localized text
            gcTime: 10 * 60 * 1000,
            // localized text
            refetchOnWindowFocus: true,
            // localized text
            refetchOnReconnect: true,
            // localized text 1 localized text
            retry: 1,
            // localized text
            retryDelay: 1000,
        },
        mutations: {
            // mutation localized text
            retry: 0,
        },
    },
})

/**
 * localized text QueryClient localized text
 * localized text React localized text
 */
export function getQueryClient() {
    return queryClient
}
