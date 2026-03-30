"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import type { CreateDoctorPayload } from "@/features/doctors/api/doctors";
import DoctorFormFields from "@/components/medicos/DoctorFormFields";
import {
  createEmptyDoctorForm,
  createTouchedDoctorForm,
  hasDoctorFormErrors,
  mapFormToPayload,
  validateDoctorForm,
  type DoctorFormTouched,
} from "@/components/medicos/doctorFormUtils";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
} from "@/components/ui/Modal";

interface AddDoctorModalProps {
  setOpen: (open: boolean) => void;
  addDoctor: (payload: CreateDoctorPayload) => Promise<boolean>;
  isSaving: boolean;
}

export default function AddDoctorModal({
  setOpen,
  addDoctor,
  isSaving,
}: AddDoctorModalProps) {
  const [formData, setFormData] = useState(createEmptyDoctorForm());
  const [touched, setTouched] = useState<DoctorFormTouched>({});

  const errors = useMemo(() => validateDoctorForm(formData), [formData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched(createTouchedDoctorForm());

    if (hasDoctorFormErrors(errors)) {
      toast.error("Revisa los campos obligatorios y corrige los errores.");
      return;
    }

    await addDoctor(mapFormToPayload(formData));
  };

  return (
    <Modal>
      <ModalPanel widthClassName="max-w-5xl">
        <ModalHeader
          title="Nuevo medico"
          description="Agrega los datos del medico para dejarlo disponible en los servicios."
          icon={<UserPlus className="h-6 w-6" />}
          onClose={() => setOpen(false)}
          closeDisabled={isSaving}
          className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500"
          descriptionClassName="text-red-50"
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
            <DoctorFormFields
              formData={formData}
              errors={errors}
              touched={touched}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSaving}
              compact
            />
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Registrando..." : "Registrar medico"}
            </button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
