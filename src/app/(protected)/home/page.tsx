import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { getDashboardOverview } from '@/actions/dashboard/dashboardActions';
import {
  getUnassignedUsersAction,
  getUsersWithRoleAction,
} from '@/actions/users/adminUsersActions';
import { verifySession } from '@/auth/dal';
import AdminControlCenter from '@/components/home/AdminControlCenter';
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
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '1 mes' },
  { value: '90d', label: '3 meses' },
  { value: 'year', label: '1 ano' },
] as const;

const receptionistShortcuts = [
  {
    href: '/servicios',
    title: 'Servicios',
    description: 'Registra servicios, da seguimiento y captura resultados.',
  },
  {
    href: '/pacientes',
    title: 'Pacientes',
    description: 'Consulta expedientes y registra nuevos pacientes.',
  },
  {
    href: '/medicos',
    title: 'Medicos',
    description: 'Busca medicos tratantes y actualiza sus datos.',
  },
  {
    href: '/estudios',
    title: 'Estudios',
    description: 'Revisa el catalogo disponible para nuevos servicios.',
  },
  {
    href: '/perfil',
    title: 'Mi perfil',
    description: 'Consulta tu informacion y cambia tu contrasena si hace falta.',
  },
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
  const { user } = await verifySession();

  if (user.rol !== 'admin') {
    return (
      <div className="space-y-8">
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
                Desde aqui puedes entrar directo a servicios, pacientes, medicos y estudios. El historial,
                los cortes del dia, las graficas y los logins quedan reservados para administracion.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
              <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Acceso de recepcion</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Operacion completa</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Puedes trabajar servicios, pacientes, medicos, estudios y resultados sin problema.
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
                        No se muestran historial, cortes del dia, graficas, logins ni asignacion de roles.
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Acceso rapido</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{shortcut.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{shortcut.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                Abrir modulo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </section>
      </div>
    );
  }

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

  const overviewResponse = await getDashboardOverview({
    range: requestedRange,
    role: requestedRole,
    startDate: requestedStartDate,
    endDate: requestedEndDate,
  });

  const adminUserResponses = await Promise.all([
    getUnassignedUsersAction(),
    getUsersWithRoleAction(),
  ]);

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
  const pendingUsersResponse = adminUserResponses[0];
  const usersWithRoleResponse = adminUserResponses[1];
  const adminRoleErrors: string[] = [];

  if (!pendingUsersResponse.ok) {
    adminRoleErrors.push(pendingUsersResponse.errors[0] ?? 'No se pudo cargar usuarios pendientes.');
  }

  if (!usersWithRoleResponse.ok) {
    adminRoleErrors.push(usersWithRoleResponse.errors[0] ?? 'No se pudo cargar usuarios con rol.');
  }

  const adminRoleError = adminRoleErrors.join(' ');
  const currentStartDate =
    overview.filters.range === 'custom' ? overview.filters.startDate : requestedStartDate ?? '';
  const currentEndDate =
    overview.filters.range === 'custom' ? overview.filters.endDate : requestedEndDate ?? '';
  const openServicesCount =
    overview.kpis.pendingServices +
    overview.kpis.inProgressServices +
    overview.kpis.delayedServices;
  const operationCards = [
    {
      label: 'Pendientes',
      value: overview.kpis.pendingServices,
      note: 'Esperan toma o seguimiento',
      barClass: 'bg-amber-500',
      surfaceClass: 'border-amber-200 bg-amber-50',
      textClass: 'text-amber-900',
    },
    {
      label: 'En curso',
      value: overview.kpis.inProgressServices,
      note: 'Se estan procesando',
      barClass: 'bg-blue-500',
      surfaceClass: 'border-blue-200 bg-blue-50',
      textClass: 'text-blue-900',
    },
    {
      label: 'Retrasados',
      value: overview.kpis.delayedServices,
      note: 'Conviene revisar entrega',
      barClass: 'bg-rose-500',
      surfaceClass: 'border-rose-200 bg-rose-50',
      textClass: 'text-rose-900',
    },
    {
      label: 'Concluidos del rango',
      value: overview.kpis.completedServicesInRange,
      note: 'Servicios ya cerrados',
      barClass: 'bg-emerald-500',
      surfaceClass: 'border-emerald-200 bg-emerald-50',
      textClass: 'text-emerald-900',
    },
  ] as const;
  const maxOperationValue =
    Math.max(...operationCards.map((card) => card.value), 1) || 1;
  const topLoginUsers = [...overview.logins.users]
    .sort(
      (left, right) =>
        right.successfulLogins - left.successfulLogins ||
        right.failedLogins - left.failedLogins ||
        left.nombre.localeCompare(right.nombre, 'es-MX'),
    )
    .slice(0, 5);
  const topUsersWithIssues = [...overview.logins.users]
    .filter((user) => user.failedLogins > 0)
    .sort(
      (left, right) =>
        right.failedLogins - left.failedLogins ||
        right.successfulLogins - left.successfulLogins ||
        left.nombre.localeCompare(right.nombre, 'es-MX'),
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
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
              Bienvenido, {user.nombre}. Aqui tienes un resumen limpio de operacion, demanda y accesos para el periodo activo.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rango activo</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {overview.filters.rangeLabel}
                </p>
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

            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Rango de analisis
              </p>
              <div className="flex flex-wrap gap-2">
                {rangeOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={buildHref(option.value, overview.filters.role)}
                    className={`app-chip-button rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
                  className={`app-chip-button rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
                    className="app-action-button rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
                  >
                    Aplicar rango
                  </button>
                  <Link
                    href={buildHref('today', overview.filters.role)}
                    className="app-action-button rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
                  >
                    Limpiar
                  </Link>
                </div>
              </form>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">
                {savedCut ? 'Corte del dia disponible' : 'Corte del dia pendiente'}
              </p>
              <p className="mt-2">
                {savedCut
                  ? `El ultimo corte guardado suma ${money(savedCut.totalAmount)} y se actualizo el ${formatDateTime(savedCut.updatedAt)}.`
                  : 'Todavia no se ha guardado el corte del dia. Puedes revisarlo desde Historial cuando cierre la jornada.'}
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de servicios</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.totalServices}
              </p>
              <p className="mt-2 text-xs text-gray-500">Base historica del laboratorio</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Medicos activos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.totalDoctors}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {overview.doctors.topInRange
                  ? `${overview.doctors.topInRange.doctorName} lidera este periodo`
                  : 'Sin medicos con movimiento en este rango'}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes activos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.totalPatients}
              </p>
              <p className="mt-2 text-xs text-gray-500">Base actual de expedientes disponibles</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Estudios activos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{overview.kpis.activeStudies}</p>
              <p className="mt-2 text-xs text-gray-500">
                {overview.studies.topInRange
                  ? `${overview.studies.topInRange.studyName} es el mas solicitado`
                  : 'Sin demanda suficiente en el rango actual'}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingreso del rango</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {money(overview.kpis.revenueInRange)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {overview.kpis.completedServicesInRange} concluidos en el rango
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios del dia</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {overview.kpis.createdServicesToday}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {overview.kpis.completedServicesToday} concluidos hoy
              </p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <AdminControlCenter
          currentUserId={user.id}
          rangeLabel={overview.filters.rangeLabel}
          adminUsers={overview.kpis.adminUsers}
          receptionistUsers={overview.kpis.receptionistUsers}
          loginSummary={overview.logins}
          initialUnassignedUsers={pendingUsersResponse.ok ? pendingUsersResponse.data : []}
          initialUsersWithRole={usersWithRoleResponse.ok ? usersWithRoleResponse.data : []}
          initialError={adminRoleError || null}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operacion</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Radar operativo</h2>
              <p className="mt-2 text-sm text-gray-600">
                Lo que mas conviene revisar primero para que la jornada no se atore. Hay{' '}
                {openServicesCount} servicios abiertos en este momento.
              </p>
            </div>
            <Clock3 className="h-6 w-6 text-slate-700" />
          </div>

          <div className="mt-6 space-y-4">
            {operationCards.map((card) => {
              const width = Math.max(10, (card.value / maxOperationValue) * 100);

              return (
                <div
                  key={card.label}
                  className={`rounded-[1.75rem] border p-5 ${card.surfaceClass}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`text-sm font-semibold ${card.textClass}`}>{card.label}</p>
                      <p className={`mt-1 text-3xl font-bold ${card.textClass}`}>{card.value}</p>
                    </div>
                    <p className={`text-sm ${card.textClass}`}>{card.note}</p>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-white/80">
                    <div
                      className={`h-3 rounded-full ${card.barClass}`}
                      style={{ width: `${Math.min(100, width)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estadisticas</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Resumen del periodo</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Sucursal mas fuerte</p>
                <p className="mt-2 text-lg font-semibold text-emerald-800">
                  {strongestBranch?.branchName ?? 'Sin datos'}
                </p>
                <p className="mt-2 text-sm text-emerald-800">
                  {strongestBranch
                    ? `${money(strongestBranch.revenueTotal)} con ${strongestBranch.servicesCount} servicios concluidos.`
                    : 'Todavia no hay servicios concluidos en este rango.'}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-900">Estudio mas solicitado</p>
                <p className="mt-2 text-lg font-semibold text-orange-800">
                  {overview.studies.topInRange?.studyName ?? 'Sin datos'}
                </p>
                <p className="mt-2 text-sm text-orange-800">
                  {overview.studies.topInRange
                    ? `${overview.studies.topInRange.times} solicitudes dentro del rango activo.`
                    : 'Todavia no hay solicitudes suficientes para detectar demanda.'}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Estudio menos solicitado</p>
                <p className="mt-2 text-lg font-semibold text-amber-800">
                  {overview.studies.bottomInRange?.studyName ?? 'Sin datos'}
                </p>
                <p className="mt-2 text-sm text-amber-800">
                  {overview.studies.bottomInRange
                    ? `${overview.studies.bottomInRange.times} solicitud${overview.studies.bottomInRange.times === 1 ? '' : 'es'} dentro del rango.`
                    : 'Todavia no hay datos suficientes para detectar minimos.'}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Ingreso de hoy</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {money(overview.kpis.todayRevenue)}
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  {savedCut
                    ? `Corte guardado por ${money(savedCut.totalAmount)}`
                    : 'Aun sin corte guardado hoy'}
                </p>
              </div>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Actividad</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">Usuarios operativos</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Aqui puedes revisar la actividad de admins y recepcionistas, que son quienes operan el sistema y capturan servicios.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Usuarios con mas logins</p>
                <div className="mt-4 space-y-3">
                  {topLoginUsers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-4 text-sm text-blue-800">
                      No hay accesos suficientes en este periodo.
                    </div>
                  ) : (
                    topLoginUsers.map((account, index) => (
                      <div
                        key={account.id}
                        className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {index + 1}. {account.nombre}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">{account.email}</p>
                          </div>
                          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                            {account.successfulLogins}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Usuarios con mas incidencias</p>
                <div className="mt-4 space-y-3">
                  {topUsersWithIssues.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-4 text-sm text-emerald-800">
                      No hubo intentos fallidos relevantes en este periodo.
                    </div>
                  ) : (
                    topUsersWithIssues.map((account, index) => (
                      <div
                        key={`${account.id}-${index}`}
                        className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {index + 1}. {account.nombre}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">{account.email}</p>
                          </div>
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                            {account.failedLogins}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr]">
        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estudios</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Demanda clinica dentro del rango
              </h2>
            </div>
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Mas solicitado</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800">
                    {overview.studies.topInRange?.studyName ?? 'Sin datos'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-emerald-800">
                {overview.studies.topInRange
                  ? `${overview.studies.topInRange.times} solicitudes dentro del rango activo.`
                  : 'Todavia no hay registros para este periodo.'}
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
                  : 'Aun no hay suficiente movimiento para detectar minimos.'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overview.studies.rankingInRange.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay ranking de estudios para este rango todavia.
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

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operacion</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">Pulso operativo</h2>

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
              <p className="text-sm text-gray-600">Retrasados</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {overview.kpis.delayedServices}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 p-5 text-white">
            <p className="text-sm text-red-100">Sucursal mas fuerte del rango</p>
            <p className="mt-2 text-2xl font-semibold">
              {strongestBranch?.branchName ?? 'Sin datos'}
            </p>
            <p className="mt-2 text-sm text-red-100">
              {strongestBranch
                ? `${money(strongestBranch.revenueTotal)} con ${strongestBranch.servicesCount} servicios concluidos.`
                : 'Todavia no hay servicios concluidos en este rango.'}
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

      <section className="grid gap-6 xl:grid-cols-[1fr]">
        <div className="hidden app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Tendencia</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Ganancias del rango
          </h2>

          <div className="mt-8 space-y-4">
            {overview.trends.revenueSeries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                Aun no hay datos concluidos para construir una tendencia.
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
                        {money(item.revenueTotal)}  -  {item.servicesCount} servicios
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

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
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

          <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1 scroll-panel">
            {overview.logins.users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay usuarios para el filtro seleccionado.
              </div>
            ) : (
              overview.logins.users.map((account) => (
                <div
                  key={account.id}
                  className="app-panel-surface rounded-2xl border border-gray-200 bg-white px-4 py-4"
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr]">
        <div className="hidden app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Accesos recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Ultimos movimientos de login
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
                  className="app-panel-surface rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
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

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Operacion reciente</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Ultimos servicios concluidos
          </h2>

          <div className="mt-5 max-h-[24rem] space-y-3 overflow-y-auto pr-2 scroll-panel">
            {overview.operations.latestCompletedServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                Todavia no hay cierres en el rango elegido.
              </div>
            ) : (
              overview.operations.latestCompletedServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/servicios/detalle/${service.id}`}
                  className="app-panel-surface block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition-colors hover:bg-white"
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

          <div className="hidden mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-4 w-4 text-blue-700" />
              <p>
                En <span className="font-semibold">{overview.filters.rangeLabel.toLowerCase()}</span> hubo{' '}
                <span className="font-semibold">{overview.logins.successfulInRange}</span> accesos exitosos y{' '}
                <span className="font-semibold">{overview.logins.failedInRange}</span> fallidos. Si el fallo crece junto con cancelaciones, conviene revisar operacion y capacitacion.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-4 w-4 text-blue-700" />
              <p>
                En <span className="font-semibold">{overview.filters.rangeLabel.toLowerCase()}</span>{' '}
                se concluyeron <span className="font-semibold">{overview.kpis.completedServicesInRange}</span>{' '}
                servicios y se registraron <span className="font-semibold">{overview.kpis.createdServicesInRange}</span>. Si la creacion sube pero la conclusion se frena, conviene revisar capacidad y tiempos de entrega.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



