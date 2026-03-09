'use client';

import AddPatientModal from '@/components/pacientes/AddPatientModal';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import { calcularEdad, usePatientsData } from '@/hooks/usePatientsData';
import { Search, Plus, Filter, Phone, Mail, MapPin, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

const getGeneroColor = (genero: 'Femenino' | 'Masculino' | 'Otro'): string => {
  const colors: Record<string, string> = {
    Femenino: 'bg-pink-100 text-pink-800',
    Masculino: 'bg-blue-100 text-blue-800',
    Otro: 'bg-gray-100 text-gray-800',
  };
  return colors[genero] || 'bg-gray-100 text-gray-800';
};

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);

  const { patients, loading, refreshing, saving, updatingStatusId, promedioEdad, addPatient, deactivatePatientById } = usePatientsData(searchTerm);
  const showSoonMessage = (action: string) => {
    toast.info(`${action} de pacientes estara disponible en la siguiente fase del CRUD.`);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pacientes</h1>
          <p className="text-gray-600">Gestion de informacion de pacientes</p>
        </div>

        <button
          className="flex rounded-lg bg-white px-4 py-3 text-sm font-medium border border-red-500 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={() => setOpenAddModal(true)}
        >
          <Plus size={20} />
          Nuevo Paciente
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, telefono o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mujeres</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter((p) => p.genero === 'Femenino').length}
              </p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <User size={20} className="text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hombres</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter((p) => p.genero === 'Masculino').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Edad Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{promedioEdad}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <User size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando pacientes...
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando pacientes...
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-600">
          No hay pacientes registrados.
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-visible">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-3">Nombre Completo</div>
              <div className="col-span-1">Edad</div>
              <div className="col-span-1">Genero</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2">Ubicacion</div>
              <div className="col-span-2">Fecha Registro</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {patients.map((paciente) => (
                <div key={paciente.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-3">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno}
                    </h3>
                    <p className="text-xs text-gray-500">Nac: {new Date(paciente.fechaNacimiento).toLocaleDateString()}</p>
                  </div>

                  <div className="col-span-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {calcularEdad(paciente.fechaNacimiento)} anos
                    </span>
                  </div>

                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGeneroColor(paciente.genero)}`}>
                      {paciente.genero}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{paciente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900 truncate">{paciente.email}</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{paciente.colonia}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{paciente.ciudad}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">
                      {paciente.fechaRegistro ? new Date(paciente.fechaRegistro).toLocaleDateString() : 'N/D'}
                    </p>
                  </div>

                  <div className="col-span-1">
                    <div className="flex justify-end">
                      <EntityActionsMenu
                        items={[
                          {
                            label: 'Ver expediente',
                            href: `/pacientes/detalle/${paciente.id}`,
                            hint: 'Disponible',
                          },
                          {
                            label: 'Editar paciente',
                            onClick: () => showSoonMessage('Editar'),
                            hint: 'Proximamente',
                          },
                          {
                            label: 'Desactivar paciente',
                            onClick: () => void deactivatePatientById(paciente),
                            hint: updatingStatusId === paciente.id ? 'Actualizando...' : 'Disponible',
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-medium">{patients.length}</span> pacientes
              </p>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {patients.map((paciente) => (
              <div key={paciente.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {paciente.nombre} {paciente.apellidoPaterno}
                    </h3>
                    <p className="text-xs text-gray-500">{paciente.apellidoMaterno}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGeneroColor(paciente.genero)}`}>
                    {paciente.genero}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Edad</p>
                    <p className="text-gray-900 font-medium">{calcularEdad(paciente.fechaNacimiento)} anos</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{paciente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900 truncate">{paciente.email}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{paciente.colonia}, {paciente.ciudad}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Registrado: {paciente.fechaRegistro ? new Date(paciente.fechaRegistro).toLocaleDateString() : 'N/D'}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Acciones del paciente</div>
                  <div>
                    <EntityActionsMenu
                      items={[
                        {
                          label: 'Ver expediente',
                          href: `/pacientes/detalle/${paciente.id}`,
                          hint: 'Disponible',
                        },
                        {
                          label: 'Editar paciente',
                          onClick: () => showSoonMessage('Editar'),
                          hint: 'Proximamente',
                        },
                        {
                          label: 'Eliminar paciente',
                          onClick: () => void deactivatePatientById(paciente),
                          hint: updatingStatusId === paciente.id ? 'Actualizando...' : 'Disponible',
                        },
                      ]}
                    />
                  </div>
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
