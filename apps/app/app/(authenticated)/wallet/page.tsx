"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { useConnect, useConnection, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Header } from "@/app/(authenticated)/_components/header";

export default function WalletConnectPage() {
  const { address, isConnected } = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <Button onClick={() => disconnect.mutate()}>Disconnect</Button>
      </div>
    );
  }

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Button onClick={() => connect.mutate({ connector: injected() })}>
          Connect Wallet
        </Button>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
}
