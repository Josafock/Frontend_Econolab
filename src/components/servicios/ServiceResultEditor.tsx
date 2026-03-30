"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileDown,
  FlaskConical,
  Loader2,
  Save,
} from "lucide-react";
import type {
  StudyResult,
  StudyResultValue,
  UpdateStudyResultPayload,
} from "@/features/results/api/results";
import { updateStudyResult } from "@/features/results/api/results";
import type { StudyDetail } from "@/features/studies/api/studies";
import {
  formatDateTime,
  toApiDateTime,
  toDateTimeLocalInput,
} from "@/helpers/date";
import { useOffline } from "@/lib/offline/network-state";
import { enqueueSyncItem } from "@/lib/offline/sync-queue";
import { toast } from "react-toastify";

type ServiceResultEditorProps = {
  serviceId: number;
  serviceItem: {
    id: number;
    studyId: number;
    studyNameSnapshot: string;
    sourcePackageNameSnapshot?: string | null;
  };
  initialResult: StudyResult;
  studyDetails: StudyDetail[];
  pdfHref?: string;
  onOpenPdfOptions?: () => void;
  onSaved: (result: StudyResult) => void;
};

type ResultFormValue = {
  id: number;
  studyDetailId?: number | null;
  label: string;
  unit: string;
  referenceValue: string;
  value: string;
  sortOrder: number;
  visible: boolean;
};

function mapResultValues(values: StudyResultValue[]): ResultFormValue[] {
  return values
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((value) => ({
      id: value.id,
      studyDetailId: value.studyDetailId,
      label: value.label ?? "",
      unit: value.unit ?? "",
      referenceValue: value.referenceValue ?? "",
      value: value.value ?? "",
      sortOrder: value.sortOrder,
      visible: value.visible,
    }));
}

function applyLocalResultUpdate(
  currentResult: StudyResult,
  payload: UpdateStudyResultPayload,
): StudyResult {
  return {
    ...currentResult,
    sampleAt: payload.sampleAt ?? currentResult.sampleAt,
    reportedAt: payload.reportedAt ?? currentResult.reportedAt,
    method: payload.method ?? currentResult.method,
    observations: payload.observations ?? currentResult.observations,
    isDraft: payload.isDraft ?? currentResult.isDraft,
    values:
      payload.values?.map((value, index) => ({
        id: currentResult.values[index]?.id ?? -(Date.now() + index),
        studyResultId: currentResult.id,
        studyDetailId: value.studyDetailId ?? null,
        label: value.label,
        unit: value.unit ?? null,
        referenceValue: value.referenceValue ?? null,
        value: value.value ?? null,
        sortOrder: value.sortOrder,
        visible: value.visible,
      })) ?? currentResult.values,
    updatedAt: new Date().toISOString(),
  };
}

export default function ServiceResultEditor({
  serviceId,
  serviceItem,
  initialResult,
  studyDetails,
  pdfHref,
  onOpenPdfOptions,
  onSaved,
}: ServiceResultEditorProps) {
  const { isOnline } = useOffline();
  const [result, setResult] = useState(initialResult);
  const [sampleAt, setSampleAt] = useState(
    toDateTimeLocalInput(initialResult.sampleAt),
  );
  const [reportedAt, setReportedAt] = useState(
    toDateTimeLocalInput(initialResult.reportedAt),
  );
  const [method, setMethod] = useState(initialResult.method ?? "");
  const [observations, setObservations] = useState(
    initialResult.observations ?? "",
  );
  const [values, setValues] = useState<ResultFormValue[]>(
    mapResultValues(initialResult.values),
  );
  const [savingMode, setSavingMode] = useState<"draft" | "final" | null>(null);

  useEffect(() => {
    setResult(initialResult);
    setSampleAt(toDateTimeLocalInput(initialResult.sampleAt));
    setReportedAt(toDateTimeLocalInput(initialResult.reportedAt));
    setMethod(initialResult.method ?? "");
    setObservations(initialResult.observations ?? "");
    setValues(mapResultValues(initialResult.values));
  }, [initialResult]);

  const detailById = useMemo(
    () => new Map(studyDetails.map((detail) => [detail.id, detail])),
    [studyDetails],
  );

  const groupedRows = useMemo(() => {
    const categories = studyDetails
      .filter(
        (detail) => detail.dataType === "category" && detail.isActive !== false,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const categoryGroups = categories.map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      rows: values.filter(
        (value) =>
          detailById.get(value.studyDetailId ?? -1)?.parentId === category.id,
      ),
    }));
    const uncategorized = values.filter((value) => {
      const detail = detailById.get(value.studyDetailId ?? -1);
      return !detail?.parentId;
    });

    return {
      categories: categoryGroups.filter((group) => group.rows.length > 0),
      uncategorized,
    };
  }, [detailById, studyDetails, values]);

  const handleValueChange = (
    valueId: number,
    field: keyof Omit<ResultFormValue, "id" | "studyDetailId" | "sortOrder">,
    nextValue: string | boolean,
  ) => {
    setValues((current) =>
      current.map((value) =>
        value.id === valueId
          ? {
              ...value,
              [field]: nextValue,
            }
          : value,
      ),
    );
  };

  const saveResult = async (mode: "draft" | "final") => {
    setSavingMode(mode);

    const payload: UpdateStudyResultPayload = {
      serviceOrderId: serviceId,
      serviceOrderItemId: serviceItem.id,
      sampleAt: toApiDateTime(sampleAt),
      reportedAt:
        mode === "final"
          ? toApiDateTime(
              reportedAt || toDateTimeLocalInput(new Date().toISOString()),
            )
          : toApiDateTime(reportedAt),
      method: method.trim() || undefined,
      observations: observations.trim() || undefined,
      isDraft: mode !== "final",
      values: values.map((value) => ({
        studyDetailId: value.studyDetailId ?? undefined,
        label: value.label.trim(),
        unit: value.unit.trim() || undefined,
        referenceValue: value.referenceValue.trim() || undefined,
        value: value.value.trim() || undefined,
        sortOrder: value.sortOrder,
        visible: value.visible,
      })),
    };

    if (!isOnline) {
      enqueueSyncItem({
        scope: "results",
        entityType: "study-result",
        entityId: result.id,
        operation: "update",
        payload,
      });

      const nextResult = applyLocalResultUpdate(result, payload);
      setResult(nextResult);
      onSaved(nextResult);
      toast.success(
        mode === "final"
          ? "Resultado guardado localmente y pendiente de sincronizacion."
          : "Borrador guardado localmente.",
      );
      setSavingMode(null);
      return;
    }

    const response = await updateStudyResult(result.id, payload);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo guardar el resultado.");
      setSavingMode(null);
      return;
    }

    setResult(response.data.data);
    onSaved(response.data.data);
    toast.success(
      mode === "final" ? "Resultado cerrado con exito." : "Borrador guardado.",
    );
    setSavingMode(null);
  };

  const renderRows = (rows: ResultFormValue[]) => {
    return rows.map((value) => (
      <div
        key={value.id}
        className="grid gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 md:grid-cols-[1.1fr_0.7fr_0.8fr_1.1fr_auto]"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Parametro
          </p>
          <input
            value={value.label}
            onChange={(e) =>
              handleValueChange(value.id, "label", e.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resultado
          </p>
          <input
            value={value.value}
            onChange={(e) =>
              handleValueChange(value.id, "value", e.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Unidad
          </p>
          <input
            value={value.unit}
            onChange={(e) =>
              handleValueChange(value.id, "unit", e.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Referencia
          </p>
          <textarea
            value={value.referenceValue}
            onChange={(e) =>
              handleValueChange(value.id, "referenceValue", e.target.value)
            }
            className="mt-2 min-h-[76px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <label className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={value.visible}
            onChange={(e) =>
              handleValueChange(value.id, "visible", e.target.checked)
            }
          />
          Visible
        </label>
      </div>
    ));
  };

  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {serviceItem.studyNameSnapshot}
            </h3>
            {serviceItem.sourcePackageNameSnapshot ? (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                {serviceItem.sourcePackageNameSnapshot}
              </span>
            ) : null}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                result.isDraft
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {result.isDraft ? "Borrador" : "Cerrado"}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Captura los valores del estudio, ajusta unidades y define que
            parametros saldran en el PDF.
          </p>
        </div>

        {onOpenPdfOptions ? (
          <button
            type="button"
            onClick={onOpenPdfOptions}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            PDF servicio
          </button>
        ) : pdfHref ? (
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            PDF servicio
          </a>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              Metadatos del resultado
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha de muestra
                </label>
                <input
                  type="datetime-local"
                  value={sampleAt}
                  onChange={(e) => setSampleAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha de reporte
                </label>
                <input
                  type="datetime-local"
                  value={reportedAt}
                  onChange={(e) => setReportedAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Metodo
                </label>
                <input
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Metodo o tecnica utilizada"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Observaciones
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-900 p-4 text-white">
            <p className="text-sm font-semibold">Estado actual</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Ultima captura</span>
                <span>{formatDateTime(result.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reporte</span>
                <span>
                  {reportedAt
                    ? formatDateTime(toApiDateTime(reportedAt))
                    : "Sin cerrar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {groupedRows.categories.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                  {group.label}
                </p>
              </div>
              <div className="space-y-3">{renderRows(group.rows)}</div>
            </div>
          ))}

          {groupedRows.uncategorized.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-900">
                Parametros sin categoria
              </p>
              <div className="space-y-3">
                {renderRows(groupedRows.uncategorized)}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void saveResult("draft")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
              disabled={savingMode !== null}
            >
              {savingMode === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar borrador
            </button>

            <button
              type="button"
              onClick={() => void saveResult("final")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              disabled={savingMode !== null}
            >
              {savingMode === "final" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Cerrar resultado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
