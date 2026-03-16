import type {
  CreateStudyPayload,
  Study,
  StudyStatus,
  StudyType,
  UpdateStudyPayload,
} from "@/actions/studies/studiesActions";
import { minutesToTimeValue, timeValueToMinutes } from "@/helpers/studies";

export type StudyFormValues = {
  nombre: string;
  clave: string;
  descripcion: string;
  duracion: string;
  tipo: StudyType;
  precioNormal: string;
  precioDif: string;
  precioEspecial: string;
  precioHospital: string;
  otros: string;
  descuento: string;
  metodo: string;
  indicador: string;
  estatus: StudyStatus;
};

export type StudyFormField = keyof StudyFormValues;
export type StudyFormErrors = Partial<Record<StudyFormField, string>>;
export type StudyFormTouched = Partial<Record<StudyFormField, boolean>>;
export type StudyDurationPart = "hours" | "minutes";

export const REQUIRED_STUDY_FIELDS: StudyFormField[] = [
  "nombre",
  "clave",
  "duracion",
  "tipo",
  "precioNormal",
];

function validateMoneyField(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} es obligatorio.`;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} debe ser numerico.`;
  if (parsed < 0) return `${label} no puede ser negativo.`;
  return undefined;
}

function normalizeText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function splitDurationValue(value: string): {
  hours: string;
  minutes: string;
} {
  const [hours = "", minutes = ""] = value.split(":");
  return {
    hours: hours.replace(/\D/g, "").slice(0, 3),
    minutes: minutes.replace(/\D/g, "").slice(0, 2),
  };
}

export function updateDurationValue(
  currentValue: string,
  part: StudyDurationPart,
  nextValue: string,
): string {
  const current = splitDurationValue(currentValue);
  const sanitizedValue = nextValue.replace(/\D/g, "");

  if (part === "hours") {
    return `${sanitizedValue.slice(0, 3)}:${current.minutes}`;
  }

  const clippedMinutes = sanitizedValue.slice(0, 2);
  if (!clippedMinutes) {
    return `${current.hours}:`;
  }

  const normalizedMinutes = String(Math.min(Number(clippedMinutes), 59));
  return `${current.hours}:${normalizedMinutes}`;
}

export function createEmptyStudyForm(initialType: StudyType = "study"): StudyFormValues {
  return {
    nombre: "",
    clave: "",
    descripcion: "",
    duracion: "01:00",
    tipo: initialType,
    precioNormal: "0.00",
    precioDif: "0.00",
    precioEspecial: "0.00",
    precioHospital: "0.00",
    otros: "0.00",
    descuento: "0.00",
    metodo: "",
    indicador: "",
    estatus: "active",
  };
}

export function createTouchedStudyForm(): StudyFormTouched {
  return {
    nombre: true,
    clave: true,
    descripcion: true,
    duracion: true,
    tipo: true,
    precioNormal: true,
    precioDif: true,
    precioEspecial: true,
    precioHospital: true,
    otros: true,
    descuento: true,
    metodo: true,
    indicador: true,
    estatus: true,
  };
}

export function validateStudyForm(values: StudyFormValues): StudyFormErrors {
  const errors: StudyFormErrors = {};
  const isPackage = values.tipo === "package";

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre del analisis es obligatorio.";
  } else if (values.nombre.trim().length > 200) {
    errors.nombre = "El nombre no puede exceder 200 caracteres.";
  }

  if (!values.clave.trim()) {
    errors.clave = "La clave es obligatoria.";
  } else if (values.clave.trim().length > 50) {
    errors.clave = "La clave no puede exceder 50 caracteres.";
  }

  if (!values.duracion.trim()) {
    errors.duracion = "La duracion es obligatoria.";
  } else {
    const [hoursRaw, minutesRaw] = values.duracion.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59 ||
      hours * 60 + minutes <= 0
    ) {
      errors.duracion = "Captura una duracion valida en formato HH:MM.";
    }
  }

  if (!values.descripcion.trim()) {
    errors.descripcion = "La descripcion es obligatoria.";
  }

  errors.precioNormal = validateMoneyField(values.precioNormal, "El precio normal");
  errors.precioDif = validateMoneyField(values.precioDif, "El precio DIF");
  errors.precioEspecial = validateMoneyField(values.precioEspecial, "El precio especial");
  errors.precioHospital = validateMoneyField(values.precioHospital, "El precio hospital");
  errors.otros = validateMoneyField(values.otros, "El campo otros");
  errors.descuento = validateMoneyField(values.descuento, "El descuento");

  if (!isPackage && values.metodo.trim().length > 150) {
    errors.metodo = "El metodo no puede exceder 150 caracteres.";
  }

  if (!isPackage && values.indicador.trim().length > 150) {
    errors.indicador = "El indicador no puede exceder 150 caracteres.";
  }

  return errors;
}

export function hasStudyFormErrors(errors: StudyFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function mapFormToCreateStudyPayload(values: StudyFormValues): CreateStudyPayload {
  const isPackage = values.tipo === "package";

  return {
    name: values.nombre.trim().toUpperCase(),
    code: values.clave.trim().toUpperCase(),
    description: normalizeText(values.descripcion),
    durationMinutes: timeValueToMinutes(values.duracion),
    type: values.tipo,
    normalPrice: Number(values.precioNormal),
    difPrice: Number(values.precioDif),
    specialPrice: Number(values.precioEspecial),
    hospitalPrice: Number(values.precioHospital),
    otherPrice: Number(values.otros),
    defaultDiscountPercent: Number(values.descuento),
    method: isPackage ? undefined : normalizeText(values.metodo),
    indicator: isPackage ? undefined : normalizeText(values.indicador),
    status: values.estatus,
  };
}

export function mapFormToUpdateStudyPayload(values: StudyFormValues): UpdateStudyPayload {
  return mapFormToCreateStudyPayload(values);
}

export function mapStudyToForm(study: Study): StudyFormValues {
  return {
    nombre: study.name ?? "",
    clave: study.code ?? "",
    descripcion: study.description ?? "",
    duracion: minutesToTimeValue(study.durationMinutes),
    tipo: study.type,
    precioNormal: Number(study.normalPrice ?? 0).toFixed(2),
    precioDif: Number(study.difPrice ?? 0).toFixed(2),
    precioEspecial: Number(study.specialPrice ?? 0).toFixed(2),
    precioHospital: Number(study.hospitalPrice ?? 0).toFixed(2),
    otros: Number(study.otherPrice ?? 0).toFixed(2),
    descuento: Number(study.defaultDiscountPercent ?? 0).toFixed(2),
    metodo: study.method ?? "",
    indicador: study.indicator ?? "",
    estatus: study.status,
  };
}
