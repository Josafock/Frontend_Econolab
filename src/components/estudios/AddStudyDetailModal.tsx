"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type {
  CreateStudyDetailPayload,
  StudyDetail,
} from "@/features/studies/api/studies";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
} from "@/components/ui/Modal";

type AddStudyDetailModalProps = {
  mode: "category" | "parameter";
  categories: StudyDetail[];
  saving: boolean;
  defaultSortOrder: number;
  onClose: () => void;
  onSave: (payloads: CreateStudyDetailPayload[]) => Promise<boolean>;
};

type QuickEntryRow = {
  id: string;
  name: string;
  unit: string;
  referenceValue: string;
  sortOrder: string;
};

type QuickEntryRowErrors = {
  name?: string;
  sortOrder?: string;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500";

function createRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createQuickEntryRow(sortOrder: string): QuickEntryRow {
  return {
    id: createRowId(),
    name: "",
    unit: "",
    referenceValue: "",
    sortOrder,
  };
}

function getFieldRefKey(rowId: string, field: keyof Omit<QuickEntryRow, "id">) {
  return `${rowId}:${field}`;
}

function hasRowContent(row: QuickEntryRow, mode: "category" | "parameter") {
  if (mode === "category") {
    return row.name.trim().length > 0;
  }

  return Boolean(
    row.name.trim() || row.unit.trim() || row.referenceValue.trim(),
  );
}

function getNextSortOrder(rows: QuickEntryRow[], defaultSortOrder: number) {
  const lastRow = rows.at(-1);
  const parsed = Number(lastRow?.sortOrder ?? "");

  if (Number.isInteger(parsed) && parsed > 0) {
    return String(parsed + 1);
  }

  return String(defaultSortOrder + rows.length);
}

function validateRow(
  row: QuickEntryRow,
  mode: "category" | "parameter",
): QuickEntryRowErrors {
  if (!hasRowContent(row, mode)) {
    return {};
  }

  const errors: QuickEntryRowErrors = {};

  if (!row.name.trim()) {
    errors.name = "Captura un nombre.";
  } else if (row.name.trim().length > 150) {
    errors.name = "El nombre no puede exceder 150 caracteres.";
  }

  if (!row.sortOrder.trim()) {
    errors.sortOrder = "El orden es obligatorio.";
  } else {
    const parsed = Number(row.sortOrder);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.sortOrder = "El orden debe ser un entero mayor a cero.";
    }
  }

  return errors;
}

function hasValidationErrors(errors: QuickEntryRowErrors) {
  return Boolean(errors.name || errors.sortOrder);
}

export default function AddStudyDetailModal({
  mode,
  categories,
  saving,
  defaultSortOrder,
  onClose,
  onSave,
}: AddStudyDetailModalProps) {
  const [parentId, setParentId] = useState("");
  const [rows, setRows] = useState<QuickEntryRow[]>(() => [
    createQuickEntryRow(String(defaultSortOrder)),
  ]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusKeyRef = useRef<string | null>(null);

  const rowErrors = useMemo(
    () => rows.map((row) => validateRow(row, mode)),
    [mode, rows],
  );
  const filledRows = useMemo(
    () => rows.filter((row) => hasRowContent(row, mode)),
    [mode, rows],
  );
  const readyRowsCount = useMemo(
    () =>
      rows.reduce((total, row, index) => {
        if (!hasRowContent(row, mode)) {
          return total;
        }

        return total + (hasValidationErrors(rowErrors[index]) ? 0 : 1);
      }, 0),
    [mode, rowErrors, rows],
  );
  const invalidRowsCount = useMemo(
    () =>
      rows.reduce((total, row, index) => {
        if (!hasRowContent(row, mode)) {
          return total;
        }

        return total + (hasValidationErrors(rowErrors[index]) ? 1 : 0);
      }, 0),
    [mode, rowErrors, rows],
  );

  const entityLabel = mode === "category" ? "categorías" : "parámetros";
  const gridClassName =
    mode === "category"
      ? "grid gap-3 md:grid-cols-[3rem_minmax(0,1fr)_8rem_2.75rem] md:items-start"
      : "grid gap-3 md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1fr)_8rem_2.75rem] md:items-start";

  useEffect(() => {
    if (!pendingFocusKeyRef.current) {
      return;
    }

    const targetKey = pendingFocusKeyRef.current;
    const frameId = window.requestAnimationFrame(() => {
      inputRefs.current[targetKey]?.focus();
      pendingFocusKeyRef.current = null;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [rows]);

  const addRow = (focusNewRow = false) => {
    setRows((current) => {
      const nextRow = createQuickEntryRow(
        getNextSortOrder(current, defaultSortOrder),
      );

      if (focusNewRow) {
        pendingFocusKeyRef.current = getFieldRefKey(nextRow.id, "name");
      }

      return [...current, nextRow];
    });
  };

  const handleRowChange = (
    rowId: string,
    field: keyof Omit<QuickEntryRow, "id">,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((current) => {
      if (current.length === 1) {
        return [createQuickEntryRow(String(defaultSortOrder))];
      }

      return current.filter((row) => row.id !== rowId);
    });
  };

  const handleLastFieldKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    rowId: string,
  ) => {
    if (event.key !== "Tab" || event.shiftKey) {
      return;
    }

    const isLastRow = rows.at(-1)?.id === rowId;
    const currentRow = rows.find((row) => row.id === rowId);

    if (!isLastRow || !currentRow || !hasRowContent(currentRow, mode)) {
      return;
    }

    event.preventDefault();
    addRow(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (filledRows.length === 0) {
      toast.error(
        mode === "category"
          ? "Captura al menos una categoría antes de guardar."
          : "Captura al menos un parámetro antes de guardar.",
      );
      return;
    }

    if (invalidRowsCount > 0) {
      toast.error(`Corrige las filas pendientes antes de guardar ${entityLabel}.`);
      return;
    }

    const payloads: CreateStudyDetailPayload[] = filledRows.map((row) => ({
      dataType: mode,
      name: row.name.trim().toUpperCase(),
      sortOrder: Number(row.sortOrder),
      parentId: parentId ? Number(parentId) : undefined,
      unit: mode === "parameter" ? row.unit.trim() || undefined : undefined,
      referenceValue:
        mode === "parameter"
          ? row.referenceValue.trim() || undefined
          : undefined,
    }));

    const ok = await onSave(payloads);
    if (ok) {
      onClose();
    }
  };

  return (
    <Modal>
      <ModalPanel widthClassName="max-w-6xl">
        <ModalHeader
          title={
            mode === "category"
              ? "Captura guiada de categorías"
              : "Captura guiada de parámetros"
          }
          description="Captura por filas como en importación manual. Avanza con Tab y al salir del último campo se crea la siguiente fila."
          icon={<Plus className="h-6 w-6" />}
          onClose={onClose}
          closeDisabled={saving}
          className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500"
          descriptionClassName="text-emerald-50"
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
            <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Cómo capturar rápido</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                    <li>
                      Captura una fila por cada{" "}
                      {mode === "category" ? "categoría" : "parámetro"}.
                    </li>
                    <li>
                      Usa <span className="font-semibold">Tab</span> para
                      avanzar entre columnas.
                    </li>
                    <li>
                      En el ultimo campo,{" "}
                      <span className="font-semibold">Tab</span> agrega una
                      nueva fila automaticamente.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {mode === "parameter"
                      ? "Categoría para este lote"
                      : "Categoría padre para este lote"}
                  </label>
                  <select
                    value={parentId}
                    onChange={(event) => setParentId(event.target.value)}
                    className={`${inputClassName} modal-select appearance-none`}
                    disabled={saving}
                  >
                    <option value="">
                      {mode === "parameter" ? "Sin categoría" : "Categoría raíz"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {mode === "parameter"
                      ? "La categoría elegida se aplicará a todas las filas de esta captura."
                      : "Úsala solo si vas a crear subcategorías dentro de otra categoría existente."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Filas listas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {readyRowsCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Por corregir
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {invalidRowsCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Filas para agregar
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {mode === "category"
                        ? "Captura nombre y orden. Puedes seguir tabulando para crear varias categorías de corrido."
                        : "Captura nombre, unidad, referencia y orden. El flujo queda rápido pero mucho más claro para quien opera."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addRow(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar fila
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div
                    className={`${gridClassName} border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500`}
                  >
                    <div className="hidden md:block">#</div>
                    <div>{mode === "category" ? "Categoría" : "Parámetro"}</div>
                    {mode === "parameter" ? <div>Unidad</div> : null}
                    {mode === "parameter" ? <div>Referencia</div> : null}
                    <div>Orden</div>
                    <div className="hidden md:block text-right">Accion</div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {rows.map((row, index) => {
                      const currentErrors = rowErrors[index];

                      return (
                        <div key={row.id} className="px-4 py-4">
                          <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              Fila {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              tabIndex={-1}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-50"
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                              Quitar
                            </button>
                          </div>

                          <div className={gridClassName}>
                            <div className="hidden items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 md:flex">
                              {index + 1}
                            </div>

                            <div>
                              <input
                                ref={(element) => {
                                  inputRefs.current[getFieldRefKey(row.id, "name")] =
                                    element;
                                }}
                                type="text"
                                value={row.name}
                                onChange={(event) =>
                                  handleRowChange(
                                    row.id,
                                    "name",
                                    event.target.value,
                                  )
                                }
                                placeholder={
                                  mode === "category"
                                    ? "Quimica sanguinea"
                                    : "Glucosa"
                                }
                                className={inputClassName}
                                disabled={saving}
                              />
                              {currentErrors.name ? (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                  {currentErrors.name}
                                </p>
                              ) : null}
                            </div>

                            {mode === "parameter" ? (
                              <div>
                                <input
                                  ref={(element) => {
                                    inputRefs.current[
                                      getFieldRefKey(row.id, "unit")
                                    ] = element;
                                  }}
                                  type="text"
                                  value={row.unit}
                                  onChange={(event) =>
                                    handleRowChange(
                                      row.id,
                                      "unit",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="mg/dL"
                                  className={inputClassName}
                                  disabled={saving}
                                />
                              </div>
                            ) : null}

                            {mode === "parameter" ? (
                              <div>
                                <input
                                  ref={(element) => {
                                    inputRefs.current[
                                      getFieldRefKey(row.id, "referenceValue")
                                    ] = element;
                                  }}
                                  type="text"
                                  value={row.referenceValue}
                                  onChange={(event) =>
                                    handleRowChange(
                                      row.id,
                                      "referenceValue",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="70 - 110"
                                  className={inputClassName}
                                  disabled={saving}
                                />
                              </div>
                            ) : null}

                            <div>
                              <input
                                ref={(element) => {
                                  inputRefs.current[
                                    getFieldRefKey(row.id, "sortOrder")
                                  ] = element;
                                }}
                                type="number"
                                min="1"
                                value={row.sortOrder}
                                onChange={(event) =>
                                  handleRowChange(
                                    row.id,
                                    "sortOrder",
                                    event.target.value,
                                  )
                                }
                                onKeyDown={(event) =>
                                  handleLastFieldKeyDown(event, row.id)
                                }
                                placeholder="1"
                                className={inputClassName}
                                disabled={saving}
                              />
                              {currentErrors.sortOrder ? (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                  {currentErrors.sortOrder}
                                </p>
                              ) : null}
                            </div>

                            <div className="hidden md:flex md:justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                tabIndex={-1}
                                className="inline-flex h-[3rem] w-[3rem] items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition-all hover:bg-red-50"
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              disabled={saving || readyRowsCount === 0}
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : `Guardar ${entityLabel}`}
            </button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
