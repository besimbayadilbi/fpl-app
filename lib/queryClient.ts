import { QueryClient } from "@tanstack/react-query";

/**
 * React Query Client Configuration
 * Handles data fetching, caching, and synchronization
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});
