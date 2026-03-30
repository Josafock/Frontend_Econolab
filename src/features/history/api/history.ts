import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import type { ServiceStatus } from "@/features/services/api/services";

export type HistoricalCompletedService = {
  id: number;
  folio: string;
  paciente: string;
  telefono: string;
  medico: string;
  estudio: string;
  estudiosCount: number;
  sucursal: string;
  fechaMuestra?: string | null;
  fechaCreacion?: string | null;
  fechaEntrega?: string | null;
  fechaConclusion?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: ServiceStatus;
};

export type DailyCutBranch = {
  branchName: string;
  servicesCount: number;
  revenueTotal: number;
};

export type DailyCutStudy = {
  studyName: string;
  times: number;
};

export type DailyCutHour = {
  hour: string;
  servicesCount: number;
  revenueTotal: number;
};

export type DailyCutServiceSnapshot = {
  serviceId: number;
  folio: string;
  patientName: string;
  patientPhone?: string | null;
  doctorName?: string | null;
  studySummary: string;
  studiesCount?: number;
  branchName: string;
  sampleAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  deliveryAt?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
};

export type DailyCutRecord = {
  id: number;
  closingDate: string;
  periodStart: string;
  periodEnd: string;
  servicesCount: number;
  patientsCount: number;
  studiesCount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  averageTicket: number;
  branchBreakdown: DailyCutBranch[];
  topStudies: DailyCutStudy[];
  hourlyBreakdown: DailyCutHour[];
  servicesSnapshot: DailyCutServiceSnapshot[];
  createdAt: string;
  updatedAt: string;
};

export type DailyCutOverviewItem = {
  date: string;
  servicesCount: number;
  patientsCount: number;
  studiesCount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  averageTicket: number;
  topStudyName?: string | null;
  topStudyTimes: number;
  strongestBranchName?: string | null;
  strongestBranchRevenue: number;
  savedCutId?: number | null;
  savedCutUpdatedAt?: string | null;
  isSaved: boolean;
};

export type DailyCutsOverviewResponse = {
  fromDate: string;
  toDate: string;
  totalDays: number;
  savedDaysCount: number;
  days: DailyCutOverviewItem[];
  totals: {
    servicesCount: number;
    patientsCount: number;
    studiesCount: number;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
};

export type HistoryDashboardResponse = {
  selectedDate: string;
  fromDate: string;
  toDate: string;
  isSingleDay: boolean;
  services: HistoricalCompletedService[];
  summary: {
    servicesCount: number;
    patientsCount: number;
    studiesCount: number;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    averageTicket: number;
    branchBreakdown: DailyCutBranch[];
    topStudies: DailyCutStudy[];
    hourlyBreakdown: DailyCutHour[];
    servicesSnapshot: DailyCutServiceSnapshot[];
  };
  savedCut: DailyCutRecord | null;
  recentCuts: DailyCutRecord[];
};

async function createHistoryRequestContext() {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (!token) {
    return null;
  }

  return {
    baseUrl: runtime.apiBaseUrl,
    token,
  };
}

export async function getHistoryDashboard(params?: {
  date?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}): Promise<ApiResult<HistoryDashboardResponse>> {
  const context = await createHistoryRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<HistoryDashboardResponse>(context, `/history/dashboard${suffix}`);
}

export async function generateDailyCut(
  date?: string,
): Promise<ApiResult<DailyCutRecord>> {
  const context = await createHistoryRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<DailyCutRecord>(context, "/history/daily-cuts", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
}

export async function getDailyCutsOverview(params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<ApiResult<DailyCutsOverviewResponse>> {
  const context = await createHistoryRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<DailyCutsOverviewResponse>(
    context,
    `/history/daily-cuts/overview${suffix}`,
  );
}

export async function getDailyCutById(
  id: number,
): Promise<ApiResult<DailyCutRecord>> {
  const context = await createHistoryRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<DailyCutRecord>(context, `/history/daily-cuts/${id}`);
}

export async function deleteDailyCut(
  id: number,
): Promise<ApiResult<{ id: number; message: string }>> {
  const context = await createHistoryRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<{ id: number; message: string }>(
    context,
    `/history/daily-cuts/${id}`,
    {
      method: "DELETE",
    },
  );
}
