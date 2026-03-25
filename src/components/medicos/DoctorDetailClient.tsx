"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
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
  updateDoctor,
  updateDoctorStatus,
  type Doctor,
} from "@/actions/doctors/doctorsActions";
import DoctorFormFields from "@/components/medicos/DoctorFormFields";
import { formatDateTime } from "@/helpers/date";
import {
  createEmptyDoctorForm,
  createTouchedDoctorForm,
  hasDoctorFormErrors,
  mapDoctorToForm,
  mapFormToPayload,
  validateDoctorForm,
  type DoctorFormTouched,
  type DoctorFormValues,
} from "@/components/medicos/doctorFormUtils";
import { useHashSectionScroll } from "@/hooks/useHashSectionScroll";

type DoctorDetailClientProps = {
  doctorId: number;
  initialDoctor: Doctor | null;
  initialError?: string | null;
  initialIsEditing?: boolean;
};

const getStatusColor = (isActive: boolean) =>
  isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

function doctorFullName(doctor: Doctor | null) {
  if (!doctor) return "";

  return [doctor.firstName, doctor.lastName, doctor.middleName ?? ""]
    .filter(Boolean)
    .join(" ");
}

export default function DoctorDetailClient({
  doctorId,
  initialDoctor,
  initialError = null,
  initialIsEditing = false,
}: DoctorDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor);
  const [formData, setFormData] = useState<DoctorFormValues>(() =>
    initialDoctor ? mapDoctorToForm(initialDoctor) : createEmptyDoctorForm(),
  );
  const [touched, setTouched] = useState<DoctorFormTouched>({});
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const errors = useMemo(() => validateDoctorForm(formData), [formData]);

  useHashSectionScroll();

  useEffect(() => {
    setIsEditing(searchParams.get("modo") === "editar");
  }, [searchParams]);

  useEffect(() => {
    setDoctor(initialDoctor);
    setFormData(
      initialDoctor ? mapDoctorToForm(initialDoctor) : createEmptyDoctorForm(),
    );
    setTouched({});
  }, [initialDoctor]);

  const refreshRoute = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
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

  const handleStartEdit = () => {
    setIsEditing(true);
    router.replace(`/medicos/detalle/${doctorId}?modo=editar#perfil-completo`);
  };

  const handleSave = async () => {
    if (!doctor) return;

    setTouched(createTouchedDoctorForm());

    if (hasDoctorFormErrors(errors)) {
      toast.error("Revisa los campos obligatorios y corrige los errores.");
      return;
    }

    setSaving(true);
    const response = await updateDoctor(doctor.id, mapFormToPayload(formData));
    setSaving(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el medico.");
      return;
    }

    setDoctor(response.data.data);
    setFormData(mapDoctorToForm(response.data.data));
    setTouched({});
    setIsEditing(false);
    toast.success("Medico actualizado con exito.");
    router.replace(`/medicos/detalle/${doctor.id}`);
    refreshRoute();
  };

  const handleToggleStatus = async () => {
    if (!doctor) return;

    setUpdatingStatus(true);
    const nextStatus = !(doctor.isActive !== false);
    const response = await updateDoctorStatus(doctor.id, nextStatus);
    setUpdatingStatus(false);

    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del medico.",
      );
      return;
    }

    setDoctor(response.data.data);
    toast.success(nextStatus ? "Medico reactivado." : "Medico suspendido.");
    refreshRoute();
  };

  const handleCancelEdit = () => {
    if (doctor) {
      setFormData(mapDoctorToForm(doctor));
    }
    setTouched({});
    setIsEditing(false);
    router.replace(`/medicos/detalle/${doctorId}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/medicos"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a medicos
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Detalle de medico
          </h1>
          <p className="mt-2 text-gray-600">
            Consulta el perfil y realiza cambios sin salir del expediente del
            medico.
          </p>
        </div>

        {doctor ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(doctor.isActive !== false)}`}
            >
              {doctor.isActive !== false ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <ShieldX className="h-4 w-4" />
              )}
              {doctor.isActive !== false ? "Activo" : "Inactivo"}
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
                    doctor.isActive !== false
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } disabled:opacity-50`}
                  disabled={updatingStatus || isRefreshing}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : doctor.isActive !== false ? (
                    <ShieldX className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {doctor.isActive !== false
                    ? "Suspender medico"
                    : "Reactivar medico"}
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
      ) : doctor ? (
        <div className="space-y-6">
          <div
            id="resumen-perfil"
            className="section-anchor-target grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resumen del perfil
                  </h2>
                  <p className="text-sm text-gray-500">
                    Vista rapida del registro actual del medico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nombre completo
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctorFullName(doctor)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Especialidad
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.specialty ?? "Sin especialidad"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Cedula profesional
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.licenseNumber ?? "Sin cedula"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Telefono
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.phone ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Correo
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.email ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Notas
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.notes ?? "Sin notas"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">
                Ficha rapida
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {doctorFullName(doctor)}
              </h2>
              <p className="mt-2 text-sm text-red-50">
                Registrado el {formatDateTime(doctor.createdAt)}
              </p>

              <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Especialidad
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {doctor.specialty ?? "Sin especialidad"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Cedula
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {doctor.licenseNumber ?? "Sin cedula"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Contacto
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {[doctor.phone, doctor.email].filter(Boolean).join(" | ") ||
                      "Sin contacto"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            id="perfil-completo"
            className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? "Editar perfil medico" : "Perfil completo"}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing
                    ? "Modifica los campos y guarda los cambios del medico."
                    : "Consulta toda la informacion capturada del medico."}
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
                  Editar perfil
                </button>
              ) : null}
            </div>

            <DoctorFormFields
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
