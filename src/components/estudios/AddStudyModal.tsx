"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { Microscope } from "lucide-react";
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
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
} from "@/components/ui/Modal";

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

      if (
        name === "tipo" &&
        useAutoCode &&
        isGeneratedStudyCode(current.clave)
      ) {
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
    <Modal>
      <ModalPanel widthClassName="max-w-6xl">
        <ModalHeader
          title={isPackage ? "Nuevo paquete" : "Nuevo estudio"}
          description={
            isPackage
              ? "Registra un paquete y despues configura los estudios que lo componen."
              : "Registra el estudio con catalogo completo, precios y configuracion base."
          }
          icon={<Microscope className="h-6 w-6" />}
          onClose={() => setOpen(false)}
          closeDisabled={isSaving}
          className={
            isPackage
              ? "bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500"
              : "bg-gradient-to-r from-red-600 via-red-500 to-rose-500"
          }
          descriptionClassName={isPackage ? "text-sky-50" : "text-red-50"}
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
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
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                isPackage
                  ? "bg-sky-600 hover:bg-sky-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              disabled={isSaving}
            >
              {isSaving ? "Registrando..." : `Registrar ${entityLabel}`}
            </button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
