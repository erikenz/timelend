"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@repo/auth/client";
import { DesignSystemProvider } from "@repo/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <DesignSystemProvider>
      <AuthUIProvider
        authClient={authClient}
        Link={Link}
        navigate={router.push}
        onSessionChange={() => {
          // Clear router cache (protected routes)
          router.refresh();
        }}
        replace={router.replace}
      >
        {children}
      </AuthUIProvider>
    </DesignSystemProvider>
  );
}
