'use client';

import {
  Camera,
  CheckCircle2,
  ImageUp,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'react-toastify';
import { getCurrentProfile } from '@/features/auth/api/get-profile';
import { updateCurrentPassword } from '@/features/auth/api/update-password';
import { updateCurrentProfile } from '@/features/auth/api/update-profile';
import { updateCurrentProfileImage } from '@/features/auth/api/update-profile-image';
import type { ProfileResponsePayload } from '@/features/auth/model/auth-types';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDate } from '@/helpers/date';
import { getPasswordStrength, passwordRules } from '@/helpers/passwordRules';

type ProfileTab = 'overview' | 'security';

function buildFallbackProfile(
  user: NonNullable<ReturnType<typeof useAuth>['user']>,
): ProfileResponsePayload {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    confirmed: true,
    createdAt: undefined,
    updatedAt: undefined,
    profileImageUrl: null,
    authProvider: 'local',
  };
}

export default function PerfilClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileResponsePayload | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    email: '',
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isSavingProfile, startProfileTransition] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setLoadingProfile(false);
        }
        return;
      }

      const fallback = buildFallbackProfile(user);
      if (!cancelled) {
        setProfile(fallback);
        setProfileForm({
          nombre: fallback.nombre,
          email: fallback.email,
        });
      }

      const response = await getCurrentProfile();
      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setLoadingProfile(false);
        return;
      }

      setProfile(response.data);
      setProfileForm({
        nombre: response.data.nombre,
        email: response.data.email,
      });
      setLoadingProfile(false);
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const strength = useMemo(
    () => getPasswordStrength(passwordData.newPassword),
    [passwordData.newPassword],
  );

  if (authLoading || loadingProfile || !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-gray-200 bg-white text-sm text-gray-500 shadow-sm">
        Cargando perfil...
      </div>
    );
  }

  const roleLabel =
    profile.rol === 'admin'
      ? 'Administrador'
      : profile.rol === 'recepcionista'
        ? 'Recepcionista'
        : 'Sin rol';
  const providerLabel = profile.authProvider === 'google' ? 'Google' : 'Correo y contrasena';
  const canEditEmail = profile.authProvider !== 'google';

  const initials = profile.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const hasProfileChanges =
    profileForm.nombre.trim() !== profile.nombre ||
    profileForm.email.trim().toLowerCase() !== profile.email;

  const handleProfileSave = () => {
    startProfileTransition(async () => {
      const response = await updateCurrentProfile(profileForm);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar la informacion del perfil.');
        return;
      }

      setProfile(response.data.user);
      setProfileForm({
        nombre: response.data.user.nombre,
        email: response.data.user.email,
      });
      await refreshProfile();
      toast.success(response.data.message ?? 'Perfil actualizado.');
    });
  };

  const handlePasswordChange = () => {
    startTransition(async () => {
      const response = await updateCurrentPassword(passwordData);

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

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = '';

    if (!image) {
      return;
    }

    setIsUploadingImage(true);
    const response = await updateCurrentProfileImage(image);
    setIsUploadingImage(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo actualizar la foto de perfil.');
      return;
    }

    setProfile(response.data.user);
    await refreshProfile();
    toast.success(response.data.message ?? 'Foto de perfil actualizada.');
  };

  return (
    <div className="space-y-6">
      <section className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] bg-slate-900 text-2xl font-semibold text-white shadow-lg shadow-slate-200">
                {profile.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImageUrl}
                    alt={`Foto de perfil de ${profile.nombre}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || 'U'
                )}
              </div>

              <button
                type="button"
                onClick={handleSelectImage}
                disabled={isUploadingImage}
                className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-red-600 text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Cambiar foto de perfil"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Perfil</p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-gray-900">
                {profile.nombre}
              </h1>
              <p className="mt-1 truncate text-sm text-gray-500">{profile.email}</p>
              <p className="mt-2 text-xs text-gray-500">
                {profile.authProvider === 'google'
                  ? 'Tu cuenta puede usar la foto de Google o la imagen que subas aqui.'
                  : 'Puedes subir una foto JPG, PNG o WEBP de hasta 2 MB.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Rol</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{roleLabel}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Estado</p>
              <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Cuenta activa
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Panel lateral</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Acciones de la cuenta</h2>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`app-tab-button flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <UserRound className="h-5 w-5" />
                Datos de la cuenta
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`app-tab-button flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
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

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estado</p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Cuenta verificada</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Sesion estable</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Tu cuenta esta lista para usarse y puedes entrar a tus secciones con normalidad.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Correo principal</p>
                    <p className="mt-1 break-all text-sm text-blue-800">{profile.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <ImageUp className="mt-0.5 h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Foto de perfil</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Puedes cambiarla cuando lo necesites desde el boton de la imagen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          {activeTab === 'overview' ? (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Resumen</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Informacion principal</h2>
              <p className="mt-2 text-sm text-gray-600">
                Aqui puedes actualizar tu nombre, tu correo y revisar los datos principales de tu cuenta.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Editar perfil
                  </p>

                  <div className="mt-5 grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Nombre visible</span>
                      <input
                        type="text"
                        value={profileForm.nombre}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            nombre: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        placeholder="Escribe tu nombre"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Correo de acceso</span>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        disabled={!canEditEmail}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="correo@dominio.com"
                      />
                    </label>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Aviso</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {canEditEmail
                          ? 'Los cambios de nombre y correo se aplican en cuanto guardas.'
                          : 'En cuentas con Google el correo lo controla el proveedor, pero si puedes cambiar el nombre visible.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        Tu sesion se actualiza automaticamente con los nuevos datos.
                      </p>

                      <button
                        type="button"
                        onClick={handleProfileSave}
                        disabled={isSavingProfile || !hasProfileChanges}
                        className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      Rol operativo
                    </p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">{roleLabel}</p>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      Metodo de acceso
                    </p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">{providerLabel}</p>
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
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Nombre visible
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">{profile.nombre}</p>
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
                    {profile.email}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Identificador
                  </p>
                  <p className="mt-3 break-all text-sm font-semibold text-gray-900">
                    {profile.id}
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

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Creado
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Ultima actualizacion
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Seguridad</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Actualiza tu contrasena</h2>
              <p className="mt-2 text-sm text-gray-600">
                Cambia tu contrasena para mantener tu cuenta protegida.
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
                  className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
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
