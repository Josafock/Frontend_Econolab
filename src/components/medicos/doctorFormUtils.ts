import type {
  CreateDoctorPayload,
  Doctor,
} from '@/actions/doctors/doctorsActions';

export type DoctorFormValues = {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  especialidad: string;
  cedulaProfesional: string;
  telefono: string;
  email: string;
  notas: string;
};

export type DoctorFormField = keyof DoctorFormValues;
export type DoctorFormErrors = Partial<Record<DoctorFormField, string>>;
export type DoctorFormTouched = Partial<Record<DoctorFormField, boolean>>;

export const REQUIRED_DOCTOR_FIELDS: DoctorFormField[] = [
  'nombre',
  'apellidoPaterno',
];

export function createEmptyDoctorForm(): DoctorFormValues {
  return {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    especialidad: '',
    cedulaProfesional: '',
    telefono: '',
    email: '',
    notas: '',
  };
}

export function createTouchedDoctorForm(
  fields: DoctorFormField[] = Object.keys(
    createEmptyDoctorForm(),
  ) as DoctorFormField[],
): DoctorFormTouched {
  return fields.reduce<DoctorFormTouched>((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}

export function validateDoctorForm(formData: DoctorFormValues): DoctorFormErrors {
  const errors: DoctorFormErrors = {};

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.';
  }

  if (!formData.apellidoPaterno.trim()) {
    errors.apellidoPaterno = 'El apellido paterno es obligatorio.';
  }

  const phone = formData.telefono.trim();
  if (phone && !/^\d{7,15}$/.test(phone)) {
    errors.telefono = 'El teléfono debe tener entre 7 y 15 dígitos.';
  }

  const email = formData.email.trim();
  if (
    email &&
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
  ) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (formData.especialidad.trim().length > 150) {
    errors.especialidad = 'La especialidad no puede exceder 150 caracteres.';
  }

  if (formData.cedulaProfesional.trim().length > 50) {
    errors.cedulaProfesional = 'La cédula profesional no puede exceder 50 caracteres.';
  }

  if (formData.notas.trim().length > 2000) {
    errors.notas = 'Las notas no pueden exceder 2000 caracteres.';
  }

  return errors;
}

export function hasDoctorFormErrors(errors: DoctorFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapDoctorToForm(doctor: Doctor): DoctorFormValues {
  return {
    nombre: doctor.firstName ?? '',
    apellidoPaterno: doctor.lastName ?? '',
    apellidoMaterno: doctor.middleName ?? '',
    especialidad: doctor.specialty ?? '',
    cedulaProfesional: doctor.licenseNumber ?? '',
    telefono: doctor.phone ?? '',
    email: doctor.email ?? '',
    notas: doctor.notes ?? '',
  };
}

function clean(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function mapFormToPayload(formData: DoctorFormValues): CreateDoctorPayload {
  return {
    firstName: formData.nombre.trim().toUpperCase(),
    lastName: formData.apellidoPaterno.trim().toUpperCase(),
    middleName: clean(formData.apellidoMaterno)?.toUpperCase(),
    specialty: clean(formData.especialidad),
    licenseNumber: clean(formData.cedulaProfesional),
    phone: clean(formData.telefono),
    email: clean(formData.email),
    notes: clean(formData.notas),
  };
}
