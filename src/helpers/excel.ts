import * as XLSX from 'xlsx';

export type ExcelColumnOption = {
  label: string;
  value: string;
};

export type ExcelColumn<Row extends Record<string, string>> = {
  key: keyof Row & string;
  label: string;
  required?: boolean;
  description?: string;
  example?: string;
  placeholder?: string;
  width?: number;
  inputType?: 'text' | 'number' | 'date' | 'email' | 'select';
  options?: ExcelColumnOption[];
  aliases?: string[];
};

export type ExcelSheet = {
  name: string;
  rows: Array<Record<string, string | number | null | undefined>>;
  widths?: number[];
};

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function buildColumnMatchers<Row extends Record<string, string>>(
  columns: ExcelColumn<Row>[],
) {
  return columns.map((column) => ({
    column,
    candidates: [
      normalizeHeader(column.key),
      normalizeHeader(column.label),
      ...(column.aliases ?? []).map(normalizeHeader),
    ],
  }));
}

function clampSheetName(value: string): string {
  const sanitized = value.replace(/[\\/?*\[\]:]/g, ' ').trim();
  return sanitized.slice(0, 31) || 'Hoja1';
}

function buildWorksheet(
  rows: Array<Record<string, string | number | null | undefined>>,
  widths?: number[],
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (widths?.length) {
    worksheet['!cols'] = widths.map((width) => ({ wch: width }));
  }

  return worksheet;
}

export async function readExcelRows<Row extends Record<string, string>>(
  file: File,
  columns: ExcelColumn<Row>[],
  createEmptyRow: () => Row,
): Promise<Row[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  const matchers = buildColumnMatchers(columns);

  return rawRows
    .map((rawRow) => {
      const normalizedEntries = Object.entries(rawRow).map(([key, value]) => ({
        normalized: normalizeHeader(key),
        value: value == null ? '' : String(value).trim(),
      }));
      const nextRow = createEmptyRow();

      for (const matcher of matchers) {
        const entry = normalizedEntries.find((candidate) =>
          matcher.candidates.includes(candidate.normalized),
        );

        nextRow[matcher.column.key] = (entry?.value ?? '') as Row[typeof matcher.column.key];
      }

      return nextRow;
    })
    .filter((row) => Object.values(row).some((value) => value.trim().length > 0));
}

export function downloadWorkbook(
  filename: string,
  sheets: ExcelSheet[],
) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = buildWorksheet(sheet.rows, sheet.widths);
    XLSX.utils.book_append_sheet(workbook, worksheet, clampSheetName(sheet.name));
  }

  XLSX.writeFile(workbook, filename);
}

export function createTemplateSheets<Row extends Record<string, string>>(
  columns: ExcelColumn<Row>[],
  createEmptyRow: () => Row,
  sheetName: string,
): ExcelSheet[] {
  const blankRow = createEmptyRow();
  const templateRow = columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.label] = blankRow[column.key] ?? '';
    return acc;
  }, {});

  const instructions = columns.map((column) => ({
    Columna: column.label,
    Obligatorio: column.required ? 'Si' : 'No',
    Ejemplo: column.example ?? '',
    Descripcion: column.description ?? '',
    Valores: column.options?.map((option) => option.value).join(', ') ?? '',
  }));

  return [
    {
      name: sheetName,
      rows: [templateRow],
      widths: columns.map((column) => column.width ?? 22),
    },
    {
      name: 'Instrucciones',
      rows: instructions,
      widths: [24, 14, 18, 44, 26],
    },
  ];
}
