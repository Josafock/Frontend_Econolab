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
import type { CreatePatientPayload } from "@/features/patients/api/patients";
import PatientFormFields from "@/components/pacientes/PatientFormFields";
import {
  createEmptyPatientForm,
  createTouchedPatientForm,
  hasPatientFormErrors,
  mapFormToPayload,
  validatePatientForm,
  type PatientFormTouched,
} from "@/components/pacientes/patientFormUtils";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
} from "@/components/ui/Modal";

interface AddPatientModalProps {
  setOpen: (open: boolean) => void;
  addPatient: (newPatient: CreatePatientPayload) => Promise<boolean>;
  isSaving: boolean;
}

export default function AddPatientModal({
  setOpen,
  addPatient,
  isSaving,
}: AddPatientModalProps) {
  const [formData, setFormData] = useState(createEmptyPatientForm());
  const [touched, setTouched] = useState<PatientFormTouched>({});

  const errors = useMemo(() => validatePatientForm(formData), [formData]);

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

    setTouched(createTouchedPatientForm());

    if (hasPatientFormErrors(errors)) {
      toast.error("Revisa los campos obligatorios y corrige los errores.");
      return;
    }

    await addPatient(mapFormToPayload(formData));
  };

  return (
    <Modal>
      <ModalPanel widthClassName="max-w-5xl">
        <ModalHeader
          title="Nuevo paciente"
          description="Registra el expediente clinico con todos los datos base."
          icon={<UserPlus className="h-6 w-6" />}
          onClose={() => setOpen(false)}
          closeDisabled={isSaving}
          className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500"
          descriptionClassName="text-red-50"
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
            <PatientFormFields
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
              {isSaving ? "Registrando..." : "Registrar paciente"}
            </button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
