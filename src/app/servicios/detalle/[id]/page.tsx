'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  FileText,
  Loader2,
  MapPin,
  PencilLine,
  Phone,
  ShieldX,
  Stethoscope,
  Ticket,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { getDoctors, type Doctor } from '@/actions/doctors/doctorsActions';
import {
  getOrCreateResultByServiceItem,
  type StudyResult,
} from '@/actions/results/resultsActions';
import {
  getServiceById,
  updateService,
  updateServiceStatus,
  type ServiceOrder,
  type ServiceStatus,
} from '@/actions/services/servicesActions';
import { getStudies, getStudyDetails, type Study, type StudyDetail } from '@/actions/studies/studiesActions';
import { getPatients, type Patient } from '@/actions/patients/patientsActions';
import AddServiceModal from '@/components/servicios/AgregarServicioModal';
import ServiceResultEditor from '@/components/servicios/ServiceResultEditor';
import { mapServiceToForm } from '@/components/servicios/serviceFormUtils';
import { formatDateTime } from '@/helpers/date';

const getStatusColor = (status: ServiceStatus): string => {
  const colors = {
    pending: 'border-blue-200 bg-blue-50 text-blue-700',
    in_progress: 'border-orange-200 bg-orange-50 text-orange-700',
    delayed: 'border-amber-200 bg-amber-50 text-amber-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
  } as const;
  return colors[status] || 'border-gray-200 bg-gray-50 text-gray-700';
};

const getStatusLabel = (status: ServiceStatus) => {
  const labels = {
    pending: 'Pendiente',
    in_progress: 'En curso',
    delayed: 'Retrasado',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  } as const;
  return labels[status] || status;
};

type CatalogsState = {
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
};

type ResultState = Record<number, StudyResult>;
type DetailState = Record<number, StudyDetail[]>;

function summarizeItems(service: ServiceOrder): string {
  const packageGroups = new Map<string, string[]>();
  const standalone: string[] = [];

  for (const item of service.items ?? []) {
    if (item.sourcePackageNameSnapshot) {
      const current = packageGroups.get(item.sourcePackageNameSnapshot) ?? [];
      current.push(item.studyNameSnapshot);
      packageGroups.set(item.sourcePackageNameSnapshot, current);
      continue;
    }

    standalone.push(item.studyNameSnapshot);
  }

  return [
    ...[...packageGroups.entries()].map(
      ([packageName, studies]) => `${packageName}: ${studies.join(', ')}`,
    ),
    ...standalone,
  ].join(' | ');
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogsState>({
    patients: [],
    doctors: [],
    studies: [],
  });
  const [resultDrafts, setResultDrafts] = useState<ResultState>({});
  const [studyDetailsMap, setStudyDetailsMap] = useState<DetailState>({});
  const [openEditModal, setOpenEditModal] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de servicio invalido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const [serviceResponse, patientsResponse, doctorsResponse, studiesResponse] = await Promise.all([
        getServiceById(id),
        getPatients({ limit: 400, status: 'all' }),
        getDoctors({ limit: 400 }),
        getStudies({ limit: 400, status: 'active' }),
      ]);

      if (!serviceResponse.ok) {
        setError(serviceResponse.errors[0] ?? 'No se pudo cargar el servicio.');
        setLoading(false);
        return;
      }

      setService(serviceResponse.data);
      setCatalogs({
        patients: patientsResponse.ok ? patientsResponse.data.data : [],
        doctors: doctorsResponse.ok ? doctorsResponse.data.data : [],
        studies: studiesResponse.ok ? studiesResponse.data.data : [],
      });
      setLoading(false);
    };

    void load();
  }, [id]);

  useEffect(() => {
    if (!service) return;

    const loadOperationalData = async () => {
      setResultsLoading(true);

      const uniqueStudyIds = [...new Set((service.items ?? []).map((item) => item.studyId))];
      const [detailsResponses, resultsResponses] = await Promise.all([
        Promise.all(uniqueStudyIds.map((studyId) => getStudyDetails(studyId))),
        Promise.all(
          (service.items ?? []).map((item) => getOrCreateResultByServiceItem(item.id)),
        ),
      ]);

      const nextDetailsMap: DetailState = {};
      uniqueStudyIds.forEach((studyId, index) => {
        const response = detailsResponses[index];
        nextDetailsMap[studyId] = response.ok ? response.data : [];
      });

      const nextResultMap: ResultState = {};
      for (let index = 0; index < (service.items ?? []).length; index += 1) {
        const item = service.items[index];
        const response = resultsResponses[index];
        if (!response.ok) {
          toast.error(response.errors[0] ?? `No se pudo preparar el resultado para ${item.studyNameSnapshot}.`);
          continue;
        }
        nextResultMap[item.id] = response.data;
      }

      setStudyDetailsMap(nextDetailsMap);
      setResultDrafts(nextResultMap);
      setResultsLoading(false);
    };

    void loadOperationalData();
  }, [service]);

  const totalStudies = service?.items?.length ?? 0;
  const closedResults = useMemo(
    () => Object.values(resultDrafts).filter((result) => !result.isDraft).length,
    [resultDrafts],
  );

  const handleStatusChange = async (nextStatus: ServiceStatus) => {
    if (!service) return;

    setUpdatingStatus(true);
    const response = await updateServiceStatus(service.id, nextStatus);

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del servicio.');
      setUpdatingStatus(false);
      return;
    }

    setService(response.data.data);
    toast.success(`Servicio marcado como ${getStatusLabel(nextStatus).toLowerCase()}.`);
    setUpdatingStatus(false);
  };

  const handleEditService = async (
    payload: Parameters<typeof updateService>[1],
  ) => {
    if (!service) return false;

    setSavingService(true);
    const response = await updateService(service.id, payload);

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo actualizar el servicio.');
      setSavingService(false);
      return false;
    }

    setService(response.data.data);
    toast.success('Servicio actualizado con exito.');
    setSavingService(false);
    return true;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-10 text-gray-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando detalle del servicio...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a servicios
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Detalle de servicio</h1>
          <p className="mt-2 text-gray-600">
            Administra el servicio, revisa sus estudios y captura resultados por cada item asociado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(service.status)}`}
          >
            {service.status === 'completed' ? (
              <BadgeCheck className="h-4 w-4" />
            ) : service.status === 'cancelled' ? (
              <ShieldX className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {getStatusLabel(service.status)}
          </span>

          <button
            type="button"
            onClick={() => setOpenEditModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <PencilLine className="h-4 w-4" />
            Editar servicio
          </button>

          <button
            type="button"
            onClick={() => void handleStatusChange('in_progress')}
            className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
            disabled={updatingStatus || service.status === 'in_progress'}
          >
            En curso
          </button>

          <button
            type="button"
            onClick={() => void handleStatusChange('completed')}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            disabled={updatingStatus || service.status === 'completed'}
          >
            Concluir
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Resumen operativo</h2>
                <p className="text-sm text-gray-500">Vista general del servicio y de sus estudios capturados.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Folio</p>
                <p className="mt-2 text-base font-semibold text-gray-900">{service.folio}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Costo total</p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  ${Number(service.totalAmount).toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de muestra</p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {formatDateTime(service.sampleAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de entrega</p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {formatDateTime(service.deliveryAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Estudios</p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {summarizeItems(service) || 'Sin estudios'}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Notas</p>
                <p className="mt-2 text-base text-gray-900">{service.notes ?? 'Sin notas'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
            <p className="text-sm uppercase tracking-[0.2em] text-red-100">Servicio en marcha</p>
            <h2 className="mt-3 text-2xl font-semibold">{service.patient ? `${service.patient.firstName} ${service.patient.lastName}` : 'Paciente'}</h2>
            <p className="mt-2 text-sm text-red-50">Creado el {formatDateTime(service.createdAt)}</p>

            <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Paciente</p>
                  <p className="text-sm font-medium text-white">
                    {service.patient
                      ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
                      : 'Sin paciente'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Telefono</p>
                  <p className="text-sm font-medium text-white">{service.patient?.phone ?? 'Sin telefono'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Sucursal</p>
                  <p className="text-sm font-medium text-white">{service.branchName ?? 'Sin sucursal'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">Avance de resultados</p>
                  <p className="text-sm font-medium text-white">
                    {closedResults} de {totalStudies} cerrados
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href={`/api/services/${service.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-all hover:bg-red-50"
              >
                <Ticket className="h-4 w-4" />
                Recibo
              </a>
              <a
                href={`/api/services/${service.id}/results`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                <Stethoscope className="h-4 w-4" />
                PDF de resultados
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Desglose del servicio</h2>
              <p className="text-sm text-gray-500">Cada item del servicio queda disponible para resultados y PDFs.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(service.items ?? []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{item.studyNameSnapshot}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.sourcePackageNameSnapshot
                    ? `Incluido en ${item.sourcePackageNameSnapshot}`
                    : 'Estudio individual'}
                </p>
                <div className="mt-4 grid gap-2 text-xs text-gray-600">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Precio: ${Number(item.unitPrice).toFixed(2)}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Descuento: {Number(item.discountPercent).toFixed(2)}%
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Subtotal: ${Number(item.subtotalAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="resultados" className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resultados por estudio</h2>
              <p className="text-sm text-gray-500">Captura los resultados uno por uno y deja listo el PDF consolidado del servicio.</p>
            </div>
          </div>

          {resultsLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando borradores y plantillas de resultados...
            </div>
          ) : (
            <div className="space-y-5">
              {(service.items ?? []).map((item) => {
                const result = resultDrafts[item.id];
                if (!result) return null;

                return (
                  <ServiceResultEditor
                    key={item.id}
                    serviceId={service.id}
                    serviceItem={item}
                    initialResult={result}
                    studyDetails={studyDetailsMap[item.studyId] ?? []}
                    pdfHref={`/api/services/${service.id}/results`}
                    onSaved={(nextResult) =>
                      setResultDrafts((current) => ({
                        ...current,
                        [item.id]: nextResult,
                      }))
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {openEditModal ? (
        <AddServiceModal
          setOpen={setOpenEditModal}
          saveService={handleEditService}
          patients={catalogs.patients}
          doctors={catalogs.doctors}
          studies={catalogs.studies}
          isSaving={savingService}
          initialValues={mapServiceToForm(service)}
          title="Editar servicio"
          description="Actualiza paciente, estudios, tiempos y notas del servicio."
          submitLabel="Guardar cambios"
        />
      ) : null}
    </div>
  );
}
