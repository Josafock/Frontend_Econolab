import type {
  Study,
  StudyDetail,
  StudyDetailDataType,
  StudyStatus,
  StudyType,
} from "@/features/studies/api/studies";

export function formatStudyDuration(minutes?: number | null): string {
  const totalMinutes = Math.max(0, Number(minutes ?? 0));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

export function minutesToTimeValue(minutes?: number | null): string {
  const safeMinutes = Math.max(1, Number(minutes ?? 60));
  const normalizedHours = Math.floor(safeMinutes / 60);
  const normalizedMinutes = safeMinutes % 60;
  return `${String(normalizedHours).padStart(2, "0")}:${String(normalizedMinutes).padStart(2, "0")}`;
}

export function timeValueToMinutes(value: string): number {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 60;
  }

  const total = hours * 60 + minutes;
  return total > 0 ? total : 60;
}

export function getStudyTypeLabel(type: StudyType): string {
  if (type === "study") return "Estudio";
  if (type === "package") return "Paquete";
  return "Otro";
}

export function getStudyStatusLabel(status: StudyStatus): string {
  return status === "active" ? "Activo" : "Suspendido";
}

export function getStudyTypeColor(type: StudyType): string {
  if (type === "study") return "bg-blue-100 text-blue-800";
  if (type === "package") return "bg-violet-100 text-violet-800";
  return "bg-gray-100 text-gray-700";
}

export function getStudyStatusColor(status: StudyStatus): string {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getStudySummary(study: Study) {
  return {
    duration: formatStudyDuration(study.durationMinutes),
    typeLabel: getStudyTypeLabel(study.type),
    statusLabel: getStudyStatusLabel(study.status),
  };
}

export function getStudyDetailTypeLabel(
  detail: Pick<StudyDetail, "dataType" | "parentId"> | { dataType: StudyDetailDataType; parentId?: number | null },
): string {
  if (detail.dataType === "category") return "Categoria";
  return detail.parentId ? "Parametro en categoria" : "Parametro libre";
}

export function sortStudyDetails(details: StudyDetail[]): StudyDetail[] {
  return [...details].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name, "es-MX");
  });
}
