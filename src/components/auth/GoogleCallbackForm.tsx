"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { authStore } from "@/lib/auth/auth-store";
import { useAuth } from "@/lib/auth/use-auth";

export default function GoogleOAuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const message = params.get("message");
    const error = params.get("error");

    if (error) {
      toast.error(error);
      router.replace("/auth/login");
      return;
    }

    if (message) {
      toast.success(message);
    }

    if (!token) {
      toast.error("No se pudo completar el inicio de sesion con Google");
      router.replace("/auth/login");
      return;
    }

    void (async () => {
      await authStore.setSession({
        token,
        user: null,
      });

      const profileResult = await refreshProfile();
      if (!profileResult.ok) {
        profileResult.errors.forEach((entry) => toast.error(entry));
        router.replace("/auth/login");
        return;
      }

      router.replace("/home");
    })();
  }, [params, refreshProfile, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-600">
        Procesando inicio de sesion con Google...
      </p>
    </div>
  );
}
