'use client';

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react';
import { Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type {
  CreateStudyDetailPayload,
  StudyDetail,
} from '@/actions/studies/studiesActions';
import {
  createEmptyStudyDetailBulkForm,
  hasStudyDetailBulkFormErrors,
  mapStudyDetailBulkFormToCreatePayloads,
  validateStudyDetailBulkForm,
  type StudyDetailBulkFormField,
  type StudyDetailBulkFormValues,
} from '@/components/estudios/studyDetailFormUtils';
import AppModal from '@/components/ui/AppModal';

type AddStudyDetailModalProps = {
  mode: 'category' | 'parameter';
  categories: StudyDetail[];
  saving: boolean;
  defaultSortOrder: number;
  onClose: () => void;
  onSave: (payloads: CreateStudyDetailPayload[]) => Promise<boolean>;
};

const fieldClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500';

const textareaClassName = `${fieldClassName} min-h-48 resize-y sm:min-h-56`;

function getExamples(mode: 'category' | 'parameter') {
  if (mode === 'category') {
    return ['QUIMICA SANGUINEA', 'FORMULA ROJA', 'FORMULA BLANCA'];
  }

  return [
    'GLUCOSA | mg/dL | 70 - 110',
    'COLESTEROL | mg/dL | < 200',
    'TRIGLICERIDOS | mg/dL | < 150',
  ];
}

export default function AddStudyDetailModal({
  mode,
  categories,
  saving,
  defaultSortOrder,
  onClose,
  onSave,
}: AddStudyDetailModalProps) {
  const [formData, setFormData] = useState<StudyDetailBulkFormValues>(() =>
    createEmptyStudyDetailBulkForm(String(defaultSortOrder)),
  );
  const [touched, setTouched] = useState<
    Partial<Record<StudyDetailBulkFormField, boolean>>
  >({});

  const errors = useMemo(
    () => validateStudyDetailBulkForm(formData, mode),
    [formData, mode],
  );
  const entityLabel = mode === 'category' ? 'categorias' : 'parametros';
  const examples = getExamples(mode);
  const totalLines = useMemo(
    () =>
      formData.bulkInput
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean).length,
    [formData.bulkInput],
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({
      parentId: true,
      sortOrderStart: true,
      bulkInput: true,
    });

    if (hasStudyDetailBulkFormErrors(errors)) {
      toast.error(`Revisa el lote de ${entityLabel} antes de guardar.`);
      return;
    }

    const payloads = mapStudyDetailBulkFormToCreatePayloads(formData, mode);
    const ok = await onSave(payloads);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-5xl">
        <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]">
          <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 p-4 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">
                  {mode === 'category'
                    ? 'Alta multiple de categorias'
                    : 'Alta multiple de parametros'}
                </h2>
                <p className="mt-1 text-sm text-emerald-50">
                  {mode === 'category'
                    ? 'Captura varias categorias de una sola vez, una por linea.'
                    : 'Captura varios parametros de una sola vez con nombre, unidad y referencia.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Formato recomendado</p>
                  <div className="mt-3 space-y-2 rounded-xl bg-white/70 p-3 font-mono text-xs text-emerald-950">
                    {examples.map((example) => (
                      <p key={example}>{example}</p>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-emerald-800">
                    {mode === 'category'
                      ? 'Cada linea crea una categoria nueva.'
                      : 'Cada linea crea un parametro. Si no ocupas unidad o referencia, puedes dejar vacio lo que va despues del |.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Categoria padre
                    </label>
                    <select
                      name="parentId"
                      value={formData.parentId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${fieldClassName} modal-select appearance-none`}
                      disabled={saving}
                    >
                      <option value="">
                        {mode === 'parameter' ? 'Sin categoria' : 'Categoria raiz'}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {mode === 'parameter'
                        ? 'Si la eliges, todo el lote quedara dentro de esa categoria.'
                        : 'Opcional, por si quieres crear subcategorias dentro de otra.'}
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Orden inicial
                    </label>
                    <input
                      type="number"
                      min="1"
                      name="sortOrderStart"
                      value={formData.sortOrderStart}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={fieldClassName}
                      disabled={saving}
                    />
                    {touched.sortOrderStart && errors.sortOrderStart ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.sortOrderStart}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-xs text-gray-500">
                      El sistema ira numerando cada linea en secuencia.
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Filas detectadas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{totalLines}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {mode === 'category'
                    ? 'Categorias por linea'
                    : 'Parametros por linea'}
                </label>
                <textarea
                  name="bulkInput"
                  value={formData.bulkInput}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={examples.join('\n')}
                  className={textareaClassName}
                  disabled={saving}
                />
                {touched.bulkInput && errors.bulkInput ? (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.bulkInput}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-gray-500">
                  {mode === 'category'
                    ? 'Tip: pega una lista completa y el sistema la convierte en categorias individuales.'
                    : 'Usa el formato NOMBRE | UNIDAD | REFERENCIA para capturar varios parametros rapido.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 md:flex-row">
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
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : `Guardar ${entityLabel}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppModal>
  );
}
