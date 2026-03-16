'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  generateDailyCut,
  getHistoryDashboard,
  type HistoryDashboardResponse,
} from '@/actions/history/historyActions';
import { formatDate, formatDateTime } from '@/helpers/date';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function getTodayInputValue() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function money(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default function HistorialPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingCut, setGeneratingCut] = useState(false);
  const [dashboard, setDashboard] = useState<HistoryDashboardResponse | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  useEffect(() => {
    const today = getTodayInputValue();
    setSelectedDate((current) => (current === today ? current : today));
  }, []);

  const loadDashboard = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      const response = await getHistoryDashboard({
        date: selectedDate,
        search: debouncedSearch || undefined,
      });

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo cargar el historial.');
        setDashboard(null);
        setLoading(false);
        return;
      }

      setDashboard(response.data);
      setLoading(false);
    },
    [debouncedSearch, selectedDate],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleGenerateCut = async () => {
    setGeneratingCut(true);
    const response = await generateDailyCut(selectedDate);

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo generar el corte del dia.');
      setGeneratingCut(false);
      return;
    }

    toast.success('Corte del dia guardado correctamente.');
    await loadDashboard({ silent: true });
    setGeneratingCut(false);
  };

  const summary = dashboard?.summary;
  const completedServices = dashboard?.services ?? [];
  const savedCut = dashboard?.savedCut;
  const recentCuts = dashboard?.recentCuts ?? [];
  const totalSummaryAmount = summary?.totalAmount ?? 0;

  const strongestBranch = useMemo(() => {
    return summary?.branchBreakdown?.[0] ?? null;
  }, [summary]);

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Historial y corte diario
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Historial</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Consulta solo los servicios concluidos por fecha, genera el corte del dia y conserva el historial de cierres para auditoria.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => void handleGenerateCut()}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
            disabled={generatingCut || loading}
          >
            {generatingCut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Guardar corte del dia
          </button>

          {savedCut ? (
            <a
              href={`/api/history/daily-cuts/${savedCut.id}/export`}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </a>
          ) : null}
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-emerald-50/70 to-white px-6 py-5">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha del historial
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Buscar concluidos
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por folio, paciente o estudio..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Fecha activa</p>
              <p className="mt-1">{formatDate(selectedDate)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingreso del dia</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {money(summary?.totalAmount ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Servicios concluidos</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {summary?.servicesCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes atendidos</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {summary?.patientsCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket promedio</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {money(summary?.averageTicket ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sucursal fuerte</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {strongestBranch?.branchName ?? 'Sin datos'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {money(strongestBranch?.revenueTotal ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-10 text-gray-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando historial del dia...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Servicios concluidos del dia
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Solo aparecen servicios con estatus concluido para la fecha seleccionada.
                </p>
              </div>

              {completedServices.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No hay servicios concluidos para esta fecha.
                </div>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-[1.7fr_1.9fr_1.8fr_1.2fr_1fr_0.8fr_0.9fr_auto] gap-5 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
                      <div>Folio</div>
                      <div>Estudios</div>
                      <div>Paciente</div>
                      <div>Concluido</div>
                      <div>Sucursal</div>
                      <div>Desc.</div>
                      <div>Total</div>
                      <div className="text-right">Detalle</div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {completedServices.map((service) => (
                        <div
                          key={service.id}
                          className="grid grid-cols-[1.7fr_1.9fr_1.8fr_1.2fr_1fr_0.8fr_0.9fr_auto] items-start gap-5 px-6 py-5 hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <span className="inline-flex max-w-full break-all rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold leading-tight text-gray-700">
                              {service.folio}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold leading-5 text-gray-900">
                              {service.estudio}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-gray-900">
                              {service.paciente}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">Tel. {service.telefono}</p>
                          </div>
                          <div className="min-w-0 text-sm leading-5 text-gray-700">
                            {formatDateTime(service.fechaConclusion)}
                          </div>
                          <div>
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {service.sucursal}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-rose-700">
                            {money(service.discountAmount)}
                          </div>
                          <div>
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {money(service.totalAmount)}
                            </span>
                          </div>
                          <div className="text-right">
                            <Link
                              href={`/servicios/detalle/${service.id}`}
                              className="inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              Ver
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 lg:hidden">
                    {completedServices.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-3xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {service.folio}
                            </p>
                            <h3 className="mt-3 text-sm font-semibold text-gray-900">
                              {service.estudio}
                            </h3>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {money(service.totalAmount)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-gray-500">Paciente</p>
                            <p className="mt-1 font-semibold text-gray-900">{service.paciente}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-xs text-gray-500">Concluido</p>
                            <p className="mt-1 font-semibold text-gray-900">
                              {formatDateTime(service.fechaConclusion)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                          <p className="text-xs text-gray-500">{service.sucursal}</p>
                          <Link
                            href={`/servicios/detalle/${service.id}`}
                            className="inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Ver detalle
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Historial de cortes guardados
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cada corte se conserva por fecha y puede exportarse nuevamente cuando se necesite.
                </p>
              </div>

              {recentCuts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Todavia no hay cortes guardados.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentCuts.map((cut) => (
                    <div
                      key={cut.id}
                      className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            Corte del {formatDate(cut.closingDate)}
                          </p>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {cut.servicesCount} servicios
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Ultima actualizacion: {formatDateTime(cut.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                          {money(cut.totalAmount)}
                        </div>
                        <a
                          href={`/api/history/daily-cuts/${cut.id}/export`}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          Exportar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                  Corte del dia
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {money(summary?.totalAmount ?? 0)}
                </h2>
                <p className="mt-2 text-sm text-emerald-100">
                  Resultado estimado de los servicios concluidos el {formatDate(selectedDate)}.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Subtotal</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {money(summary?.subtotalAmount ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Descuentos</p>
                    <p className="mt-2 text-lg font-semibold text-rose-700">
                      {money(summary?.discountAmount ?? 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">Sucursales del dia</p>
                  <div className="mt-3 space-y-3">
                    {(summary?.branchBreakdown ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                        Sin movimientos para esta fecha.
                      </div>
                    ) : (
                      summary?.branchBreakdown.map((branch) => (
                        <div
                          key={branch.branchName}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {branch.branchName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {branch.servicesCount} servicios
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-emerald-700">
                              {money(branch.revenueTotal)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">Estudios mas frecuentes</p>
                  <div className="mt-3 space-y-3">
                    {(summary?.topStudies ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                        Aun no hay datos suficientes.
                      </div>
                    ) : (
                      summary?.topStudies.map((study, index) => (
                        <div
                          key={`${study.studyName}-${index}`}
                          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3"
                        >
                          <p className="text-sm font-medium text-gray-900">{study.studyName}</p>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {study.times}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">
                    {savedCut ? 'Corte guardado' : 'Corte pendiente de guardar'}
                  </p>
                  <p className="mt-2">
                    {savedCut
                      ? `Se guardo por ultima vez el ${formatDateTime(savedCut.updatedAt)} y ya puede exportarse en CSV compatible con Excel.`
                      : 'Genera el corte del dia para conservar un snapshot del ingreso y su desglose.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Ritmo del dia</h2>
              <p className="mt-1 text-sm text-gray-500">
                Distribucion de servicios concluidos por hora.
              </p>

              <div className="mt-4 space-y-3">
                    {(summary?.hourlyBreakdown ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    Sin cierres registrados para esta fecha.
                  </div>
                ) : (
                  summary?.hourlyBreakdown.map((item) => {
                    const ratio =
                      totalSummaryAmount > 0
                        ? (item.revenueTotal / totalSummaryAmount) * 100
                        : 0;

                    return (
                      <div key={item.hour} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{item.hour}</span>
                          <span className="text-gray-600">
                            {item.servicesCount} servicios · {money(item.revenueTotal)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Math.max(ratio, 6))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
