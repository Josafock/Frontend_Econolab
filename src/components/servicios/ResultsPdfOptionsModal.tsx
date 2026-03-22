"use client";

import { useMemo, useState } from "react";
import { FileDown, SlidersHorizontal, X } from "lucide-react";
import AppModal from "@/components/ui/AppModal";

type ResultSignatureMode = "with" | "without";
type ResultCategoryLayout = "continuous" | "page-per-category";
type ResultStudyLayout = "continuous" | "page-per-study";

type ResultPrintOptions = {
  signature: ResultSignatureMode;
  categoryLayout: ResultCategoryLayout;
  studyLayout: ResultStudyLayout;
};

type ResultsPdfOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  serviceId: number | null;
  serviceLabel?: string;
};

const DEFAULT_PRINT_OPTIONS: ResultPrintOptions = {
  signature: "with",
  categoryLayout: "continuous",
  studyLayout: "continuous",
};

export default function ResultsPdfOptionsModal({
  open,
  onClose,
  serviceId,
  serviceLabel,
}: ResultsPdfOptionsModalProps) {
  const [printOptions, setPrintOptions] = useState<ResultPrintOptions>(
    DEFAULT_PRINT_OPTIONS,
  );

  const pdfHref = useMemo(() => {
    if (!serviceId) {
      return "#";
    }

    const params = new URLSearchParams({
      signature: printOptions.signature,
      categoryLayout: printOptions.categoryLayout,
      studyLayout: printOptions.studyLayout,
    });

    return `/api/services/${serviceId}/results?${params.toString()}`;
  }, [printOptions, serviceId]);

  const updatePrintOption = <K extends keyof ResultPrintOptions>(
    key: K,
    value: ResultPrintOptions[K],
  ) => {
    setPrintOptions((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (!open || !serviceId) {
    return null;
  }

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]">
          <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-4 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/20 bg-white/10 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <SlidersHorizontal className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    Opciones de PDF de resultados
                  </h2>
                  <p className="mt-1 text-sm text-emerald-50/90">
                    Ajusta firma y distribucion por hojas antes de abrir el PDF.
                  </p>
                  {serviceLabel ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/75">
                      {serviceLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-6 sm:p-6">
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                  Estas opciones aplican al PDF consolidado del servicio y te
                  ayudan a separar mejor estudios o categorias sin saturar la
                  pantalla principal.
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Firma
                    </span>
                    <select
                      value={printOptions.signature}
                      onChange={(event) =>
                        updatePrintOption(
                          "signature",
                          event.target.value as ResultSignatureMode,
                        )
                      }
                      className="mt-3 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="with">Con firma</option>
                      <option value="without">Sin firma</option>
                    </select>
                    <span className="mt-2 block text-xs text-gray-500">
                      Muestra u oculta la firma del responsable sanitario.
                    </span>
                  </label>

                  <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Categorias
                    </span>
                    <select
                      value={printOptions.categoryLayout}
                      onChange={(event) =>
                        updatePrintOption(
                          "categoryLayout",
                          event.target.value as ResultCategoryLayout,
                        )
                      }
                      className="mt-3 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="continuous">Todas seguidas</option>
                      <option value="page-per-category">
                        Una categoria por hoja
                      </option>
                    </select>
                    <span className="mt-2 block text-xs text-gray-500">
                      Util si el estudio trae varios bloques y quieres
                      separarlos.
                    </span>
                  </label>

                  <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estudios
                    </span>
                    <select
                      value={printOptions.studyLayout}
                      onChange={(event) =>
                        updatePrintOption(
                          "studyLayout",
                          event.target.value as ResultStudyLayout,
                        )
                      }
                      className="mt-3 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="continuous">Todos juntos</option>
                      <option value="page-per-study">
                        Un estudio por hoja
                      </option>
                    </select>
                    <span className="mt-2 block text-xs text-gray-500">
                      Perfecto para paquetes o servicios con varios estudios.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:flex-row sm:p-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Cancelar
              </button>

              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
              >
                <FileDown className="h-4 w-4" />
                Abrir PDF de resultados
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
