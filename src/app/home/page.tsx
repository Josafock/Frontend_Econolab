import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { getDashboardOverview } from '@/actions/dashboard/dashboardActions';
import {
  getUnassignedUsersAction,
  getUsersWithRoleAction,
} from '@/actions/users/adminUsersActions';
import { verifySession } from '@/auth/dal';
import AdminRoleManager from '@/components/home/AdminRoleManager';
import { formatDate, formatDateTime } from '@/helpers/date';

type HomePageProps = {
  searchParams?: Promise<{
    range?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

function isDateInput(value?: string): value is string {
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

const roleOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admins' },
  { value: 'recepcionista', label: 'Recepcionistas' },
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedRange =
    resolvedSearchParams?.range === '7d' ||
    resolvedSearchParams?.range === '30d' ||
    resolvedSearchParams?.range === '90d' ||
    resolvedSearchParams?.range === 'custom' ||
    resolvedSearchParams?.range === 'year'
      ? resolvedSearchParams.range
      : 'today';
  const requestedRole =
    resolvedSearchParams?.role === 'admin' ||
    resolvedSearchParams?.role === 'recepcionista'
      ? resolvedSearchParams.role
      : 'all';
  const requestedStartDate = isDateInput(resolvedSearchParams?.startDate)
    ? resolvedSearchParams.startDate
    : undefined;
  const requestedEndDate = isDateInput(resolvedSearchParams?.endDate)
    ? resolvedSearchParams.endDate
    : undefined;

  const [{ user }, overviewResponse] = await Promise.all([
    verifySession(),
    getDashboardOverview({
      range: requestedRange,
      role: requestedRole,
      startDate: requestedStartDate,
      endDate: requestedEndDate,
    }),
  ]);

  const adminUserResponses =
    user.rol === 'admin'
      ? await Promise.all([getUnassignedUsersAction(), getUsersWithRoleAction()])
      : null;

  if (!overviewResponse.ok) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
        No se pudo cargar el panel de inicio: {overviewResponse.errors[0] ?? 'Error desconocido.'}
      </div>
    );
  }

  const overview = overviewResponse.data;
  const strongestBranch = overview.branches.strongestInRange;
  const savedCut = overview.finance.savedTodayCut;
  const maxTrendRevenue =
    Math.max(...overview.trends.revenueSeries.map((item) => item.revenueTotal), 1) || 1;
  const pendingUsersResponse = adminUserResponses?.[0];
  const usersWithRoleResponse = adminUserResponses?.[1];
  const adminRoleErrors: string[] = [];

  if (pendingUsersResponse && !pendingUsersResponse.ok) {
    adminRoleErrors.push(pendingUsersResponse.errors[0] ?? 'No se pudo cargar usuarios pendientes.');
  }

  if (usersWithRoleResponse && !usersWithRoleResponse.ok) {
    adminRoleErrors.push(usersWithRoleResponse.errors[0] ?? 'No se pudo cargar usuarios con rol.');
  }

  const adminRoleError = adminRoleErrors.join(' ');
  const currentStartDate =
    overview.filters.range === 'custom' ? overview.filters.startDate : requestedStartDate ?? '';
  const currentEndDate =
    overview.filters.range === 'custom' ? overview.filters.endDate : requestedEndDate ?? '';

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] border border-red-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(255,245,235,0.92)_35%,_rgba(254,215,170,0.92)_100%)] shadow-xl shadow-orange-200/40">
        <div className="grid gap-6 p-8 xl:grid-cols-[1.35fr_0.95fr] xl:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-red-700">
              <Sparkles className="h-3.5 w-3.5" />
              Inicio
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Bienvenido, {user.nombre}. Aquí vive el pulso financiero y operativo del laboratorio.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              {overview.welcome.subtitle}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rango activo</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {overview.filters.rangeLabel}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Periodo</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(overview.filters.startDate)} a {formatDate(overview.filters.endDate)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Corte de hoy</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {savedCut ? money(savedCut.totalAmount) : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Filtros del panel</p>

            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Rango de análisis
              </p>
              <div className="flex flex-wrap gap-2">
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
                <Link
                  href={buildHref('custom', overview.filters.role, {
                    startDate: currentStartDate || overview.filters.startDate,
                    endDate: currentEndDate || overview.filters.endDate,
                  })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    overview.filters.range === 'custom'
                      ? 'bg-white text-slate-900'
                      : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  Personalizado
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <CalendarRange className="h-4 w-4" />
                Rango personalizado
              </div>
              <form action="/home" className="mt-4 grid gap-3">
                <input type="hidden" name="range" value="custom" />
                <input type="hidden" name="role" value={overview.filters.role} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs text-slate-300">
                    <span>Desde</span>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={currentStartDate}
                      className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-300"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs text-slate-300">
                    <span>Hasta</span>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={currentEndDate}
                      className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-300"
                    />
                  </label>
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
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Usuarios visibles
              </p>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={buildHref(overview.filters.range, option.value, {
                      startDate:
                        overview.filters.range === 'custom' ? overview.filters.startDate : undefined,
                      endDate:
                        overview.filters.range === 'custom' ? overview.filters.endDate : undefined,
                    })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      overview.filters.role === option.value
                        ? 'bg-emerald-400 text-slate-950'
                        : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">
                {savedCut ? 'Corte del dia disponible' : 'Corte del dia pendiente'}
              </p>
              <p className="mt-2">
                {savedCut
                  ? `El ultimo corte guardado suma ${money(savedCut.totalAmount)} y se actualizo el ${formatDateTime(savedCut.updatedAt)}.`
                  : 'Todavia no se ha guardado el corte del dia. Puedes hacerlo desde Historial cuando cierre la jornada.'}
              </p>
              <Link
                href="/historial"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-200 transition-colors hover:text-white"
              >
                Ir a historial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {user.rol === 'admin' ? (
        <AdminRoleManager
          currentUserId={user.id}
          initialUnassignedUsers={pendingUsersResponse?.ok ? pendingUsersResponse.data : []}
          initialUsersWithRole={usersWithRoleResponse?.ok ? usersWithRoleResponse.data : []}
          initialError={adminRoleError || null}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ganancia del rango</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {money(overview.kpis.revenueInRange)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluidos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.completedServicesInRange}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Creados</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.createdServicesInRange}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket promedio</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {money(overview.kpis.averageTicket)}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Logins fallidos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.logins.failedInRange}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estudios</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Demanda clínica dentro del rango
              </h2>
            </div>
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>

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
              <p className="mt-4 text-sm text-emerald-800">
                {overview.studies.topInRange
                  ? `${overview.studies.topInRange.times} solicitudes dentro del rango activo.`
                  : 'Todavía no hay registros para este periodo.'}
              </p>
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
              <p className="mt-4 text-sm text-orange-800">
                {overview.studies.bottomInRange
                  ? `${overview.studies.bottomInRange.times} solicitud${overview.studies.bottomInRange.times === 1 ? '' : 'es'} en el rango.`
                  : 'Aún no hay suficiente movimiento para detectar mínimos.'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overview.studies.rankingInRange.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay ranking de estudios para este rango todavía.
              </div>
            ) : (
              overview.studies.rankingInRange.map((study, index) => (
                <div
                  key={`${study.studyName}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-900">{study.studyName}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {study.times}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operación</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">Pulso actual del sistema</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{overview.kpis.pendingServices}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">En curso</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{overview.kpis.inProgressServices}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Cancelados en rango</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {overview.kpis.cancelledServicesInRange}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Usuarios únicos con login</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {overview.logins.uniqueUsersInRange}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 p-5 text-white">
            <p className="text-sm text-red-100">Sucursal más fuerte del rango</p>
            <p className="mt-2 text-2xl font-semibold">
              {strongestBranch?.branchName ?? 'Sin datos'}
            </p>
            <p className="mt-2 text-sm text-red-100">
              {strongestBranch
                ? `${money(strongestBranch.revenueTotal)} con ${strongestBranch.servicesCount} servicios concluidos.`
                : 'Todavía no hay servicios concluidos en este rango.'}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {overview.branches.breakdownInRange.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                Sin datos de sucursales para el rango seleccionado.
              </div>
            ) : (
              overview.branches.breakdownInRange.map((branch) => (
                <div
                  key={branch.branchName}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{branch.branchName}</p>
                    <p className="mt-1 text-xs text-gray-500">{branch.servicesCount} servicios</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {money(branch.revenueTotal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Tendencia</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Ganancias del rango
          </h2>

          <div className="mt-8 space-y-4">
            {overview.trends.revenueSeries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                Aún no hay datos concluidos para construir una tendencia.
              </div>
            ) : (
              overview.trends.revenueSeries.map((item) => {
                const width = Math.max(10, (item.revenueTotal / maxTrendRevenue) * 100);

                return (
                  <div key={item.key}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-gray-900">
                        {item.key.length === 7 ? item.key : formatDate(item.key)}
                      </span>
                      <span className="text-gray-600">
                        {money(item.revenueTotal)} · {item.servicesCount} servicios
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500"
                        style={{ width: `${Math.min(100, width)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Usuarios</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Admins y recepcionistas con sus logins
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Admins</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {overview.kpis.adminUsers}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Recepcionistas</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {overview.kpis.receptionistUsers}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Logins exitosos</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {overview.logins.successfulInRange}
              </p>
            </div>
          </div>

          <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {overview.logins.users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay usuarios para el filtro seleccionado.
              </div>
            ) : (
              overview.logins.users.map((account) => (
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
                      {account.rol === 'admin' ? 'Admin' : 'Recepcionista'}
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

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Último login:{' '}
                      {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : 'Sin login'}
                    </span>
                    <span>
                      Último intento:{' '}
                      {account.lastAttemptAt ? formatDateTime(account.lastAttemptAt) : 'Sin intentos'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Accesos recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Últimos movimientos de login
          </h2>

          <div className="mt-5 max-h-[24rem] space-y-3 overflow-y-auto pr-2 scroll-panel">
            {overview.logins.recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay actividad de acceso registrada.
              </div>
            ) : (
              overview.logins.recent.map((login) => (
                <div
                  key={login.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {login.userName ?? login.email ?? 'Acceso sin identificar'}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">{login.email ?? 'Sin correo'}</p>
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
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDateTime(login.createdAt)}</span>
                    <span>{login.ip ?? 'Sin IP'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operación reciente</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Últimos servicios concluidos
          </h2>

          <div className="mt-5 max-h-[24rem] space-y-3 overflow-y-auto pr-2 scroll-panel">
            {overview.operations.latestCompletedServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                Todavía no hay cierres en el rango elegido.
              </div>
            ) : (
              overview.operations.latestCompletedServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/servicios/detalle/${service.id}`}
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

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-4 w-4 text-blue-700" />
              <p>
                En <span className="font-semibold">{overview.filters.rangeLabel.toLowerCase()}</span> hubo{' '}
                <span className="font-semibold">{overview.logins.successfulInRange}</span> accesos exitosos y{' '}
                <span className="font-semibold">{overview.logins.failedInRange}</span> fallidos. Si el fallo crece junto con cancelaciones, conviene revisar operación y capacitación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
