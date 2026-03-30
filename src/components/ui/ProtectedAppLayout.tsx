"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialogProvider";
import Breadcrumbs from "@/components/ui/BreadCrumbs";
import { Sidebar } from "@/components/ui/sidebar";
import SyncQueuePanel from "@/components/ui/SyncQueuePanel";
import ToastNotification from "@/components/ui/ToastNotification";
import { useAuth } from "@/lib/auth/use-auth";
import type { User } from "@/schemas";

type ProtectedAppLayoutProps = {
  children: React.ReactNode;
  allowedRoles?: User["rol"][];
};

export default function ProtectedAppLayout({
  children,
  allowedRoles,
}: ProtectedAppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/auth/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      router.replace("/home");
    }
  }, [allowedRoles, isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-sm text-gray-500">
        Preparando tu sesion...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return null;
  }

  return (
    <ConfirmDialogProvider>
      <div className="min-h-screen bg-slate-100 text-gray-900">
        <div className="mx-auto flex min-h-screen max-w-[1920px] md:items-start">
          <Sidebar {...user} />

          <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:px-6 sm:pb-8 md:px-8 md:pt-8 xl:px-10">
            <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[1440px] flex-col">
              <div className="mb-6 rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-slate-200/60 backdrop-blur sm:px-6">
                <Breadcrumbs />
              </div>

              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </main>
        </div>

        <ToastNotification />
        <SyncQueuePanel />
      </div>
    </ConfirmDialogProvider>
  );
}
