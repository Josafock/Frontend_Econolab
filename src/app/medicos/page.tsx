'use client';

import AddDoctorModal from '@/components/medicos/AddDoctorModal';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import { useDoctorsData } from '@/hooks/useDoctorsData';
import { Search, Plus, Filter, Phone, Mail, User, Stethoscope, BadgeCheck, Calendar, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

const getEstatusColor = (estatus: string): string => {
  const colors: Record<string, string> = {
    Activo: 'bg-green-100 text-green-800 border-green-200',
    Inactivo: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[estatus] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getEspecialidadColor = (especialidad: string): string => {
  const low = especialidad.toLowerCase();
  if (low.includes('cardio')) return 'bg-red-100 text-red-800';
  if (low.includes('pedia')) return 'bg-pink-100 text-pink-800';
  if (low.includes('derma')) return 'bg-cyan-100 text-cyan-800';
  if (low.includes('gine')) return 'bg-purple-100 text-purple-800';
  return 'bg-blue-100 text-blue-800';
};

export default function MedicosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);

  const { doctors, loading, refreshing, saving, updatingStatusId, especialidadesUnicas, conCedula, addDoctor, deactivateDoctorById } = useDoctorsData(searchTerm);
  const showSoonMessage = (action: string) => {
    toast.info(`${action} de medicos estara disponible en la siguiente fase del CRUD.`);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medicos</h1>
          <p className="text-gray-600">Gestion del personal medico</p>
        </div>

        <button
          onClick={() => setOpenAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mt-4 lg:mt-0"
        >
          <Plus size={20} />
          Nuevo Medico
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad o cedula..."
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
              <p className="text-sm font-medium text-gray-600">Total Medicos</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BadgeCheck size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Especialidades</p>
              <p className="text-2xl font-bold text-gray-900">{especialidadesUnicas}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Stethoscope size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Cedula</p>
              <p className="text-2xl font-bold text-gray-900">{conCedula}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando medicos...
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando medicos...
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-600">
          No hay medicos registrados.
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-visible">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-3">Nombre Completo</div>
              <div className="col-span-2">Especialidad</div>
              <div className="col-span-2">Cedula</div>
              <div className="col-span-3">Contacto</div>
              <div className="col-span-1">Estatus</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {doctors.map((medico) => (
                <div key={medico.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-3">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {medico.nombre} {medico.apellidoPaterno} {medico.apellidoMaterno}
                    </h3>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEspecialidadColor(medico.especialidad)}`}>
                      {medico.especialidad}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {medico.cedula}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{medico.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900 truncate">{medico.email}</span>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(medico.estatus)}`}>
                      {medico.estatus}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <div className="flex justify-end">
                      <EntityActionsMenu
                        items={[
                          {
                            label: 'Ver perfil medico',
                            href: `/medicos/detalle/${medico.id}`,
                            hint: 'Disponible',
                          },
                          {
                            label: 'Editar medico',
                            onClick: () => showSoonMessage('Editar'),
                            hint: 'Proximamente',
                          },
                          {
                            label: 'Desactivar medico',
                            onClick: () => void deactivateDoctorById(medico),
                            hint: updatingStatusId === medico.id ? 'Actualizando...' : 'Disponible',
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
                Mostrando <span className="font-medium">{doctors.length}</span> medicos
              </p>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {doctors.map((medico) => (
              <div key={medico.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {medico.nombre} {medico.apellidoPaterno}
                    </h3>
                    <p className="text-xs text-gray-500">{medico.apellidoMaterno}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(medico.estatus)}`}>
                    {medico.estatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Especialidad</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEspecialidadColor(medico.especialidad)}`}>
                      {medico.especialidad}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Cedula</p>
                    <p className="text-gray-900 font-mono font-medium">{medico.cedula}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{medico.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900 truncate">{medico.email}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">ID: {medico.id}</span>
                  <div>
                    <EntityActionsMenu
                      items={[
                        {
                          label: 'Ver perfil medico',
                          href: `/medicos/detalle/${medico.id}`,
                          hint: 'Disponible',
                        },
                        {
                          label: 'Editar medico',
                          onClick: () => showSoonMessage('Editar'),
                          hint: 'Proximamente',
                        },
                        {
                          label: 'Eliminar medico',
                          onClick: () => void deactivateDoctorById(medico),
                          hint: updatingStatusId === medico.id ? 'Actualizando...' : 'Disponible',
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
        <AddDoctorModal
          setOpen={setOpenAddModal}
          addDoctor={async (payload) => {
            const ok = await addDoctor(payload);
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
