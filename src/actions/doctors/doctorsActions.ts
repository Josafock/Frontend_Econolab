"use server";

import { fetchApi } from "@/actions/_lib/api";

export type Doctor = {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  licenseNumber?: string | null;
};

type DoctorsSearchResponse = {
  data: Doctor[];
  meta: { page: number; limit: number; total: number };
};

type CreateDoctorResponse = {
  message: string;
  data: Doctor;
};

export type CreateDoctorPayload = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
  notes?: string;
};

export async function getDoctors(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<DoctorsSearchResponse>(`/doctors${suffix}`);
}

export async function createDoctor(payload: CreateDoctorPayload) {
  return fetchApi<CreateDoctorResponse>("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
