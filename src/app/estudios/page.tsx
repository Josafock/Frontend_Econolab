'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  FileSpreadsheet,
  Filter,
  FlaskConical,
  Loader2,
  Microscope,
  PencilLine,
  Plus,
  Search,
  ShieldX,
  Trash2,
} from 'lucide-react';
import AddStudyModal from '@/components/estudios/AddStudyModal';
import {
  createEmptyStudyForm,
  mapFormToCreateStudyPayload,
  mapStudyToForm,
  validateStudyForm,
  type StudyFormValues,
} from '@/components/estudios/studyFormUtils';
import { CollectionContentSkeleton } from '@/components/ui/PageSkeletons';
import CatalogExcelManager from '@/components/ui/CatalogExcelManager';
import CatalogExcelModal from '@/components/ui/CatalogExcelModal';
import { useConfirmDialog } from '@/components/ui/ConfirmDialogProvider';
import EntityActionsMenu from '@/components/ui/EntityActionsMenu';
import TablePagination from '@/components/ui/TablePagination';
import { createStudy } from '@/actions/studies/studiesActions';
import { useStudiesData } from '@/hooks/useStudiesData';
import {
  formatStudyDuration,
  getStudyStatusColor,
  getStudyStatusLabel,
  getStudyTypeColor,
  getStudyTypeLabel,
} from '@/helpers/studies';
import type {
  StudyStatusFilter,
  StudyTypeFilter,
} from '@/actions/studies/studiesActions';
import type { ExcelColumn } from '@/helpers/excel';

const statusOptions: Array<{ value: StudyStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
];

const typeOptions: Array<{ value: StudyTypeFilter; label: string }> = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'study', label: 'Estudios' },
  { value: 'package', label: 'Paquetes' },
  { value: 'other', label: 'Otros' },
];

const studyExcelColumns: ExcelColumn<StudyFormValues>[] = [
  {
    key: 'nombre',
    label: 'Nombre',
    required: true,
    description: 'Nombre principal del estudio o paquete.',
    example: 'BIOMETRIA HEMATICA',
    width: 30,
  },
  {
    key: 'clave',
    label: 'Clave',
    required: true,
    description: 'Clave interna unica del catalogo.',
    example: 'BH-001',
    width: 18,
  },
  {
    key: 'descripcion',
    label: 'Descripcion',
    required: true,
    description: 'Texto descriptivo para el estudio.',
    example: 'Analisis sanguineo completo',
    width: 34,
  },
  {
    key: 'duracion',
    label: 'Duracion',
    required: true,
    description: 'Usa formato HH:MM.',
    example: '01:30',
    placeholder: '01:00',
    width: 14,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    required: true,
    description: 'Tipo de registro del catalogo.',
    example: 'study',
    inputType: 'select',
    options: [
      { label: 'Estudio', value: 'study' },
      { label: 'Paquete', value: 'package' },
      { label: 'Otro', value: 'other' },
    ],
    width: 14,
  },
  {
    key: 'precioNormal',
    label: 'Precio normal',
    required: true,
    description: 'Precio publico.',
    example: '350.00',
    inputType: 'number',
    width: 16,
  },
  {
    key: 'precioDif',
    label: 'Precio DIF',
    description: 'Precio para DIF.',
    example: '300.00',
    inputType: 'number',
    width: 16,
  },
  {
    key: 'precioEspecial',
    label: 'Precio especial',
    description: 'Precio especial autorizado.',
    example: '280.00',
    inputType: 'number',
    width: 18,
  },
  {
    key: 'precioHospital',
    label: 'Precio hospital',
    description: 'Precio hospitalario.',
    example: '260.00',
    inputType: 'number',
    width: 18,
  },
  {
    key: 'otros',
    label: 'Otros',
    description: 'Otro precio relacionado.',
    example: '0.00',
    inputType: 'number',
    width: 14,
  },
  {
    key: 'descuento',
    label: 'Descuento',
    description: 'Porcentaje base de descuento.',
    example: '0.00',
    inputType: 'number',
    width: 14,
  },
  {
    key: 'metodo',
    label: 'Metodo',
    description: 'Aplica sobre todo para estudios.',
    example: 'QUIMICA SECA',
    width: 24,
  },
  {
    key: 'indicador',
    label: 'Indicador',
    description: 'Indicador o referencia clave.',
    example: 'mg/dL',
    width: 20,
  },
  {
    key: 'estatus',
    label: 'Estatus',
    description: 'Estado inicial del registro.',
    example: 'active',
    inputType: 'select',
    options: [
      { label: 'Activo', value: 'active' },
      { label: 'Suspendido', value: 'suspended' },
    ],
    width: 14,
  },
];

export default function EstudiosPage() {
  const confirm = useConfirmDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudyStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<StudyTypeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [createType, setCreateType] = useState<'study' | 'package'>('study');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    studies,
    allStudies,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    removingId,
    activos,
    suspendidos,
    precioPromedio,
    addStudy,
    toggleStudyStatus,
    deleteStudyById,
    reloadStudies,
  } = useStudiesData(searchTerm, statusFilter, typeFilter);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(studies.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedStudies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return studies.slice(start, start + pageSize);
  }, [page, pageSize, studies]);

  const handleDelete = (id: number, name: string) => {
    void (async () => {
      const confirmed = await confirm({
        title: 'Eliminar estudio',
        message: `Se eliminara el estudio "${name}" del catalogo. Esta accion ocultara el registro y dejara de estar disponible para operar.`,
        confirmLabel: 'Eliminar estudio',
        tone: 'danger',
      });

      if (!confirmed) return;

      const targetStudy = allStudies.find((study) => study.id === id);
      if (targetStudy) {
        void deleteStudyById(targetStudy);
      }
    })();
  };

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Catalogo de estudios
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Estudios</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Administra el catalogo de analisis, paquetes y su configuracion de resultados.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <CatalogExcelModal
            title="Importacion y exportacion de estudios"
            subtitle="Gestiona cargas masivas y descargas del catalogo desde una ventana separada para mantener esta vista enfocada en la operacion diaria."
            trigger={
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-100"
              >
                <FileSpreadsheet size={20} />
                Importacion/Exportacion
              </button>
            }
          >
            <CatalogExcelManager
              title="Carga masiva de estudios"
              description="Importa estudios o paquetes con vista previa editable, y exporta el listado que tienes visible en pantalla."
              entityLabel="estudios"
              columns={studyExcelColumns}
              createEmptyRow={() => createEmptyStudyForm('study')}
              validateRow={(row) =>
                Object.values(validateStudyForm(row)).filter(
                  (error): error is string => Boolean(error),
                )
              }
              rowsForExport={studies.map((study) => mapStudyToForm(study))}
              exportFileName="estudios-catalogo.xlsx"
              exportSheetName="Estudios"
              templateFileName="plantilla-estudios.xlsx"
              templateSheetName="Plantilla estudios"
              onImportRow={async (row) => {
                const response = await createStudy(mapFormToCreateStudyPayload(row));
                if (!response.ok) {
                  return {
                    ok: false,
                    error: response.errors[0] ?? 'No se pudo importar el estudio.',
                  };
                }

                return { ok: true };
              }}
              onImportFinished={async () => {
                await reloadStudies();
              }}
              layout="flat"
            />
          </CatalogExcelModal>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
            onClick={() => {
              setCreateType('study');
              setOpenAddModal(true);
            }}
          >
            <Plus size={20} />
            Nuevo estudio
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-100"
            onClick={() => {
              setCreateType('package');
              setOpenAddModal(true);
            }}
          >
            <Plus size={20} />
            Nuevo paquete
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, clave, descripcion, metodo o indicador..."
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
          <div className="space-y-4 px-6 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estatus
              </p>
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

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tipo de estudio
              </p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTypeFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      typeFilter === option.value
                        ? 'bg-gray-900 text-white shadow-md shadow-gray-900/10'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total estudios</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{allStudies.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <Microscope className="h-5 w-5 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Suspendidos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{suspendidos}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3">
              <ShieldX className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio promedio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">${precioPromedio}</p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3">
              <FlaskConical className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {refreshing && !loading && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando estudios...
        </div>
      )}

      {loading ? (
        <CollectionContentSkeleton statCards={4} rows={5} />
      ) : studies.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay estudios para el filtro seleccionado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm xl:block">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-4">Estudio</div>
              <div className="col-span-1">Clave</div>
              <div className="col-span-1">Tipo</div>
              <div className="col-span-1">Duracion</div>
              <div className="col-span-2">Precio normal</div>
              <div className="col-span-2">Estatus</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {paginatedStudies.map((study) => (
                <div
                  key={study.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="col-span-4">
                    <h3 className="text-sm font-semibold text-gray-900">{study.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {study.description || 'Sin descripcion'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {study.type !== 'package' && study.method ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Metodo: {study.method}
                        </span>
                      ) : null}
                      {study.type !== 'package' && study.indicator ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Indicador: {study.indicator}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {study.code}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStudyTypeColor(study.type)}`}
                    >
                      {getStudyTypeLabel(study.type)}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatStudyDuration(study.durationMinutes)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">
                      ${Number(study.normalPrice).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      DIF ${Number(study.difPrice).toFixed(2)} · Esp. $
                      {Number(study.specialPrice).toFixed(2)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStudyStatusColor(study.status)}`}
                    >
                      {getStudyStatusLabel(study.status)}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <EntityActionsMenu
                      buttonLabel="Acciones"
                      items={[
                        {
                          label: 'Ver detalle',
                          href: `/estudios/detalle/${study.id}`,
                          hint: 'Disponible',
                          icon: <Eye size={16} />,
                        },
                        {
                          label:
                            study.type === 'package' ? 'Editar paquete' : 'Editar estudio',
                          href: `/estudios/detalle/${study.id}?modo=editar`,
                          hint: 'Disponible',
                          icon: <PencilLine size={16} />,
                        },
                        {
                          label:
                            study.type === 'package'
                              ? 'Configurar paquete'
                              : 'Configurar estudio',
                          href: `/estudios/detalle/${study.id}`,
                          hint: 'Disponible',
                          icon: <FlaskConical size={16} />,
                        },
                        {
                          label:
                            study.status === 'active'
                              ? 'Suspender estudio'
                              : 'Reactivar estudio',
                          onClick: () => void toggleStudyStatus(study),
                          hint:
                            updatingStatusId === study.id ? 'Actualizando...' : 'Disponible',
                          icon:
                            study.status === 'active' ? (
                              <ShieldX size={16} />
                            ) : (
                              <BadgeCheck size={16} />
                            ),
                        },
                        {
                          label: 'Eliminar estudio',
                          onClick: () => handleDelete(study.id, study.name),
                          hint: removingId === study.id ? 'Eliminando...' : 'Disponible',
                          destructive: true,
                          icon: <Trash2 size={16} />,
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={studies.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          <div className="space-y-4 xl:hidden">
            {paginatedStudies.map((study) => (
              <div
                key={study.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{study.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{study.code}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStudyStatusColor(study.status)}`}
                  >
                    {getStudyStatusLabel(study.status)}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="mt-1 font-semibold text-gray-900">{getStudyTypeLabel(study.type)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Duracion</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatStudyDuration(study.durationMinutes)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Precio normal</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      ${Number(study.normalPrice).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Precio DIF</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      ${Number(study.difPrice).toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                  {study.description || 'Sin descripcion'}
                </p>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">
                    {study.type === 'package'
                      ? 'Paquete listo para agrupar estudios'
                      : `Metodo: ${study.method || 'Sin metodo'}`}
                  </div>
                  <EntityActionsMenu
                    buttonLabel="Acciones"
                    items={[
                      {
                        label: 'Ver detalle',
                        href: `/estudios/detalle/${study.id}`,
                        hint: 'Disponible',
                        icon: <Eye size={16} />,
                      },
                      {
                        label:
                          study.type === 'package' ? 'Editar paquete' : 'Editar estudio',
                        href: `/estudios/detalle/${study.id}?modo=editar`,
                        hint: 'Disponible',
                        icon: <PencilLine size={16} />,
                      },
                      {
                        label:
                          study.type === 'package'
                            ? 'Configurar paquete'
                            : 'Configurar estudio',
                        href: `/estudios/detalle/${study.id}`,
                        hint: 'Disponible',
                        icon: <FlaskConical size={16} />,
                      },
                      {
                        label:
                          study.status === 'active'
                            ? 'Suspender estudio'
                            : 'Reactivar estudio',
                        onClick: () => void toggleStudyStatus(study),
                        hint:
                          updatingStatusId === study.id ? 'Actualizando...' : 'Disponible',
                        icon:
                          study.status === 'active' ? (
                            <ShieldX size={16} />
                          ) : (
                            <BadgeCheck size={16} />
                          ),
                      },
                      {
                        label: 'Eliminar estudio',
                        onClick: () => handleDelete(study.id, study.name),
                        hint: removingId === study.id ? 'Eliminando...' : 'Disponible',
                        destructive: true,
                        icon: <Trash2 size={16} />,
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm xl:hidden">
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={studies.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
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
            return ok;
          }}
          isSaving={saving}
          initialType={createType}
        />
      )}
    </div>
  );
}
