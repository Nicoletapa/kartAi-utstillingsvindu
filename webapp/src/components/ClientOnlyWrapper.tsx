/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * A utility component that ensures its children are only rendered on the client side.
 * This is useful for components that deåend on browser APIs or require client-only behavior,
 * avoiding mismatches during server-side rendering (SSR).
 * 
 * @features
 * - Delays rendering of children until the component is mounted on the client
 * - Prevents hydration errors from server/client content mismatches
 * 
 * @usage
 * <ClientOnlyWrapper>
 *   <YourComponent />
 * </ClientOnlyWrapper>
 */

'use client';
import { useEffect, useState } from 'react';

export default function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}