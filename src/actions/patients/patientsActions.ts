"use server";

import { fetchApi } from "@/actions/_lib/api";

export type PatientGender = "male" | "female" | "other";

export type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: PatientGender;
  birthDate: string;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  addressBetween?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  createdAt?: string;
};

type PatientsSearchResponse = {
  data: Patient[];
  meta: { page: number; limit: number; total: number };
};

type CreatePatientResponse = {
  message: string;
  data: Patient;
};

export type CreatePatientPayload = {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: PatientGender;
  birthDate: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  addressCity?: string;
  documentType?: string;
  documentNumber?: string;
};

export async function getPatients(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<PatientsSearchResponse>(`/patients${suffix}`);
}

export async function createPatient(payload: CreatePatientPayload) {
  return fetchApi<CreatePatientResponse>("/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
