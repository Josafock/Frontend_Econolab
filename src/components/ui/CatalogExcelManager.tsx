'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  type ExcelColumn,
} from '@/helpers/excel';

type ImportResult = {
  ok: boolean;
  error?: string;
};

type ProgressState =
  | {
      mode: 'import' | 'export' | 'reading';
      current: number;
      total: number;
      label: string;
    }
  | null;

type PreviewRow<Row extends Record<string, string>> = {
  id: string;
  values: Row;
  validationErrors: string[];
  importError?: string;
};

type CatalogExcelManagerProps<Row extends Record<string, string>> = {
  title: string;
  description: string;
  entityLabel: string;
  columns: ExcelColumn<Row>[];
  createEmptyRow: () => Row;
  validateRow: (row: Row) => string[];
  rowsForExport: Row[];
  exportFileName: string;
  exportSheetName: string;
  templateFileName: string;
  templateSheetName: string;
  onImportRow: (row: Row) => Promise<ImportResult>;
  onImportFinished?: () => Promise<void> | void;
  onImportStart?: (rows: Row[]) => Promise<void> | void;
  onImportCompleted?: (result: {
    importedRows: Row[];
    successCount: number;
    errorCount: number;
  }) => Promise<void> | void;
  sortImportRows?: (rows: Row[]) => Row[];
  layout?: 'section' | 'flat';
};

function createRowId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function loadExcelHelpers() {
  return import('@/helpers/excel');
}

export default function CatalogExcelManager<Row extends Record<string, string>>({
  title,
  description,
  entityLabel,
  columns,
  createEmptyRow,
  validateRow,
  rowsForExport,
  exportFileName,
  exportSheetName,
  templateFileName,
  templateSheetName,
  onImportRow,
  onImportFinished,
  onImportStart,
  onImportCompleted,
  sortImportRows,
  layout = 'section',
}: CatalogExcelManagerProps<Row>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow<Row>[]>([]);
  const [progress, setProgress] = useState<ProgressState>(null);
  const [lastSummary, setLastSummary] = useState<{
    successCount: number;
    errorCount: number;
  } | null>(null);

  const validRowsCount = useMemo(
    () => previewRows.filter((row) => row.validationErrors.length === 0).length,
    [previewRows],
  );

  const invalidRowsCount = previewRows.length - validRowsCount;
  const isBusy = progress !== null;

  const exportedRows = useMemo(() => {
    return rowsForExport.map((row) =>
      columns.reduce<Record<string, string>>((acc, column) => {
        acc[column.label] = row[column.key] ?? '';
        return acc;
      }, {}),
    );
  }, [columns, rowsForExport]);

  const normalizePreviewRow = (values: Row): PreviewRow<Row> => ({
    id: createRowId(),
    values,
    validationErrors: validateRow(values),
  });

  const updatePreviewRow = (rowId: string, updater: (row: PreviewRow<Row>) => PreviewRow<Row>) => {
    setPreviewRows((current) =>
      current.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  };

  const handleDownloadTemplate = async () => {
    const { createTemplateSheets, downloadWorkbook } = await loadExcelHelpers();

    setProgress({
      mode: 'export',
      current: 15,
      total: 100,
      label: `Preparando plantilla de ${entityLabel}...`,
    });
    await wait(60);

    downloadWorkbook(
      templateFileName,
      createTemplateSheets(columns, createEmptyRow, templateSheetName),
    );

    setProgress({
      mode: 'export',
      current: 100,
      total: 100,
      label: 'Plantilla lista para descargar.',
    });
    toast.success('Plantilla descargada correctamente.');
    await wait(300);
    setProgress(null);
  };

  const handleExport = async () => {
    if (exportedRows.length === 0) {
      toast.info(`No hay ${entityLabel} para exportar en este momento.`);
      return;
    }

    const { downloadWorkbook } = await loadExcelHelpers();

    setProgress({
      mode: 'export',
      current: 20,
      total: 100,
      label: `Preparando exportacion de ${entityLabel}...`,
    });
    await wait(80);

    const summarySheet = [
      {
        Catalogo: title,
        Registros: exportedRows.length,
        Fecha: new Date().toLocaleString('es-MX'),
      },
    ];

    setProgress({
      mode: 'export',
      current: 70,
      total: 100,
      label: 'Construyendo archivo de exportacion...',
    });
    await wait(60);

    downloadWorkbook(exportFileName, [
      {
        name: exportSheetName,
        rows: exportedRows,
        widths: columns.map((column) => column.width ?? 22),
      },
      {
        name: 'Resumen',
        rows: summarySheet,
        widths: [26, 14, 24],
      },
    ]);

    setProgress({
      mode: 'export',
      current: 100,
      total: 100,
      label: 'Exportacion terminada.',
    });
    toast.success('Archivo exportado correctamente.');
    await wait(300);
    setProgress(null);
  };

  const handleAddEmptyRow = () => {
    setPreviewRows((current) => [...current, normalizePreviewRow(createEmptyRow())]);
  };

  const handleClearRows = () => {
    setPreviewRows([]);
    setLastSummary(null);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    const pendingFiles = Array.from(files ?? []);
    if (!pendingFiles.length) return;

    try {
      const { readExcelRows } = await loadExcelHelpers();

      setProgress({
        mode: 'reading',
        current: 5,
        total: 100,
        label: 'Leyendo archivo de importacion...',
      });

      const imported: PreviewRow<Row>[] = [];

      for (const [index, file] of pendingFiles.entries()) {
        const parsedRows = await readExcelRows(file, columns, createEmptyRow);
        imported.push(...parsedRows.map(normalizePreviewRow));

        setProgress({
          mode: 'reading',
          current: Math.round(((index + 1) / pendingFiles.length) * 100),
          total: 100,
          label: `Archivo ${index + 1} de ${pendingFiles.length} procesado.`,
        });
      }

      setPreviewRows((current) => [...current, ...imported]);
      setLastSummary(null);

      if (!imported.length) {
        toast.info('El archivo no contenia filas con datos.');
      } else {
        toast.success(
          `Se cargaron ${imported.length} fila${imported.length === 1 ? '' : 's'} para vista previa.`,
        );
      }

      await wait(250);
      setProgress(null);
    } catch {
      setProgress(null);
      toast.error('No se pudo leer el archivo. Verifica que tenga un formato valido.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    const importableRows = (
      sortImportRows
        ? sortImportRows(
            previewRows
              .filter((row) => row.validationErrors.length === 0)
              .map((row) => row.values),
          )
        : previewRows
            .filter((row) => row.validationErrors.length === 0)
            .map((row) => row.values)
    ).map((row) => ({
      values: row,
    }));

    if (!importableRows.length) {
      toast.info('Corrige o elimina las filas con errores antes de importar.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const failedRows: PreviewRow<Row>[] = [];

    await onImportStart?.(importableRows.map((row) => row.values));

    for (const [index, row] of importableRows.entries()) {
      setProgress({
        mode: 'import',
        current: index + 1,
        total: importableRows.length,
        label: `Importando ${index + 1} de ${importableRows.length}...`,
      });

      const result = await onImportRow(row.values);

      if (result.ok) {
        successCount += 1;
        continue;
      }

      errorCount += 1;
      failedRows.push({
        ...normalizePreviewRow(row.values),
        importError: result.error ?? 'No se pudo importar esta fila.',
      });
    }

    const invalidRows = previewRows
      .filter((row) => row.validationErrors.length > 0)
      .map((row) => ({
        ...row,
        importError: row.importError,
      }));

    setPreviewRows([...failedRows, ...invalidRows]);
    setLastSummary({ successCount, errorCount: errorCount + invalidRows.length });

    if (successCount > 0) {
      await onImportFinished?.();
    }

    await onImportCompleted?.({
      importedRows: importableRows.map((row) => row.values),
      successCount,
      errorCount: errorCount + invalidRows.length,
    });

    setProgress({
      mode: 'import',
      current: importableRows.length,
      total: importableRows.length || 1,
      label:
        successCount > 0
          ? `Importacion finalizada. ${successCount} registro(s) insertado(s).`
          : 'La importacion termino sin altas nuevas.',
    });

    if (successCount > 0 && errorCount === 0 && invalidRows.length === 0) {
      toast.success(`Se importaron ${successCount} registro(s) correctamente.`);
    } else if (successCount > 0) {
      toast.warn(
        `Se importaron ${successCount} registro(s) y quedaron ${errorCount + invalidRows.length} pendiente(s).`,
      );
    } else {
      toast.error('No se pudo importar ninguna fila.');
    }

    await wait(500);
    setProgress(null);
  };

  const wrapperClassName =
    layout === 'section'
      ? 'mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm'
      : 'overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm';

  return (
    <section className={wrapperClassName}>
      <div className="border-b border-gray-100 bg-gradient-to-r from-white via-amber-50/70 to-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Importacion y exportacion masiva
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 disabled:opacity-60"
              disabled={isBusy}
            >
              {progress?.mode === 'reading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Cargar archivo
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadTemplate()}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              disabled={isBusy}
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </button>

            <button
              type="button"
              onClick={() => void handleExport()}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
              disabled={isBusy}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar archivo
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        className="hidden"
        onChange={(event) => void handleFilesSelected(event.target.files)}
      />

      <div className="space-y-5 px-6 py-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-900">Como funciona</p>
            <p className="mt-2 text-sm text-gray-600">
              Descarga la plantilla, pega o captura la informacion y luego sube el archivo para revisar cada fila antes de importarla.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Filas en vista previa</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{previewRows.length}</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Exportables</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{rowsForExport.length}</p>
          </div>
        </div>

        {progress ? (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">{progress.label}</p>
                  <p className="text-xs text-blue-700">
                    {progress.mode === 'import'
                      ? `${progress.current} de ${progress.total} registros`
                      : `${progress.current}% completado`}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-800">
                {progress.mode === 'import'
                  ? `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%`
                  : `${progress.current}%`}
              </span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-blue-100">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${
                    progress.mode === 'import'
                      ? Math.round((progress.current / Math.max(progress.total, 1)) * 100)
                      : progress.current
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {lastSummary ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Registros importados
                  </p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {lastSummary.successCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">Pendientes o con error</p>
                  <p className="text-2xl font-bold text-rose-900">{lastSummary.errorCount}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAddEmptyRow}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={isBusy}
          >
            <Plus className="h-4 w-4" />
            Agregar fila manual
          </button>

          <button
            type="button"
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-60"
            disabled={isBusy || previewRows.length === 0 || validRowsCount === 0}
          >
            {progress?.mode === 'import' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar {validRowsCount} validos
          </button>

          <button
            type="button"
            onClick={handleClearRows}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
            disabled={isBusy || previewRows.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Limpiar vista previa
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              {validRowsCount} listas
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
              {invalidRowsCount} por corregir
            </span>
          </div>
        </div>

        {previewRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            Todavia no hay filas cargadas. Puedes subir un archivo o agregar filas manualmente.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      #
                    </th>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Accion
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {previewRows.map((row, index) => {
                    const hasErrors = row.validationErrors.length > 0 || Boolean(row.importError);

                    return (
                      <tr key={row.id} className={hasErrors ? 'bg-rose-50/50' : 'bg-white'}>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-gray-700">
                          {index + 1}
                        </td>

                        {columns.map((column) => {
                          const commonClassName =
                            'w-full rounded-xl border px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:ring-2';
                          const invalidCellClass = hasErrors
                            ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20';

                          return (
                            <td key={column.key} className="px-4 py-4 align-top">
                              {column.inputType === 'select' ? (
                                <select
                                  value={row.values[column.key]}
                                  onChange={(event) =>
                                    updatePreviewRow(row.id, (currentRow) => {
                                      const values = {
                                        ...currentRow.values,
                                        [column.key]: event.target.value,
                                      };
                                      return {
                                        ...currentRow,
                                        values,
                                        validationErrors: validateRow(values),
                                        importError: undefined,
                                      };
                                    })
                                  }
                                  className={`${commonClassName} ${invalidCellClass}`}
                                >
                                  <option value="">Selecciona</option>
                                  {column.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={column.inputType === 'number' ? 'number' : column.inputType ?? 'text'}
                                  value={row.values[column.key]}
                                  placeholder={column.placeholder}
                                  onChange={(event) =>
                                    updatePreviewRow(row.id, (currentRow) => {
                                      const values = {
                                        ...currentRow.values,
                                        [column.key]: event.target.value,
                                      };
                                      return {
                                        ...currentRow,
                                        values,
                                        validationErrors: validateRow(values),
                                        importError: undefined,
                                      };
                                    })
                                  }
                                  className={`${commonClassName} ${invalidCellClass}`}
                                />
                              )}
                            </td>
                          );
                        })}

                        <td className="px-4 py-4 align-top">
                          {row.validationErrors.length > 0 ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                              <div className="mb-2 inline-flex items-center gap-2 font-semibold">
                                <AlertCircle className="h-4 w-4" />
                                Revisar fila
                              </div>
                              <div className="space-y-1">
                                {row.validationErrors.map((error, errorIndex) => (
                                  <p key={`${row.id}-validation-${errorIndex}`}>{error}</p>
                                ))}
                              </div>
                            </div>
                          ) : row.importError ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                              <div className="mb-2 inline-flex items-center gap-2 font-semibold">
                                <XCircle className="h-4 w-4" />
                                Error al importar
                              </div>
                              <p>{row.importError}</p>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Lista para importar
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewRows((current) =>
                                current.filter((item) => item.id !== row.id),
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                            disabled={isBusy}
                          >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
