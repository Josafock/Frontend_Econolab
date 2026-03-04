'use client';

import AddServiceModal from '@/components/servicios/AgregarServicioModal';
import { createService, getServices, type ServiceOrder, type ServiceStatus } from '@/actions/services/servicesActions';
import { getPatients, type Patient } from '@/actions/patients/patientsActions';
import { getStudies, type Study } from '@/actions/studies/studiesActions';
import { getDoctors, type Doctor } from '@/actions/doctors/doctorsActions';
import { Search, Plus, Filter, Edit, Trash2, Eye, FileText, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

type UiService = {
  id: number;
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServiceStatus;
};

function formatDate(date?: string | null) {
  if (!date) return 'N/D';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/D';
  return parsed.toLocaleString('es-MX');
}

function toUiService(service: ServiceOrder): UiService {
  const studyNames = (service.items ?? []).map((item) => item.studyNameSnapshot).join(', ');
  const patientName = service.patient
    ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
    : 'Sin paciente';

  return {
    id: service.id,
    folio: service.folio,
    estudio: studyNames || 'Sin estudios',
    paciente: patientName,
    telefono: service.patient?.phone ?? '-',
    sucursal: service.branchName ?? 'Sin sucursal',
    creador: formatDate(service.createdAt),
    fechaEntrega: formatDate(service.deliveryAt),
    costo: Number(service.totalAmount).toFixed(2),
    status: service.status,
  };
}

export default function ServiciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servicios, setServicios] = useState<UiService[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);

  const fetchServices = async (search = '') => {
    setLoading(true);
    const response = await getServices({ search, limit: 100 });
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar servicios.');
      setServicios([]);
      setLoading(false);
      return;
    }
    setServicios(response.data.data.map(toUiService));
    setLoading(false);
  };

  const loadFormCatalogs = async () => {
    const [patientsResponse, doctorsResponse, studiesResponse] = await Promise.all([
      getPatients({ limit: 200 }),
      getDoctors({ limit: 200 }),
      getStudies({ limit: 200, status: 'active' }),
    ]);

    if (patientsResponse.ok) {
      setPatients(patientsResponse.data.data);
    }
    if (doctorsResponse.ok) {
      setDoctors(doctorsResponse.data.data);
    }
    if (studiesResponse.ok) {
      setStudies(studiesResponse.data.data);
    }
  };

  useEffect(() => {
    void loadFormCatalogs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchServices(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addService = async (newService: {
    folio: string;
    patientId: number;
    doctorId?: number;
    studyId: number;
    branchName: string;
    deliveryAt: string;
  }) => {
    setSaving(true);
    const response = await createService({
      folio: newService.folio,
      patientId: newService.patientId,
      doctorId: newService.doctorId,
      branchName: newService.branchName,
      deliveryAt: newService.deliveryAt,
      items: [
        {
          studyId: newService.studyId,
          priceType: 'normal',
          quantity: 1,
        },
      ],
    });

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo crear el servicio.');
      setSaving(false);
      return;
    }

    toast.success(`Servicio ${newService.folio} agregado exitosamente.`);
    setOpenServiceModal(false);
    await fetchServices(searchTerm.trim());
    setSaving(false);
  };

  const getStatusColor = (status: ServiceStatus): string => {
    const colors: Record<ServiceStatus, string> = {
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
      delayed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statusLabel = (status: ServiceStatus) => {
    const labels: Record<ServiceStatus, string> = {
      pending: 'PENDIENTE',
      in_progress: 'EN PROCESO',
      delayed: 'RETRASADO',
      completed: 'COMPLETADO',
      cancelled: 'CANCELADO',
    };
    return labels[status] || status;
  };

  const stats = useMemo(() => {
    const completed = servicios.filter((s) => s.status === 'completed').length;
    const inProgress = servicios.filter((s) => s.status === 'in_progress').length;
    const income = servicios.reduce((acc, s) => acc + Number(s.costo), 0);
    return { total: servicios.length, completed, inProgress, income };
  }, [servicios]);

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Servicios</h1>
          <p className="text-gray-600">Gestion y administracion de servicios medicos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2 lg:mt-0">
          <button className="flex bg-white items-center text-sm border gap-2 border-green-600 text-green-700 hover:text-white hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors">
            <FileText size={20} />
            Generar Corte del Dia
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

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
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
              <p className="text-sm font-medium text-gray-600">Servicios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingreso</p>
              <p className="text-2xl font-bold text-gray-900">${stats.income.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando servicios...
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-600">
          No hay servicios registrados.
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-1">Folio</div>
              <div className="col-span-2">Estudio</div>
              <div className="col-span-2">Paciente</div>
              <div className="col-span-1">Sucursal</div>
              <div className="col-span-2">Fecha Creacion</div>
              <div className="col-span-1">Fecha Entrega</div>
              <div className="col-span-1">Costo</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {servicios.map((servicio) => (
                <Link href="/servicios/detalle" key={servicio.folio} className="block">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1">
                      <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {servicio.folio}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-3">{servicio.estudio}</h3>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-gray-900 font-medium mb-1">{servicio.paciente}</p>
                      {servicio.telefono && <p className="text-xs text-gray-500">Tel: {servicio.telefono}</p>}
                    </div>

                    <div className="col-span-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {servicio.sucursal}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-gray-900">{servicio.creador}</p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-sm text-gray-900">{servicio.fechaEntrega}</p>
                    </div>

                    <div className="col-span-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${servicio.costo}
                      </span>
                    </div>

                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(servicio.status)}`}>
                        {statusLabel(servicio.status)}
                      </span>
                    </div>

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

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-medium">{servicios.length}</span> servicios
              </p>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {servicios.map((servicio) => (
              <div key={servicio.folio} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {servicio.folio}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(servicio.status)}`}>
                    {statusLabel(servicio.status)}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">Estudio:</h3>
                  <p className="text-sm text-gray-700">{servicio.estudio}</p>
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-1">Paciente:</h3>
                  <p className="text-sm text-gray-700">{servicio.paciente}</p>
                  {servicio.telefono && <p className="text-xs text-gray-500 mt-1">Tel: {servicio.telefono}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Sucursal</p>
                    <p className="text-gray-900 font-medium">{servicio.sucursal}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Costo</p>
                    <p className="text-gray-900 font-medium">${servicio.costo}</p>
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

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Ultima actualizacion</div>
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
        </>
      )}

      {openServiceModal && (
        <AddServiceModal
          setOpen={setOpenServiceModal}
          addService={addService}
          patients={patients}
          doctors={doctors}
          studies={studies}
          isSaving={saving}
        />
      )}
    </div>
  );
}
