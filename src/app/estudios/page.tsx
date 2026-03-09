'use client';

import AddStudyModal from '@/components/estudios/AddStudyModal';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import { useStudiesData } from '@/hooks/useStudiesData';
import { Search, Plus, Filter, Tag, DollarSign, Hash, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

const getStatusColor = (estatus: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[estatus] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getCategoryColor = (tipo: string): string => {
  const colors: Record<string, string> = {
    study: 'bg-blue-100 text-blue-800',
    package: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[tipo] || 'bg-gray-100 text-gray-800';
};

export default function EstudiosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);

  const { studies, loading, refreshing, saving, updatingStatusId, activos, inactivos, precioPromedio, addStudy, toggleStudyStatus } = useStudiesData(searchTerm);
  const showSoonMessage = (action: string) => {
    toast.info(`${action} de estudios estara disponible en la siguiente fase del CRUD.`);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estudios</h1>
          <p className="text-gray-600">Catalogo de estudios y analisis medicos</p>
        </div>

        <button
          onClick={() => setOpenAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mt-4 lg:mt-0"
        >
          <Plus size={20} />
          Nuevo Estudio
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o clave..."
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
              <p className="text-sm font-medium text-gray-600">Total Estudios</p>
              <p className="text-2xl font-bold text-gray-900">{studies.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{activos}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{inactivos}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Tag size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-gray-900">${precioPromedio}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando estudios...
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando estudios...
        </div>
      ) : studies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-600">
          No hay estudios registrados.
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-visible">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-4">Nombre del Estudio</div>
              <div className="col-span-1">Clave</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Estatus</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {studies.map((estudio) => (
                <div key={estudio.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-4">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{estudio.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{estudio.description || 'Sin descripcion'}</p>
                  </div>

                  <div className="col-span-1">
                    <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {estudio.code}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(estudio.type)}`}>
                      {estudio.type}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-lg font-semibold text-gray-900">${Number(estudio.normalPrice).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">MXN</p>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(estudio.status)}`}>
                      {estudio.status}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <div className="flex justify-end">
                      <EntityActionsMenu
                        items={[
                          {
                            label: 'Ver detalle',
                            href: `/estudios/detalle/${estudio.id}`,
                            hint: 'Disponible',
                          },
                          {
                            label: 'Editar estudio',
                            onClick: () => showSoonMessage('Editar'),
                            hint: 'Proximamente',
                          },
                          {
                            label: estudio.status === 'active' ? 'Desactivar estudio' : 'Activar estudio',
                            onClick: () => void toggleStudyStatus(estudio),
                            hint: updatingStatusId === estudio.id ? 'Actualizando...' : 'Disponible',
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
                Mostrando <span className="font-medium">{studies.length}</span> estudios
              </p>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {studies.map((estudio) => (
              <div key={estudio.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">{estudio.code}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estudio.status)}`}>
                    {estudio.status}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">Estudio:</h3>
                  <p className="text-sm text-gray-700">{estudio.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{estudio.description || 'Sin descripcion'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Tipo</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(estudio.type)}`}>
                      {estudio.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Precio</p>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-600" />
                      <p className="text-gray-900 font-bold">${Number(estudio.normalPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">ID: {estudio.id}</div>
                  <div>
                    <EntityActionsMenu
                      items={[
                        {
                          label: 'Ver detalle',
                          href: `/estudios/detalle/${estudio.id}`,
                          hint: 'Disponible',
                        },
                        {
                          label: 'Editar estudio',
                          onClick: () => showSoonMessage('Editar'),
                          hint: 'Proximamente',
                        },
                        {
                          label: estudio.status === 'active' ? 'Desactivar estudio' : 'Activar estudio',
                          onClick: () => void toggleStudyStatus(estudio),
                          hint: updatingStatusId === estudio.id ? 'Actualizando...' : 'Disponible',
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
        <AddStudyModal
          setOpen={setOpenAddModal}
          addStudy={async (payload) => {
            const ok = await addStudy(payload);
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
