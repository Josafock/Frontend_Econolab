'use client';

import AddServiceModal from '@/components/servicios/AgregarServicioModal';
import { Search, Plus, Filter, Edit, Trash2, Eye, FileText, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-toastify';

// Datos de ejemplo mejorados
interface Servicio {
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServicioStatus;
}

type ServicioStatus = 'CONCURSO' | 'PENDIENTE' | 'EN PROCESO' | 'COMPLETADO' | 'CANCELADO';

interface StatusColors {
  [key: string]: string;
}

const initialServicios: Servicio[] = [
  {
    folio: 'GLU-006',
    estudio: 'GLUCOSA EN SANGRE EN AYUNAS',
    paciente: 'JUAN PÉREZ LÓPEZ',
    telefono: '7711234567',
    sucursal: 'Matriz',
    creador: '2025-09-25 09:15:00',
    fechaEntrega: '2025-09-25 HORA 12:00:00',
    costo: '180',
    status: 'PENDIENTE'
  },
  {
    folio: 'TOL-001',
    estudio: 'GRUPO Y FACTOR-RH',
    paciente: 'HEARRO RAVIOS BAUTISTA',
    telefono: '',
    sucursal: 'Unidad Móvil',
    creador: '2025-08-31 11:31:36',
    fechaEntrega: '0000-00-00 HORA 11:45:00',
    costo: '550',
    status: 'EN PROCESO'
  },
  {
    folio: 'LEG-002',
    estudio: 'BIOQUIMICA, HEMATICA COMPLETA, EXAMEN GENERAL DE ORINA',
    paciente: 'MARIA NUENTA, HERNANDEZ, HERMANTIEZ',
    telefono: '',
    sucursal: 'Unidad Móvil',
    creador: '2025-09-14 10:08:11',
    fechaEntrega: '2025-09-15 HORA 14:00:00',
    costo: '250',
    status: 'PENDIENTE'
  },
  {
    folio: 'VIC-003',
    estudio: 'MC, MINUTA E FONA, MC MINUTTE, CHICA',
    paciente: 'Spindall, AFLIMA, FANTASÍ',
    telefono: '7713340000',
    sucursal: 'Matriz',
    creador: '2025-09-20 10:40:48',
    fechaEntrega: '2025-09-24 HORA 14:00:00',
    costo: '160',
    status: 'EN PROCESO'
  },
  {
    folio: 'RES-004',
    estudio: 'GABRIOTA DIVINA, BRIGADENTRA',
    paciente: 'FALSINA, HERNANDEZ, MAYESTA',
    telefono: '7773360000',
    sucursal: 'Unidad Móvil',
    creador: '2025-09-23 10:04:51',
    fechaEntrega: '2025-09-30 HORA 14:00:00',
    costo: '320',
    status: 'COMPLETADO'
  },
  {
    folio: 'APL-005',
    estudio: 'MARCAS DE ORINA (GABRIOTA)',
    paciente: 'La Manuela, HERNANDEZ, ZAPAPORZA',
    telefono: '7713340000',
    sucursal: 'Unidad Móvil',
    creador: '2025-09-24 09:49:22',
    fechaEntrega: '2025-09-27 HORA 14:00:02',
    costo: '200',
    status: 'CANCELADO'
  }
];


export default function ServiciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>(initialServicios);

  const addService = (newService: Omit<Servicio, 'folio' | 'creador' | 'status'>) => {
    // Generar un folio simple y la fecha/hora actual para simulación
    const newFolioNumber = servicios.length + 1;
    const newFolio = `SIM-${String(newFolioNumber).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const fullNewService: Servicio = {
      ...newService,
      folio: newFolio,
      creador: now,
      status: 'PENDIENTE', // Por defecto al crear
    };

    // Agrega el nuevo servicio al inicio del array
    setServicios(prevServicios => [fullNewService, ...prevServicios]);
    toast.success(`Servicio ${newFolio} agregado exitosamente.`);
    setOpenServiceModal(false); // Cierra el modal al agregar
  };

  const getStatusColor = (status: ServicioStatus): string => {
    const colors: StatusColors = {
      'CONCURSO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PENDIENTE': 'bg-blue-100 text-blue-800 border-blue-200',
      'EN PROCESO': 'bg-orange-100 text-orange-800 border-orange-200',
      'COMPLETADO': 'bg-green-100 text-green-800 border-green-200',
      'CANCELADO': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleGenerarCorte = (): void => {
    // Aquí iría la lógica para generar el corte del día
    console.log('Generando corte del día...');
    alert('Corte del día generado exitosamente');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Servicios</h1>
          <p className="text-gray-600">Gestión y administración de servicios médicos</p>
        </div>

        {/* Botones de acciones */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2 lg:mt-0">
          <button
            onClick={handleGenerarCorte}
            className="flex bg-white items-center text-sm border gap-2 border-green-600 text-green-700 hover:text-white hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <FileText size={20} />
            Generar Corte del Día
          </button>

          <button
            className="flex rounded-lg bg-white px-4 py-3 text-sm font-medium border border-red-500 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={() => setOpenServiceModal(true)}
          >
            <Plus size={20} />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por folio, estudio, paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios Hoy</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingreso del Día</p>
              <p className="text-2xl font-bold text-gray-900">$2,850</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de servicios - Versión Desktop */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header de la tabla */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          <div className="col-span-1">Folio</div>
          <div className="col-span-2">Estudio</div>
          <div className="col-span-2">Paciente</div>
          <div className="col-span-1">Sucursal</div>
          <div className="col-span-1">Fecha Creación</div>
          <div className="col-span-1">Fecha Entrega</div>
          <div className="col-span-1">Costo</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Lista de servicios */}
        <div className="divide-y divide-gray-200">
          {servicios.map((servicio) => (
            <Link href={`/servicios/detalle`} className="block">
            <div key={servicio.folio} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              {/* Folio */}
              <div className="col-span-1">
                <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {servicio.folio}
                </span>
              </div>

              {/* Estudio */}
              <div className="col-span-2">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-3">
                  {servicio.estudio}
                </h3>
              </div>

              {/* Paciente */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900 font-medium mb-1">{servicio.paciente}</p>
                {servicio.telefono && (
                  <p className="text-xs text-gray-500">Tel: {servicio.telefono}</p>
                )}
              </div>

              {/* Sucursal */}
              <div className="col-span-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {servicio.sucursal}
                </span>
              </div>

              {/* Fecha Creación */}
              <div className="col-span-1">
                <p className="text-sm text-gray-900">{servicio.creador.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">{servicio.creador.split(' ')[1]}</p>
              </div>

              {/* Fecha Entrega */}
              <div className="col-span-1">
                <p className="text-sm text-gray-900">{servicio.fechaEntrega.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">{servicio.fechaEntrega.split(' ')[1]}</p>
              </div>

              {/* Costo */}
              <div className="col-span-1">
                {servicio.costo ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ${servicio.costo}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(servicio.status)}`}>
                  {servicio.status}
                </span>
              </div>

              {/* Acciones */}
              <div className="col-span-1">
                <div className="flex items-center justify-end space-x-1">
                  <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Ver">
                    <Eye size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Editar">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            </Link>
          ))}
        </div>

        {/* Footer de la tabla */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{servicios.length}</span> servicios
            </p>

            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                Anterior
              </button>
              <span className="px-3 py-1 bg-red-600 text-white rounded text-sm">1</span>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Versión Móvil */}
      <div className="lg:hidden space-y-4">
        {servicios.map((servicio) => (
          <div key={servicio.folio} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* Header con Folio y Status */}
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                {servicio.folio}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(servicio.status)}`}>
                {servicio.status}
              </span>
            </div>

            {/* Estudio */}
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 text-sm mb-2">Estudio:</h3>
              <p className="text-sm text-gray-700">{servicio.estudio}</p>
            </div>

            {/* Paciente */}
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 text-sm mb-1">Paciente:</h3>
              <p className="text-sm text-gray-700">{servicio.paciente}</p>
              {servicio.telefono && (
                <p className="text-xs text-gray-500 mt-1">Tel: {servicio.telefono}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-gray-500 text-xs">Sucursal</p>
                <p className="text-gray-900 font-medium">{servicio.sucursal}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Costo</p>
                <p className="text-gray-900 font-medium">{servicio.costo ? `$${servicio.costo}` : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-gray-500 text-xs">Creado</p>
                <p className="text-gray-900 text-xs">{servicio.creador}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Entrega</p>
                <p className="text-gray-900 text-xs">{servicio.fechaEntrega}</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Última actualización
              </div>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Eye size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                  <Edit size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {openServiceModal && (
        <AddServiceModal setOpen={setOpenServiceModal} addService={addService} />
      )}
    </div>
  );
}