import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Providers } from "@/app/(authenticated)/_components/providers";
import { getSession } from "@/server/better-auth/server";
import { GlobalSidebar } from "./_components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const session = await getSession();
  if (!session?.user) {
    return redirect("/auth/sign-in"); // from next/navigation
  }

  return (
    <SidebarProvider>
      <GlobalSidebar>
        <Providers>{children}</Providers>
      </GlobalSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;
