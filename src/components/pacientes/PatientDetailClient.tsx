"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Loader2,
  PencilLine,
  Save,
  ShieldX,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  getPatientById,
  updatePatient,
  updatePatientStatus,
  type Patient,
} from "@/features/patients/api/patients";
import PatientFormFields from "@/components/pacientes/PatientFormFields";
import { DetailPageSkeleton } from "@/components/ui/PageSkeletons";
import { formatDateTime } from "@/helpers/date";
import {
  calculateAge,
  createEmptyPatientForm,
  createTouchedPatientForm,
  hasPatientFormErrors,
  mapFormToPayload,
  mapPatientToForm,
  validatePatientForm,
  type PatientFormTouched,
  type PatientFormValues,
} from "@/components/pacientes/patientFormUtils";
import { useHashSectionScroll } from "@/hooks/useHashSectionScroll";
import { buildPatientDetailHref } from "@/lib/routes/detail-routes";

type PatientDetailClientProps = {
  patientId: number;
  initialIsEditing?: boolean;
};

const getStatusColor = (isActive: boolean) =>
  isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

const getGenderLabel = (gender: string) => {
  if (gender === "male") return "Masculino";
  if (gender === "female") return "Femenino";
  return "Otro";
};

function formatDocument(patient: Patient | null) {
  if (!patient?.documentType || !patient.documentNumber) {
    return "Sin documento";
  }

  return `${patient.documentType}: ${patient.documentNumber}`;
}

export default function PatientDetailClient({
  patientId,
  initialIsEditing = false,
}: PatientDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<PatientFormValues>(createEmptyPatientForm());
  const [touched, setTouched] = useState<PatientFormTouched>({});
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const errors = useMemo(() => validatePatientForm(formData), [formData]);

  useHashSectionScroll();

  useEffect(() => {
    setIsEditing(searchParams.get("modo") === "editar");
  }, [searchParams]);

  const age = useMemo(
    () => calculateAge(formData.fechaNacimiento),
    [formData.fechaNacimiento],
  );

  const refreshPatient = async () => {
    setIsRefreshing(true);
    const response = await getPatientById(patientId);
    setIsRefreshing(false);

    if (!response.ok) {
      setPatient(null);
      setInitialError(
        response.errors[0] ?? "No se pudo cargar el detalle del paciente.",
      );
      setLoading(false);
      return;
    }

    setPatient(response.data);
    setFormData(mapPatientToForm(response.data));
    setInitialError(null);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!Number.isInteger(patientId) || patientId < 1) {
        if (!cancelled) {
          setInitialError("ID de paciente invalido.");
          setLoading(false);
        }
        return;
      }

      const response = await getPatientById(patientId);
      if (cancelled) return;

      if (!response.ok) {
        setPatient(null);
        setInitialError(
          response.errors[0] ?? "No se pudo cargar el detalle del paciente.",
        );
        setLoading(false);
        return;
      }

      setPatient(response.data);
      setFormData(mapPatientToForm(response.data));
      setInitialError(null);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
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

  const handleStartEdit = () => {
    setIsEditing(true);
    router.replace(
      buildPatientDetailHref(patientId, {
        mode: "editar",
        hash: "expediente-completo",
      }),
    );
  };

  const handleSave = async () => {
    if (!patient) return;

    setTouched(createTouchedPatientForm());

    if (hasPatientFormErrors(errors)) {
      toast.error("Revisa los campos obligatorios y corrige los errores.");
      return;
    }

    setSaving(true);
    const response = await updatePatient(patient.id, mapFormToPayload(formData));
    setSaving(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el paciente.");
      return;
    }

    setPatient(response.data.data);
    setFormData(mapPatientToForm(response.data.data));
    setTouched({});
    setIsEditing(false);
    toast.success("Paciente actualizado con exito.");
    router.replace(buildPatientDetailHref(patient.id));
    await refreshPatient();
  };

  const handleToggleStatus = async () => {
    if (!patient) return;

    setUpdatingStatus(true);
    const nextStatus = !(patient.isActive !== false);
    const response = await updatePatientStatus(patient.id, nextStatus);
    setUpdatingStatus(false);

    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del paciente.",
      );
      return;
    }

    setPatient(response.data.data);
    toast.success(nextStatus ? "Paciente reactivado." : "Paciente suspendido.");
    await refreshPatient();
  };

  const handleCancelEdit = () => {
    if (patient) {
      setFormData(mapPatientToForm(patient));
    }
    setTouched({});
    setIsEditing(false);
    router.replace(buildPatientDetailHref(patientId));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <DetailPageSkeleton sections={3} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/pacientes"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a pacientes
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Detalle de paciente
          </h1>
          <p className="mt-2 text-gray-600">
            Consulta el expediente y realiza cambios sin perder el historial del
            registro.
          </p>
        </div>

        {patient ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(patient.isActive !== false)}`}
            >
              {patient.isActive !== false ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <ShieldX className="h-4 w-4" />
              )}
              {patient.isActive !== false ? "Activo" : "Inactivo"}
            </span>

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={saving || isRefreshing}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={saving || isRefreshing}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isRefreshing}
                >
                  <PencilLine className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleStatus()}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    patient.isActive !== false
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } disabled:opacity-50`}
                  disabled={updatingStatus || isRefreshing}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : patient.isActive !== false ? (
                    <ShieldX className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {patient.isActive !== false
                    ? "Suspender paciente"
                    : "Reactivar paciente"}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {isRefreshing ? (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando cambios...
        </div>
      ) : null}

      {initialError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {initialError}
        </div>
      ) : patient ? (
        <div className="space-y-6">
          <div
            id="resumen-expediente"
            className="section-anchor-target grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resumen del expediente
                  </h2>
                  <p className="text-sm text-gray-500">
                    Vista rapida del registro actual del paciente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nombre completo
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {[
                      patient.firstName,
                      patient.lastName,
                      patient.middleName ?? "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Documento
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatDocument(patient)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Genero
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {getGenderLabel(patient.gender)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Edad actual
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {age} anos
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Teléfono
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {patient.phone ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Correo
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {patient.email ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">
                Ficha rapida
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {[patient.firstName, patient.lastName].filter(Boolean).join(" ")}
              </h2>
              <p className="mt-2 text-sm text-red-50">
                Registrado el {formatDateTime(patient.createdAt)}
              </p>

              <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Direccion
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {patient.addressLine ?? "Sin direccion"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Entre calles
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {patient.addressBetween ?? "Sin referencia"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Ubicacion
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {[
                      patient.addressCity,
                      patient.addressState,
                      patient.addressZip,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicacion"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            id="expediente-completo"
            className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? "Editar expediente" : "Expediente completo"}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing
                    ? "Modifica los campos y guarda los cambios del paciente."
                    : "Consulta toda la informacion capturada del paciente."}
                </p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isRefreshing}
                >
                  <PencilLine className="h-4 w-4" />
                  Editar expediente
                </button>
              ) : null}
            </div>

            <PatientFormFields
              formData={formData}
              errors={errors}
              touched={touched}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditing || saving || isRefreshing}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
