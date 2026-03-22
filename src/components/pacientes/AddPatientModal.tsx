"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import type { CreatePatientPayload } from "@/actions/patients/patientsActions";
import PatientFormFields from "@/components/pacientes/PatientFormFields";
import {
  createEmptyPatientForm,
  createTouchedPatientForm,
  hasPatientFormErrors,
  mapFormToPayload,
  validatePatientForm,
  type PatientFormTouched,
} from "@/components/pacientes/patientFormUtils";
import AppModal from "@/components/ui/AppModal";

interface AddPatientModalProps {
  setOpen: (open: boolean) => void;
  addPatient: (newPatient: CreatePatientPayload) => Promise<void>;
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

    const nextTouched = createTouchedPatientForm();
    setTouched(nextTouched);

    if (hasPatientFormErrors(errors)) {
      toast.error("Revisa los campos obligatorios y corrige los errores.");
      return;
    }

    await addPatient(mapFormToPayload(formData));
  };

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]">
          <div className="border-b border-gray-200 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 p-4 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/30 bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    Nuevo paciente
                  </h2>
                  <p className="mt-1 text-sm text-red-50">
                    Registra el expediente clínico con todos los datos base.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                disabled={isSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-6 sm:p-6">
              <PatientFormFields
                formData={formData}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSaving}
                compact
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:flex-row sm:p-6">
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
            </div>
          </form>
        </div>
      </div>
    </AppModal>
  );
}
