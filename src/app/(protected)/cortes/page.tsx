"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FlaskConical,
  Loader2,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  deleteDailyCut,
  generateDailyCut,
  getDailyCutById,
  getDailyCutsOverview,
  getHistoryDashboard,
  type DailyCutRecord,
  type DailyCutServiceSnapshot,
  type DailyCutsOverviewResponse,
  type HistoryDashboardResponse,
} from "@/features/history/api/history";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { formatDate, formatDateTime } from "@/helpers/date";
import { useOffline } from "@/lib/offline/network-state";
import {
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from "@/lib/offline/offline-store";

function getTodayInputValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function shiftInputDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getMonthStartInputValue(value: string) {
  const [year, month] = value.split("-");
  return `${year}-${month}-01`;
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function getRangeLabel(fromDate: string, toDate: string) {
  if (fromDate === toDate) {
    return formatDate(fromDate);
  }

  return `${formatDate(fromDate)} al ${formatDate(toDate)}`;
}

function getCutDayIndicator(date: string) {
  const today = getTodayInputValue();
  const yesterday = shiftInputDate(today, -1);

  if (date === today) {
    return {
      label: "Hoy",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (date === yesterday) {
    return {
      label: "Ayer",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Personalizado",
    className: "bg-sky-100 text-sky-700",
  };
}

function formatExcelDate(value?: string | null) {
  return value ? formatDate(value) : "N/D";
}

function formatExcelDateTime(value?: string | null) {
  return value ? formatDateTime(value) : "N/D";
}

function formatExcelPercent(value: number, total: number) {
  if (!total) return "0.00%";
  return `${((value / total) * 100).toFixed(2)}%`;
}

function inferStudiesCountFromSummary(summary?: string | null) {
  if (!summary?.trim()) {
    return 0;
  }

  return summary
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((total, segment) => {
      if (segment.includes(":")) {
        const studiesPart = segment.split(":").slice(1).join(":");
        const studies = studiesPart
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean).length;
        return total + Math.max(studies, 1);
      }

      return total + 1;
    }, 0);
}

function formatStudySummaryForCard(summary?: string | null) {
  if (!summary?.trim()) {
    return "Sin estudios";
  }

  return summary
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" • ");
}

function buildCutsOverviewSnapshotKey(fromDate: string, toDate: string) {
  return `cuts:overview:${fromDate}:${toDate}`;
}

function buildCutsDetailSnapshotKey(date: string, mode: "saved" | "live") {
  return `cuts:detail:${date}:${mode}`;
}

function buildExecutiveSummaryRows(
  summary:
    | HistoryDashboardResponse["summary"]
    | Pick<
        DailyCutRecord,
        | "servicesCount"
        | "patientsCount"
        | "studiesCount"
        | "subtotalAmount"
        | "discountAmount"
        | "totalAmount"
        | "branchBreakdown"
        | "topStudies"
      >,
) {
  const strongestBranch = summary.branchBreakdown[0];
  const strongestStudy = summary.topStudies[0];

  return [
    { Concepto: "Servicios concluidos", Valor: summary.servicesCount },
    { Concepto: "Pacientes atendidos", Valor: summary.patientsCount },
    { Concepto: "Estudios procesados", Valor: summary.studiesCount },
    { Concepto: "Subtotal del dia", Valor: money(summary.subtotalAmount) },
    { Concepto: "Descuentos aplicados", Valor: money(summary.discountAmount) },
    { Concepto: "Ingreso total del dia", Valor: money(summary.totalAmount) },
    {
      Concepto: "Sucursal con mayor ingreso",
      Valor: strongestBranch
        ? `${strongestBranch.branchName} (${money(strongestBranch.revenueTotal)})`
        : "Sin movimientos",
    },
    {
      Concepto: "Estudio mas solicitado",
      Valor: strongestStudy
        ? `${strongestStudy.studyName} (${strongestStudy.times} solicitudes)`
        : "Sin datos",
    },
  ];
}

function buildDailyCutWorkbook(cut: DailyCutRecord) {
  return [
    {
      name: "Control del corte",
      rows: [
        {
          Seccion: "Corte",
          Dato: "Fecha del corte",
          Valor: formatExcelDate(cut.closingDate),
        },
        {
          Seccion: "Corte",
          Dato: "Periodo inicial",
          Valor: formatExcelDateTime(cut.periodStart),
        },
        {
          Seccion: "Corte",
          Dato: "Periodo final",
          Valor: formatExcelDateTime(cut.periodEnd),
        },
        {
          Seccion: "Corte",
          Dato: "Creado",
          Valor: formatExcelDateTime(cut.createdAt),
        },
        {
          Seccion: "Corte",
          Dato: "Ultima actualizacion",
          Valor: formatExcelDateTime(cut.updatedAt),
        },
        ...buildExecutiveSummaryRows(cut).map((item) => ({
          Seccion: "Resumen",
          Dato: item.Concepto,
          Valor: item.Valor,
        })),
      ],
      widths: [16, 28, 28],
    },
    {
      name: "Servicios del corte",
      rows: cut.servicesSnapshot.map((service) => ({
        Folio: service.folio,
        Paciente: service.patientName,
        Telefono: service.patientPhone ?? "N/D",
        Medico: service.doctorName ?? "Sin medico",
        "Cantidad estudios":
          service.studiesCount ??
          inferStudiesCountFromSummary(service.studySummary),
        Estudios: service.studySummary,
        Sucursal: service.branchName,
        "Fecha muestra": formatExcelDateTime(service.sampleAt),
        "Fecha entrega": formatExcelDateTime(service.deliveryAt),
        "Fecha conclusion": formatExcelDateTime(service.completedAt),
        "Fecha creacion": formatExcelDateTime(service.createdAt),
        Subtotal: money(service.subtotalAmount),
        Descuento: money(service.discountAmount),
        Total: money(service.totalAmount),
      })),
      widths: [18, 28, 18, 28, 16, 42, 18, 22, 22, 22, 22, 16, 16, 16],
    },
    {
      name: "Sucursales",
      rows: cut.branchBreakdown.map((branch) => ({
        Sucursal: branch.branchName,
        "Servicios concluidos": branch.servicesCount,
        "Ingreso total": money(branch.revenueTotal),
        "Participacion ingreso": formatExcelPercent(
          branch.revenueTotal,
          cut.totalAmount,
        ),
        "Participacion servicios": formatExcelPercent(
          branch.servicesCount,
          cut.servicesCount,
        ),
      })),
      widths: [24, 18, 18, 18, 18],
    },
    {
      name: "Estudios frecuentes",
      rows: cut.topStudies.map((study, index) => ({
        Posicion: index + 1,
        Estudio: study.studyName,
        "Veces solicitado": study.times,
      })),
      widths: [12, 40, 18],
    },
    {
      name: "Ritmo del dia",
      rows: cut.hourlyBreakdown.map((hour) => ({
        Hora: hour.hour,
        "Servicios concluidos": hour.servicesCount,
        Ingreso: money(hour.revenueTotal),
        "Participacion ingreso": formatExcelPercent(
          hour.revenueTotal,
          cut.totalAmount,
        ),
      })),
      widths: [12, 18, 18, 18],
    },
  ];
}

type CutDetailView = {
  date: string;
  source: "saved" | "live";
  cutId: number | null;
  updatedAt: string | null;
  servicesCount: number;
  patientsCount: number;
  studiesCount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  averageTicket: number;
  branchBreakdown: DailyCutRecord["branchBreakdown"];
  topStudies: DailyCutRecord["topStudies"];
  hourlyBreakdown: DailyCutRecord["hourlyBreakdown"];
  servicesSnapshot: DailyCutServiceSnapshot[];
};

function buildDetailFromSavedCut(cut: DailyCutRecord): CutDetailView {
  return {
    date: cut.closingDate,
    source: "saved",
    cutId: cut.id,
    updatedAt: cut.updatedAt,
    servicesCount: cut.servicesCount,
    patientsCount: cut.patientsCount,
    studiesCount: cut.studiesCount,
    subtotalAmount: cut.subtotalAmount,
    discountAmount: cut.discountAmount,
    totalAmount: cut.totalAmount,
    averageTicket: cut.averageTicket,
    branchBreakdown: cut.branchBreakdown,
    topStudies: cut.topStudies,
    hourlyBreakdown: cut.hourlyBreakdown,
    servicesSnapshot: cut.servicesSnapshot,
  };
}

function buildDetailFromDashboard(
  date: string,
  dashboard: HistoryDashboardResponse,
): CutDetailView {
  return {
    date,
    source: "live",
    cutId: dashboard.savedCut?.id ?? null,
    updatedAt: dashboard.savedCut?.updatedAt ?? null,
    servicesCount: dashboard.summary.servicesCount,
    patientsCount: dashboard.summary.patientsCount,
    studiesCount: dashboard.summary.studiesCount,
    subtotalAmount: dashboard.summary.subtotalAmount,
    discountAmount: dashboard.summary.discountAmount,
    totalAmount: dashboard.summary.totalAmount,
    averageTicket: dashboard.summary.averageTicket,
    branchBreakdown: dashboard.summary.branchBreakdown,
    topStudies: dashboard.summary.topStudies,
    hourlyBreakdown: dashboard.summary.hourlyBreakdown,
    servicesSnapshot: dashboard.summary.servicesSnapshot,
  };
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{hint}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function LoadingOverview() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-48 rounded bg-gray-100" />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="h-10 rounded-2xl bg-white" />
            <div className="h-10 rounded-2xl bg-white" />
            <div className="h-10 rounded-2xl bg-white" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingDetail() {
  return (
    <div className="space-y-5 p-6">
      <div className="animate-pulse">
        <div className="h-5 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-gray-100" />
    </div>
  );
}

export default function CortesPage() {
  const confirm = useConfirmDialog();
  const hasLoadedOverviewRef = useRef(false);
  const { isOnline, pendingCount } = useOffline();
  const today = getTodayInputValue();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [overview, setOverview] = useState<DailyCutsOverviewResponse | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [detail, setDetail] = useState<CutDetailView | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingCut, setSavingCut] = useState(false);
  const [exportingCut, setExportingCut] = useState(false);
  const [deletingCutId, setDeletingCutId] = useState<number | null>(null);
  const [overviewDataSource, setOverviewDataSource] = useState<
    "live" | "snapshot"
  >("live");
  const [detailDataSource, setDetailDataSource] = useState<
    "live" | "snapshot"
  >("live");
  const [overviewSnapshotUpdatedAt, setOverviewSnapshotUpdatedAt] = useState<
    number | null
  >(null);
  const [detailSnapshotUpdatedAt, setDetailSnapshotUpdatedAt] = useState<
    number | null
  >(null);

  const overviewSnapshotKey = useMemo(
    () => buildCutsOverviewSnapshotKey(fromDate, toDate),
    [fromDate, toDate],
  );

  const selectedDayOverview = useMemo(
    () => overview?.days.find((day) => day.date === selectedDate) ?? null,
    [overview, selectedDate],
  );
  const selectedDateIndicator = useMemo(
    () => getCutDayIndicator(selectedDate),
    [selectedDate],
  );
  const detailSnapshotKey = useMemo(
    () =>
      buildCutsDetailSnapshotKey(
        selectedDate,
        selectedDayOverview?.isSaved ? "saved" : "live",
      ),
    [selectedDate, selectedDayOverview?.isSaved],
  );

  const handleApplyPreset = useCallback(
    (preset: "today" | "yesterday" | "last7" | "month") => {
      if (preset === "today") {
        setFromDate(today);
        setToDate(today);
        setSelectedDate(today);
        return;
      }

      if (preset === "yesterday") {
        const yesterday = shiftInputDate(today, -1);
        setFromDate(yesterday);
        setToDate(yesterday);
        setSelectedDate(yesterday);
        return;
      }

      if (preset === "month") {
        const monthStart = getMonthStartInputValue(today);
        setFromDate(monthStart);
        setToDate(today);
        setSelectedDate(today);
        return;
      }

      const start = shiftInputDate(today, -6);
      setFromDate(start);
      setToDate(today);
      setSelectedDate(today);
    },
    [today],
  );

  const loadOverview = useCallback(
    async (options?: { background?: boolean }) => {
      if (options?.background) {
        setRefreshing(true);
      } else {
        setLoadingOverview(true);
      }

      const cachedOverview =
        readOfflineSnapshot<DailyCutsOverviewResponse>(overviewSnapshotKey);

      if (!isOnline) {
        if (cachedOverview) {
          setOverview(cachedOverview.value);
          setOverviewDataSource("snapshot");
          setOverviewSnapshotUpdatedAt(cachedOverview.updatedAt);
          setSelectedDate((current) => {
            if (
              current >= cachedOverview.value.fromDate &&
              current <= cachedOverview.value.toDate
            ) {
              return current;
            }

            return (
              cachedOverview.value.days[0]?.date ?? cachedOverview.value.toDate
            );
          });
          hasLoadedOverviewRef.current = true;
        } else if (!options?.background) {
          setOverview(null);
          toast.error(
            "No hay conexion y tampoco existe un resumen guardado para este periodo.",
          );
        }

        setLoadingOverview(false);
        setRefreshing(false);
        return;
      }

      const response = await getDailyCutsOverview({
        fromDate,
        toDate,
      });

      if (!response.ok) {
        if (cachedOverview) {
          setOverview(cachedOverview.value);
          setOverviewDataSource("snapshot");
          setOverviewSnapshotUpdatedAt(cachedOverview.updatedAt);
          setSelectedDate((current) => {
            if (
              current >= cachedOverview.value.fromDate &&
              current <= cachedOverview.value.toDate
            ) {
              return current;
            }

            return (
              cachedOverview.value.days[0]?.date ?? cachedOverview.value.toDate
            );
          });
        } else {
          toast.error(response.errors[0] ?? "No se pudieron cargar los cortes.");
          if (!options?.background) {
            setOverview(null);
          }
        }
        setLoadingOverview(false);
        setRefreshing(false);
        return;
      }

      setOverview(response.data);
      const storedSnapshot = writeOfflineSnapshot(
        overviewSnapshotKey,
        response.data,
      );
      setOverviewDataSource("live");
      setOverviewSnapshotUpdatedAt(storedSnapshot.updatedAt);
      setSelectedDate((current) => {
        if (current >= response.data.fromDate && current <= response.data.toDate) {
          return current;
        }

        return response.data.days[0]?.date ?? response.data.toDate;
      });
      hasLoadedOverviewRef.current = true;
      setLoadingOverview(false);
      setRefreshing(false);
    },
    [fromDate, isOnline, overviewSnapshotKey, toDate],
  );

  useEffect(() => {
    void loadOverview({ background: hasLoadedOverviewRef.current });
  }, [loadOverview]);

  const loadDetail = useCallback(async () => {
    if (!selectedDate) return;

    setLoadingDetail(true);

    const cachedDetail = readOfflineSnapshot<CutDetailView>(detailSnapshotKey);

    if (!isOnline) {
      if (cachedDetail) {
        setDetail(cachedDetail.value);
        setDetailDataSource("snapshot");
        setDetailSnapshotUpdatedAt(cachedDetail.updatedAt);
      } else {
        setDetail(null);
        toast.error(
          "No hay conexion y tampoco existe un detalle guardado para este dia.",
        );
      }
      setLoadingDetail(false);
      return;
    }

    if (selectedDayOverview?.isSaved && selectedDayOverview.savedCutId) {
      const response = await getDailyCutById(selectedDayOverview.savedCutId);
      if (!response.ok) {
        if (cachedDetail) {
          setDetail(cachedDetail.value);
          setDetailDataSource("snapshot");
          setDetailSnapshotUpdatedAt(cachedDetail.updatedAt);
        } else {
          toast.error(
            response.errors[0] ?? "No se pudo cargar el corte guardado.",
          );
          setDetail(null);
        }
        setLoadingDetail(false);
        return;
      }

      const nextDetail = buildDetailFromSavedCut(response.data);
      setDetail(nextDetail);
      const storedSnapshot = writeOfflineSnapshot(detailSnapshotKey, nextDetail);
      setDetailDataSource("live");
      setDetailSnapshotUpdatedAt(storedSnapshot.updatedAt);
      setLoadingDetail(false);
      return;
    }

    const response = await getHistoryDashboard({ date: selectedDate });
    if (!response.ok) {
      if (cachedDetail) {
        setDetail(cachedDetail.value);
        setDetailDataSource("snapshot");
        setDetailSnapshotUpdatedAt(cachedDetail.updatedAt);
      } else {
        toast.error(
          response.errors[0] ?? "No se pudo cargar el dia seleccionado.",
        );
        setDetail(null);
      }
      setLoadingDetail(false);
      return;
    }

    const nextDetail = buildDetailFromDashboard(selectedDate, response.data);
    setDetail(nextDetail);
    const storedSnapshot = writeOfflineSnapshot(detailSnapshotKey, nextDetail);
    setDetailDataSource("live");
    setDetailSnapshotUpdatedAt(storedSnapshot.updatedAt);
    setLoadingDetail(false);
  }, [detailSnapshotKey, isOnline, selectedDate, selectedDayOverview]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleSaveCut = async () => {
    if (!isOnline) {
      toast.info(
        "Guardar cortes sin conexion quedara disponible cuando activemos la sincronizacion.",
      );
      return;
    }

    setSavingCut(true);
    const response = await generateDailyCut(selectedDate);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo guardar el corte.");
      setSavingCut(false);
      return;
    }

    toast.success(`Corte del ${formatDate(selectedDate)} guardado correctamente.`);
    await loadOverview({ background: true });
    setSavingCut(false);
  };

  const handleDeleteCut = async () => {
    if (!detail?.cutId) return;

    if (!isOnline) {
      toast.info(
        "Eliminar cortes sin conexion quedara disponible cuando activemos la sincronizacion.",
      );
      return;
    }

    const confirmed = await confirm({
      title: "Eliminar corte guardado",
      message: `Se eliminara el corte del ${formatDate(selectedDate)}. Podras seguir consultando el dia, pero el snapshot guardado dejara de estar disponible hasta volver a generarlo.`,
      confirmLabel: "Eliminar corte",
      tone: "danger",
    });

    if (!confirmed) return;

    setDeletingCutId(detail.cutId);
    const response = await deleteDailyCut(detail.cutId);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo eliminar el corte.");
      setDeletingCutId(null);
      return;
    }

    toast.success(`Corte del ${formatDate(selectedDate)} eliminado.`);
    await loadOverview({ background: true });
    setDeletingCutId(null);
  };

  const handleExportCut = async () => {
    if (!detail?.cutId) {
      toast.info("Guarda el corte antes de exportarlo.");
      return;
    }

    if (!isOnline) {
      toast.info("La exportacion de cortes requiere conexion por ahora.");
      return;
    }

    setExportingCut(true);
    const response = await getDailyCutById(detail.cutId);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo preparar el corte.");
      setExportingCut(false);
      return;
    }

    const { downloadWorkbook } = await import("@/helpers/excel");
    downloadWorkbook(
      `corte-dia-${response.data.closingDate}.xlsx`,
      buildDailyCutWorkbook(response.data),
    );

    toast.success("Corte exportado correctamente.");
    setExportingCut(false);
  };

  const rangeLabel = getRangeLabel(fromDate, toDate);
  const detailStatusLabel =
    detail?.source === "saved" ? "Corte guardado" : "Consulta del dia";
  const activeSnapshotUpdatedAt =
    detailDataSource === "snapshot"
      ? detailSnapshotUpdatedAt
      : overviewSnapshotUpdatedAt;

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Control de cortes
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cortes</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Consulta el acumulado por dia, revisa el detalle comprimido de los
            servicios y guarda el corte cuando quieras conservar el snapshot
            para exportacion.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/historial"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
          >
            Ir a historial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void loadOverview({ background: Boolean(overview) })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            disabled={loadingOverview || refreshing || savingCut || exportingCut}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {!isOnline ||
      overviewDataSource === "snapshot" ||
      detailDataSource === "snapshot" ? (
        <div className="mb-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="font-semibold">
                {overviewDataSource === "snapshot" ||
                detailDataSource === "snapshot"
                  ? "Mostrando informacion guardada localmente."
                  : "Sin conexion detectada."}
              </span>
            </div>
            <span className="text-xs font-medium text-amber-800">
              {activeSnapshotUpdatedAt
                ? `Ultima copia local: ${formatDateTime(
                    new Date(activeSnapshotUpdatedAt).toISOString(),
                  )}`
                : "Aun no hay copia local para este corte o periodo."}
            </span>
          </div>
          {pendingCount > 0 ? (
            <p className="mt-2 text-xs text-amber-800">
              Operaciones pendientes en cola: {pendingCount}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-white via-emerald-50/70 to-white p-6">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_0.8fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Desde
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hasta
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Periodo consultado</p>
              <p className="mt-1">{rangeLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset("today")}
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("yesterday")}
              className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("last7")}
              className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              Ultimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("month")}
              className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
            >
              Este mes
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Dias visibles"
          value={String(overview?.totalDays ?? 0)}
          hint="Dias con corte o movimiento en el periodo"
          tone="bg-blue-100 text-blue-700"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <SummaryCard
          label="Cortes guardados"
          value={String(overview?.savedDaysCount ?? 0)}
          hint="Dias que ya cuentan con snapshot guardado"
          tone="bg-emerald-100 text-emerald-700"
          icon={<FileSpreadsheet className="h-5 w-5" />}
        />
        <SummaryCard
          label="Servicios del rango"
          value={String(overview?.totals.servicesCount ?? 0)}
          hint="Servicios considerados en el acumulado diario"
          tone="bg-amber-100 text-amber-700"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <SummaryCard
          label="Ingreso del rango"
          value={money(overview?.totals.totalAmount ?? 0)}
          hint="Total sumado a partir de los dias consultados"
          tone="bg-violet-100 text-violet-700"
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            overviewDataSource === "snapshot"
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          Resumen:{" "}
          {overviewDataSource === "snapshot" ? "copia local" : "conexion activa"}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            detailDataSource === "snapshot"
              ? "bg-amber-100 text-amber-800"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          Detalle:{" "}
          {detailDataSource === "snapshot" ? "copia local" : "conexion activa"}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Resumen por dia
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona un dia para revisar el corte guardado o la consulta
              disponible de esa fecha.
            </p>
          </div>

          {loadingOverview ? (
            <LoadingOverview />
          ) : overview && overview.days.length > 0 ? (
            <div className="max-h-[52rem] space-y-3 overflow-y-auto p-5 scroll-panel">
              {overview.days.map((day) => {
                const isSelected = day.date === selectedDate;
                const dayIndicator = getCutDayIndicator(day.date);

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full rounded-[1.75rem] border p-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(day.date)}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              day.isSaved
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {day.isSaved ? "Guardado" : "Consulta"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dayIndicator.className}`}
                          >
                            {dayIndicator.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {day.topStudyName
                            ? `Top: ${day.topStudyName} (${day.topStudyTimes})`
                            : "Sin estudio destacado en este dia"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-700">
                          {money(day.totalAmount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {day.servicesCount} servicios
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Pacientes
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {day.patientsCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Estudios
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {day.studiesCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Sucursal fuerte
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {day.strongestBranchName ?? "Sin datos"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No hay dias con movimientos ni cortes guardados en este periodo.
            </div>
          )}
        </div>

        <div className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          {loadingDetail ? (
            <LoadingDetail />
          ) : detail ? (
            <div className="p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    Detalle del corte
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-gray-900">
                    {formatDate(detail.date)}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        detail.source === "saved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {detailStatusLabel}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedDateIndicator.className}`}
                    >
                      {selectedDateIndicator.label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {detail.servicesCount} servicios
                    </span>
                    {detail.updatedAt ? (
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        Actualizado: {formatDateTime(detail.updatedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveCut()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
                    disabled={savingCut || deletingCutId !== null || !isOnline}
                  >
                    {savingCut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    {savingCut ? "Guardando..." : "Guardar corte"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleExportCut()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 sm:w-auto"
                    disabled={!detail.cutId || exportingCut || savingCut || !isOnline}
                  >
                    {exportingCut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {exportingCut ? "Exportando..." : "Exportar corte"}
                  </button>

                  {detail.cutId ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteCut()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 sm:w-auto"
                      disabled={deletingCutId !== null || savingCut || !isOnline}
                    >
                      {deletingCutId === detail.cutId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deletingCutId === detail.cutId
                        ? "Eliminando..."
                        : "Eliminar corte"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Ingreso
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {money(detail.totalAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Servicios
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {detail.servicesCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Pacientes
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {detail.patientsCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Estudios
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {detail.studiesCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 2xl:grid-cols-[1.35fr_0.85fr]">
                <div className="min-w-0 space-y-6">
                  <div className="rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Servicios del dia
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Vista compacta para revisar folio, paciente, estudios,
                        sucursal y total.
                      </p>
                    </div>

                    <div className="max-h-[34rem] overflow-y-auto p-4 scroll-panel">
                      {detail.servicesSnapshot.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                          No hay servicios concluidos para esta fecha.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {detail.servicesSnapshot.map((service) => (
                            <Link
                              key={`${service.serviceId}-${service.folio}`}
                              href={`/servicios/detalle/${service.serviceId}`}
                              className="block rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
                            >
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                                      {service.folio}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(service.completedAt)}
                                    </span>
                                  </div>

                                  <p className="mt-3 text-sm font-semibold text-gray-900">
                                    {service.patientName}
                                  </p>
                                  <p
                                    className="mt-1 line-clamp-2 break-words text-sm leading-5 text-gray-600"
                                    title={formatStudySummaryForCard(
                                      service.studySummary,
                                    )}
                                  >
                                    {formatStudySummaryForCard(
                                      service.studySummary,
                                    )}
                                  </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[18rem]">
                                  <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                      Estudios
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                      {service.studiesCount ??
                                        inferStudiesCountFromSummary(
                                          service.studySummary,
                                        )}
                                    </p>
                                  </div>

                                  <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                      Sucursal
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                      {service.branchName}
                                    </p>
                                  </div>

                                  <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                      Total
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                                      {money(service.totalAmount)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-6">
                  <div className="rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Estudios frecuentes
                      </h3>
                    </div>

                    <div className="space-y-3 p-4">
                      {detail.topStudies.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                          Sin estudios para este dia.
                        </div>
                      ) : (
                        detail.topStudies.slice(0, 6).map((study, index) => (
                          <div
                            key={`${study.studyName}-${index}`}
                            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {study.studyName}
                            </p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                              {study.times}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Sucursales del dia
                      </h3>
                    </div>

                    <div className="space-y-3 p-4">
                      {detail.branchBreakdown.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                          Sin movimientos por sucursal.
                        </div>
                      ) : (
                        detail.branchBreakdown.map((branch) => (
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
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-sm text-gray-500">
              Selecciona un dia para revisar el corte.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
