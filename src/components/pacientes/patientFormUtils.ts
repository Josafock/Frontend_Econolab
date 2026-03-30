import type {
  CreatePatientPayload,
  Patient,
} from "@/features/patients/api/patients";

export type PatientFormValues = {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: "" | "female" | "male" | "other";
  telefono: string;
  email: string;
  direccion: string;
  entreCalles: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  tipoDocumento: string;
  numeroDocumento: string;
};

export type PatientFormField = keyof PatientFormValues;
export type PatientFormErrors = Partial<Record<PatientFormField, string>>;
export type PatientFormTouched = Partial<Record<PatientFormField, boolean>>;

export const REQUIRED_PATIENT_FIELDS: PatientFormField[] = [
  "nombre",
  "apellidoPaterno",
  "fechaNacimiento",
  "genero",
];

export function createEmptyPatientForm(): PatientFormValues {
  return {
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "",
    genero: "",
    telefono: "",
    email: "",
    direccion: "",
    entreCalles: "",
    ciudad: "",
    estado: "",
    codigoPostal: "",
    tipoDocumento: "",
    numeroDocumento: "",
  };
}

export function createTouchedPatientForm(
  fields: PatientFormField[] = Object.keys(
    createEmptyPatientForm(),
  ) as PatientFormField[],
): PatientFormTouched {
  return fields.reduce<PatientFormTouched>((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;

  const today = new Date();
  const born = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }

  return Number.isNaN(age) || age < 0 ? 0 : age;
}

export function validatePatientForm(
  formData: PatientFormValues,
): PatientFormErrors {
  const errors: PatientFormErrors = {};

  if (!formData.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!formData.apellidoPaterno.trim()) {
    errors.apellidoPaterno = "El apellido paterno es obligatorio.";
  }

  if (!formData.fechaNacimiento) {
    errors.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
  } else {
    const selectedDate = new Date(`${formData.fechaNacimiento}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(selectedDate.getTime())) {
      errors.fechaNacimiento = "La fecha de nacimiento no es válida.";
    } else if (selectedDate > today) {
      errors.fechaNacimiento = "La fecha de nacimiento no puede ser futura.";
    }
  }

  if (!formData.genero) {
    errors.genero = "Selecciona un género.";
  }

  const phone = formData.telefono.trim();
  if (phone && !/^\d{7,15}$/.test(phone)) {
    errors.telefono = "El teléfono debe tener entre 7 y 15 dígitos.";
  }

  const email = formData.email.trim();
  if (
    email &&
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
  ) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  const zip = formData.codigoPostal.trim();
  if (zip && !/^\d{4,10}$/.test(zip)) {
    errors.codigoPostal = "El código postal debe contener solo números.";
  }

  const documentType = formData.tipoDocumento.trim();
  const documentNumber = formData.numeroDocumento.trim();
  if (documentType && !documentNumber) {
    errors.numeroDocumento = "Captura el número del documento.";
  }
  if (!documentType && documentNumber) {
    errors.tipoDocumento = "Indica el tipo de documento.";
  }

  return errors;
}

export function hasPatientFormErrors(errors: PatientFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapPatientToForm(patient: Patient): PatientFormValues {
  return {
    nombre: patient.firstName ?? "",
    apellidoPaterno: patient.lastName ?? "",
    apellidoMaterno: patient.middleName ?? "",
    fechaNacimiento: patient.birthDate ?? "",
    genero: patient.gender ?? "",
    telefono: patient.phone ?? "",
    email: patient.email ?? "",
    direccion: patient.addressLine ?? "",
    entreCalles: patient.addressBetween ?? "",
    ciudad: patient.addressCity ?? "",
    estado: patient.addressState ?? "",
    codigoPostal: patient.addressZip ?? "",
    tipoDocumento: patient.documentType ?? "",
    numeroDocumento: patient.documentNumber ?? "",
  };
}

function clean(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function mapFormToPayload(
  formData: PatientFormValues,
): CreatePatientPayload {
  return {
    firstName: formData.nombre.trim().toUpperCase(),
    lastName: formData.apellidoPaterno.trim().toUpperCase(),
    middleName: clean(formData.apellidoMaterno)?.toUpperCase(),
    birthDate: formData.fechaNacimiento,
    gender: formData.genero as "female" | "male" | "other",
    phone: clean(formData.telefono),
    email: clean(formData.email),
    addressLine: clean(formData.direccion),
    addressBetween: clean(formData.entreCalles),
    addressCity: clean(formData.ciudad),
    addressState: clean(formData.estado),
    addressZip: clean(formData.codigoPostal),
    documentType: clean(formData.tipoDocumento),
    documentNumber: clean(formData.numeroDocumento),
  };
}
