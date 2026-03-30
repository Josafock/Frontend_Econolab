import type { Patient } from "@/features/patients/api/patients";

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

export function toUiPatient(patient: Patient): UiPatient {
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
