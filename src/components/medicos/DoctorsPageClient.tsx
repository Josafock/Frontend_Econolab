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
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldX,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { buildDoctorDetailHref } from "@/lib/routes/detail-routes";
import {
  createDoctor,
  getDoctors,
  hardDeleteDoctor,
  updateDoctorStatus,
  type CreateDoctorPayload,
  type DoctorStatusFilter,
} from "@/features/doctors/api/doctors";
import { toUiDoctor, type UiDoctor } from "@/features/doctors/model/ui-doctor";
import {
  createEmptyDoctorForm,
  mapFormToPayload,
  validateDoctorForm,
  type DoctorFormValues,
} from "@/components/medicos/doctorFormUtils";
import CatalogExcelModal from "@/components/ui/CatalogExcelModal";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import EntityActionsMenu from "@/components/ui/EntityActionsMenu";
import SortableTableHeader from "@/components/ui/SortableTableHeader";
import TablePagination from "@/components/ui/TablePagination";
import { formatDate } from "@/helpers/date";
import type { ExcelColumn } from "@/helpers/excel";
import {
  applySortDirection,
  compareDate,
  compareText,
  type SortDirection,
} from "@/lib/table/sort";

const AddDoctorModal = dynamic(() => import("@/components/medicos/AddDoctorModal"));
const CatalogExcelManager = dynamic(
  () => import("@/components/ui/CatalogExcelManager"),
) as typeof import("@/components/ui/CatalogExcelManager").default;

const statusOptions: Array<{ value: DoctorStatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

const doctorExcelColumns: ExcelColumn<DoctorFormValues>[] = [
  { key: "nombre", label: "Nombre", required: true, description: "Nombre del médico.", example: "MARIA", width: 18 },
  { key: "apellidoPaterno", label: "Apellido paterno", required: true, description: "Apellido paterno del médico.", example: "GOMEZ", width: 22 },
  { key: "apellidoMaterno", label: "Apellido materno", description: "Apellido materno si aplica.", example: "RUIZ", width: 22 },
  { key: "especialidad", label: "Especialidad", description: "Especialidad principal.", example: "CARDIOLOGIA", width: 24 },
  { key: "cedulaProfesional", label: "Cédula profesional", description: "Cédula o licencia.", example: "1234567", width: 20 },
  { key: "telefono", label: "Teléfono", description: "Solo números entre 7 y 15 dígitos.", example: "5512345678", width: 18 },
  { key: "email", label: "Correo electrónico", description: "Correo del médico.", example: "medico@dominio.com", inputType: "email", width: 28 },
  { key: "notas", label: "Notas", description: "Observaciones internas opcionales.", example: "Disponibilidad por las tardes", width: 34 },
];

function getEspecialidadColor(especialidad: string): string {
  const low = especialidad.toLowerCase();
  if (low.includes("cardio")) return "bg-red-100 text-red-800";
  if (low.includes("pedia")) return "bg-pink-100 text-pink-800";
  if (low.includes("derma")) return "bg-cyan-100 text-cyan-800";
  if (low.includes("gine")) return "bg-purple-100 text-purple-800";
  return "bg-blue-100 text-blue-800";
}

function getStatusColor(estatus: "Activo" | "Inactivo"): string {
  const colors: Record<string, string> = {
    Activo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Inactivo: "border-red-200 bg-red-50 text-red-700",
  };
  return colors[estatus] || "border-gray-200 bg-gray-50 text-gray-700";
}

function matchesDoctorSearch(doctor: UiDoctor, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    doctor.nombreCompleto,
    doctor.nombre,
    doctor.apellidoPaterno,
    doctor.apellidoMaterno,
    doctor.especialidad,
    doctor.cedula,
    doctor.telefono,
    doctor.email,
  ].some((value) => value.toLowerCase().includes(normalizedSearch));
}

type DoctorSortKey =
  | "doctor"
  | "specialty"
  | "license"
  | "contact"
  | "status"
  | "registeredAt";

type DoctorsState = {
  doctors: UiDoctor[];
  error: string | null;
};

async function loadDoctorsCatalog(): Promise<DoctorsState> {
  const response = await getDoctors({ limit: 1000, status: "all" });

  if (!response.ok) {
    return {
      doctors: [],
      error: response.errors[0] ?? "No se pudieron cargar los médicos en este momento.",
    };
  }

  return {
    doctors: response.data.data.map(toUiDoctor),
    error: null,
  };
}

export default function DoctorsPageClient() {
  const confirm = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>("all");
  const [sortState, setSortState] = useState<{
    key: DoctorSortKey;
    direction: SortDirection;
  }>({
    key: "registeredAt",
    direction: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [catalogDoctors, setCatalogDoctors] = useState<UiDoctor[]>([]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const result = await loadDoctorsCatalog();
      if (cancelled) return;

      setCatalogDoctors(result.doctors);
      setInitialError(result.error);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDoctors = async () => {
    setRefreshing(true);
    const result = await loadDoctorsCatalog();
    setCatalogDoctors(result.doctors);
    setInitialError(result.error);
    setRefreshing(false);
  };

  const allDoctors = useMemo(
    () => catalogDoctors.filter((doctor) => matchesDoctorSearch(doctor, searchTerm)),
    [catalogDoctors, searchTerm],
  );

  const doctors = useMemo(() => {
    if (statusFilter === "all") return allDoctors;
    return allDoctors.filter((doctor) =>
      statusFilter === "active" ? doctor.isActive : !doctor.isActive,
    );
  }, [allDoctors, statusFilter]);

  const sortedDoctors = useMemo(() => {
    const items = [...doctors];

    items.sort((left, right) => {
      const comparison = (() => {
        switch (sortState.key) {
          case "doctor":
            return compareText(left.nombreCompleto, right.nombreCompleto);
          case "specialty":
            return compareText(left.especialidad, right.especialidad);
          case "license":
            return compareText(left.cedula, right.cedula);
          case "contact":
            return compareText(
              `${left.telefono} ${left.email}`,
              `${right.telefono} ${right.email}`,
            );
          case "status":
            return compareText(left.estatus, right.estatus);
          case "registeredAt":
            return compareDate(left.fechaRegistro, right.fechaRegistro);
          default:
            return 0;
        }
      })();

      return applySortDirection(comparison, sortState.direction);
    });

    return items;
  }, [doctors, sortState]);

  const especialidadesUnicas = useMemo(
    () => new Set(allDoctors.map((doctor) => doctor.especialidad)).size,
    [allDoctors],
  );
  const activos = useMemo(() => allDoctors.filter((doctor) => doctor.isActive).length, [allDoctors]);
  const inactivos = useMemo(() => allDoctors.filter((doctor) => !doctor.isActive).length, [allDoctors]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortState, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedDoctors.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedDoctors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDoctors.slice(start, start + pageSize);
  }, [page, pageSize, sortedDoctors]);

  const toggleSort = (key: DoctorSortKey) => {
    setSortState((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : "asc"
          : key === "registeredAt"
            ? "desc"
            : "asc",
    }));
  };

  const handleAddDoctor = async (payload: CreateDoctorPayload) => {
    setSaving(true);
    const response = await createDoctor(payload);
    setSaving(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo registrar el médico.");
      return false;
    }

    toast.success("Médico registrado con éxito.");
    await refreshDoctors();
    return true;
  };

  const handleToggleDoctorStatus = async (doctor: UiDoctor) => {
    setUpdatingStatusId(doctor.id);
    const response = await updateDoctorStatus(doctor.id, !doctor.isActive);
    setUpdatingStatusId(null);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el estatus del médico.");
      return false;
    }

    toast.success(doctor.isActive ? "Médico suspendido." : "Médico reactivado.");
    await refreshDoctors();
    return true;
  };

  const handleDeleteDoctor = async (doctor: UiDoctor) => {
    const confirmed = await confirm({
      title: "Eliminar médico",
      message: `Se eliminará definitivamente a ${doctor.nombreCompleto}. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar médico",
      tone: "danger",
    });

    if (!confirmed) return;

    setDeletingId(doctor.id);
    const response = await hardDeleteDoctor(doctor.id);
    setDeletingId(null);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo eliminar el médico.");
      return;
    }

    toast.success("Médico eliminado definitivamente.");
    await refreshDoctors();
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-gray-200 bg-white text-sm text-gray-500 shadow-sm">
        Cargando médicos...
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Directorio de médicos
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Médicos</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Administra altas, edición de perfil, cambios de estatus y control del personal médico.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
            onClick={() => setOpenAddModal(true)}
          >
            <Plus size={20} />
            Nuevo médico
          </button>

          <CatalogExcelModal
            title="Importación y exportación de médicos"
            subtitle="Centraliza importaciones, exportaciones y vista previa sin recargar la pantalla principal."
            trigger={
              <button
                type="button"
                className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-100"
              >
                <FileSpreadsheet size={20} />
                Importación/Exportación
              </button>
            }
          >
            <CatalogExcelManager
              title="Carga masiva de médicos"
              description="Sube directorios completos de médicos, revisa la vista previa y corrige cualquier fila antes de insertarla."
              entityLabel="medicos"
              columns={doctorExcelColumns}
              createEmptyRow={createEmptyDoctorForm}
              validateRow={(row) =>
                Object.values(validateDoctorForm(row)).filter(
                  (error): error is string => Boolean(error),
                )
              }
              rowsForExport={doctors.map((doctor) => ({
                nombre: doctor.nombre,
                apellidoPaterno: doctor.apellidoPaterno,
                apellidoMaterno: doctor.apellidoMaterno === "-" ? "" : doctor.apellidoMaterno,
                especialidad: doctor.especialidad === "Sin especialidad" ? "" : doctor.especialidad,
                cedulaProfesional: doctor.cedula === "-" ? "" : doctor.cedula,
                telefono: doctor.telefono === "-" ? "" : doctor.telefono,
                email: doctor.email === "-" ? "" : doctor.email,
                notas: doctor.notas,
              }))}
              exportFileName="medicos.xlsx"
              exportSheetName="Médicos"
              templateFileName="plantilla-medicos.xlsx"
              templateSheetName="Plantilla médicos"
              onImportRow={async (row) => {
                const response = await createDoctor(mapFormToPayload(row));
                if (!response.ok) {
                  return {
                    ok: false,
                    error: response.errors[0] ?? "No se pudo importar el médico.",
                  };
                }
                return { ok: true };
              }}
              onImportFinished={() => void refreshDoctors()}
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
                placeholder="Buscar por nombre, especialidad, cédula, teléfono o correo..."
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
              <p className="text-sm font-medium text-gray-600">Total médicos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{allDoctors.length}</p>
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
              <p className="mt-1 text-3xl font-bold text-gray-900">{inactivos}</p>
            </div>
            <div className="rounded-2xl bg-red-100 p-3">
              <ShieldX className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
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

      {refreshing ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando cambios...
        </div>
      ) : null}

      {doctors.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          {initialError && catalogDoctors.length === 0
            ? "No fue posible cargar médicos en este momento."
            : "No hay médicos para el filtro seleccionado."}
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-3">
                <SortableTableHeader
                  label="Médico"
                  active={sortState.key === "doctor"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("doctor")}
                />
              </div>
              <div className="col-span-2">
                <SortableTableHeader
                  label="Especialidad"
                  active={sortState.key === "specialty"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("specialty")}
                />
              </div>
              <div className="col-span-2">
                <SortableTableHeader
                  label="Cédula"
                  active={sortState.key === "license"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("license")}
                />
              </div>
              <div className="col-span-2">
                <SortableTableHeader
                  label="Contacto"
                  active={sortState.key === "contact"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("contact")}
                />
              </div>
              <div className="col-span-1">
                <SortableTableHeader
                  label="Estatus"
                  active={sortState.key === "status"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("status")}
                />
              </div>
              <div className="col-span-1">
                <SortableTableHeader
                  label="Registro"
                  active={sortState.key === "registeredAt"}
                  direction={sortState.direction}
                  onToggle={() => toggleSort("registeredAt")}
                />
              </div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {paginatedDoctors.map((medico) => (
                <div key={medico.id} className="grid grid-cols-12 gap-4 px-6 py-5 transition-colors hover:bg-gray-50">
                  <div className="col-span-3">
                    <h3 className="text-sm font-semibold text-gray-900">{medico.nombreCompleto}</h3>
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
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(medico.estatus)}`}>
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
                        { label: "Ver detalle", href: buildDoctorDetailHref(medico.id, { hash: "resumen-perfil" }), icon: <Eye size={16} /> },
                        { label: "Editar médico", href: buildDoctorDetailHref(medico.id, { mode: "editar", hash: "perfil-completo" }), icon: <PencilLine size={16} /> },
                        {
                          label: medico.isActive ? "Suspender médico" : "Reactivar médico",
                          onClick: () => void handleToggleDoctorStatus(medico),
                          icon: medico.isActive ? <ShieldX size={16} /> : <BadgeCheck size={16} />,
                          disabled: updatingStatusId === medico.id,
                        },
                        {
                          label: "Eliminar médico",
                          onClick: () => void handleDeleteDoctor(medico),
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

            <TablePagination page={page} pageSize={pageSize} totalItems={sortedDoctors.length} itemLabel="registros" onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2 2xl:hidden">
            {paginatedDoctors.map((medico) => (
              <div key={medico.id} className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{medico.nombreCompleto}</h3>
                    <p className="mt-1 text-xs text-gray-500">{medico.especialidad}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(medico.estatus)}`}>
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
                      { label: "Ver detalle", href: buildDoctorDetailHref(medico.id, { hash: "resumen-perfil" }), icon: <Eye size={16} /> },
                      { label: "Editar médico", href: buildDoctorDetailHref(medico.id, { mode: "editar", hash: "perfil-completo" }), icon: <PencilLine size={16} /> },
                      {
                        label: medico.isActive ? "Suspender médico" : "Reactivar médico",
                        onClick: () => void handleToggleDoctorStatus(medico),
                        icon: medico.isActive ? <ShieldX size={16} /> : <BadgeCheck size={16} />,
                        disabled: updatingStatusId === medico.id,
                      },
                      {
                        label: "Eliminar médico",
                        onClick: () => void handleDeleteDoctor(medico),
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

          <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:hidden">
            <TablePagination page={page} pageSize={pageSize} totalItems={sortedDoctors.length} itemLabel="registros" onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </>
      )}

      {openAddModal ? (
        <AddDoctorModal
          setOpen={setOpenAddModal}
          addDoctor={async (payload) => {
            const ok = await handleAddDoctor(payload);
            if (ok) setOpenAddModal(false);
            return ok;
          }}
          isSaving={saving}
        />
      ) : null}
    </div>
  );
}
