'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { resetPasswordAction } from '@/actions/auth/resetPasswordAction';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  passwordRules,
  getPasswordStrength,
  isPasswordStrong,
} from '@/helpers/passwordRules';

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const resetPassWithToken = resetPasswordAction.bind(null, token);
  const [state, dispatch] = useActionState(resetPassWithToken, {
    errors: [],
    success: '',
  });

  useEffect(() => {
    if (state?.errors?.length) state.errors.forEach((e: string) => toast.error(e));
    if (state?.success) {
      toast.success(state.success, {
        onClose: () => router.push('/auth/login'),
        onClick: () => router.push('/auth/login'),
      });
    }
  }, [state, router]);

  // 🔐 Reglas de contraseña usando el helper compartido
  const strength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const allRulesOk = isPasswordStrong(password);
  const passwordsMatch = !!confirmPassword && confirmPassword === password;
  const canSubmit = allRulesOk && passwordsMatch;

  const triangles = Array.from({ length: 120 });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      {/* Fondo claro con triángulos sutiles */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)' }}
      />

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
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>

      {/* Contenido */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Formulario */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Cambia tu contraseña
                  </h1>
                  <p className="text-xs text-gray-500">
                    Elige una clave segura que no uses en otros sitios
                  </p>
                </div>
              </div>

              <form className="space-y-5" action={dispatch} noValidate>
                {/* Nueva contraseña */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmación */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword2 ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2((v) => !v)}
                      aria-label={
                        showPassword2
                          ? 'Ocultar confirmación de contraseña'
                          : 'Mostrar confirmación de contraseña'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Indicador de fuerza */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Fuerza de la contraseña</span>
                    <span className="font-medium text-gray-700">
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={
                        'h-full transition-all ' +
                        (strength.pct < 40
                          ? 'bg-red-500'
                          : strength.pct < 80
                          ? 'bg-yellow-400'
                          : 'bg-green-500')
                      }
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  <ul className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <li key={rule.id} className="flex items-center gap-2">
                        {rule.test(password) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Validación de coincidencia */}
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs font-medium text-red-600">
                    Las contraseñas no coinciden
                  </p>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!canSubmit}
                >
                  Actualizar contraseña
                </button>

                <p className="text-center text-xs text-gray-500">
                  ¿Recordaste tu contraseña?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </form>
            </div>

            {/* Panel de ayuda */}
            <aside className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                Recomendaciones de seguridad
              </p>
              <ul className="list-disc space-y-2 pl-5 text-xs text-gray-600">
                <li>Usa una contraseña única que no utilices en otros sitios.</li>
                <li>Evita información fácil de adivinar (cumpleaños, nombres, etc.).</li>
                <li>
                  Activa el gestor de contraseñas para guardarla de forma segura.
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-600">
                Si no solicitaste este cambio, por favor contacta a soporte.
              </p>
            </aside>
          </div>

          <div className="mt-6 text-center text-xs text-gray-600">
            Al continuar aceptas nuestros{' '}
            <Link href="/terms" className="text-red-600 hover:underline">
              Términos
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-red-600 hover:underline">
              Política de privacidad
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
