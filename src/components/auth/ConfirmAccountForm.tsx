'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { PinInput, PinInputField } from '@chakra-ui/pin-input';
import { MailCheck, Repeat, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmAccountToken } from '@/features/auth/api/public-auth';
import { getRuntimeConfig } from '@/lib/runtime/runtime-config';

export default function ConfirmAccountForm() {
  const runtime = getRuntimeConfig();
  const [token, setToken] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
    const response = await confirmAccountToken(value);

    if (!response.ok) {
      response.errors.forEach((error) => toast.error(error));
      setIsSubmitting(false);
      return;
    }

    toast.success(response.data.message, {
      onClose: () => router.push('/auth/login'),
    });
    setIsSubmitting(false);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    toast.info(
      'El reenvio de codigo quedara disponible cuando el backend exponga ese endpoint.',
    );
    setCooldown(30);
  };

  const triangles = Array.from({ length: 120 });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)' }}
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

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="order-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:order-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                  <MailCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Confirma tu cuenta</h1>
                  <p className="text-xs text-gray-500">
                    Ingresa el código de 6 dígitos enviado a tu correo
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <PinInput
                    value={token}
                    onChange={handleChange}
                    onComplete={handleComplete}
                    otp
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <PinInputField
                        key={index}
                        className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl"
                      />
                    ))}
                  </PinInput>
                </div>

                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  <Repeat className="h-4 w-4" />
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                </button>

                <p className="text-center text-xs text-gray-500">
                  {runtime.isDesktop ? (
                    <>
                      Si no puedes completar este paso, vuelve a{' '}
                      <Link
                        href="/auth/login"
                        className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
                      >
                        iniciar sesión
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Si no tienes acceso al correo, vuelve al{' '}
                      <Link
                        href="/auth/register"
                        className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
                      >
                        registro
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="order-1 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm sm:order-2">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <ShieldCheck className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold">Consejos rápidos</span>
              </div>
              <ul className="list-disc space-y-2 pl-5 text-xs text-gray-600">
                <li>Revisa Spam o Promociones si no ves el correo.</li>
                <li>El codigo expira por seguridad. Si caduca, solicita uno nuevo.</li>
                <li>Escribe los 6 digitos manualmente para evitar errores.</li>
                <li>No compartas este codigo con terceros.</li>
              </ul>

              <div className="mt-4 text-xs text-gray-600">
                <p>
                  Si necesitas ayuda, escribe a{' '}
                  <a
                    href="mailto:soporte@tu-dominio.com"
                    className="text-red-600 underline underline-offset-2 hover:text-red-700"
                  >
                    soporte@tu-dominio.com
                  </a>
                  .
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <Image
                  src="/LOGOSINCUENTAB.png"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-md object-contain"
                />
                <p className="text-xs text-gray-500">ECONOLAB</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-600">
            Al continuar aceptas nuestros{' '}
            <Link href="/terms" className="text-red-600 hover:underline">
              Terminos
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-red-600 hover:underline">
              Politica de privacidad
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
