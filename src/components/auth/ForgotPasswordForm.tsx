"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { requestPasswordReset } from "@/features/auth/api/public-auth";
import { Mail, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPassForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const response = await requestPasswordReset({ email });

    if (!response.ok) {
      response.errors.forEach((error) => toast.error(error));
      setIsSubmitting(false);
      return;
    }

    toast.success(response.data.message, {
      onClose: () => {
        router.push("/auth/new-password");
      },
    });
    setIsSubmitting(false);
  };

  const triangles = Array.from({ length: 120 });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      {/* Fondo claro con triángulos sutiles */}
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)" }} />

      {/* Campo de triángulos izquierdo */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`l-${i}`} className="mx-auto h-5 w-5 bg-red-50 clip-triangle" />
          ))}
        </div>
      </div>

      {/* Campo de triángulos derecho */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`r-${i}`} className="mx-auto h-5 w-5 bg-gray-100 clip-triangle" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
      `}</style>

      {/* Contenido */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-xl">
          {/* Tarjeta */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
            {/* Encabezado */}
            <div className="flex flex-col items-left gap-3 border-b border-gray-100 px-8 py-6">
              <h1 className="text-4xl text-black font-bold"><span className="text-primary font-bold">ECONO</span>LAB</h1>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-semibold text-gray-900">Recuperar contraseña</h1>
                  <p className="text-xs text-gray-500">Te enviaremos un enlace para restablecerla</p>
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="grid gap-6 px-6 py-6 sm:grid-cols-5 sm:px-8 sm:py-8">
              {/* Formulario */}
              <form onSubmit={handleSubmit} noValidate className="sm:col-span-3 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="usuario@correo.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>

                <p className="text-center text-xs text-gray-500">
                  ¿Recordaste tu contraseña?{' '}
                  <Link href="/auth/login" className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700">
                    Inicia sesión
                  </Link>
                </p>
              </form>

              {/* Panel de ayuda */}
              <div className="sm:col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-gray-800">
                  <ShieldCheck className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold">Consejos rápidos</span>
                </div>
                <ul className="list-disc space-y-2 pl-5 text-xs text-gray-600">
                  <li>Revisa tu carpeta de <span className="font-medium text-gray-800">Spam</span> o <span className="font-medium text-gray-800">Promociones</span>.</li>
                  <li>El enlace expira por seguridad. Si caduca, solicita uno nuevo.</li>
                  <li>Si no recibes el correo en 5–10 min, verifica que tu email esté escrito correctamente.</li>
                  <li>Protegemos tus datos: solo usamos este correo para validar tu identidad.</li>
                </ul>
                <div className="mt-4 text-xs text-gray-600">
                  <p>
                    ¿Necesitas más ayuda? Escríbenos a{' '}
                    <a href="mailto:soporte@tu-dominio.com" className="text-red-600 underline underline-offset-2 hover:text-red-700">
                      soporte@tu-dominio.com
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Pie */}
            <div className="flex flex-col items-center gap-2 border-t border-gray-100 px-8 py-5 text-center">
              <p className="text-xs text-gray-500">
                Al continuar aceptas nuestros{' '}
                <Link href="/terms" className="text-red-600 hover:underline">Términos</Link> y{' '}
                <Link href="/privacy" className="text-red-600 hover:underline">Política de privacidad</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
