"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { PinInput, PinInputField } from "@chakra-ui/pin-input";
import { toast } from "react-toastify";
import { Repeat, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { validatePasswordResetToken } from "@/features/auth/api/public-auth";

type ValidateTokenProps = {
  setIsValidToken: Dispatch<SetStateAction<boolean>>;
  token: string;
  setToken: Dispatch<SetStateAction<string>>;
};

export default function ValidateTokenForm({
  setIsValidToken,
  token,
  setToken,
}: ValidateTokenProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const handleChange = (value: string) => {
    setToken(value);
  };

  const handleComplete = async (value: string) => {
    if (isSubmitting) return;

    setToken(value);
    setIsSubmitting(true);
    const response = await validatePasswordResetToken(value);

    if (!response.ok) {
      response.errors.forEach((error) => toast.error(error));
      setIsSubmitting(false);
      return;
    }

    toast.success(response.data.message);
    setIsValidToken(true);
    setIsSubmitting(false);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    toast.info(
      "El reenvio del codigo de recuperacion quedara disponible cuando el backend exponga ese endpoint.",
    );
    setCooldown(30);
  };

  const triangles = Array.from({ length: 120 });

  return (
    <div className="relative min-h-[80vh] w-full overflow-hidden bg-gray-50">
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)" }}
      />

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`l-${i}`} className="mx-auto h-5 w-5 bg-red-50 clip-triangle" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`r-${i}`} className="mx-auto h-5 w-5 bg-gray-100 clip-triangle" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>

      <div className="relative z-10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 border-b border-gray-100 px-8 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Verificacion de seguridad</h1>
                <p className="text-xs text-gray-500">
                  Introduce el codigo de 6 digitos que enviamos a tu correo
                </p>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:grid-cols-5 sm:px-8 sm:py-8">
              <div className="space-y-5 sm:col-span-3">
                <div className="flex justify-center">
                  <PinInput value={token} onChange={handleChange} onComplete={handleComplete} otp>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <PinInputField
                        key={index}
                        className="mx-1 h-12 w-12 rounded-lg border border-gray-300 bg-white text-center text-xl text-gray-900 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-red-500"
                      />
                    ))}
                  </PinInput>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Repeat className="h-4 w-4" />
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar codigo"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                <p className="mb-2 text-sm font-semibold text-gray-800">Consejos rapidos</p>
                <ul className="list-disc space-y-2 pl-5 text-xs text-gray-600">
                  <li>Revisa Spam o Promociones.</li>
                  <li>Evita pegar con espacios ocultos.</li>
                  <li>El codigo expira por seguridad. Si caduca, solicita uno nuevo.</li>
                </ul>
                <p className="mt-3 text-xs text-gray-600">
                  Si no tienes acceso al correo, vuelve a{" "}
                  <Link
                    href="/auth/register"
                    className="text-red-600 underline underline-offset-2 hover:text-red-700"
                  >
                    registro
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 px-8 py-5 text-center text-xs text-gray-600">
              Al continuar aceptas nuestros{" "}
              <Link href="/terms" className="text-red-600 hover:underline">
                Terminos
              </Link>{" "}
              y{" "}
              <Link href="/privacy" className="text-red-600 hover:underline">
                Politica de privacidad
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
