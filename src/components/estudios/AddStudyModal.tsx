"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { Microscope, X } from "lucide-react";
import { toast } from "react-toastify";
import type {
  CreateStudyPayload,
  StudyType,
} from "@/actions/studies/studiesActions";
import { getSuggestedStudyCode } from "@/actions/studies/studiesActions";
import StudyFormFields from "@/components/estudios/StudyFormFields";
import {
  createEmptyStudyForm,
  createTouchedStudyForm,
  generateSuggestedStudyCode,
  hasStudyFormErrors,
  isGeneratedStudyCode,
  mapFormToCreateStudyPayload,
  updateDurationValue,
  validateStudyForm,
  type StudyFormTouched,
} from "@/components/estudios/studyFormUtils";
import AppModal from "@/components/ui/AppModal";

interface AddStudyModalProps {
  setOpen: (open: boolean) => void;
  addStudy: (payload: CreateStudyPayload) => Promise<boolean>;
  isSaving: boolean;
  initialType?: StudyType;
}

export default function AddStudyModal({
  setOpen,
  addStudy,
  isSaving,
  initialType = "study",
}: AddStudyModalProps) {
  const [formData, setFormData] = useState(() =>
    ({
      ...createEmptyStudyForm(initialType),
      clave: generateSuggestedStudyCode(initialType),
    }),
  );
  const [useAutoCode, setUseAutoCode] = useState(true);
  const [touched, setTouched] = useState<StudyFormTouched>({});
  const entityLabel = initialType === "package" ? "paquete" : "estudio";
  const isPackage = initialType === "package";

  const errors = useMemo(() => validateStudyForm(formData), [formData]);

  useEffect(() => {
    void (async () => {
      const response = await getSuggestedStudyCode(initialType);
      if (!response.ok) {
        return;
      }

      setFormData((current) => {
        if (!isGeneratedStudyCode(current.clave)) {
          return current;
        }

        return {
          ...current,
          clave: response.data.code,
        };
      });
    })();
  }, [initialType]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "clave") {
      setUseAutoCode(false);
    }

    setFormData((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      };

      if (name === "tipo" && useAutoCode && isGeneratedStudyCode(current.clave)) {
        nextForm.clave = generateSuggestedStudyCode(value as StudyType);
      }

      return nextForm;
    });

    if (name === "tipo" && useAutoCode) {
      void handleGenerateCode(value as StudyType);
    }
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

  const handleDurationChange = (part: "hours" | "minutes", value: string) => {
    setFormData((current) => ({
      ...current,
      duracion: updateDurationValue(current.duracion, part, value),
    }));
  };

  const handleDurationBlur = () => {
    setTouched((current) => ({
      ...current,
      duracion: true,
    }));
  };

  const handleGenerateCode = async (typeOverride?: StudyType) => {
    setUseAutoCode(true);
    const targetType = typeOverride ?? formData.tipo;
    const response = await getSuggestedStudyCode(targetType);

    setFormData((current) => ({
      ...current,
      clave: response.ok
        ? response.data.code
        : generateSuggestedStudyCode(targetType),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched(createTouchedStudyForm());

    if (hasStudyFormErrors(errors)) {
      toast.error(
        "Revisa los campos obligatorios y corrige los errores del estudio.",
      );
      return;
    }

    await addStudy(
      mapFormToCreateStudyPayload(formData, { autoGenerateCode: useAutoCode }),
    );
  };

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]">
          <div
            className={`border-b border-gray-200 p-4 text-white sm:p-6 ${
              isPackage
                ? "bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500"
                : "bg-gradient-to-r from-red-600 via-red-500 to-rose-500"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/30 bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Microscope className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    {isPackage ? "Nuevo paquete" : "Nuevo estudio"}
                  </h2>
                  <p
                    className={`mt-1 text-sm ${isPackage ? "text-sky-50" : "text-red-50"}`}
                  >
                    {isPackage
                      ? "Registra un paquete y despues configura los estudios que lo componen."
                      : "Registra el estudio con catalogo completo, precios y configuracion base."}
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
              <StudyFormFields
                formData={formData}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
                onDurationChange={handleDurationChange}
                onDurationBlur={handleDurationBlur}
                onGenerateCode={handleGenerateCode}
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
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                  isPackage
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={isSaving}
              >
                {isSaving ? "Registrando..." : `Registrar ${entityLabel}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppModal>
  );
}
