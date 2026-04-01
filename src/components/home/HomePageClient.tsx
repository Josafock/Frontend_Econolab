'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unplug,
  UserCheck,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getUnassignedUsers,
  getUsersWithRole,
  type AdminManagedUser,
} from '@/features/admin-users/api/admin-users';
import {
  getDashboardOverview,
  type DashboardOverview,
  type DashboardRange,
  type DashboardRoleFilter,
} from '@/features/dashboard/api/dashboard';
import AdminControlCenter from '@/components/home/AdminControlCenter';
import { formatDate, formatDateTime } from '@/helpers/date';
import { useAuth } from '@/lib/auth/use-auth';
import { useOffline } from '@/lib/offline/network-state';
import { buildServiceDetailHref } from '@/lib/routes/detail-routes';

function isDateInput(value?: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function money(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

const rangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '1 mes' },
  { value: '90d', label: '3 meses' },
  { value: 'year', label: '1 año' },
] as const;

const receptionistShortcuts = [
  { href: '/servicios', title: 'Servicios', description: 'Registra servicios, da seguimiento y captura resultados.' },
  { href: '/pacientes', title: 'Pacientes', description: 'Consulta expedientes y registra nuevos pacientes.' },
  { href: '/medicos', title: 'Médicos', description: 'Busca médicos tratantes y actualiza sus datos.' },
  { href: '/estudios', title: 'Estudios', description: 'Revisa el catálogo disponible para nuevos servicios.' },
  { href: '/perfil', title: 'Mi perfil', description: 'Consulta tu información y cambia tu contraseña si hace falta.' },
] as const;

function buildHref(
  range: string,
  role: string,
  options?: { startDate?: string; endDate?: string },
) {
  const params = new URLSearchParams();
  if (range) params.set('range', range);
  if (role) params.set('role', role);
  if (options?.startDate) params.set('startDate', options.startDate);
  if (options?.endDate) params.set('endDate', options.endDate);
  return `/home?${params.toString()}`;
}

function KPI({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-gray-100 p-3 text-gray-700">{icon}</div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-gray-200 bg-white px-6 py-10 text-sm text-gray-500 shadow-sm">
      Preparando panel de inicio...
    </div>
  );
}

function getLastSyncError(lastRunResult: Record<string, unknown> | null) {
  if (!lastRunResult || lastRunResult.status !== 'failed') {
    return null;
  }

  return (
    (typeof lastRunResult.message === 'string' && lastRunResult.message) ||
    (typeof (lastRunResult.push as { error?: unknown } | undefined)?.error ===
      'string' &&
      (lastRunResult.push as { error?: string }).error) ||
    (typeof (lastRunResult.pull as { error?: unknown } | undefined)?.error ===
      'string' &&
      (lastRunResult.pull as { error?: string }).error) ||
    null
  );
}

function DesktopSyncCard() {
  const {
    isDesktop,
    hasBackendConnection,
    hasInternetConnection,
    pendingCount,
    failedCount,
    localPendingCount,
    localFailedCount,
    backendPendingCount,
    backendFailedCount,
    backendSyncStatus,
    runBackendSync,
    refreshSyncState,
  } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isDesktop) {
    return null;
  }

  const lastRunAt = backendSyncStatus?.lastRunAt
    ? new Date(backendSyncStatus.lastRunAt).toLocaleString('es-MX')
    : null;
  const lastSyncError = getLastSyncError(backendSyncStatus?.lastRunResult ?? null);

  const statusTone = hasBackendConnection
    ? hasInternetConnection
      ? {
          icon: <Wifi className="h-5 w-5 text-emerald-700" />,
          badge: 'bg-emerald-100 text-emerald-700',
          label: 'Backend local y central accesibles',
          hint: 'Puedes seguir trabajando y sincronizar normalmente.',
        }
      : {
          icon: <Unplug className="h-5 w-5 text-sky-700" />,
          badge: 'bg-sky-100 text-sky-700',
          label: 'Modo local activo',
          hint: 'La app sigue trabajando en SQLite local aunque no haya internet.',
        }
    : {
        icon: <AlertTriangle className="h-5 w-5 text-amber-700" />,
        badge: 'bg-amber-100 text-amber-700',
        label: 'Backend local no disponible',
        hint: 'Revisa que la app local haya levantado correctamente el backend.',
      };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const result = await runBackendSync();
    await refreshSyncState();
    setIsSyncing(false);

    if (!result.ok) {
      toast.error(result.errors[0] ?? 'No se pudo completar la sincronización.');
      return;
    }

    toast.success('Sincronización ejecutada.');
  };

  return (
    <section className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            <Database className="h-3.5 w-3.5 text-red-600" />
            Sincronización desktop
          </div>
          <div className="mt-4 flex items-center gap-3">
            {statusTone.icon}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {statusTone.label}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{statusTone.hint}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone.badge}`}
          >
            {backendSyncStatus?.autoEnabled
              ? `Sincronización automática cada ${backendSyncStatus.autoIntervalSeconds}s`
              : 'Sincronización manual'}
          </span>
          <button
            type="button"
            onClick={() => void handleSyncNow()}
            disabled={!hasBackendConnection || isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            Local {localPendingCount} · Backend {backendPendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Fallidos</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{failedCount}</p>
          <p className="mt-1 text-xs text-amber-800">
            Local {localFailedCount} · Backend {backendFailedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Último intento</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {lastRunAt ?? 'Sin intentos aún'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Runner {backendSyncStatus?.running ? 'ocupado' : 'disponible'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Destino central</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {backendSyncStatus?.remoteBaseUrlConfigured ? 'Configurado' : 'Sin configurar'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {hasInternetConnection ? 'Internet detectado' : 'Sin internet general'}
          </p>
        </div>
      </div>

      {lastSyncError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">Último error de sincronización</p>
          <p className="mt-1">{lastSyncError}</p>
        </div>
      ) : null}
    </section>
  );
}

function ReceptionistHome() {
  return (
    <div className="space-y-8">
      <DesktopSyncCard />

      <section className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Inicio
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Panel operativo listo para tu jornada
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Desde aquí puedes entrar directo a servicios, pacientes, médicos y estudios. El historial,
              los cortes del día y la administración quedan reservados para administración.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Acceso de recepción</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Operación completa</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Puedes trabajar servicios, pacientes, médicos, estudios y resultados sin problema.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Secciones restringidas</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Historial, cortes, roles y logins quedan reservados para administración.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {receptionistShortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="app-panel-surface group rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-100/60"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Acceso rápido</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{shortcut.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{shortcut.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-600">
              Abrir módulo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [adminRoleError, setAdminRoleError] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AdminManagedUser[]>([]);
  const [usersWithRole, setUsersWithRole] = useState<AdminManagedUser[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const requestedRange: DashboardRange =
    searchParams.get('range') === '7d' ||
    searchParams.get('range') === '30d' ||
    searchParams.get('range') === '90d' ||
    searchParams.get('range') === 'custom' ||
    searchParams.get('range') === 'year'
      ? (searchParams.get('range') as DashboardRange)
      : 'today';

  const requestedRole: DashboardRoleFilter =
    searchParams.get('role') === 'admin' ||
    searchParams.get('role') === 'recepcionista'
      ? (searchParams.get('role') as DashboardRoleFilter)
      : 'all';

  const requestedStartDate = isDateInput(searchParams.get('startDate'))
    ? searchParams.get('startDate') ?? undefined
    : undefined;
  const requestedEndDate = isDateInput(searchParams.get('endDate'))
    ? searchParams.get('endDate') ?? undefined
    : undefined;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user || user.rol !== 'admin') {
      setPageLoading(false);
      return;
    }

    let cancelled = false;
    setPageLoading(true);
    setDashboardError(null);
    setAdminRoleError(null);
    const overviewPromise = getDashboardOverview({
      range: requestedRange,
      role: requestedRole,
      startDate: requestedStartDate,
      endDate: requestedEndDate,
    });
    const pendingPromise = getUnassignedUsers();
    const withRolePromise = getUsersWithRole();

    void (async () => {
      const overviewResponse = await overviewPromise;

      if (cancelled) return;

      if (!overviewResponse.ok) {
        setOverview(null);
        setDashboardError(overviewResponse.errors[0] ?? 'No se pudo cargar el panel de inicio.');
        setPendingUsers([]);
        setUsersWithRole([]);
        setAdminRoleError(null);
        setPageLoading(false);
        return;
      }

      setOverview(overviewResponse.data);
      setPageLoading(false);

      const [pendingResponse, withRoleResponse] = await Promise.all([
        pendingPromise,
        withRolePromise,
      ]);

      if (cancelled) return;

      const nextErrors: string[] = [];
      if (!pendingResponse.ok) {
        setPendingUsers([]);
        nextErrors.push(pendingResponse.errors[0] ?? 'No se pudo cargar usuarios pendientes.');
      } else {
        setPendingUsers(pendingResponse.data);
      }

      if (!withRoleResponse.ok) {
        setUsersWithRole([]);
        nextErrors.push(withRoleResponse.errors[0] ?? 'No se pudo cargar usuarios con rol.');
      } else {
        setUsersWithRole(withRoleResponse.data);
      }

      setAdminRoleError(nextErrors.join(' ') || null);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, requestedEndDate, requestedRange, requestedRole, requestedStartDate, user]);

  const topLoginUsers = useMemo(
    () =>
      overview
        ? [...overview.logins.users]
            .sort(
              (left, right) =>
                right.successfulLogins - left.successfulLogins ||
                right.failedLogins - left.failedLogins ||
                left.nombre.localeCompare(right.nombre, 'es-MX'),
            )
            .slice(0, 5)
        : [],
    [overview],
  );

  if (isLoading || (user?.rol === 'admin' && pageLoading)) {
    return <LoadingState />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.rol !== 'admin') {
    return <ReceptionistHome />;
  }

  if (!overview || dashboardError) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
        No se pudo cargar el panel de inicio: {dashboardError ?? 'Error desconocido.'}
      </div>
    );
  }

  const currentStartDate =
    overview.filters.range === 'custom' ? overview.filters.startDate : requestedStartDate ?? '';
  const currentEndDate =
    overview.filters.range === 'custom' ? overview.filters.endDate : requestedEndDate ?? '';
  const strongestBranch = overview.branches.strongestInRange;
  const savedCut = overview.finance.savedTodayCut;

  return (
    <div className="space-y-8">
      <DesktopSyncCard />

      <section className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Inicio
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Tablero principal del laboratorio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Bienvenido, {user.nombre}. Aquí tienes un resumen limpio de operación, demanda y accesos para el periodo activo.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rango activo</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{overview.filters.rangeLabel}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Periodo</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(overview.filters.startDate)} a {formatDate(overview.filters.endDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Corte de hoy</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {savedCut ? money(savedCut.totalAmount) : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Filtros del panel</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(option.value, overview.filters.role)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    overview.filters.range === option.value
                      ? 'bg-white text-slate-900'
                      : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <form action="/home" className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input type="hidden" name="range" value="custom" />
              <input type="hidden" name="role" value={overview.filters.role} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  name="startDate"
                  defaultValue={currentStartDate}
                  className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  type="date"
                  name="endDate"
                  defaultValue={currentEndDate}
                  className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                >
                  Aplicar rango
                </button>
                <Link
                  href={buildHref('today', overview.filters.role)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
                >
                  Limpiar
                </Link>
              </div>
            </form>

            <Link
              href="/historial"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-200 transition-colors hover:text-white"
            >
              Ir a historial y cortes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KPI label="Total de servicios" value={overview.kpis.totalServices} hint="Base historica del laboratorio" icon={<Activity className="h-5 w-5" />} />
        <KPI label="Ingreso del rango" value={money(overview.kpis.revenueInRange)} hint={`Creados: ${overview.kpis.createdServicesInRange}`} icon={<Wallet className="h-5 w-5" />} />
        <KPI label="Médicos activos" value={overview.kpis.totalDoctors} hint={overview.doctors.topInRange?.doctorName ?? 'Sin líder actual'} icon={<UserCheck className="h-5 w-5" />} />
        <KPI label="Pacientes" value={overview.kpis.totalPatients} hint={`Usuarios: ${overview.kpis.totalUsers}`} icon={<Users className="h-5 w-5" />} />
        <KPI label="Estudios activos" value={overview.kpis.activeStudies} hint={overview.studies.topInRange?.studyName ?? 'Sin top actual'} icon={<BarChart3 className="h-5 w-5" />} />
        <KPI label="Logins exitosos" value={overview.logins.successfulInRange} hint={`Fallidos: ${overview.logins.failedInRange}`} icon={<ShieldAlert className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operación</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Pulso operativo</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">Pendientes</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">{overview.kpis.pendingServices}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">En curso</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{overview.kpis.inProgressServices}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-900">Retrasados</p>
                <p className="mt-2 text-3xl font-bold text-rose-900">{overview.kpis.delayedServices}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-900">Concluidos del rango</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{overview.kpis.completedServicesInRange}</p>
              </div>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operación reciente</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Últimos servicios concluidos</h2>
            <div className="mt-5 space-y-3">
              {overview.operations.latestCompletedServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                  Todavía no hay cierres en el rango elegido.
                </div>
              ) : (
                overview.operations.latestCompletedServices.map((service) => (
                  <Link
                    key={service.id}
                    href={buildServiceDetailHref(service.id)}
                    className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition-colors hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{service.patientName}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{service.studySummary}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {money(service.totalAmount)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{service.folio}</span>
                      <span>{formatDateTime(service.completedAt)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Negocio</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Demanda y sucursales</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Más solicitado</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-800">
                      {overview.studies.topInRange?.studyName ?? 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-orange-700" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">Menos solicitado</p>
                    <p className="mt-1 text-lg font-semibold text-orange-800">
                      {overview.studies.bottomInRange?.studyName ?? 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 p-5 text-white">
              <p className="text-sm text-red-100">Sucursal más fuerte del rango</p>
              <p className="mt-2 text-2xl font-semibold">{strongestBranch?.branchName ?? 'Sin datos'}</p>
              <p className="mt-2 text-sm text-red-100">
                {strongestBranch
                  ? `${money(strongestBranch.revenueTotal)} con ${strongestBranch.servicesCount} servicios concluidos.`
                  : 'Todavía no hay servicios concluidos en este rango.'}
              </p>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Usuarios</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Accesos destacados del rango</h2>
            <div className="mt-5 space-y-3">
              {topLoginUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                  Sin actividad para este rango.
                </div>
              ) : (
                topLoginUsers.map((account, index) => (
                  <div key={`${account.id}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{index + 1}. {account.nombre}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{account.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {account.successfulLogins}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <AdminControlCenter
        currentUserId={user.id}
        rangeLabel={overview.filters.rangeLabel}
        adminUsers={overview.kpis.adminUsers}
        receptionistUsers={overview.kpis.receptionistUsers}
        loginSummary={overview.logins}
        initialUnassignedUsers={pendingUsers}
        initialUsersWithRole={usersWithRole}
        initialError={adminRoleError}
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <UserCheck className="mt-0.5 h-4 w-4 text-blue-700" />
          <p>
            En <span className="font-semibold">{overview.filters.rangeLabel.toLowerCase()}</span>{' '}
            se concluyeron <span className="font-semibold">{overview.kpis.completedServicesInRange}</span>{' '}
            servicios y se registraron <span className="font-semibold">{overview.kpis.createdServicesInRange}</span>.
            Si la creación sube pero la conclusión se frena, conviene revisar capacidad y tiempos de entrega.
          </p>
        </div>
      </div>
    </div>
  );
}
