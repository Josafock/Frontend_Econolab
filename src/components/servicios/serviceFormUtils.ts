import type {
  CreateServicePayload,
  ServiceItemPriceType,
  ServiceOrder,
} from "@/features/services/api/services";
import type { Study } from "@/features/studies/api/studies";
import { toApiDateTime, toDateTimeLocalInput } from "@/helpers/date";

export const SERVICE_BRANCH_OPTIONS = ["Matriz", "Unidad Movil"] as const;

export type ServiceDraftItem = {
  id: string;
  studyId: number;
  priceType: ServiceItemPriceType;
  quantity: number;
  defaultDiscountPercent: number;
  useDefaultDiscount: boolean;
  discountPercent: number;
};

export type ServiceFormValues = {
  folio: string;
  patientId: string;
  doctorId: string;
  branchName: string;
  sampleAt: string;
  deliveryAt: string;
  courtesyPercent: string;
  notes: string;
  items: ServiceDraftItem[];
};

export type ServiceFormErrors = Partial<
  Record<
    | "folio"
    | "patientId"
    | "branchName"
    | "deliveryAt"
    | "courtesyPercent"
    | "items",
    string
  >
>;

export function generateSuggestedServiceFolio() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ];

  return `ECO${parts.join("")}0001`;
}

export function isGeneratedServiceFolio(value: string) {
  return /^ECO\d{12}$/i.test(value.trim());
}

export function createEmptyServiceForm(): ServiceFormValues {
  return {
    folio: generateSuggestedServiceFolio(),
    patientId: "",
    doctorId: "",
    branchName: SERVICE_BRANCH_OPTIONS[0],
    sampleAt: "",
    deliveryAt: "",
    courtesyPercent: "0",
    notes: "",
    items: [],
  };
}

export function createServiceDraftItem(
  studyId: number,
  overrides?: Partial<ServiceDraftItem>,
): ServiceDraftItem {
  const defaultDiscountPercent = Number(overrides?.defaultDiscountPercent ?? 0);
  const useDefaultDiscount = overrides?.useDefaultDiscount ?? defaultDiscountPercent > 0;

  return {
    id: `${studyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studyId,
    priceType: "normal",
    quantity: 1,
    defaultDiscountPercent,
    useDefaultDiscount,
    discountPercent: useDefaultDiscount ? defaultDiscountPercent : 0,
    ...overrides,
  };
}

export function mapServiceToForm(service: ServiceOrder): ServiceFormValues {
  const groupedPackageItems = new Set<number>();
  const items: ServiceDraftItem[] = [];

  for (const item of service.items ?? []) {
    if (item.sourcePackageId) {
      if (groupedPackageItems.has(item.sourcePackageId)) {
        continue;
      }

      groupedPackageItems.add(item.sourcePackageId);
      items.push(
        createServiceDraftItem(item.sourcePackageId, {
          priceType: item.priceType,
          quantity: item.quantity,
          defaultDiscountPercent: Number(item.discountPercent ?? 0),
          useDefaultDiscount: Number(item.discountPercent ?? 0) > 0,
          discountPercent: Number(item.discountPercent ?? 0),
        }),
      );
      continue;
    }

    items.push(
      createServiceDraftItem(item.studyId, {
        priceType: item.priceType,
        quantity: item.quantity,
        defaultDiscountPercent: Number(item.discountPercent ?? 0),
        useDefaultDiscount: Number(item.discountPercent ?? 0) > 0,
        discountPercent: Number(item.discountPercent ?? 0),
      }),
    );
  }

  return {
    folio: service.folio ?? generateSuggestedServiceFolio(),
    patientId: service.patientId ? String(service.patientId) : "",
    doctorId: service.doctorId ? String(service.doctorId) : "",
    branchName: service.branchName ?? SERVICE_BRANCH_OPTIONS[0],
    sampleAt: toDateTimeLocalInput(service.sampleAt),
    deliveryAt: toDateTimeLocalInput(service.deliveryAt),
    courtesyPercent: String(Number(service.courtesyPercent ?? 0)),
    notes: service.notes ?? "",
    items,
  };
}

export function validateServiceForm(formData: ServiceFormValues): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  const courtesy = Number(formData.courtesyPercent || 0);

  if (!formData.folio.trim()) {
    errors.folio = "El folio es obligatorio.";
  }

  if (!formData.patientId) {
    errors.patientId = "Selecciona un paciente.";
  }

  if (!formData.branchName.trim()) {
    errors.branchName = "Selecciona una sucursal.";
  }

  if (!formData.deliveryAt) {
    errors.deliveryAt = "Captura la fecha de entrega.";
  }

  if (Number.isNaN(courtesy) || courtesy < 0 || courtesy > 100) {
    errors.courtesyPercent = "La cortesia debe estar entre 0 y 100.";
  }

  if (formData.items.length === 0) {
    errors.items = "Agrega al menos un estudio o paquete.";
  }

  return errors;
}

export function hasServiceFormErrors(errors: ServiceFormErrors) {
  return Object.keys(errors).length > 0;
}

export function getStudyPriceByType(
  study: Pick<
    Study,
    "normalPrice" | "difPrice" | "specialPrice" | "hospitalPrice" | "otherPrice"
  >,
  priceType: ServiceItemPriceType,
) {
  switch (priceType) {
    case "dif":
      return Number(study.difPrice);
    case "special":
      return Number(study.specialPrice);
    case "hospital":
      return Number(study.hospitalPrice);
    case "other":
      return Number(study.otherPrice);
    case "normal":
    default:
      return Number(study.normalPrice);
  }
}

export function getServicePriceTypeLabel(priceType: ServiceItemPriceType) {
  switch (priceType) {
    case "dif":
      return "DIF";
    case "special":
      return "Especial";
    case "hospital":
      return "Hospital";
    case "other":
      return "Otro";
    case "normal":
    default:
      return "Normal";
  }
}

export function getStudyNameSummary(study?: Study | null) {
  if (!study) return "Estudio no disponible";

  if (study.type === "package") {
    return `${study.name} (${study.packageStudyIds?.length ?? 0} estudios)`;
  }

  return study.name;
}

export function calculateServiceTotals(
  items: ServiceDraftItem[],
  studies: Study[],
  courtesyPercent: number,
) {
  const detailedItems = items.map((item) => {
    const study = studies.find((candidate) => candidate.id === item.studyId);
    const unitPrice = study ? getStudyPriceByType(study, item.priceType) : 0;
    const baseAmount = unitPrice * item.quantity;
    const appliedDiscountPercent = Number(item.discountPercent || 0);
    const discountAmount = baseAmount * (appliedDiscountPercent / 100);
    const subtotalAmount = baseAmount - discountAmount;

    return {
      ...item,
      study,
      unitPrice,
      baseAmount,
      discountAmount,
      appliedDiscountPercent,
      subtotalAmount,
    };
  });

  const baseSubtotal = detailedItems.reduce((acc, item) => acc + item.baseAmount, 0);
  const itemDiscountAmount = detailedItems.reduce((acc, item) => acc + item.discountAmount, 0);
  const subtotal = detailedItems.reduce((acc, item) => acc + item.subtotalAmount, 0);
  const courtesyDiscountAmount = subtotal * (courtesyPercent / 100);
  const totalAmount = subtotal - courtesyDiscountAmount;

  return {
    items: detailedItems,
    baseSubtotal,
    itemDiscountAmount,
    subtotal,
    courtesyDiscountAmount,
    discountAmount: courtesyDiscountAmount,
    totalAmount,
  };
}

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function mapServiceFormToPayload(
  formData: ServiceFormValues,
  options?: { autoGenerateFolio?: boolean },
): CreateServicePayload {
  const courtesyPercent = Number(formData.courtesyPercent || 0);

  return {
    folio: formData.folio.trim().toUpperCase(),
    autoGenerateFolio: options?.autoGenerateFolio,
    patientId: Number(formData.patientId),
    doctorId: formData.doctorId ? Number(formData.doctorId) : undefined,
    branchName: clean(formData.branchName),
    sampleAt: toApiDateTime(formData.sampleAt),
    deliveryAt: toApiDateTime(formData.deliveryAt),
    courtesyPercent: Number.isFinite(courtesyPercent) ? courtesyPercent : 0,
    notes: clean(formData.notes),
    items: formData.items.map((item) => ({
      studyId: item.studyId,
      priceType: item.priceType,
      quantity: item.quantity,
      discountPercent: item.discountPercent,
    })),
  };
}
