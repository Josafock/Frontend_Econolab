'use client';

import { useMemo, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type {
  StudyDetail,
  UpdateStudyDetailPayload,
} from '@/actions/studies/studiesActions';
import StudyDetailFormFields from '@/components/estudios/StudyDetailFormFields';
import {
  createTouchedStudyDetailForm,
  hasStudyDetailFormErrors,
  mapStudyDetailFormToUpdatePayload,
  mapStudyDetailToForm,
  validateStudyDetailForm,
  type StudyDetailFormTouched,
} from '@/components/estudios/studyDetailFormUtils';
import AppModal from '@/components/ui/AppModal';

type EditStudyDetailModalProps = {
  detail: StudyDetail;
  categories: StudyDetail[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: UpdateStudyDetailPayload) => Promise<boolean>;
};

export default function EditStudyDetailModal({
  detail,
  categories,
  saving,
  onClose,
  onSave,
}: EditStudyDetailModalProps) {
  const [formData, setFormData] = useState(() => mapStudyDetailToForm(detail));
  const [touched, setTouched] = useState<StudyDetailFormTouched>({});

  const errors = useMemo(() => validateStudyDetailForm(formData), [formData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'dataType' && value === 'category'
        ? { parentId: current.parentId, unit: '', referenceValue: '' }
        : {}),
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

    setTouched(createTouchedStudyDetailForm());

    if (hasStudyDetailFormErrors(errors)) {
      toast.error('Revisa la configuracion del detalle antes de guardar.');
      return;
    }

    const ok = await onSave(mapStudyDetailFormToUpdatePayload(formData));
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-3xl">
        <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-4 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">Editar elemento</h2>
                <p className="mt-1 text-sm text-blue-50">
                  Actualiza categoria, orden, unidad y valores de referencia.
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
            <StudyDetailFormFields
              formData={formData}
              errors={errors}
              touched={touched}
              onChange={handleChange}
              onBlur={handleBlur}
              categories={categories}
              excludeParentId={detail.id}
              disabled={saving}
              compact
            />

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
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppModal>
  );
}
