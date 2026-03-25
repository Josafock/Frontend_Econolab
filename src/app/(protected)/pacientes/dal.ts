import "server-only";

import { cache } from "react";
import { getPatientById, getPatients, type Patient } from "@/actions/patients/patientsActions";

export type UiPatient = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: "Femenino" | "Masculino" | "Otro";
  telefono: string;
  email: string;
  direccion: string;
  entreCalles: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  documento: string;
  fechaRegistro: string;
  estatus: "Activo" | "Inactivo";
  isActive: boolean;
};

function toUiPatient(patient: Patient): UiPatient {
  const nombre = (patient.firstName ?? "").toUpperCase();
  const apellidoPaterno = (patient.lastName ?? "").toUpperCase();
  const apellidoMaterno = (patient.middleName ?? "").toUpperCase();
  const documentLabel =
    patient.documentType && patient.documentNumber
      ? `${patient.documentType}: ${patient.documentNumber}`
      : "Sin documento";

  return {
    id: patient.id,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto: [nombre, apellidoPaterno, apellidoMaterno]
      .filter(Boolean)
      .join(" "),
    fechaNacimiento: patient.birthDate,
    genero:
      patient.gender === "female"
        ? "Femenino"
        : patient.gender === "male"
          ? "Masculino"
          : "Otro",
    telefono: patient.phone ?? "-",
    email: patient.email ?? "-",
    direccion: patient.addressLine ?? "-",
    entreCalles: patient.addressBetween ?? "-",
    ciudad: patient.addressCity ?? "-",
    estado: patient.addressState ?? "-",
    codigoPostal: patient.addressZip ?? "-",
    documento: documentLabel,
    fechaRegistro: patient.createdAt ?? "",
    estatus: patient.isActive === false ? "Inactivo" : "Activo",
    isActive: patient.isActive !== false,
  };
}

export const getPatientsCatalog = cache(async () => {
  const response = await getPatients({ limit: 1000, status: "all" });

  if (!response.ok) {
    return {
      patients: [] as UiPatient[],
      error:
        response.errors[0] ??
        "No se pudieron cargar los pacientes en este momento.",
    };
  }

  return {
    patients: response.data.data.map(toUiPatient),
    error: null,
  };
});

export const getPatientDetail = cache(async (id: number) => {
  if (!Number.isInteger(id) || id < 1) {
    return {
      patient: null as Patient | null,
      error: "ID de paciente invalido.",
    };
  }

  const response = await getPatientById(id);

  if (!response.ok) {
    return {
      patient: null as Patient | null,
      error:
        response.errors[0] ?? "No se pudo cargar el detalle del paciente.",
    };
  }

  return {
    patient: response.data,
    error: null,
  };
});
