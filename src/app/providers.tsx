"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import DesktopStartupReady from "@/components/runtime/DesktopStartupReady";
import { OfflineProvider } from "@/lib/offline/network-state";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <OfflineProvider>
      <AuthProvider>
        <DesktopStartupReady />
        {children}
      </AuthProvider>
    </OfflineProvider>
  );
}
