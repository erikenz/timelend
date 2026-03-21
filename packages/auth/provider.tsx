"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "./client";

interface AuthProviderProps {
  children: ReactNode;
}
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  return (
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
  );
};
