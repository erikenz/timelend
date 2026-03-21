import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import type { ReactNode } from "react";
import { TRPCReactProvider } from "@/trpc/react";
import "./styles.css";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body>
      <DesignSystemProvider>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
