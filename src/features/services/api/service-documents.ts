import { fetchProtectedFile } from "@/lib/files/fetch-protected-file";

export type ServiceResultsPdfOptions = {
  signature: "with" | "without";
  categoryLayout: "continuous" | "page-per-category";
  studyLayout: "continuous" | "page-per-study";
};

export function getServiceResultsPdfPath(
  serviceId: number,
  options: ServiceResultsPdfOptions,
) {
  const params = new URLSearchParams({
    signature: options.signature,
    categoryLayout: options.categoryLayout,
    studyLayout: options.studyLayout,
  });

  return `/results/service-order/${serviceId}/pdf?${params.toString()}`;
}

export async function getServiceReceiptFile(serviceId: number) {
  return fetchProtectedFile(
    `/services/${serviceId}/receipt`,
    `recibo-${serviceId}.pdf`,
    "No se pudo generar el recibo.",
  );
}

export async function getServiceTicketFile(serviceId: number) {
  return fetchProtectedFile(
    `/services/${serviceId}/ticket`,
    `ticket-${serviceId}.pdf`,
    "No se pudo generar el ticket.",
  );
}

export async function getServiceLabelsFile(serviceId: number) {
  return fetchProtectedFile(
    `/services/${serviceId}/labels`,
    `etiquetas-${serviceId}.pdf`,
    "No se pudo generar el codigo de barras.",
  );
}

export async function getServiceResultsPdfFile(
  serviceId: number,
  options: ServiceResultsPdfOptions,
) {
  return fetchProtectedFile(
    getServiceResultsPdfPath(serviceId, options),
    `resultado-servicio-${serviceId}.pdf`,
    "No se pudo generar el PDF de resultados.",
  );
}
