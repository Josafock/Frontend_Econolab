import type { Doctor } from "@/features/doctors/api/doctors";

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

export function toUiDoctor(doctor: Doctor): UiDoctor {
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
