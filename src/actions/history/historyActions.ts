"use server";

import { fetchApi } from "@/actions/_lib/api";
import type { ServiceStatus } from "@/actions/services/servicesActions";

export type HistoricalCompletedService = {
  id: number;
  folio: string;
  paciente: string;
  telefono: string;
  estudio: string;
  sucursal: string;
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
  studySummary: string;
  branchName: string;
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

export type HistoryDashboardResponse = {
  selectedDate: string;
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
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
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

export async function getDailyCutById(id: number) {
  return fetchApi<DailyCutRecord>(`/history/daily-cuts/${id}`);
}
