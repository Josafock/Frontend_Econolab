"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { googleCallbackAction } from "@/actions/auth/googleCallbackAction";

export default function GoogleOAuthPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const message = params.get("message");

    if (message) {
      toast.success(message);
    }

    if (!token) {
      toast.error("No se pudo completar el inicio de sesión con Google");
      router.replace("/auth/login");
      return;
    }

    googleCallbackAction(token).then(() => {
      // Si quieres, puedes hacer lógica por rol:
      // if (rol === "admin") return router.replace("/admin");
      router.replace("/home");
    });
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-600">
        Procesando inicio de sesión con Google...
      </p>
    </div>
  );
}
