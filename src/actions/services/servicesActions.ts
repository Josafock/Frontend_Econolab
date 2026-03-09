"use server";

import { fetchApi } from "@/actions/_lib/api";

export type ServiceStatus =
  | "pending"
  | "in_progress"
  | "delayed"
  | "completed"
  | "cancelled";

export type ServiceItemPriceType =
  | "normal"
  | "dif"
  | "special"
  | "hospital"
  | "other";

export type ServiceItem = {
  id: number;
  studyId: number;
  studyNameSnapshot: string;
  priceType: ServiceItemPriceType;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  subtotalAmount: number;
};

export type ServiceOrder = {
  id: number;
  folio: string;
  patientId: number;
  doctorId?: number | null;
  branchName?: string | null;
  sampleAt?: string | null;
  deliveryAt?: string | null;
  status: ServiceStatus;
  subtotalAmount: number;
  courtesyPercent: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    phone?: string | null;
  };
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string | null;
  } | null;
  items: ServiceItem[];
};

type ServicesSearchResponse = {
  data: ServiceOrder[];
  meta: { page: number; limit: number; total: number };
};

type CreateServiceResponse = {
  message: string;
  data: ServiceOrder;
};

type UpdateServiceResponse = {
  message: string;
  data: ServiceOrder;
};

export type CreateServicePayload = {
  folio: string;
  patientId: number;
  doctorId?: number;
  branchName?: string;
  sampleAt?: string;
  deliveryAt?: string;
  status?: ServiceStatus;
  courtesyPercent?: number;
  notes?: string;
  items: {
    studyId: number;
    priceType: ServiceItemPriceType;
    quantity: number;
    discountPercent?: number;
  }[];
};

export async function getServices(params?: {
  search?: string;
  status?: ServiceStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<ServicesSearchResponse>(`/services${suffix}`);
}

export async function createService(payload: CreateServicePayload) {
  return fetchApi<CreateServiceResponse>("/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getServiceById(id: number) {
  return fetchApi<ServiceOrder>(`/services/${id}`);
}

export async function updateServiceStatus(id: number, status: ServiceStatus) {
  return fetchApi<UpdateServiceResponse>(`/services/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
