"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { OfflineProvider } from "@/lib/offline/network-state";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <OfflineProvider>
      <AuthProvider>{children}</AuthProvider>
    </OfflineProvider>
  );
}
