"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CollectionContentSkeleton } from "@/components/ui/PageSkeletons";
import { isDesktopApp } from "@/lib/runtime/platform";

export default function ProtectedLoading() {
  const router = useRouter();
  const pathname = usePathname();
  const [recoveryState, setRecoveryState] = useState<"waiting" | "refreshing" | "reloading">(
    "waiting",
  );

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      setRecoveryState("refreshing");
      router.refresh();
    }, 4500);

    const reloadTimer = window.setTimeout(() => {
      setRecoveryState("reloading");
      window.location.replace(window.location.href);
    }, 9000);

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearTimeout(reloadTimer);
    };
  }, [pathname, router]);

  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-10 w-72 max-w-full rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>

      {recoveryState !== "waiting" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          {recoveryState === "refreshing"
            ? "La vista esta tardando mas de lo esperado. Estamos reintentando la carga automaticamente."
            : "La vista sigue ocupada. Estamos recargando la pantalla para recuperarla sin que tengas que presionar F5."}
        </div>
      ) : null}

      <CollectionContentSkeleton statCards={4} rows={5} />
    </div>
  );
}
