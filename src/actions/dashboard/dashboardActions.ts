"use server";

import { fetchApi } from "@/actions/_lib/api";

export type DashboardLoginItem = {
  id: string;
  success: boolean;
  createdAt: string;
  userName?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type DashboardOverview = {
  generatedAt: string;
  filters: {
    range: "today" | "7d" | "30d" | "90d" | "year" | "custom";
    rangeLabel: string;
    startDate: string;
    endDate: string;
    role: "all" | "admin" | "recepcionista";
  };
  welcome: {
    title: string;
    subtitle: string;
  };
  kpis: {
    revenueInRange: number;
    createdServicesInRange: number;
    completedServicesInRange: number;
    totalServices: number;
    createdServicesToday: number;
    completedServicesToday: number;
    todayRevenue: number;
    pendingServices: number;
    inProgressServices: number;
    delayedServices: number;
    cancelledServicesInRange: number;
    totalPatients: number;
    totalDoctors: number;
    activeStudies: number;
    totalUsers: number;
    adminUsers: number;
    receptionistUsers: number;
  };
  studies: {
    topInRange: { studyName: string; times: number } | null;
    bottomInRange: { studyName: string; times: number } | null;
    rankingInRange: Array<{ studyName: string; times: number }>;
  };
  branches: {
    strongestInRange: {
      branchName: string;
      servicesCount: number;
      revenueTotal: number;
    } | null;
    breakdownInRange: Array<{
      branchName: string;
      servicesCount: number;
      revenueTotal: number;
    }>;
  };
  doctors: {
    topInRange: {
      doctorName: string;
      servicesCount: number;
      revenueTotal: number;
    } | null;
    rankingInRange: Array<{
      doctorName: string;
      servicesCount: number;
      revenueTotal: number;
    }>;
  };
  logins: {
    successfulInRange: number;
    failedInRange: number;
    uniqueUsersInRange: number;
    recent: DashboardLoginItem[];
    users: Array<{
      id: string;
      nombre: string;
      email: string;
      rol: "admin" | "recepcionista" | "unassigned";
      confirmed: boolean;
      createdAt: string;
      successfulLogins: number;
      failedLogins: number;
      lastLoginAt?: string | null;
      lastAttemptAt?: string | null;
    }>;
  };
  finance: {
    savedTodayCut: {
      id: number;
      closingDate: string;
      totalAmount: number;
      servicesCount: number;
      updatedAt: string;
    } | null;
  };
  trends: {
    revenueSeries: Array<{
      key: string;
      revenueTotal: number;
      servicesCount: number;
    }>;
  };
  operations: {
    latestCompletedServices: Array<{
      id: number;
      folio: string;
      patientName: string;
      studySummary: string;
      totalAmount: number;
      completedAt: string;
    }>;
  };
};

export async function getDashboardOverview(params?: {
  range?: "today" | "7d" | "30d" | "90d" | "year" | "custom";
  role?: "all" | "admin" | "recepcionista";
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.range) query.set("range", params.range);
  if (params?.role) query.set("role", params.role);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<DashboardOverview>(`/dashboard/overview${suffix}`);
}
