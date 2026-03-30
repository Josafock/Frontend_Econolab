"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  PackagePlus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createPatient,
  type CreatePatientPayload,
  type Patient,
} from "@/features/patients/api/patients";
import {
  createDoctor,
  type CreateDoctorPayload,
  type Doctor,
} from "@/features/doctors/api/doctors";
import { getSuggestedServiceFolio } from "@/features/services/api/services";
import type { Study } from "@/features/studies/api/studies";
import AppModal from "@/components/ui/AppModal";
import { matchesNormalizedSearch, normalizeSearchText } from "@/helpers/search";
import {
  SERVICE_BRANCH_OPTIONS,
  calculateServiceTotals,
  createEmptyServiceForm,
  createServiceDraftItem,
  generateSuggestedServiceFolio,
  isGeneratedServiceFolio,
  getServicePriceTypeLabel,
  getStudyNameSummary,
  hasServiceFormErrors,
  mapServiceFormToPayload,
  type ServiceFormValues,
  validateServiceForm,
} from "@/components/servicios/serviceFormUtils";

const AddPatientModal = dynamic(
  () => import("@/components/pacientes/AddPatientModal"),
);
const AddDoctorModal = dynamic(
  () => import("@/components/medicos/AddDoctorModal"),
);

type SaveServicePayload = ReturnType<typeof mapServiceFormToPayload>;

interface AddServiceModalProps {
  setOpen: (open: boolean) => void;
  saveService: (payload: SaveServicePayload) => Promise<boolean>;
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
  isSaving: boolean;
  isCatalogsLoading?: boolean;
  initialValues?: ServiceFormValues;
  title?: string;
  description?: string;
  submitLabel?: string;
}

const stepTitles = [
  "Paciente y contexto",
  "Estudios y precios",
  "Logistica y cierre",
] as const;

function getPatientLabel(patient: Patient) {
  return `${patient.firstName} ${patient.lastName} ${patient.middleName ?? ""}`.trim();
}

function getDoctorLabel(doctor: Doctor) {
  return `${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ""}`.trim();
}

function StepBadge({
  label,
  index,
  currentStep,
}: {
  label: string;
  index: number;
  currentStep: number;
}) {
  const isCurrent = currentStep === index;
  const isComplete = currentStep > index;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
          isComplete
            ? "bg-emerald-500 text-white"
            : isCurrent
              ? "bg-white text-red-600"
              : "bg-white/15 text-white"
        }`}
      >
        {index + 1}
      </div>
      <div className="hidden sm:block">
        <p className="text-xs uppercase tracking-[0.2em] text-red-100">
          Paso {index + 1}
        </p>
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
    </div>
  );
}

export default function AddServiceModal({
  setOpen,
  saveService,
  patients,
  doctors,
  studies,
  isSaving,
  isCatalogsLoading = false,
  initialValues,
  title = "Nuevo servicio",
  description = "Selecciona al paciente, agrega los estudios y completa los datos del servicio.",
  submitLabel = "Crear servicio",
}: AddServiceModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [studySearch, setStudySearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [localPatients, setLocalPatients] = useState(patients);
  const [localDoctors, setLocalDoctors] = useState(doctors);
  const [openPatientModal, setOpenPatientModal] = useState(false);
  const [openDoctorModal, setOpenDoctorModal] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [formData, setFormData] = useState<ServiceFormValues>(
    initialValues ?? createEmptyServiceForm(),
  );
  const [useAutoFolio, setUseAutoFolio] = useState(!initialValues);

  useEffect(() => {
    setLocalPatients((current) => {
      const incomingIds = new Set(patients.map((patient) => patient.id));
      const preservedLocal = current.filter(
        (patient) => !incomingIds.has(patient.id),
      );
      return [...preservedLocal, ...patients];
    });
  }, [patients]);

  useEffect(() => {
    setLocalDoctors((current) => {
      const incomingIds = new Set(doctors.map((doctor) => doctor.id));
      const preservedLocal = current.filter(
        (doctor) => !incomingIds.has(doctor.id),
      );
      return [...preservedLocal, ...doctors];
    });
  }, [doctors]);

  useEffect(() => {
    if (initialValues) {
      return;
    }

    void (async () => {
      const response = await getSuggestedServiceFolio();
      if (!response.ok) {
        return;
      }

      setFormData((current) => {
        if (!isGeneratedServiceFolio(current.folio)) {
          return current;
        }

        return {
          ...current,
          folio: response.data.folio,
        };
      });
    })();
  }, [initialValues]);

  const errors = useMemo(() => validateServiceForm(formData), [formData]);
  const courtesyPercent = Number(formData.courtesyPercent || 0);
  const totals = useMemo(
    () =>
      calculateServiceTotals(
        formData.items,
        studies,
        Number.isFinite(courtesyPercent) ? courtesyPercent : 0,
      ),
    [courtesyPercent, formData.items, studies],
  );

  const filteredStudies = useMemo(() => {
    const normalizedSearch = normalizeSearchText(studySearch);
    const baseStudies = studies.filter((study) => study.status === "active");

    if (!normalizedSearch) {
      return baseStudies;
    }

    return baseStudies.filter((study) =>
      matchesNormalizedSearch(
        [study.name, study.code, study.description ?? "", study.type],
        normalizedSearch,
      ),
    );
  }, [studies, studySearch]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) {
      const activePatients = localPatients.filter((patient) => patient.isActive !== false);
      return activePatients;
    }

    return localPatients.filter((patient) =>
      matchesNormalizedSearch(
        [
          getPatientLabel(patient),
          patient.phone ?? "",
          patient.email ?? "",
          patient.documentType ?? "",
          patient.documentNumber ?? "",
          patient.addressLine ?? "",
        ],
        patientSearch,
      ),
    );
  }, [localPatients, patientSearch]);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) {
      return localDoctors;
    }

    return localDoctors.filter((doctor) =>
      matchesNormalizedSearch(
        [
          getDoctorLabel(doctor),
          doctor.specialty ?? "",
          doctor.licenseNumber ?? "",
          doctor.phone ?? "",
          doctor.email ?? "",
        ],
        doctorSearch,
      ),
    );
  }, [doctorSearch, localDoctors]);

  const selectedPatient = useMemo(
    () =>
      localPatients.find(
        (patient) => String(patient.id) === formData.patientId,
      ) ?? null,
    [formData.patientId, localPatients],
  );

  const selectedDoctor = useMemo(
    () =>
      localDoctors.find((doctor) => String(doctor.id) === formData.doctorId) ??
      null,
    [formData.doctorId, localDoctors],
  );

  const canAdvanceToStudies = Boolean(
    formData.folio.trim() && formData.patientId && formData.branchName,
  );
  const canAdvanceToClosing = formData.items.length > 0;

  const handleClose = () => {
    if (isSaving) return;
    setOpen(false);
  };

  const handleAddStudy = (studyId: number) => {
    const selectedStudy = studies.find((study) => study.id === studyId);
    const defaultDiscountPercent = Number(
      selectedStudy?.defaultDiscountPercent ?? 0,
    );

    setFormData((current) => ({
      ...current,
      items: [
        ...current.items,
        createServiceDraftItem(studyId, {
          defaultDiscountPercent,
          useDefaultDiscount: defaultDiscountPercent > 0,
          discountPercent:
            defaultDiscountPercent > 0 ? defaultDiscountPercent : 0,
        }),
      ],
    }));
  };

  const handleUpdateItem = (
    itemId: string,
    field: "priceType" | "quantity" | "discountPercent" | "courtesyPercent",
    rawValue: string,
  ) => {
    if (field === "courtesyPercent") {
      setFormData((current) => ({
        ...current,
        courtesyPercent: rawValue,
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;

        if (field === "priceType") {
          return { ...item, priceType: rawValue as typeof item.priceType };
        }

        const parsed = Number(rawValue);
        if (field === "quantity") {
          return {
            ...item,
            quantity:
              Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1,
          };
        }

        return {
          ...item,
          discountPercent:
            Number.isFinite(parsed) && parsed >= 0 ? Math.min(100, parsed) : 0,
        };
      }),
    }));
  };

  const handleToggleDefaultDiscount = (itemId: string, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;

        return {
          ...item,
          useDefaultDiscount: checked,
          discountPercent: checked
            ? Number(item.defaultDiscountPercent || 0)
            : 0,
        };
      }),
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleInlinePatientCreate = async (payload: CreatePatientPayload) => {
    setIsSavingPatient(true);
    const response = await createPatient(payload);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo crear el paciente.");
      setIsSavingPatient(false);
      return false;
    }

    const patient = response.data.data;
    setLocalPatients((current) => {
      const filtered = current.filter((item) => item.id !== patient.id);
      return [patient, ...filtered];
    });
    setFormData((current) => ({
      ...current,
      patientId: String(patient.id),
    }));
    setOpenPatientModal(false);
    setIsSavingPatient(false);
    toast.success("Paciente creado y seleccionado en el servicio.");
    return true;
  };

  const handleInlineDoctorCreate = async (payload: CreateDoctorPayload) => {
    setIsSavingDoctor(true);
    const response = await createDoctor(payload);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo crear el medico.");
      setIsSavingDoctor(false);
      return false;
    }

    const doctor = response.data.data;
    setLocalDoctors((current) => {
      const filtered = current.filter((item) => item.id !== doctor.id);
      return [doctor, ...filtered];
    });
    setFormData((current) => ({
      ...current,
      doctorId: String(doctor.id),
    }));
    setOpenDoctorModal(false);
    setIsSavingDoctor(false);
    toast.success("Medico creado y seleccionado en el servicio.");
    return true;
  };

  const handleSubmit = async () => {
    if (hasServiceFormErrors(errors)) {
      toast.error("Completa los campos obligatorios del servicio.");
      return;
    }

    const ok = await saveService(
      mapServiceFormToPayload(formData, { autoGenerateFolio: useAutoFolio }),
    );
    if (ok) {
      setOpen(false);
    }
  };

  return (
    <>
      <AppModal>
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]">
            <div className="border-b border-gray-200 bg-gradient-to-r from-red-700 via-red-600 to-rose-500 p-4 text-white sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/30 bg-white/10 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold sm:text-2xl">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-red-50">{description}</p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  disabled={isSaving}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                {stepTitles.map((stepTitle, index) => (
                  <StepBadge
                    key={stepTitle}
                    label={stepTitle}
                    index={index}
                    currentStep={currentStep}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-6 sm:p-6">
              {isCatalogsLoading ? (
                <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Cargando catalogos del servicio
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-gray-500">
                      Estamos preparando pacientes, medicos y estudios para que
                      el modal abra ya listo y no reciba carga innecesaria desde
                      el inicio.
                    </p>
                  </div>
                </div>
              ) : null}

              {!isCatalogsLoading && currentStep === 0 ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50/70 p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Identidad del servicio
                          </h3>
                          <p className="text-xs text-gray-500">
                            Folio unico y sucursal donde nace el estudio.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Folio
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={formData.folio}
                              onChange={(e) => {
                                setUseAutoFolio(false);
                                setFormData((current) => ({
                                  ...current,
                                  folio: e.target.value,
                                }));
                              }}
                              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                              placeholder="ECO202603220001"
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                setUseAutoFolio(true);
                                const response = await getSuggestedServiceFolio();

                                setFormData((current) => ({
                                  ...current,
                                  folio: response.ok
                                    ? response.data.folio
                                    : generateSuggestedServiceFolio(),
                                }));
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                              disabled={isSaving}
                            >
                              <RefreshCw className="h-4 w-4" />
                              Auto
                            </button>
                          </div>
                          {errors.folio ? (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.folio}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Sucursal
                          </label>
                          <select
                            value={formData.branchName}
                            onChange={(e) =>
                              setFormData((current) => ({
                                ...current,
                                branchName: e.target.value,
                              }))
                            }
                            className="modal-select w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            disabled={isSaving}
                          >
                            {SERVICE_BRANCH_OPTIONS.map((branch) => (
                              <option key={branch} value={branch}>
                                {branch}
                              </option>
                            ))}
                          </select>
                          {errors.branchName ? (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.branchName}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Paciente y medico
                          </h3>
                          <p className="text-xs text-gray-500">
                            Selecciona el expediente y el medico tratante si
                            aplica.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Paciente
                          </label>
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input
                                value={patientSearch}
                                onChange={(e) =>
                                  setPatientSearch(e.target.value)
                                }
                                placeholder="Buscar por nombre, telefono, documento o correo..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                disabled={isSaving}
                              />
                            </div>

                            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                              {filteredPatients.length ? (
                                filteredPatients.map((patient) => {
                                  const isSelected =
                                    formData.patientId === String(patient.id);
                                  const patientName = getPatientLabel(patient);
                                  const secondaryInfo = [
                                    patient.documentType &&
                                    patient.documentNumber
                                      ? `${patient.documentType}: ${patient.documentNumber}`
                                      : null,
                                    patient.phone ?? null,
                                    patient.email ?? null,
                                  ]
                                    .filter(Boolean)
                                    .join(" | ");

                                  return (
                                    <button
                                      key={patient.id}
                                      type="button"
                                      onClick={() =>
                                        setFormData((current) => ({
                                          ...current,
                                          patientId: String(patient.id),
                                        }))
                                      }
                                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                        isSelected
                                          ? "border-red-300 bg-red-50 shadow-sm"
                                          : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                                      }`}
                                      disabled={isSaving}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-gray-900">
                                            {patientName}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-500">
                                            {secondaryInfo ||
                                              "Sin datos adicionales"}
                                          </p>
                                        </div>
                                        <span
                                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            patient.isActive === false
                                              ? "bg-red-100 text-red-700"
                                              : "bg-emerald-100 text-emerald-700"
                                          }`}
                                        >
                                          {patient.isActive === false
                                            ? "Inactivo"
                                            : "Activo"}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                  No se encontraron pacientes con esa busqueda.
                                </div>
                              )}
                            </div>
                          </div>
                          {errors.patientId ? (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.patientId}
                            </p>
                          ) : null}
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => setOpenPatientModal(true)}
                              className="text-xs font-medium text-red-600 hover:underline"
                              disabled={isSaving || isSavingPatient}
                            >
                              + Crear nuevo paciente
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Medico tratante
                          </label>
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input
                                value={doctorSearch}
                                onChange={(e) =>
                                  setDoctorSearch(e.target.value)
                                }
                                placeholder="Buscar por nombre, especialidad, cedula o correo..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                disabled={isSaving}
                              />
                            </div>

                            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((current) => ({
                                    ...current,
                                    doctorId: "",
                                  }))
                                }
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                  !formData.doctorId
                                    ? "border-red-300 bg-red-50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                                }`}
                                disabled={isSaving}
                              >
                                <p className="text-sm font-semibold text-gray-900">
                                  Sin medico asignado
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Usa esta opcion si el servicio no lleva medico
                                  tratante.
                                </p>
                              </button>

                              {filteredDoctors.length ? (
                                filteredDoctors.map((doctor) => {
                                  const isSelected =
                                    formData.doctorId === String(doctor.id);
                                  const doctorName = getDoctorLabel(doctor);
                                  const secondaryInfo = [
                                    doctor.specialty ?? null,
                                    doctor.licenseNumber
                                      ? `Cedula ${doctor.licenseNumber}`
                                      : null,
                                    doctor.phone ?? null,
                                    doctor.email ?? null,
                                  ]
                                    .filter(Boolean)
                                    .join(" | ");

                                  return (
                                    <button
                                      key={doctor.id}
                                      type="button"
                                      onClick={() =>
                                        setFormData((current) => ({
                                          ...current,
                                          doctorId: String(doctor.id),
                                        }))
                                      }
                                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                        isSelected
                                          ? "border-red-300 bg-red-50 shadow-sm"
                                          : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                                      }`}
                                      disabled={isSaving}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-gray-900">
                                            {doctorName}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-500">
                                            {secondaryInfo ||
                                              "Sin datos adicionales"}
                                          </p>
                                        </div>
                                        <span
                                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            doctor.isActive === false
                                              ? "bg-red-100 text-red-700"
                                              : "bg-emerald-100 text-emerald-700"
                                          }`}
                                        >
                                          {doctor.isActive === false
                                            ? "Inactivo"
                                            : "Activo"}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                  No se encontraron medicos con esa busqueda.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => setOpenDoctorModal(true)}
                              className="text-xs font-medium text-red-600 hover:underline"
                              disabled={isSaving || isSavingDoctor}
                            >
                              + Crear nuevo medico
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-red-100 bg-red-50/70 p-5 text-sm text-red-900">
                      <p className="font-semibold">Antes de continuar</p>
                      <ul className="mt-3 space-y-2 text-sm text-red-800">
                        <li>
                          Define un folio unico para identificar el servicio.
                        </li>
                        <li>Relaciona el servicio con un paciente activo.</li>
                        <li>
                          Selecciona la sucursal donde se tomara o procesara la
                          muestra.
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900">
                        Resumen rapido
                      </p>

                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Folio
                          </p>
                          <p className="mt-2 font-semibold text-gray-900">
                            {formData.folio || "Sin folio"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Paciente
                          </p>
                          <p className="mt-2 font-semibold text-gray-900">
                            {selectedPatient
                              ? getPatientLabel(selectedPatient)
                              : "Sin seleccionar"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Medico
                          </p>
                          <p className="mt-2 font-semibold text-gray-900">
                            {selectedDoctor
                              ? getDoctorLabel(selectedDoctor)
                              : "Sin medico"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Sucursal
                          </p>
                          <p className="mt-2 font-semibold text-gray-900">
                            {formData.branchName || "Sin definir"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isCatalogsLoading && currentStep === 1 ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                          <PackagePlus className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Catalogo de estudios
                          </h3>
                          <p className="text-xs text-gray-500">
                            Busca estudios individuales o paquetes activos y
                            agregalos al servicio.
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          value={studySearch}
                          onChange={(e) => setStudySearch(e.target.value)}
                          placeholder="Buscar por nombre, clave o descripcion..."
                          className="w-full rounded-xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          disabled={isSaving}
                        />
                      </div>

                      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-2">
                        {filteredStudies.map((study) => (
                          <div
                            key={study.id}
                            className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {study.name}
                                  </p>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                      study.type === "package"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {study.type === "package"
                                      ? "Paquete"
                                      : "Estudio"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {study.code} · $
                                  {Number(study.normalPrice).toFixed(2)} normal
                                </p>
                                {Number(study.defaultDiscountPercent ?? 0) >
                                0 ? (
                                  <p className="mt-1 text-xs font-medium text-emerald-700">
                                    Descuento configurado:{" "}
                                    {Number(
                                      study.defaultDiscountPercent,
                                    ).toFixed(2)}
                                    %
                                  </p>
                                ) : null}
                                <p className="mt-2 text-xs text-gray-600">
                                  {study.description || "Sin descripcion"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddStudy(study.id)}
                                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-red-700"
                                disabled={isSaving}
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Servicio armado
                          </h3>
                          <p className="text-xs text-gray-500">
                            Ajusta precio, conserva o quita el descuento del
                            estudio y revisa el total en vivo.
                          </p>
                        </div>
                      </div>

                      {errors.items ? (
                        <p className="mb-3 text-xs font-medium text-red-600">
                          {errors.items}
                        </p>
                      ) : null}

                      {totals.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                          Todavia no agregas estudios al servicio.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {totals.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {getStudyNameSummary(item.study)}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.study?.code ?? "Sin clave"} ·{" "}
                                    {item.study?.type === "package"
                                      ? "Se desglosa al guardar"
                                      : "Item individual"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="rounded-xl border border-red-200 bg-white p-2 text-red-600 transition-all hover:bg-red-50"
                                  disabled={isSaving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Tipo de precio
                                  </label>
                                  <select
                                    value={item.priceType}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        item.id,
                                        "priceType",
                                        e.target.value,
                                      )
                                    }
                                    className="modal-select w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    disabled={isSaving}
                                  >
                                    {(
                                      [
                                        "normal",
                                        "dif",
                                        "special",
                                        "hospital",
                                        "other",
                                      ] as const
                                    ).map((priceType) => (
                                      <option key={priceType} value={priceType}>
                                        {getServicePriceTypeLabel(priceType)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Cantidad
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        item.id,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    disabled={isSaving}
                                  />
                                </div>
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Desc. estudio
                                  </label>
                                  <label className="flex min-h-[48px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={item.useDefaultDiscount}
                                      onChange={(e) =>
                                        handleToggleDefaultDiscount(
                                          item.id,
                                          e.target.checked,
                                        )
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                      disabled={
                                        isSaving ||
                                        Number(
                                          item.defaultDiscountPercent || 0,
                                        ) <= 0
                                      }
                                    />
                                    <span className="font-medium">
                                      {Number(
                                        item.defaultDiscountPercent || 0,
                                      ) > 0
                                        ? `${Number(item.defaultDiscountPercent).toFixed(2)}%`
                                        : "Sin descuento"}
                                    </span>
                                  </label>
                                </div>
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Subtotal
                                  </label>
                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
                                    ${item.subtotalAmount.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-3 text-xs text-gray-600 md:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  Costo base: ${item.baseAmount.toFixed(2)}
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  Modo:{" "}
                                  {getServicePriceTypeLabel(item.priceType)}
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 md:col-span-2">
                                  Descuento aplicado:{" "}
                                  {item.useDefaultDiscount
                                    ? `${item.appliedDiscountPercent.toFixed(2)}%`
                                    : "No aplicar"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-[1.75rem] border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-lg">
                      <p className="text-sm font-semibold">Cierre economico</p>
                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between text-slate-200">
                            <span>Subtotal base</span>
                            <span className="font-semibold">
                              ${totals.baseSubtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-200">
                            <span>Descuento estudios</span>
                            <span className="font-semibold text-rose-200">
                              -${totals.itemDiscountAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-200">
                            <span>Subtotal</span>
                            <span className="font-semibold">
                              ${totals.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-200">
                            <span>Cortesia</span>
                            <span className="font-semibold text-amber-200">
                              -${totals.courtesyDiscountAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base">
                            <span>Total estimado</span>
                            <span className="font-semibold">
                              ${totals.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                            Aplicar % de cortesia
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.courtesyPercent}
                            onChange={(e) =>
                              handleUpdateItem(
                                "",
                                "courtesyPercent",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-white/30 focus:ring-2 focus:ring-white/20"
                            disabled={isSaving}
                          />
                          <p className="mt-2 text-xs text-slate-300">
                            La cortesia se aplica despues del descuento propio
                            del estudio.
                          </p>
                          {errors.courtesyPercent ? (
                            <p className="mt-2 text-xs font-medium text-amber-200">
                              {errors.courtesyPercent}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isCatalogsLoading && currentStep === 2 ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                          <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Fechas y notas
                          </h3>
                          <p className="text-xs text-gray-500">
                            Deja programada la toma, entrega y observaciones del
                            servicio.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Fecha de muestra
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.sampleAt}
                            onChange={(e) =>
                              setFormData((current) => ({
                                ...current,
                                sampleAt: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            disabled={isSaving}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Fecha de entrega
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.deliveryAt}
                            onChange={(e) =>
                              setFormData((current) => ({
                                ...current,
                                deliveryAt: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            disabled={isSaving}
                          />
                          {errors.deliveryAt ? (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.deliveryAt}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[0.45fr_0.55fr]">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Cortesia (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.courtesyPercent}
                            onChange={(e) =>
                              setFormData((current) => ({
                                ...current,
                                courtesyPercent: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            disabled={isSaving}
                          />
                          {errors.courtesyPercent ? (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.courtesyPercent}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Notas del servicio
                          </label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData((current) => ({
                                ...current,
                                notes: e.target.value,
                              }))
                            }
                            className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            placeholder="Indicaciones, condiciones del paciente o notas internas..."
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900">
                        Resumen final del servicio
                      </p>

                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Paciente
                          </p>
                          <p className="mt-2 font-semibold text-gray-900">
                            {selectedPatient
                              ? `${selectedPatient.firstName} ${selectedPatient.lastName} ${selectedPatient.middleName ?? ""}`.trim()
                              : "Sin seleccionar"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Estudios capturados
                          </p>
                          <div className="mt-2 space-y-2">
                            {totals.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                              >
                                {getStudyNameSummary(item.study)}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Totales
                          </p>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Subtotal base</span>
                              <span className="font-semibold text-gray-900">
                                ${totals.baseSubtotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Descuento estudios</span>
                              <span className="font-semibold text-gray-900">
                                -${totals.itemDiscountAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Subtotal</span>
                              <span className="font-semibold text-gray-900">
                                ${totals.subtotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Cortesia</span>
                              <span className="font-semibold text-gray-900">
                                -${totals.courtesyDiscountAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                              <span>Total</span>
                              <span className="font-semibold text-gray-900">
                                ${totals.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-5 text-sm text-emerald-900">
                      <p className="font-semibold">Al guardar</p>
                      <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                        <li>
                          Los paquetes se desglosan automaticamente en sus
                          estudios reales.
                        </li>
                        <li>Se calculan subtotal, cortesia y total final.</li>
                        <li>
                          El servicio queda listo para resultados, ticket,
                          recibo y etiquetas.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:flex-row md:items-center md:justify-between sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  className="app-action-button rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                  disabled={isSaving || isCatalogsLoading}
                >
                  Cancelar
                </button>

                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep((step) => Math.max(0, step - 1))
                    }
                    className="app-action-button inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                    disabled={isSaving || isCatalogsLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Regresar
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {currentStep < stepTitles.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 0 && !canAdvanceToStudies) {
                        toast.error(
                          "Completa folio, paciente y sucursal antes de continuar.",
                        );
                        return;
                      }

                      if (currentStep === 1 && !canAdvanceToClosing) {
                        toast.error("Agrega al menos un estudio o paquete.");
                        return;
                      }

                      setCurrentStep((step) =>
                        Math.min(stepTitles.length - 1, step + 1),
                      );
                    }}
                    className="app-action-button inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    disabled={isSaving || isCatalogsLoading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    className="app-action-button inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    disabled={isSaving || isCatalogsLoading}
                  >
                    {isSaving ? "Guardando..." : submitLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppModal>

      {openPatientModal ? (
        <AddPatientModal
          setOpen={setOpenPatientModal}
          addPatient={handleInlinePatientCreate}
          isSaving={isSavingPatient}
        />
      ) : null}

      {openDoctorModal ? (
        <AddDoctorModal
          setOpen={setOpenDoctorModal}
          addDoctor={handleInlineDoctorCreate}
          isSaving={isSavingDoctor}
        />
      ) : null}
    </>
  );
}
