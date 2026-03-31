"use client";

type DetailHrefOptions = {
  mode?: string;
  hash?: string;
};

function normalizeHash(hash?: string) {
  if (!hash) {
    return "";
  }

  return hash.startsWith("#") ? hash : `#${hash}`;
}

function buildDetailHref(
  basePath: string,
  id: number | string,
  options?: DetailHrefOptions,
) {
  const params = new URLSearchParams({
    id: String(id),
  });

  if (options?.mode) {
    params.set("modo", options.mode);
  }

  return `${basePath}?${params.toString()}${normalizeHash(options?.hash)}`;
}

export function buildDoctorDetailHref(
  id: number | string,
  options?: DetailHrefOptions,
) {
  return buildDetailHref("/medicos/detalle", id, options);
}

export function buildPatientDetailHref(
  id: number | string,
  options?: DetailHrefOptions,
) {
  return buildDetailHref("/pacientes/detalle", id, options);
}

export function buildStudyDetailHref(
  id: number | string,
  options?: DetailHrefOptions,
) {
  return buildDetailHref("/estudios/detalle", id, options);
}

export function buildServiceDetailHref(
  id: number | string,
  options?: DetailHrefOptions,
) {
  return buildDetailHref("/servicios/detalle", id, options);
}
