"use server";

import { fetchApi } from "@/actions/_lib/api";
import type { ServiceStatus } from "@/actions/services/servicesActions";

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

export async function getHistoryDashboard(params?: {
  date?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<HistoryDashboardResponse>(`/history/dashboard${suffix}`);
}

export async function generateDailyCut(date?: string) {
  return fetchApi<DailyCutRecord>("/history/daily-cuts", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
}

export async function getDailyCutsOverview(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<DailyCutsOverviewResponse>(`/history/daily-cuts/overview${suffix}`);
}

export async function getDailyCutById(id: number) {
  return fetchApi<DailyCutRecord>(`/history/daily-cuts/${id}`);
}

export async function deleteDailyCut(id: number) {
  return fetchApi<{ id: number; message: string }>(`/history/daily-cuts/${id}`, {
    method: "DELETE",
  });
}
