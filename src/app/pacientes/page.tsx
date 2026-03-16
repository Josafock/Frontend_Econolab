'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Eye,
  Filter,
  Loader2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldX,
  User,
} from 'lucide-react';
import AddPatientModal from '@/components/pacientes/AddPatientModal';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import { formatDate } from '@/helpers/date';
import { calcularEdad, usePatientsData } from '@/hooks/usePatientsData';
import type { PatientStatusFilter } from '@/actions/patients/patientsActions';

const statusOptions: Array<{ value: PatientStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const getGeneroColor = (genero: 'Femenino' | 'Masculino' | 'Otro'): string => {
  const colors: Record<string, string> = {
    Femenino: 'bg-pink-100 text-pink-800',
    Masculino: 'bg-blue-100 text-blue-800',
    Otro: 'bg-gray-100 text-gray-800',
  };
  return colors[genero] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (estatus: 'Activo' | 'Inactivo'): string => {
  const colors: Record<string, string> = {
    Activo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Inactivo: 'border-red-200 bg-red-50 text-red-700',
  };
  return colors[estatus] || 'border-gray-200 bg-gray-50 text-gray-700';
};

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);

  const {
    patients,
    allPatients,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    promedioEdad,
    activos,
    inactivos,
    addPatient,
    togglePatientStatusById,
  } = usePatientsData(searchTerm, statusFilter);

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Módulo de pacientes
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Administra altas, edición de expediente y bajas lógicas sin perder historial.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          onClick={() => setOpenAddModal(true)}
        >
          <Plus size={20} />
          Nuevo paciente
        </button>
      </div>

      <div className="mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, documento o dirección..."
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
              <p className="text-sm font-medium text-gray-600">Total pacientes</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{allPatients.length}</p>
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
              <p className="text-sm font-medium text-gray-600">Edad promedio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{promedioEdad}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3">
              <User className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando pacientes...
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-10 text-gray-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando pacientes...
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay pacientes para el filtro seleccionado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm xl:block">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-3">Paciente</div>
              <div className="col-span-2">Documento</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2">Dirección</div>
              <div className="col-span-1">Estatus</div>
              <div className="col-span-1">Registro</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {patients.map((paciente) => (
                <div
                  key={paciente.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="col-span-3">
                    <h3 className="text-sm font-semibold text-gray-900">{paciente.nombreCompleto}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {calcularEdad(paciente.fechaNacimiento)} años
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGeneroColor(paciente.genero)}`}
                      >
                        {paciente.genero}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">{paciente.documento}</p>
                    <p className="mt-1 text-xs text-gray-500">ID #{paciente.id}</p>
                  </div>

                  <div className="col-span-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{paciente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate text-sm text-gray-900">{paciente.email}</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{paciente.direccion}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {paciente.ciudad}
                          {paciente.estado !== '-' ? `, ${paciente.estado}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(paciente.estatus)}`}
                    >
                      {paciente.estatus}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <p className="text-sm text-gray-900">
                      {formatDate(paciente.fechaRegistro)}
                    </p>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <EntityActionsMenu
                      buttonLabel="Acciones"
                      items={[
                        {
                          label: 'Ver detalle',
                          href: `/pacientes/detalle/${paciente.id}`,
                          hint: 'Disponible',
                          icon: <Eye size={16} />,
                        },
                        {
                          label: 'Editar paciente',
                          href: `/pacientes/detalle/${paciente.id}?modo=editar`,
                          hint: 'Disponible',
                          icon: <PencilLine size={16} />,
                        },
                        {
                          label: paciente.isActive ? 'Suspender paciente' : 'Reactivar paciente',
                          onClick: () => void togglePatientStatusById(paciente),
                          hint:
                            updatingStatusId === paciente.id ? 'Actualizando...' : 'Disponible',
                          icon: paciente.isActive ? (
                            <ShieldX size={16} />
                          ) : (
                            <BadgeCheck size={16} />
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600">
              Mostrando <span className="font-semibold">{patients.length}</span> pacientes
            </div>
          </div>

          <div className="space-y-4 xl:hidden">
            {patients.map((paciente) => (
              <div
                key={paciente.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{paciente.nombreCompleto}</h3>
                    <p className="mt-1 text-xs text-gray-500">{paciente.documento}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(paciente.estatus)}`}
                  >
                    {paciente.estatus}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Edad</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {calcularEdad(paciente.fechaNacimiento)} años
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Genero</p>
                    <p className="mt-1 font-semibold text-gray-900">{paciente.genero}</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{paciente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate text-sm text-gray-900">{paciente.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{paciente.direccion}</p>
                      <p className="text-xs text-gray-500">
                        {paciente.ciudad}
                        {paciente.estado !== '-' ? `, ${paciente.estado}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">
                    Registro: {formatDate(paciente.fechaRegistro)}
                  </div>
                  <EntityActionsMenu
                    buttonLabel="Acciones"
                    items={[
                      {
                        label: 'Ver detalle',
                        href: `/pacientes/detalle/${paciente.id}`,
                        hint: 'Disponible',
                        icon: <Eye size={16} />,
                      },
                      {
                        label: 'Editar paciente',
                        href: `/pacientes/detalle/${paciente.id}?modo=editar`,
                        hint: 'Disponible',
                        icon: <PencilLine size={16} />,
                      },
                      {
                        label: paciente.isActive ? 'Suspender paciente' : 'Reactivar paciente',
                        onClick: () => void togglePatientStatusById(paciente),
                        hint: updatingStatusId === paciente.id ? 'Actualizando...' : 'Disponible',
                        icon: paciente.isActive ? (
                          <ShieldX size={16} />
                        ) : (
                          <BadgeCheck size={16} />
                        ),
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
        <AddPatientModal
          setOpen={setOpenAddModal}
          addPatient={async (payload) => {
            const ok = await addPatient(payload);
            if (ok) {
              setOpenAddModal(false);
            }
          }}
          isSaving={saving}
        />
      )}
    </div>
  );
}
