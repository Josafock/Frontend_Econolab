"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import type { User } from "@/schemas";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: User["rol"][];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
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
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-500">
        Validando sesión...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return null;
  }

  return <>{children}</>;
}
