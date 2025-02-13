'use client';

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";

export default function Providers({ 
  children,
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  return (
    <TRPCReactProvider>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </TRPCReactProvider>
  );
}