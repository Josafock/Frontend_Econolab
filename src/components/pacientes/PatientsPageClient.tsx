"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Eye,
  FileSpreadsheet,
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
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createPatient,
  getPatients,
  updatePatientStatus,
  type CreatePatientPayload,
  type PatientStatusFilter,
} from "@/features/patients/api/patients";
import { toUiPatient, type UiPatient } from "@/features/patients/model/ui-patient";
import {
  calculateAge,
  createEmptyPatientForm,
  mapFormToPayload,
  validatePatientForm,
  type PatientFormValues,
} from "@/components/pacientes/patientFormUtils";
import CatalogExcelModal from "@/components/ui/CatalogExcelModal";
import { CollectionContentSkeleton } from "@/components/ui/PageSkeletons";
import EntityActionsMenu from "@/components/ui/EntityActionsMenu";
import TablePagination from "@/components/ui/TablePagination";
import { formatDate } from "@/helpers/date";
import type { ExcelColumn } from "@/helpers/excel";

const AddPatientModal = dynamic(
  () => import("@/components/pacientes/AddPatientModal"),
);
const CatalogExcelManager = dynamic(
  () => import("@/components/ui/CatalogExcelManager"),
) as typeof import("@/components/ui/CatalogExcelManager").default;

type PatientsState = {
  patients: UiPatient[];
  error: string | null;
};

const statusOptions: Array<{ value: PatientStatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

const patientExcelColumns: ExcelColumn<PatientFormValues>[] = [
  {
    key: "nombre",
    label: "Nombre",
    required: true,
    description: "Nombre del paciente.",
    example: "JUAN",
    width: 18,
  },
  {
    key: "apellidoPaterno",
    label: "Apellido paterno",
    required: true,
    description: "Apellido paterno del paciente.",
    example: "PEREZ",
    width: 22,
  },
  {
    key: "apellidoMaterno",
    label: "Apellido materno",
    description: "Apellido materno si aplica.",
    example: "LOPEZ",
    width: 22,
  },
  {
    key: "fechaNacimiento",
    label: "Fecha nacimiento",
    required: true,
    description: "Formato YYYY-MM-DD.",
    example: "1990-05-14",
    inputType: "date",
    width: 18,
  },
  {
    key: "genero",
    label: "Genero",
    required: true,
    description: "Genero del paciente.",
    example: "female",
    inputType: "select",
    options: [
      { label: "Femenino", value: "female" },
      { label: "Masculino", value: "male" },
      { label: "Otro", value: "other" },
    ],
    width: 14,
  },
  {
    key: "telefono",
    label: "Telefono",
    description: "Solo numeros entre 7 y 15 digitos.",
    example: "5512345678",
    width: 18,
  },
  {
    key: "email",
    label: "Email",
    description: "Correo electronico del paciente.",
    example: "correo@dominio.com",
    inputType: "email",
    width: 28,
  },
  {
    key: "direccion",
    label: "Direccion",
    description: "Calle y numero.",
    example: "Av. Central 123",
    width: 28,
  },
  {
    key: "entreCalles",
    label: "Entre calles",
    description: "Referencia adicional de direccion.",
    example: "Entre Norte y Sur",
    width: 28,
  },
  {
    key: "ciudad",
    label: "Ciudad",
    description: "Ciudad o municipio.",
    example: "Ecatepec",
    width: 18,
  },
  {
    key: "estado",
    label: "Estado",
    description: "Estado de residencia.",
    example: "Estado de Mexico",
    width: 20,
  },
  {
    key: "codigoPostal",
    label: "Codigo postal",
    description: "Solo numeros.",
    example: "55070",
    width: 16,
  },
  {
    key: "tipoDocumento",
    label: "Tipo documento",
    description: "Ejemplo: INE, CURP o Pasaporte.",
    example: "INE",
    width: 18,
  },
  {
    key: "numeroDocumento",
    label: "Numero documento",
    description: "Numero del documento si existe.",
    example: "ABC123456",
    width: 22,
  },
];

const getGeneroColor = (genero: "Femenino" | "Masculino" | "Otro"): string => {
  const colors: Record<string, string> = {
    Femenino: "bg-pink-100 text-pink-800",
    Masculino: "bg-blue-100 text-blue-800",
    Otro: "bg-gray-100 text-gray-800",
  };
  return colors[genero] || "bg-gray-100 text-gray-800";
};

const getStatusColor = (estatus: "Activo" | "Inactivo"): string => {
  const colors: Record<string, string> = {
    Activo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Inactivo: "border-red-200 bg-red-50 text-red-700",
  };
  return colors[estatus] || "border-gray-200 bg-gray-50 text-gray-700";
};

function matchesPatientSearch(patient: UiPatient, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    patient.nombreCompleto,
    patient.nombre,
    patient.apellidoPaterno,
    patient.apellidoMaterno,
    patient.telefono,
    patient.email,
    patient.documento,
    patient.direccion,
    patient.entreCalles,
    patient.ciudad,
    patient.estado,
    patient.codigoPostal,
  ].some((value) => value.toLowerCase().includes(normalizedSearch));
}

async function loadPatientsCatalog(): Promise<PatientsState> {
  const response = await getPatients({ limit: 1000, status: "all" });

  if (!response.ok) {
    return {
      patients: [],
      error:
        response.errors[0] ??
        "No se pudieron cargar los pacientes en este momento.",
    };
  }

  return {
    patients: response.data.data.map(toUiPatient),
    error: null,
  };
}

export default function PatientsPageClient() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [catalogPatients, setCatalogPatients] = useState<UiPatient[]>([]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const result = await loadPatientsCatalog();
      if (cancelled) return;

      setCatalogPatients(result.patients);
      setInitialError(result.error);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const allPatients = useMemo(
    () =>
      catalogPatients.filter((patient) =>
        matchesPatientSearch(patient, searchTerm),
      ),
    [catalogPatients, searchTerm],
  );

  const patients = useMemo(() => {
    if (statusFilter === "all") return allPatients;

    return allPatients.filter((patient) =>
      statusFilter === "active" ? patient.isActive : !patient.isActive,
    );
  }, [allPatients, statusFilter]);

  const promedioEdad = useMemo(() => {
    if (!patients.length) return 0;
    return Math.round(
      patients.reduce(
        (acc, patient) => acc + calculateAge(patient.fechaNacimiento),
        0,
      ) / patients.length,
    );
  }, [patients]);
  const activos = useMemo(
    () => allPatients.filter((patient) => patient.isActive).length,
    [allPatients],
  );
  const inactivos = useMemo(
    () => allPatients.filter((patient) => !patient.isActive).length,
    [allPatients],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(patients.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return patients.slice(start, start + pageSize);
  }, [page, pageSize, patients]);

  const refreshPatients = async () => {
    setIsRefreshing(true);
    const result = await loadPatientsCatalog();
    setCatalogPatients(result.patients);
    setInitialError(result.error);
    setIsRefreshing(false);
  };

  const handleAddPatient = async (payload: CreatePatientPayload) => {
    setSaving(true);
    const response = await createPatient(payload);
    setSaving(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo registrar el paciente.");
      return false;
    }

    toast.success("Paciente registrado con exito.");
    await refreshPatients();
    return true;
  };

  const handleTogglePatientStatus = async (patient: UiPatient) => {
    setUpdatingStatusId(patient.id);
    const response = await updatePatientStatus(patient.id, !patient.isActive);
    setUpdatingStatusId(null);

    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del paciente.",
      );
      return false;
    }

    toast.success(
      patient.isActive ? "Paciente suspendido." : "Paciente reactivado.",
    );
    await refreshPatients();
    return true;
  };

  if (loading) {
    return <CollectionContentSkeleton statCards={4} rows={6} />;
  }

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Registro de pacientes
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Administra altas, edicion de expediente y bajas logicas sin perder
            historial.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
            onClick={() => setOpenAddModal(true)}
          >
            <Plus size={20} />
            Nuevo paciente
          </button>

          <CatalogExcelModal
            title="Importacion y exportacion de pacientes"
            subtitle="Importa, exporta y valida pacientes desde un espacio separado para mantener esta pantalla limpia."
            trigger={
              <button
                type="button"
                className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-100"
              >
                <FileSpreadsheet size={20} />
                Importacion/Exportacion
              </button>
            }
          >
            <CatalogExcelManager
              title="Carga masiva de pacientes"
              description="Trabaja con una plantilla para subir varios pacientes de una sola vez, revisar sus datos y corregirlos antes de guardarlos."
              entityLabel="pacientes"
              columns={patientExcelColumns}
              createEmptyRow={createEmptyPatientForm}
              validateRow={(row) =>
                Object.values(validatePatientForm(row)).filter(
                  (error): error is string => Boolean(error),
                )
              }
              rowsForExport={patients.map((patient) => ({
                nombre: patient.nombre,
                apellidoPaterno: patient.apellidoPaterno,
                apellidoMaterno:
                  patient.apellidoMaterno === "-" ? "" : patient.apellidoMaterno,
                fechaNacimiento: patient.fechaNacimiento,
                genero: (patient.genero === "Femenino"
                  ? "female"
                  : patient.genero === "Masculino"
                    ? "male"
                    : "other") as PatientFormValues["genero"],
                telefono: patient.telefono === "-" ? "" : patient.telefono,
                email: patient.email === "-" ? "" : patient.email,
                direccion: patient.direccion === "-" ? "" : patient.direccion,
                entreCalles:
                  patient.entreCalles === "-" ? "" : patient.entreCalles,
                ciudad: patient.ciudad === "-" ? "" : patient.ciudad,
                estado: patient.estado === "-" ? "" : patient.estado,
                codigoPostal:
                  patient.codigoPostal === "-" ? "" : patient.codigoPostal,
                tipoDocumento:
                  patient.documento === "Sin documento"
                    ? ""
                    : (patient.documento.split(":")[0] ?? ""),
                numeroDocumento:
                  patient.documento === "Sin documento"
                    ? ""
                    : patient.documento.split(":").slice(1).join(":").trim(),
              }))}
              exportFileName="pacientes.xlsx"
              exportSheetName="Pacientes"
              templateFileName="plantilla-pacientes.xlsx"
              templateSheetName="Plantilla pacientes"
              onImportRow={async (row) => {
                const response = await createPatient(mapFormToPayload(row));
                if (!response.ok) {
                  return {
                    ok: false,
                    error:
                      response.errors[0] ?? "No se pudo importar el paciente.",
                  };
                }

                return { ok: true };
              }}
              onImportFinished={() => void refreshPatients()}
              layout="flat"
            />
          </CatalogExcelModal>
        </div>
      </div>

      {initialError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {initialError}
        </div>
      ) : null}

      <div className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, telefono, documento o direccion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`app-chip-button rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total pacientes
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {allPatients.length}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
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

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {inactivos}
              </p>
            </div>
            <div className="rounded-2xl bg-red-100 p-3">
              <ShieldX className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Edad promedio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {promedioEdad}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3">
              <User className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {isRefreshing ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando cambios...
        </div>
      ) : null}

      {patients.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          {initialError && catalogPatients.length === 0
            ? "No fue posible cargar pacientes en este momento."
            : "No hay pacientes para el filtro seleccionado."}
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-3">Paciente</div>
              <div className="col-span-2">Documento</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2">Direccion</div>
              <div className="col-span-1">Estatus</div>
              <div className="col-span-1">Registro</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {paginatedPatients.map((paciente) => (
                <div
                  key={paciente.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="col-span-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {paciente.nombreCompleto}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {calculateAge(paciente.fechaNacimiento)} anos
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGeneroColor(paciente.genero)}`}
                      >
                        {paciente.genero}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      {paciente.documento}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {paciente.telefono}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate text-sm text-gray-900">
                        {paciente.email}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {paciente.direccion}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {paciente.ciudad}
                          {paciente.estado !== "-"
                            ? `, ${paciente.estado}`
                            : ""}
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
                          label: "Ver detalle",
                          href: `/pacientes/detalle/${paciente.id}#resumen-expediente`,
                          hint: "Disponible",
                          icon: <Eye size={16} />,
                        },
                        {
                          label: "Editar paciente",
                          href: `/pacientes/detalle/${paciente.id}?modo=editar#expediente-completo`,
                          hint: "Disponible",
                          icon: <PencilLine size={16} />,
                        },
                        {
                          label: paciente.isActive
                            ? "Suspender paciente"
                            : "Reactivar paciente",
                          onClick: () => void handleTogglePatientStatus(paciente),
                          hint:
                            updatingStatusId === paciente.id
                              ? "Actualizando..."
                              : "Disponible",
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

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={patients.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2 2xl:hidden">
            {paginatedPatients.map((paciente) => (
              <div
                key={paciente.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {paciente.nombreCompleto}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {paciente.documento}
                    </p>
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
                      {calculateAge(paciente.fechaNacimiento)} anos
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Genero</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {paciente.genero}
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {paciente.telefono}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate text-sm text-gray-900">
                      {paciente.email}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {paciente.direccion}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paciente.ciudad}
                        {paciente.estado !== "-" ? `, ${paciente.estado}` : ""}
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
                        label: "Ver detalle",
                        href: `/pacientes/detalle/${paciente.id}#resumen-expediente`,
                        hint: "Disponible",
                        icon: <Eye size={16} />,
                      },
                      {
                        label: "Editar paciente",
                        href: `/pacientes/detalle/${paciente.id}?modo=editar#expediente-completo`,
                        hint: "Disponible",
                        icon: <PencilLine size={16} />,
                      },
                      {
                        label: paciente.isActive
                          ? "Suspender paciente"
                          : "Reactivar paciente",
                        onClick: () => void handleTogglePatientStatus(paciente),
                        hint:
                          updatingStatusId === paciente.id
                            ? "Actualizando..."
                            : "Disponible",
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

          <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:hidden">
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={patients.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {openAddModal ? (
        <AddPatientModal
          setOpen={setOpenAddModal}
          addPatient={async (payload) => {
            const ok = await handleAddPatient(payload);
            if (ok) {
              setOpenAddModal(false);
            }
            return ok;
          }}
          isSaving={saving}
        />
      ) : null}
    </div>
  );
}
