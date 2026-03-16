'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Eye,
  Filter,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldX,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react';
import AddDoctorModal from '@/components/medicos/AddDoctorModal';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import { formatDate } from '@/helpers/date';
import { useDoctorsData } from '@/hooks/useDoctorsData';
import type { DoctorStatusFilter } from '@/actions/doctors/doctorsActions';

const statusOptions: Array<{ value: DoctorStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const getEspecialidadColor = (especialidad: string): string => {
  const low = especialidad.toLowerCase();
  if (low.includes('cardio')) return 'bg-red-100 text-red-800';
  if (low.includes('pedia')) return 'bg-pink-100 text-pink-800';
  if (low.includes('derma')) return 'bg-cyan-100 text-cyan-800';
  if (low.includes('gine')) return 'bg-purple-100 text-purple-800';
  return 'bg-blue-100 text-blue-800';
};

const getStatusColor = (estatus: 'Activo' | 'Inactivo'): string => {
  const colors: Record<string, string> = {
    Activo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Inactivo: 'border-red-200 bg-red-50 text-red-700',
  };
  return colors[estatus] || 'border-gray-200 bg-gray-50 text-gray-700';
};

export default function MedicosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);

  const {
    doctors,
    allDoctors,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    deletingId,
    especialidadesUnicas,
    activos,
    inactivos,
    addDoctor,
    toggleDoctorStatusById,
    deleteDoctorById,
  } = useDoctorsData(searchTerm, statusFilter);

  const handleDeleteDoctor = async (doctorId: number) => {
    const doctor = allDoctors.find((item) => item.id === doctorId);
    if (!doctor) return;

    const confirmed = window.confirm(
      `Se eliminará definitivamente a ${doctor.nombreCompleto}. Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    await deleteDoctorById(doctor);
  };

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Módulo de médicos
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Médicos</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Administra altas, edición de perfil, cambios de estatus y control del personal médico.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          onClick={() => setOpenAddModal(true)}
        >
          <Plus size={20} />
          Nuevo médico
        </button>
      </div>

      <div className="mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad, cédula, teléfono o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total médicos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{allDoctors.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{activos}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{inactivos}</p>
            </div>
            <div className="rounded-2xl bg-red-100 p-3">
              <ShieldX className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Especialidades</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{especialidadesUnicas}</p>
            </div>
            <div className="rounded-2xl bg-purple-100 p-3">
              <Stethoscope className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando médicos...
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-10 text-gray-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando médicos...
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay médicos para el filtro seleccionado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm xl:block">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-3">Médico</div>
              <div className="col-span-2">Especialidad</div>
              <div className="col-span-2">Cédula</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-1">Estatus</div>
              <div className="col-span-1">Registro</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {doctors.map((medico) => (
                <div
                  key={medico.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="col-span-3">
                    <h3 className="text-sm font-semibold text-gray-900">{medico.nombreCompleto}</h3>
                    <p className="mt-1 text-xs text-gray-500">ID #{medico.id}</p>
                  </div>

                  <div className="col-span-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getEspecialidadColor(medico.especialidad)}`}>
                      {medico.especialidad}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">{medico.cedula}</p>
                  </div>

                  <div className="col-span-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{medico.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate text-sm text-gray-900">{medico.email}</span>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(medico.estatus)}`}
                    >
                      {medico.estatus}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <p className="text-sm text-gray-900">{formatDate(medico.fechaRegistro)}</p>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <EntityActionsMenu
                      buttonLabel="Acciones"
                      items={[
                        {
                          label: 'Ver detalle',
                          href: `/medicos/detalle/${medico.id}`,
                          icon: <Eye size={16} />,
                        },
                        {
                          label: 'Editar médico',
                          href: `/medicos/detalle/${medico.id}?modo=editar`,
                          icon: <PencilLine size={16} />,
                        },
                        {
                          label: medico.isActive ? 'Suspender médico' : 'Reactivar médico',
                          onClick: () => void toggleDoctorStatusById(medico),
                          icon: medico.isActive ? (
                            <ShieldX size={16} />
                          ) : (
                            <BadgeCheck size={16} />
                          ),
                          disabled: updatingStatusId === medico.id,
                        },
                        {
                          label: 'Eliminar médico',
                          onClick: () => void handleDeleteDoctor(medico.id),
                          icon: <Trash2 size={16} />,
                          destructive: true,
                          disabled: deletingId === medico.id,
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600">
              Mostrando <span className="font-semibold">{doctors.length}</span> médicos
            </div>
          </div>

          <div className="space-y-4 xl:hidden">
            {doctors.map((medico) => (
              <div
                key={medico.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{medico.nombreCompleto}</h3>
                    <p className="mt-1 text-xs text-gray-500">{medico.especialidad}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(medico.estatus)}`}
                  >
                    {medico.estatus}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Cédula</p>
                    <p className="mt-1 font-semibold text-gray-900">{medico.cedula}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Registro</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatDate(medico.fechaRegistro)}</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{medico.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate text-sm text-gray-900">{medico.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">ID #{medico.id}</div>
                  <EntityActionsMenu
                    buttonLabel="Acciones"
                    items={[
                      {
                        label: 'Ver detalle',
                        href: `/medicos/detalle/${medico.id}`,
                        icon: <Eye size={16} />,
                      },
                      {
                        label: 'Editar médico',
                        href: `/medicos/detalle/${medico.id}?modo=editar`,
                        icon: <PencilLine size={16} />,
                      },
                      {
                        label: medico.isActive ? 'Suspender médico' : 'Reactivar médico',
                        onClick: () => void toggleDoctorStatusById(medico),
                        icon: medico.isActive ? (
                          <ShieldX size={16} />
                        ) : (
                          <BadgeCheck size={16} />
                        ),
                        disabled: updatingStatusId === medico.id,
                      },
                      {
                        label: 'Eliminar médico',
                        onClick: () => void handleDeleteDoctor(medico.id),
                        icon: <Trash2 size={16} />,
                        destructive: true,
                        disabled: deletingId === medico.id,
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {openAddModal && (
        <AddDoctorModal
          setOpen={setOpenAddModal}
          addDoctor={async (payload) => {
            const ok = await addDoctor(payload);
            if (ok) {
              setOpenAddModal(false);
            }
            return ok;
          }}
          isSaving={saving}
        />
      )}
    </div>
  );
}
