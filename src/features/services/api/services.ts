import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

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
  sourcePackageId?: number | null;
  sourcePackageNameSnapshot?: string | null;
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
  completedAt?: string | null;
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
  autoGenerateFolio?: boolean;
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

export type UpdateServicePayload = Partial<CreateServicePayload>;

async function createServiceRequestContext() {
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

export async function getServices(params?: {
  search?: string;
  status?: ServiceStatus;
  branchName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResult<ServicesSearchResponse>> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.branchName) query.set("branchName", params.branchName);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ServicesSearchResponse>(context, `/services${suffix}`);
}

export async function createService(
  payload: CreateServicePayload,
): Promise<ApiResult<CreateServiceResponse>> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<CreateServiceResponse>(context, "/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSuggestedServiceFolio(): Promise<
  ApiResult<{ folio: string }>
> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<{ folio: string }>(context, "/services/next-folio");
}

export async function getServiceById(
  id: number,
): Promise<ApiResult<ServiceOrder>> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<ServiceOrder>(context, `/services/${id}`);
}

export async function updateService(
  id: number,
  payload: UpdateServicePayload,
): Promise<ApiResult<UpdateServiceResponse>> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<UpdateServiceResponse>(context, `/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateServiceStatus(
  id: number,
  status: ServiceStatus,
): Promise<ApiResult<UpdateServiceResponse>> {
  const context = await createServiceRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<UpdateServiceResponse>(context, `/services/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
