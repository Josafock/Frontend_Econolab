'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Loader2,
  PencilLine,
  Save,
  ShieldX,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { DetailPageSkeleton } from '@/components/ui/PageSkeletons';
import {
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  type Doctor,
} from '@/actions/doctors/doctorsActions';
import DoctorFormFields from '@/components/medicos/DoctorFormFields';
import { formatDateTime } from '@/helpers/date';
import {
  createEmptyDoctorForm,
  createTouchedDoctorForm,
  hasDoctorFormErrors,
  mapDoctorToForm,
  mapFormToPayload,
  validateDoctorForm,
  type DoctorFormTouched,
  type DoctorFormValues,
} from '@/components/medicos/doctorFormUtils';

const getStatusColor = (isActive: boolean) =>
  isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-red-200 bg-red-50 text-red-700';

function doctorFullName(doctor: Doctor | null) {
  if (!doctor) return '';
  return [doctor.firstName, doctor.lastName, doctor.middleName ?? '']
    .filter(Boolean)
    .join(' ');
}

export default function DoctorDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormValues>(createEmptyDoctorForm());
  const [touched, setTouched] = useState<DoctorFormTouched>({});
  const [isEditing, setIsEditing] = useState(searchParams.get('modo') === 'editar');
  const errors = useMemo(() => validateDoctorForm(formData), [formData]);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de médico inválido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await getDoctorById(id);
      if (!response.ok) {
        setError(response.errors[0] ?? 'No se pudo cargar el médico.');
        setLoading(false);
        return;
      }

      setDoctor(response.data);
      setFormData(mapDoctorToForm(response.data));
      setTouched({});
      setLoading(false);
    };

    void load();
  }, [id]);

  useEffect(() => {
    setIsEditing(searchParams.get('modo') === 'editar');
  }, [searchParams]);

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

  const handleSave = async () => {
    if (!doctor) return;

    setTouched(createTouchedDoctorForm());

    if (hasDoctorFormErrors(errors)) {
      toast.error('Revisa los campos obligatorios y corrige los errores.');
      return;
    }

    setSaving(true);
    const response = await updateDoctor(doctor.id, mapFormToPayload(formData));
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo actualizar el médico.');
      setSaving(false);
      return;
    }

    setDoctor(response.data.data);
    setFormData(mapDoctorToForm(response.data.data));
    setTouched({});
    setIsEditing(false);
    toast.success('Médico actualizado con éxito.');
    router.replace(`/medicos/detalle/${doctor.id}`);
    setSaving(false);
  };

  const handleToggleStatus = async () => {
    if (!doctor) return;

    setUpdatingStatus(true);
    const nextStatus = !(doctor.isActive !== false);
    const response = await updateDoctorStatus(doctor.id, nextStatus);
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del médico.');
      setUpdatingStatus(false);
      return;
    }

    setDoctor(response.data.data);
    toast.success(nextStatus ? 'Médico reactivado.' : 'Médico suspendido.');
    setUpdatingStatus(false);
  };

  const handleCancelEdit = () => {
    if (doctor) {
      setFormData(mapDoctorToForm(doctor));
    }
    setTouched({});
    setIsEditing(false);
    router.replace(`/medicos/detalle/${id}`);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/medicos"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a médicos
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Detalle de médico</h1>
          <p className="mt-2 text-gray-600">
            Consulta el perfil y realiza cambios sin salir del expediente del médico.
          </p>
        </div>

        {!loading && doctor && (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(doctor.isActive !== false)}`}
            >
              {doctor.isActive !== false ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <ShieldX className="h-4 w-4" />
              )}
              {doctor.isActive !== false ? 'Activo' : 'Inactivo'}
            </span>

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar cambios
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    router.replace(`/medicos/detalle/${id}?modo=editar`);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleStatus()}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    doctor.isActive !== false
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } disabled:opacity-50`}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : doctor.isActive !== false ? (
                    <ShieldX className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {doctor.isActive !== false ? 'Suspender médico' : 'Reactivar médico'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <DetailPageSkeleton sections={3} />
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : doctor ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Resumen del perfil</h2>
                  <p className="text-sm text-gray-500">
                    Vista rápida del registro actual del médico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Nombre completo</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctorFullName(doctor)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Especialidad</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.specialty ?? 'Sin especialidad'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Cédula profesional</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.licenseNumber ?? 'Sin cédula'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Teléfono</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{doctor.phone ?? '-'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Correo</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{doctor.email ?? '-'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Notas</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {doctor.notes ?? 'Sin notas'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">Ficha rápida</p>
              <h2 className="mt-3 text-2xl font-semibold">{doctorFullName(doctor)}</h2>
              <p className="mt-2 text-sm text-red-50">
                Registrado el {formatDateTime(doctor.createdAt)}
              </p>

              <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Especialidad</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {doctor.specialty ?? 'Sin especialidad'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Cédula</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {doctor.licenseNumber ?? 'Sin cédula'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Contacto</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {[doctor.phone, doctor.email].filter(Boolean).join(' | ') || 'Sin contacto'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Editar perfil médico' : 'Perfil completo'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing
                    ? 'Modifica los campos y guarda los cambios del médico.'
                    : 'Consulta toda la información capturada del médico.'}
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    router.replace(`/medicos/detalle/${id}?modo=editar`);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Editar perfil
                </button>
              )}
            </div>

            <DoctorFormFields
              formData={formData}
              errors={errors}
              touched={touched}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditing || saving}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
