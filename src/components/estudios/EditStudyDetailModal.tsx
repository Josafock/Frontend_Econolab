"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { Save } from "lucide-react";
import { toast } from "react-toastify";
import type {
  StudyDetail,
  UpdateStudyDetailPayload,
} from "@/features/studies/api/studies";
import StudyDetailFormFields from "@/components/estudios/StudyDetailFormFields";
import {
  createTouchedStudyDetailForm,
  hasStudyDetailFormErrors,
  mapStudyDetailFormToUpdatePayload,
  mapStudyDetailToForm,
  validateStudyDetailForm,
  type StudyDetailFormTouched,
} from "@/components/estudios/studyDetailFormUtils";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
} from "@/components/ui/Modal";

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
      ...(name === "dataType" && value === "category"
        ? { parentId: current.parentId, unit: "", referenceValue: "" }
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
      toast.error("Revisa la configuracion del detalle antes de guardar.");
      return;
    }

    const ok = await onSave(mapStudyDetailFormToUpdatePayload(formData));
    if (ok) {
      onClose();
    }
  };

  return (
    <Modal>
      <ModalPanel widthClassName="max-w-3xl">
        <ModalHeader
          title="Editar elemento"
          description="Actualiza categoria, orden, unidad y valores de referencia."
          onClose={onClose}
          closeDisabled={saving}
          className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500"
          descriptionClassName="text-blue-50"
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
