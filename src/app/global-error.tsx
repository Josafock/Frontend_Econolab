"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCcw, ServerCrash } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error RSC:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mb-5 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ServerCrash className="text-red-600" size={38} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Ocurrio un error</h1>
        <p className="mt-3 text-gray-600">
          Algo fallo al cargar esta vista. Puedes reintentar o volver al inicio.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="app-interactive-button inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 hover:shadow-lg hover:shadow-red-200/60"
          >
            <RefreshCcw size={18} />
            Reintentar
          </button>

          <Link
            href="/"
            className="app-interactive-button inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-gray-50 hover:shadow-md hover:shadow-red-100/50"
          >
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Error ID: {error.digest ?? "N/A"}
        </p>
      </div>
    </div>
  );
}
