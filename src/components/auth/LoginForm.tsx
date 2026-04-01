'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/auth/use-auth';
import { getRuntimeConfig } from '@/lib/runtime/runtime-config';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const runtime = getRuntimeConfig();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const triangles = Array.from({ length: 120 });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await login({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    setPending(false);

    if (!result.ok) {
      result.errors.forEach((error) => toast.error(error));
      return;
    }

    toast.success('Inicio de sesión completado.', {
      onClose: () => router.push('/home'),
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white to-gray-50" />

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden opacity-30 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`l-${i}`} className="mx-auto h-5 w-5 bg-red-100 clip-triangle" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden opacity-30 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`r-${i}`} className="mx-auto h-5 w-5 bg-gray-200 clip-triangle" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="flex flex-col items-center justify-center gap-4 border-b border-gray-100 px-8 py-8">
              <h1 className="text-4xl font-bold text-black">
                <span className="text-red-600">ECONO</span>LAB
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-red-200 bg-red-50">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-semibold text-gray-900">Iniciar sesión</h1>
                  <p className="text-sm text-gray-500">Accede a tu cuenta</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8" noValidate>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@clinica.com"
                      className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 pr-11 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-red-500 bg-white px-4 py-3 text-sm font-semibold text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>

                {!runtime.isDesktop ? (
                  <p className="text-center text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <Link
                      href="/auth/register"
                      className="font-medium text-red-600 underline underline-offset-2 transition-colors hover:text-red-700"
                    >
                      Regístrate aquí
                    </Link>
                  </p>
                ) : (
                  <p className="text-center text-sm text-gray-600">
                    Si no tienes acceso, solicita tu cuenta al administrador.
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-gray-600">
            Al iniciar sesión, aceptas nuestros{' '}
            <Link
              href="/terms"
              className="text-red-600 transition-colors hover:text-red-700 hover:underline"
            >
              Términos de servicio
            </Link>{' '}
            y{' '}
            <Link
              href="/privacy"
              className="text-red-600 transition-colors hover:text-red-700 hover:underline"
            >
              Política de privacidad
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
