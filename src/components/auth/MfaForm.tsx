'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Shield, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { verifyMfaAction, type MfaState } from '@/actions/auth/verifyMfaAction';

export default function MfaForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');

  const verifyWithEmail = verifyMfaAction.bind(null, email);
  const [state, dispatch, pending] = useActionState<MfaState, FormData>(
    verifyWithEmail,
    { errors: [], success: '', rol: '' }
  );

  useEffect(() => {
    if (state?.errors?.length) {
      state.errors.forEach((e: string) => toast.error(e));
    }
    if (state?.success) {
      toast.success(state.success, {
        onClose: () => {
          // Igual que en login, si quieres redirigir por rol:
          // if (state.rol === 'admin') return router.push('/admin');
          router.push('/home');
        },
      });
    }
  }, [state, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)' }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Verificación en dos pasos
                </h1>
                <p className="text-xs text-gray-500">
                  Ingresa el código de 6 dígitos generado por tu app de autenticación.
                </p>
                {email && (
                  <p className="mt-1 text-xs text-gray-400">Cuenta: {email}</p>
                )}
              </div>
            </div>

            <form
              className="space-y-5"
              action={(formData) => {
                formData.set('token', code);
                return dispatch(formData);
              }}
              noValidate
            >
              <div>
                <label
                  htmlFor="token"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Código MFA
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="token"
                    name="token"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="••••••"
                    className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-center text-lg tracking-[0.4em] text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending || code.length !== 6}
                className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Verificando...' : 'Verificar código'}
              </button>

              <p className="text-center text-xs text-gray-500">
                ¿Problemas con el código?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
                >
                  Volver al inicio de sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
