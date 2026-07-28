"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmationProvider } from "@/components/ui/confirmation";

/**
 * Providers globales. La sesión ya no necesita provider: el token vive en
 * localStorage y `useAuth()` lo lee con useSyncExternalStore (antes aquí estaba
 * el AuthProvider de react-oidc-context con su UserManager).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmationProvider>{children}</ConfirmationProvider>
    </QueryClientProvider>
  );
}
