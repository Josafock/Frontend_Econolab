'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DashboardOverview } from '@/actions/dashboard/dashboardActions';
import type { AdminManagedUser } from '@/actions/users/adminUsersActions';
import AdminRoleManager from '@/components/home/AdminRoleManager';
import AppModal from '@/components/ui/AppModal';
import { formatDate, formatDateTime } from '@/helpers/date';
import {
  ArrowRight,
  Clock3,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';

type AdminControlCenterProps = {
  currentUserId: string;
  rangeLabel: string;
  adminUsers: number;
  receptionistUsers: number;
  loginSummary: DashboardOverview['logins'];
  initialUnassignedUsers: AdminManagedUser[];
  initialUsersWithRole: AdminManagedUser[];
  initialError?: string | null;
};

type AdminTab = 'summary' | 'roles' | 'access';

const tabLabels: Record<AdminTab, string> = {
  summary: 'Resumen',
  roles: 'Roles',
  access: 'Accesos',
};

function getRoleLabel(role: DashboardOverview['logins']['users'][number]['rol']) {
  if (role === 'admin') return 'Admin';
  if (role === 'recepcionista') return 'Recepcionista';
  return 'Sin rol';
}

export default function AdminControlCenter({
  currentUserId,
  rangeLabel,
  adminUsers,
  receptionistUsers,
  loginSummary,
  initialUnassignedUsers,
  initialUsersWithRole,
  initialError,
}: AdminControlCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('summary');

  const pendingCount = initialUnassignedUsers.length;
  const accountsWithFailures = loginSummary.users.filter((user) => user.failedLogins > 0).length;
  const lastAccess = loginSummary.recent[0];

  const usersWithMostFailures = useMemo(
    () =>
      [...loginSummary.users]
        .filter((user) => user.failedLogins > 0)
        .sort((left, right) => right.failedLogins - left.failedLogins || left.nombre.localeCompare(right.nombre, 'es-MX'))
        .slice(0, 5),
    [loginSummary.users],
  );

  return (
    <>
      <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Centro administrativo
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Roles, accesos y control interno separados del tablero del negocio.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usuarios activos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{adminUsers + receptionistUsers}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fallos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{loginSummary.failedInRange}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
        >
          Abrir centro administrativo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {isOpen ? (
        <AppModal>
          <div className="flex max-h-[min(92vh,62rem)] w-full max-w-[min(96vw,86rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,235,0.95)_38%,_rgba(254,215,170,0.9)_100%)] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">
                    Centro administrativo
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Control de accesos y roles
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                    Aqui vive la parte administrativa para no mezclarla con el tablero operativo del laboratorio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition-colors hover:bg-slate-50"
                  aria-label="Cerrar centro administrativo"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 scroll-panel">
              {activeTab === 'summary' ? (
                <div className="space-y-6">
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendientes por activar</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{pendingCount}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                          <UserCog className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Admins activos</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{adminUsers}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Recepcionistas</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{receptionistUsers}</p>
                        </div>
                        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Fallos en {rangeLabel.toLowerCase()}</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{loginSummary.failedInRange}</p>
                        </div>
                        <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Salud del control</p>
                      <h3 className="mt-2 text-2xl font-semibold text-gray-900">Resumen rapido</h3>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm text-gray-600">Usuarios con intentos fallidos</p>
                          <p className="mt-2 text-2xl font-semibold text-gray-900">
                            {accountsWithFailures}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm text-gray-600">Usuarios con acceso exitoso</p>
                          <p className="mt-2 text-2xl font-semibold text-emerald-700">
                            {loginSummary.uniqueUsersInRange}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 p-5 text-white">
                        <p className="text-sm text-red-100">Ultimo acceso registrado</p>
                        <p className="mt-2 text-xl font-semibold">
                          {lastAccess?.userName ?? lastAccess?.email ?? 'Sin actividad reciente'}
                        </p>
                        <p className="mt-2 text-sm text-red-100">
                          {lastAccess
                            ? `${lastAccess.success ? 'Acceso exitoso' : 'Acceso fallido'} el ${formatDateTime(lastAccess.createdAt)}.`
                            : 'Todavia no hay movimientos de acceso registrados.'}
                        </p>
                      </div>

                      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-semibold">Sugerencia operativa</p>
                        <p className="mt-2">
                          Si ves usuarios pendientes o intentos fallidos repetidos, conviene revisar accesos y activaciones antes del inicio de turno.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Atencion</p>
                      <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                        Donde poner ojo primero
                      </h3>

                      {initialError ? (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          {initialError}
                        </div>
                      ) : null}

                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                          <p className="font-semibold">Usuarios pendientes</p>
                          <p className="mt-2">
                            {pendingCount > 0
                              ? `${pendingCount} usuario${pendingCount === 1 ? '' : 's'} esperan rol para poder entrar al sistema.`
                              : 'No hay usuarios pendientes por activar.'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                          <p className="font-semibold">Intentos fallidos</p>
                          <p className="mt-2">
                            {loginSummary.failedInRange > 0
                              ? `${loginSummary.failedInRange} intento${loginSummary.failedInRange === 1 ? '' : 's'} fallido${loginSummary.failedInRange === 1 ? '' : 's'} en ${rangeLabel.toLowerCase()}.`
                              : `No hubo accesos fallidos en ${rangeLabel.toLowerCase()}.`}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <p className="font-semibold">Acceso directo</p>
                          <Link
                            href="/historial"
                            onClick={() => setIsOpen(false)}
                            className="mt-2 inline-flex items-center gap-2 font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                          >
                            Ir a historial y cortes
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-slate-700" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Accesos con mas ruido</p>
                        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                          Usuarios con mas intentos fallidos
                        </h3>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {usersWithMostFailures.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                          No hay usuarios con intentos fallidos en el rango revisado.
                        </div>
                      ) : (
                        usersWithMostFailures.map((user) => (
                          <div
                            key={user.id}
                            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{user.nombre}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                  {user.failedLogins} fallidos
                                </span>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  {user.successfulLogins} exitosos
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === 'roles' ? (
                <AdminRoleManager
                  currentUserId={currentUserId}
                  initialUnassignedUsers={initialUnassignedUsers}
                  initialUsersWithRole={initialUsersWithRole}
                  initialError={initialError}
                />
              ) : null}

              {activeTab === 'access' ? (
                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Usuarios</p>
                    <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                      Admins y recepcionistas con sus accesos
                    </h3>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-600">Admins</p>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{adminUsers}</p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-600">Recepcionistas</p>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">
                          {receptionistUsers}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-600">Logins exitosos</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">
                          {loginSummary.successfulInRange}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 max-h-[30rem] space-y-3 overflow-y-auto pr-1 scroll-panel">
                      {loginSummary.users.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                          No hay usuarios para el filtro seleccionado.
                        </div>
                      ) : (
                        loginSummary.users.map((account) => (
                          <div
                            key={account.id}
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {account.nombre}
                                </p>
                                <p className="mt-1 truncate text-xs text-gray-500">{account.email}</p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  account.rol === 'admin'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {getRoleLabel(account.rol)}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                Exitosos: <span className="font-semibold">{account.successfulLogins}</span>
                              </div>
                              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                Fallidos: <span className="font-semibold">{account.failedLogins}</span>
                              </div>
                              <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                Alta: <span className="font-semibold">{formatDate(account.createdAt)}</span>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                              <span>
                                Ultimo login:{' '}
                                {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : 'Sin login'}
                              </span>
                              <span>
                                Ultimo intento:{' '}
                                {account.lastAttemptAt ? formatDateTime(account.lastAttemptAt) : 'Sin intentos'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-slate-700" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Accesos recientes</p>
                        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                          Ultimos movimientos de login
                        </h3>
                      </div>
                    </div>

                    <div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-2 scroll-panel">
                      {loginSummary.recent.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                          No hay actividad de acceso registrada.
                        </div>
                      ) : (
                        loginSummary.recent.map((login) => (
                          <div
                            key={login.id}
                            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {login.userName ?? login.email ?? 'Acceso sin identificar'}
                                </p>
                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {login.email ?? 'Sin correo'}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  login.success
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {login.success ? 'Exitoso' : 'Fallido'}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                              <span>{formatDateTime(login.createdAt)}</span>
                              <span>{login.ip ?? 'Sin IP'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </AppModal>
      ) : null}
    </>
  );
}
