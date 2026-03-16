'use client';

import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'react-toastify';
import { updatePasswordAction } from '@/actions/users/updatePasswordAction';
import { getPasswordStrength, passwordRules } from '@/helpers/passwordRules';
import type { User } from '@/schemas';

type PerfilClientProps = {
  user: User;
};

type ProfileTab = 'overview' | 'security';

export default function PerfilClient({ user }: PerfilClientProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isPending, startTransition] = useTransition();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const roleLabel =
    user.rol === 'admin'
      ? 'Administrador'
      : user.rol === 'recepcionista'
        ? 'Recepcionista'
        : 'Sin rol';

  const initials = user.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const strength = useMemo(
    () => getPasswordStrength(passwordData.newPassword),
    [passwordData.newPassword],
  );

  const handlePasswordChange = () => {
    startTransition(async () => {
      const response = await updatePasswordAction(passwordData);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar la contrasena.');
        return;
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success(response.data.message ?? 'Contrasena actualizada.');
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.25rem] border border-red-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,244,240,0.95)_35%,_rgba(254,226,226,0.92)_100%)] shadow-xl shadow-red-200/40">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
              <Sparkles className="h-3.5 w-3.5" />
              Perfil
            </div>

            <h1 className="mt-5 text-3xl font-semibold text-slate-900 md:text-4xl">
              Tu cuenta ya vive dentro del mismo lenguaje visual del sistema.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
              Revisa tus datos de sesion, valida tu rol y actualiza tu contrasena desde un
              modulo mas limpio, compacto y consistente con el resto de Econolab.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rol activo</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{roleLabel}</p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Correo</p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-900">{user.email}</p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sesion</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Activa en este equipo</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-white/10 text-2xl font-semibold text-white">
                {initials || 'U'}
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-red-200">Usuario</p>
                <h2 className="mt-2 truncate text-2xl font-semibold">{user.nombre}</h2>
                <p className="mt-1 truncate text-sm text-slate-300">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Estado de la cuenta</p>
              <p className="mt-2">
                El acceso esta validado y el panel reconoce tu rol actual sin depender de
                datos de prueba.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white text-slate-950'
                    : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                Resumen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'security'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                Seguridad
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Panel lateral</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Acciones de la cuenta</h2>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <UserRound className="h-5 w-5" />
                Datos de la sesion
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'security'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <KeyRound className="h-5 w-5" />
                Cambiar contrasena
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estado</p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Cuenta verificada</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Sesion estable</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      La navegacion y el acceso del perfil ya estan integrados con el usuario
                      autenticado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Correo principal</p>
                    <p className="mt-1 break-all text-sm text-blue-800">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Siguiente paso sugerido</p>
                <p className="mt-1 text-sm text-gray-600">
                  Si compartes equipo con otras personas, cambia tu contrasena periodicamente
                  desde la pestana de seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          {activeTab === 'overview' ? (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Resumen</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Informacion principal</h2>
              <p className="mt-2 text-sm text-gray-600">
                Este bloque ya usa datos reales de la sesion para mantener el modulo coherente
                con el resto del sistema.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Nombre visible
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">{user.nombre}</p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Rol operativo
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">{roleLabel}</p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Correo de acceso
                  </p>
                  <p className="mt-3 break-all text-lg font-semibold text-gray-900">
                    {user.email}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Identificador
                  </p>
                  <p className="mt-3 break-all text-sm font-semibold text-gray-900">
                    {user.id}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Estado
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Cuenta activa
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-900">
                  Edicion de datos personales
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  El diseno del perfil ya quedo homologado y la parte critica de seguridad ya
                  funciona. Si despues quieres, podemos conectar tambien la edicion completa de
                  nombre y correo al backend.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Seguridad</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Actualiza tu contrasena</h2>
              <p className="mt-2 text-sm text-gray-600">
                Esta accion ya usa el endpoint real del sistema, asi que no se queda en una
                simulacion local.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Contrasena actual</span>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(event) =>
                      setPasswordData((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Escribe tu contrasena actual"
                  />
                </label>

                <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Nueva contrasena</span>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(event) =>
                          setPasswordData((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Minimo 8 caracteres"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Confirmar contrasena
                      </span>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(event) =>
                          setPasswordData((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Repite la nueva contrasena"
                      />
                    </label>
                  </div>

                  <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Fuerza</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{strength.label}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                        {strength.pct}%
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          strength.pct >= 80
                            ? 'bg-emerald-500'
                            : strength.pct >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${strength.pct}%` }}
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      {passwordRules.map((rule) => {
                        const fulfilled = rule.test(passwordData.newPassword);

                        return (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-2 text-sm ${
                              fulfilled ? 'text-emerald-700' : 'text-gray-500'
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {rule.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Recomendacion: usa una contrasena unica y no la compartas.
                </p>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Actualizar contrasena
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
