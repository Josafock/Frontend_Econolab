import "server-only";

import { cache } from "react";
import {
  getDoctorById,
  getDoctors,
  type Doctor,
} from "@/actions/doctors/doctorsActions";

export type UiDoctor = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  especialidad: string;
  cedula: string;
  telefono: string;
  email: string;
  notas: string;
  fechaRegistro: string;
  estatus: "Activo" | "Inactivo";
  isActive: boolean;
};

function toUiDoctor(doctor: Doctor): UiDoctor {
  const nombre = (doctor.firstName ?? "").toUpperCase();
  const apellidoPaterno = (doctor.lastName ?? "").toUpperCase();
  const apellidoMaterno = (doctor.middleName ?? "").toUpperCase();

  return {
    id: doctor.id,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto: [nombre, apellidoPaterno, apellidoMaterno]
      .filter(Boolean)
      .join(" "),
    especialidad: doctor.specialty ?? "Sin especialidad",
    cedula: doctor.licenseNumber ?? "-",
    telefono: doctor.phone ?? "-",
    email: doctor.email ?? "-",
    notas: doctor.notes ?? "",
    fechaRegistro: doctor.createdAt ?? "",
    estatus: doctor.isActive === false ? "Inactivo" : "Activo",
    isActive: doctor.isActive !== false,
  };
}

export const getDoctorsCatalog = cache(async () => {
  const response = await getDoctors({ limit: 1000, status: "all" });

  if (!response.ok) {
    return {
      doctors: [] as UiDoctor[],
      error:
        response.errors[0] ??
        "No se pudieron cargar los medicos en este momento.",
    };
  }

  return {
    doctors: response.data.data.map(toUiDoctor),
    error: null,
  };
});

export const getDoctorDetail = cache(async (id: number) => {
  if (!Number.isInteger(id) || id < 1) {
    return {
      doctor: null as Doctor | null,
      error: "ID de medico invalido.",
    };
  }

  const response = await getDoctorById(id);

  if (!response.ok) {
    return {
      doctor: null as Doctor | null,
      error:
        response.errors[0] ?? "No se pudo cargar el detalle del medico.",
    };
  }

  return {
    doctor: response.data,
    error: null,
  };
});
