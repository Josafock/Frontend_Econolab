'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

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
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
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
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <RefreshCcw size={18} />
            Reintentar
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>

        {/* Detalle técnico opcional */}
        <p className="mt-6 text-xs text-gray-400">
          Error ID: {error.digest ?? 'N/A'}
        </p>
      </div>
    </div>
  );
}
