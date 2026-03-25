import "server-only";

import { cache } from "react";
import {
  getStudies,
  getStudyById,
  getStudyDetails,
  type Study,
  type StudyDetail,
} from "@/actions/studies/studiesActions";

export const getStudiesCatalog = cache(async () => {
  const response = await getStudies({ limit: 1000 });

  if (!response.ok) {
    return {
      studies: [] as Study[],
      error:
        response.errors[0] ??
        "No se pudieron cargar los estudios en este momento.",
    };
  }

  return {
    studies: response.data.data,
    error: null,
  };
});

export const getStudyDetail = cache(async (id: number) => {
  if (!Number.isInteger(id) || id < 1) {
    return {
      study: null as Study | null,
      details: [] as StudyDetail[],
      availableStudies: [] as Study[],
      error: "ID de estudio invalido.",
    };
  }

  const [studyResponse, detailsResponse, studiesCatalogResponse] =
    await Promise.all([
      getStudyById(id),
      getStudyDetails(id),
      getStudies({ limit: 500, type: "study" }),
    ]);

  if (!studyResponse.ok) {
    return {
      study: null as Study | null,
      details: [] as StudyDetail[],
      availableStudies: [] as Study[],
      error: studyResponse.errors[0] ?? "No se pudo cargar el estudio.",
    };
  }

  if (!detailsResponse.ok) {
    return {
      study: null as Study | null,
      details: [] as StudyDetail[],
      availableStudies: [] as Study[],
      error:
        detailsResponse.errors[0] ??
        "No se pudo cargar la configuracion del estudio.",
    };
  }

  if (!studiesCatalogResponse.ok) {
    return {
      study: null as Study | null,
      details: [] as StudyDetail[],
      availableStudies: [] as Study[],
      error:
        studiesCatalogResponse.errors[0] ??
        "No se pudo cargar el catalogo de estudios.",
    };
  }

  return {
    study: studyResponse.data,
    details: detailsResponse.data,
    availableStudies: studiesCatalogResponse.data.data.filter(
      (candidate) => candidate.id !== studyResponse.data.id,
    ),
    error: null,
  };
});
