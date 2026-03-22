"use client";

import { useEffect } from "react";
import { RefreshCcw, Home, Bug } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-orange-100 rounded-full">
            <Bug className="text-orange-600" size={40} />
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ocurrió un error
        </h1>
        <p className="text-gray-600 mb-6">
          Algo salió mal. No te preocupes, ya estamos trabajando en ello.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="app-interactive-button flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 hover:shadow-lg hover:shadow-red-200/60"
          >
            <RefreshCcw size={18} />
            Reintentar
          </button>

          <Link
            href="/"
            className="app-interactive-button flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:border-red-200 hover:bg-gray-50 hover:shadow-md hover:shadow-red-100/50"
          >
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>

        {/* Detalle técnico opcional */}
        <p className="mt-6 text-xs text-gray-400">
          Error ID: {error.digest ?? "N/A"}
        </p>
      </div>
    </div>
  );
}
