"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="text-red-600" size={40} />
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-600 mb-6">
          La página que estás buscando no existe o fue movida.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Home size={18} />
            Ir al inicio
          </Link>

          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
        </div>

        {/* Ayuda */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Search size={16} />
          <span>Usa el menú para encontrar la sección correcta</span>
        </div>
      </div>
    </div>
  );
}
