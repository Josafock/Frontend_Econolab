import type {
  CreateStudyDetailPayload,
  StudyDetail,
  StudyDetailDataType,
  UpdateStudyDetailPayload,
} from "@/actions/studies/studiesActions";

export type StudyDetailFormValues = {
  dataType: StudyDetailDataType;
  parentId: string;
  name: string;
  sortOrder: string;
  unit: string;
  referenceValue: string;
};

export type StudyDetailFormField = keyof StudyDetailFormValues;
export type StudyDetailFormErrors = Partial<Record<StudyDetailFormField, string>>;
export type StudyDetailFormTouched = Partial<Record<StudyDetailFormField, boolean>>;

export type StudyDetailBulkFormValues = {
  parentId: string;
  sortOrderStart: string;
  bulkInput: string;
};

export type StudyDetailBulkFormField = keyof StudyDetailBulkFormValues;
export type StudyDetailBulkFormErrors = Partial<
  Record<StudyDetailBulkFormField, string>
>;

export function createEmptyStudyDetailForm(): StudyDetailFormValues {
  return {
    dataType: "category",
    parentId: "",
    name: "",
    sortOrder: "1",
    unit: "",
    referenceValue: "",
  };
}

export function createTouchedStudyDetailForm(): StudyDetailFormTouched {
  return {
    dataType: true,
    parentId: true,
    name: true,
    sortOrder: true,
    unit: true,
    referenceValue: true,
  };
}

export function createEmptyStudyDetailBulkForm(
  sortOrderStart = "1",
): StudyDetailBulkFormValues {
  return {
    parentId: "",
    sortOrderStart,
    bulkInput: "",
  };
}

export function validateStudyDetailForm(
  values: StudyDetailFormValues,
): StudyDetailFormErrors {
  const errors: StudyDetailFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "El nombre es obligatorio.";
  } else if (values.name.trim().length > 150) {
    errors.name = "El nombre no puede exceder 150 caracteres.";
  }

  if (!values.sortOrder.trim()) {
    errors.sortOrder = "El orden es obligatorio.";
  } else {
    const parsed = Number(values.sortOrder);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.sortOrder = "El orden debe ser un entero mayor a cero.";
    }
  }

  return errors;
}

export function hasStudyDetailFormErrors(
  errors: StudyDetailFormErrors,
): boolean {
  return Object.values(errors).some(Boolean);
}

export function hasStudyDetailBulkFormErrors(
  errors: StudyDetailBulkFormErrors,
): boolean {
  return Object.values(errors).some(Boolean);
}

function normalizeText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function getNormalizedBulkLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateStudyDetailBulkForm(
  values: StudyDetailBulkFormValues,
  mode: StudyDetailDataType,
): StudyDetailBulkFormErrors {
  const errors: StudyDetailBulkFormErrors = {};

  if (!values.sortOrderStart.trim()) {
    errors.sortOrderStart = "El orden inicial es obligatorio.";
  } else {
    const parsed = Number(values.sortOrderStart);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.sortOrderStart = "El orden inicial debe ser un entero mayor a cero.";
    }
  }

  const lines = getNormalizedBulkLines(values.bulkInput);

  if (lines.length === 0) {
    errors.bulkInput =
      mode === "category"
        ? "Captura al menos una categoria."
        : "Captura al menos un parametro.";
    return errors;
  }

  const invalidLine = lines.find((line) => {
    const [name] = line.split("|");
    return !name?.trim() || name.trim().length > 150;
  });

  if (invalidLine) {
    errors.bulkInput =
      "Cada linea debe tener nombre y no exceder 150 caracteres.";
  }

  return errors;
}

export function mapStudyDetailBulkFormToCreatePayloads(
  values: StudyDetailBulkFormValues,
  mode: StudyDetailDataType,
): CreateStudyDetailPayload[] {
  const start = Number(values.sortOrderStart);
  const parentId = values.parentId ? Number(values.parentId) : undefined;

  return getNormalizedBulkLines(values.bulkInput).map((line, index) => {
    if (mode === "category") {
      return {
        dataType: "category",
        name: line.trim().toUpperCase(),
        sortOrder: start + index,
        parentId,
      };
    }

    const [name, unit, referenceValue] = line.split("|").map((part) => part.trim());

    return {
      dataType: "parameter",
      name: name.toUpperCase(),
      sortOrder: start + index,
      parentId,
      unit: normalizeText(unit ?? ""),
      referenceValue: normalizeText(referenceValue ?? ""),
    };
  });
}

export function mapStudyDetailFormToCreatePayload(
  values: StudyDetailFormValues,
): CreateStudyDetailPayload {
  return {
    dataType: values.dataType,
    name: values.name.trim().toUpperCase(),
    sortOrder: Number(values.sortOrder),
    unit: values.dataType === "parameter" ? normalizeText(values.unit) : undefined,
    referenceValue:
      values.dataType === "parameter"
        ? normalizeText(values.referenceValue)
        : undefined,
    parentId: values.parentId ? Number(values.parentId) : undefined,
  };
}

export function mapStudyDetailFormToUpdatePayload(
  values: StudyDetailFormValues,
): UpdateStudyDetailPayload {
  return mapStudyDetailFormToCreatePayload(values);
}

export function mapStudyDetailToForm(detail: StudyDetail): StudyDetailFormValues {
  return {
    dataType: detail.dataType,
    parentId: detail.parentId ? String(detail.parentId) : "",
    name: detail.name ?? "",
    sortOrder: String(detail.sortOrder ?? 1),
    unit: detail.unit ?? "",
    referenceValue: detail.referenceValue ?? "",
  };
}
