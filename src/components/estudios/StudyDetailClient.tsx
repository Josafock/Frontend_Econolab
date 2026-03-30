"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import {
  ArrowLeft,
  BadgeCheck,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Loader2,
  Plus,
  PencilLine,
  Search,
  Save,
  ShieldX,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  createStudyDetail,
  getStudyById,
  getStudyDetails,
  getStudies,
  getSuggestedStudyCode,
  removeStudy,
  removeStudyDetail,
  updateStudy,
  updateStudyDetail,
  updateStudyDetailStatus,
  updateStudyStatus,
  type Study,
  type StudyDetail,
} from "@/features/studies/api/studies";
import StudyFormFields from "@/components/estudios/StudyFormFields";
import CatalogExcelModal from "@/components/ui/CatalogExcelModal";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { DetailPageSkeleton } from "@/components/ui/PageSkeletons";
import {
  createEmptyStudyForm,
  createTouchedStudyForm,
  generateSuggestedStudyCode,
  hasStudyFormErrors,
  isGeneratedStudyCode,
  mapFormToUpdateStudyPayload,
  mapStudyToForm,
  updateDurationValue,
  validateStudyForm,
  type StudyFormTouched,
  type StudyFormValues,
} from "@/components/estudios/studyFormUtils";
import {
  createEmptyStudyDetailExcelRow,
  mapStudyDetailToExcelRow,
  validateStudyDetailExcelRow,
  type StudyDetailExcelRow,
} from "@/components/estudios/studyDetailFormUtils";
import EntityActionsMenu from "@/components/ui/EntityActionsMenu";
import type { ExcelColumn } from "@/helpers/excel";
import { matchesNormalizedSearch } from "@/helpers/search";
import {
  formatStudyDuration,
  getStudyDetailTypeLabel,
  getStudyStatusColor,
  getStudyStatusLabel,
  getStudyTypeColor,
  getStudyTypeLabel,
  sortStudyDetails,
} from "@/helpers/studies";
import { useHashSectionScroll } from "@/hooks/useHashSectionScroll";

const CatalogExcelManager = dynamic(
  () => import("@/components/ui/CatalogExcelManager"),
) as typeof import("@/components/ui/CatalogExcelManager").default;
const AddStudyDetailModal = dynamic(
  () => import("@/components/estudios/AddStudyDetailModal"),
);
const EditStudyDetailModal = dynamic(
  () => import("@/components/estudios/EditStudyDetailModal"),
);

const studyDetailExcelColumns: ExcelColumn<StudyDetailExcelRow>[] = [
  {
    key: "tipo",
    label: "Tipo",
    required: true,
    description: "Define si la fila es categoria o parametro.",
    inputType: "select",
    options: [
      { label: "Categoria", value: "category" },
      { label: "Parametro", value: "parameter" },
    ],
    example: "parameter",
    width: 16,
  },
  {
    key: "categoriaPadre",
    label: "Categoria padre",
    description:
      "Nombre de la categoria contenedora. Dejalo vacio para nivel raiz.",
    example: "QUIMICA SANGUINEA",
    width: 24,
  },
  {
    key: "nombre",
    label: "Nombre",
    required: true,
    description: "Nombre de la categoria o parametro.",
    example: "GLUCOSA",
    width: 28,
  },
  {
    key: "orden",
    label: "Orden",
    required: true,
    description: "Numero entero para ordenar en pantalla.",
    example: "1",
    inputType: "number",
    width: 12,
  },
  {
    key: "unidad",
    label: "Unidad",
    description: "Solo para parametros.",
    example: "mg/dL",
    width: 16,
  },
  {
    key: "valorReferencia",
    label: "Valor referencia",
    description: "Solo para parametros.",
    example: "70 - 110",
    width: 28,
  },
];

type StudyDetailClientProps = {
  studyId: number;
  initialIsEditing?: boolean;
};

export default function StudyDetailClient({
  studyId,
  initialIsEditing = false,
}: StudyDetailClientProps) {
  const confirm = useConfirmDialog();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [study, setStudy] = useState<Study | null>(null);
  const [details, setDetails] = useState<StudyDetail[]>([]);
  const entityLabel = study?.type === "package" ? "paquete" : "estudio";

  const [formData, setFormData] = useState<StudyFormValues>(
    createEmptyStudyForm(),
  );
  const [useAutoCode, setUseAutoCode] = useState(false);
  const [touched, setTouched] = useState<StudyFormTouched>({});
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [savingStudy, setSavingStudy] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingStudy, setDeletingStudy] = useState(false);

  const [savingDetail, setSavingDetail] = useState(false);
  const [updatingDetailId, setUpdatingDetailId] = useState<number | null>(null);
  const [updatingDetailStatusId, setUpdatingDetailStatusId] = useState<
    number | null
  >(null);
  const [removingDetailId, setRemovingDetailId] = useState<number | null>(null);
  const [editingDetail, setEditingDetail] = useState<StudyDetail | null>(null);
  const [creatingDetailType, setCreatingDetailType] = useState<
    "category" | "parameter" | null
  >(null);
  const [availableStudies, setAvailableStudies] = useState<Study[]>([]);
  const [packageStudyIds, setPackageStudyIds] = useState<number[]>([]);
  const [packageStudySearch, setPackageStudySearch] = useState("");
  const [savingPackageStudies, setSavingPackageStudies] = useState(false);
  const detailImportCategoryMapRef = useRef<Map<string, number>>(new Map());
  const detailImportUsedNamesRef = useRef<Set<string>>(new Set());

  const formErrors = useMemo(() => validateStudyForm(formData), [formData]);

  useHashSectionScroll({ enabled: !error && Boolean(study) });

  const categories = useMemo(
    () =>
      sortStudyDetails(
        details.filter((detail) => detail.dataType === "category"),
      ),
    [details],
  );
  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive !== false),
    [categories],
  );
  const activeCategoryIds = useMemo(
    () => new Set(activeCategories.map((category) => category.id)),
    [activeCategories],
  );
  const activeParameters = useMemo(
    () =>
      sortStudyDetails(
        details.filter(
          (detail) =>
            detail.dataType === "parameter" && detail.isActive !== false,
        ),
      ),
    [details],
  );
  const groupedParameters = useMemo(
    () =>
      activeCategories
        .map((category) => ({
          category,
          parameters: activeParameters.filter(
            (parameter) => parameter.parentId === category.id,
          ),
        }))
        .filter((group) => group.parameters.length > 0),
    [activeCategories, activeParameters],
  );
  const standaloneParameters = useMemo(
    () =>
      activeParameters.filter(
        (parameter) =>
          !parameter.parentId || !activeCategoryIds.has(parameter.parentId),
      ),
    [activeCategoryIds, activeParameters],
  );
  const emptyCategories = useMemo(
    () =>
      activeCategories.filter(
        (category) =>
          !activeParameters.some(
            (parameter) => parameter.parentId === category.id,
          ),
      ),
    [activeCategories, activeParameters],
  );
  const selectedPackageStudies = useMemo(
    () =>
      packageStudyIds
        .map((packageStudyId) =>
          availableStudies.find((candidate) => candidate.id === packageStudyId),
        )
        .filter((candidate): candidate is Study => Boolean(candidate)),
    [availableStudies, packageStudyIds],
  );
  const packageCandidateStudies = useMemo(
    () =>
      availableStudies.filter(
        (candidate) =>
          !packageStudyIds.includes(candidate.id) && candidate.type === "study",
      ),
    [availableStudies, packageStudyIds],
  );
  const activePackageCandidateStudies = useMemo(
    () =>
      packageCandidateStudies.filter((candidate) => candidate.status === "active"),
    [packageCandidateStudies],
  );
  const filteredPackageCandidateStudies = useMemo(
    () =>
      activePackageCandidateStudies.filter((candidate) => {
        return matchesNormalizedSearch(
          [
            candidate.name,
            candidate.code,
            candidate.description ?? "",
            candidate.method ?? "",
            candidate.indicator ?? "",
          ],
          packageStudySearch,
        );
      }),
    [activePackageCandidateStudies, packageStudySearch],
  );

  useEffect(() => {
    setIsEditing(searchParams.get("modo") === "editar");
  }, [searchParams]);

  const refreshStudyBundle = async (options?: {
    silent?: boolean;
    preserveForm?: boolean;
  }) => {
    setIsRefreshing(true);

    const [studyResponse, detailsResponse, studiesCatalogResponse] =
      await Promise.all([
        getStudyById(studyId),
        getStudyDetails(studyId),
        getStudies({ limit: 500, type: "study" }),
      ]);

    setIsRefreshing(false);

    if (!studyResponse.ok) {
      const nextError =
        studyResponse.errors[0] ?? "No se pudo cargar el estudio.";
      setError(nextError);
      setStudy(null);
      if (!options?.silent) {
        toast.error(nextError);
      }
      setLoading(false);
      return false;
    }

    if (!detailsResponse.ok) {
      const nextError =
        detailsResponse.errors[0] ??
        "No se pudo cargar la configuracion del estudio.";
      setError(nextError);
      if (!options?.silent) {
        toast.error(nextError);
      }
      setLoading(false);
      return false;
    }

    if (!studiesCatalogResponse.ok) {
      const nextError =
        studiesCatalogResponse.errors[0] ??
        "No se pudo cargar el catalogo de estudios.";
      setError(nextError);
      if (!options?.silent) {
        toast.error(nextError);
      }
      setLoading(false);
      return false;
    }

    const nextStudy = studyResponse.data;
    const nextDetails = detailsResponse.data;
    const nextAvailableStudies = studiesCatalogResponse.data.data.filter(
      (candidate) => candidate.id !== nextStudy.id,
    );

    setError("");
    setStudy(nextStudy);
    setDetails(nextDetails);
    setAvailableStudies(nextAvailableStudies);
    setPackageStudyIds(nextStudy.packageStudyIds ?? []);
    setPackageStudySearch("");

    if (!options?.preserveForm) {
      setFormData(mapStudyToForm(nextStudy));
      setUseAutoCode(false);
      setTouched({});
    }

    setLoading(false);
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!Number.isInteger(studyId) || studyId < 1) {
        if (!cancelled) {
          setError("ID de estudio invalido.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setIsRefreshing(true);

      const [studyResponse, detailsResponse, studiesCatalogResponse] =
        await Promise.all([
          getStudyById(studyId),
          getStudyDetails(studyId),
          getStudies({ limit: 500, type: "study" }),
        ]);

      if (cancelled) {
        return;
      }

      setIsRefreshing(false);

      if (!studyResponse.ok) {
        setError(studyResponse.errors[0] ?? "No se pudo cargar el estudio.");
        setStudy(null);
        setLoading(false);
        return;
      }

      if (!detailsResponse.ok) {
        setError(
          detailsResponse.errors[0] ??
            "No se pudo cargar la configuracion del estudio.",
        );
        setStudy(null);
        setLoading(false);
        return;
      }

      if (!studiesCatalogResponse.ok) {
        setError(
          studiesCatalogResponse.errors[0] ??
            "No se pudo cargar el catalogo de estudios.",
        );
        setStudy(null);
        setLoading(false);
        return;
      }

      const nextStudy = studyResponse.data;
      setError("");
      setStudy(nextStudy);
      setDetails(detailsResponse.data);
      setAvailableStudies(
        studiesCatalogResponse.data.data.filter(
          (candidate) => candidate.id !== nextStudy.id,
        ),
      );
      setPackageStudyIds(nextStudy.packageStudyIds ?? []);
      setPackageStudySearch("");
      setFormData(mapStudyToForm(nextStudy));
      setUseAutoCode(false);
      setTouched({});
      setLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [studyId]);

  const refreshDetails = async (silent = false) => {
    const response = await getStudyDetails(studyId);
    if (!response.ok) {
      if (!silent) {
        toast.error(
          response.errors[0] ?? "No se pudo refrescar la configuracion.",
        );
      }
      return false;
    }

    setDetails(response.data);
    return true;
  };

  const normalizeDetailName = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

  const prepareDetailImportSession = () => {
    const categoryMap = new Map<string, number>();
    const usedNames = new Set<string>();

    for (const detail of details) {
      if (detail.dataType === "category") {
        categoryMap.set(normalizeDetailName(detail.name), detail.id);
      }

      usedNames.add(`${detail.dataType}:${normalizeDetailName(detail.name)}`);
    }

    detailImportCategoryMapRef.current = categoryMap;
    detailImportUsedNamesRef.current = usedNames;
  };

  const sortDetailImportRows = (rows: StudyDetailExcelRow[]) => {
    const knownCategories = new Set(
      details
        .filter((detail) => detail.dataType === "category")
        .map((detail) => normalizeDetailName(detail.name)),
    );
    const pending = [...rows];
    const ordered: StudyDetailExcelRow[] = [];

    while (pending.length > 0) {
      let moved = false;

      for (let index = 0; index < pending.length; ) {
        const row = pending[index];
        const parentName = normalizeDetailName(row.categoriaPadre);

        if (
          row.tipo === "category" &&
          (!parentName || knownCategories.has(parentName))
        ) {
          ordered.push(row);
          knownCategories.add(normalizeDetailName(row.nombre));
          pending.splice(index, 1);
          moved = true;
          continue;
        }

        index += 1;
      }

      for (let index = 0; index < pending.length; ) {
        const row = pending[index];
        const parentName = normalizeDetailName(row.categoriaPadre);

        if (
          row.tipo === "parameter" &&
          (!parentName || knownCategories.has(parentName))
        ) {
          ordered.push(row);
          pending.splice(index, 1);
          moved = true;
          continue;
        }

        index += 1;
      }

      if (!moved) {
        ordered.push(...pending);
        break;
      }
    }

    return ordered;
  };

  const exportableDetailRows = useMemo(
    () =>
      sortStudyDetails(details).map((detail) =>
        mapStudyDetailToExcelRow(detail, details),
      ),
    [details],
  );

  const importStudyDetailRow = async (row: StudyDetailExcelRow) => {
    if (!study) {
      return { ok: false, error: "No se encontro el estudio actual." };
    }

    const normalizedType = row.tipo;
    const normalizedName = normalizeDetailName(row.nombre);
    const duplicateKey = `${normalizedType}:${normalizedName}`;

    if (detailImportUsedNamesRef.current.has(duplicateKey)) {
      return {
        ok: false,
        error: `Ya existe un elemento ${row.tipo === "category" ? "de categoria" : "de parametro"} con ese nombre.`,
      };
    }

    let parentId: number | undefined;
    const normalizedParentName = normalizeDetailName(row.categoriaPadre);

    if (normalizedParentName) {
      parentId = detailImportCategoryMapRef.current.get(normalizedParentName);

      if (!parentId) {
        return {
          ok: false,
          error: `No se encontro la categoria padre "${row.categoriaPadre}".`,
        };
      }
    }

    const payload =
      row.tipo === "category"
        ? {
            dataType: "category" as const,
            name: normalizedName,
            sortOrder: Number(row.orden),
            parentId,
          }
        : {
            dataType: "parameter" as const,
            name: normalizedName,
            sortOrder: Number(row.orden),
            parentId,
            unit: row.unidad.trim() || undefined,
            referenceValue: row.valorReferencia.trim() || undefined,
          };

    const response = await createStudyDetail(study.id, payload);

    if (!response.ok) {
      return {
        ok: false,
        error: response.errors[0] ?? "No se pudo importar este elemento.",
      };
    }

    detailImportUsedNamesRef.current.add(duplicateKey);

    if (response.data.data.dataType === "category") {
      detailImportCategoryMapRef.current.set(
        normalizeDetailName(response.data.data.name),
        response.data.data.id,
      );
    }

    return { ok: true };
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "clave") {
      setUseAutoCode(false);
    }

    setFormData((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      };

      if (name === "tipo" && useAutoCode && isGeneratedStudyCode(current.clave)) {
        nextForm.clave = generateSuggestedStudyCode(value as Study["type"]);
      }

      return nextForm;
    });

    if (name === "tipo" && useAutoCode) {
      void handleGenerateCode(value as Study["type"]);
    }
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const handleDurationChange = (part: "hours" | "minutes", value: string) => {
    setFormData((current) => ({
      ...current,
      duracion: updateDurationValue(current.duracion, part, value),
    }));
  };

  const handleDurationBlur = () => {
    setTouched((current) => ({
      ...current,
      duracion: true,
    }));
  };

  const handleGenerateCode = async (typeOverride?: Study["type"]) => {
    setUseAutoCode(true);
    const targetType = typeOverride ?? formData.tipo;
    const response = await getSuggestedStudyCode(targetType);

    setFormData((current) => ({
      ...current,
      clave: response.ok
        ? response.data.code
        : generateSuggestedStudyCode(targetType),
    }));
  };

  const handleAddPackageStudy = (studyId: number) => {
    if (!Number.isInteger(studyId) || studyId <= 0) {
      toast.error("Selecciona un estudio valido para agregar al paquete.");
      return;
    }

    setPackageStudyIds((current) =>
      current.includes(studyId) ? current : [...current, studyId],
    );
  };

  const handleRemovePackageStudy = (studyId: number) => {
    setPackageStudyIds((current) =>
      current.filter((currentId) => currentId !== studyId),
    );
  };

  const handleSavePackageStudies = async () => {
    if (!study) return;

    setSavingPackageStudies(true);
    const response = await updateStudy(study.id, { packageStudyIds });
    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo guardar el contenido del paquete.",
      );
      setSavingPackageStudies(false);
      return;
    }

    setStudy(response.data.data);
    setPackageStudyIds(response.data.data.packageStudyIds ?? []);
    toast.success("Contenido del paquete actualizado con exito.");
    setSavingPackageStudies(false);
    await refreshStudyBundle({ silent: true, preserveForm: true });
  };

  const handleSaveStudy = async () => {
    if (!study) return;

    setTouched(createTouchedStudyForm());

    if (hasStudyFormErrors(formErrors)) {
      toast.error(
        "Revisa los campos obligatorios y corrige los errores del estudio.",
      );
      return;
    }

    setSavingStudy(true);
    const response = await updateStudy(
      study.id,
      mapFormToUpdateStudyPayload(formData, { autoGenerateCode: useAutoCode }),
    );
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el estudio.");
      setSavingStudy(false);
      return;
    }

    setStudy(response.data.data);
    setPackageStudyIds(response.data.data.packageStudyIds ?? []);
    setFormData(mapStudyToForm(response.data.data));
    setUseAutoCode(false);
    setTouched({});
    setIsEditing(false);
    toast.success("Estudio actualizado con exito.");
    router.replace(`/estudios/detalle/${study.id}`);
    setSavingStudy(false);
    await refreshStudyBundle({ silent: true });
  };

  const handleToggleStatus = async () => {
    if (!study) return;

    setUpdatingStatus(true);
    const nextStatus = study.status === "active" ? "suspended" : "active";
    const response = await updateStudyStatus(study.id, nextStatus);
    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del estudio.",
      );
      setUpdatingStatus(false);
      return;
    }

    setStudy(response.data.data);
    setFormData(mapStudyToForm(response.data.data));
    setUseAutoCode(false);
    toast.success(
      nextStatus === "active" ? "Estudio reactivado." : "Estudio suspendido.",
    );
    setUpdatingStatus(false);
    await refreshStudyBundle({ silent: true });
  };

  const handleDeleteStudy = async () => {
    if (!study) return;

    const confirmed = await confirm({
      title: "Eliminar estudio",
      message: `Se eliminara "${study.name}" del catalogo. Esta accion ocultara el registro y dejara de estar disponible para operar.`,
      confirmLabel: "Eliminar estudio",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeletingStudy(true);
    const response = await removeStudy(study.id);
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo eliminar el estudio.");
      setDeletingStudy(false);
      return;
    }

    toast.success("Estudio eliminado del catalogo.");
    router.push("/estudios");
  };

  const handleCancelEdit = () => {
    if (study) {
      setFormData(mapStudyToForm(study));
    }
    setUseAutoCode(false);
    setTouched({});
    setIsEditing(false);
    router.replace(`/estudios/detalle/${studyId}`);
  };

  const handleCreateDetail = async (
    payloads: Parameters<typeof createStudyDetail>[1][],
  ) => {
    if (!study) return false;

    setSavingDetail(true);

    for (const payload of payloads) {
      const response = await createStudyDetail(study.id, payload);
      if (!response.ok) {
        toast.error(
          response.errors[0] ?? "No se pudo crear el lote del estudio.",
        );
        setSavingDetail(false);
        return false;
      }
    }

    toast.success(
      payloads.length === 1
        ? "Elemento agregado correctamente."
        : `${payloads.length} elementos agregados correctamente.`,
    );
    await refreshDetails(true);
    setSavingDetail(false);
    return true;
  };

  const handleSaveDetailEdition = async (
    detailId: number,
    payload: Parameters<typeof updateStudyDetail>[1],
  ) => {
    setUpdatingDetailId(detailId);
    const response = await updateStudyDetail(detailId, payload);
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el elemento.");
      setUpdatingDetailId(null);
      return false;
    }

    toast.success("Elemento actualizado con exito.");
    await refreshDetails(true);
    setUpdatingDetailId(null);
    return true;
  };

  const handleToggleDetailStatus = async (detail: StudyDetail) => {
    setUpdatingDetailStatusId(detail.id);
    const nextStatus = !(detail.isActive !== false);
    const response = await updateStudyDetailStatus(detail.id, nextStatus);
    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del elemento.",
      );
      setUpdatingDetailStatusId(null);
      return;
    }

    toast.success(nextStatus ? "Elemento reactivado." : "Elemento suspendido.");
    await refreshDetails(true);
    setUpdatingDetailStatusId(null);
  };

  const handleDeleteDetail = async (detail: StudyDetail) => {
    const confirmed = await confirm({
      title: "Eliminar elemento",
      message: `Se eliminara el elemento "${detail.name}" y dejara de formar parte de la configuracion del estudio.`,
      confirmLabel: "Eliminar elemento",
      tone: "warning",
    });
    if (!confirmed) return;

    setRemovingDetailId(detail.id);
    const response = await removeStudyDetail(detail.id);
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo eliminar el elemento.");
      setRemovingDetailId(null);
      return;
    }

    toast.success("Elemento eliminado del estudio.");
    await refreshDetails(true);
    setRemovingDetailId(null);
  };

  const buildDetailActions = (detail: StudyDetail) => {
    const isActive = detail.isActive !== false;

    return [
      {
        label: "Editar elemento",
        onClick: () => setEditingDetail(detail),
        hint: "Disponible",
        icon: <PencilLine size={16} />,
      },
      {
        label: isActive ? "Suspender elemento" : "Reactivar elemento",
        onClick: () => void handleToggleDetailStatus(detail),
        hint:
          updatingDetailStatusId === detail.id
            ? "Actualizando..."
            : "Disponible",
        icon: isActive ? <ShieldX size={16} /> : <BadgeCheck size={16} />,
      },
      {
        label: "Eliminar elemento",
        onClick: () => void handleDeleteDetail(detail),
        hint: removingDetailId === detail.id ? "Eliminando..." : "Disponible",
        destructive: true,
        icon: <Trash2 size={16} />,
      },
    ];
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <DetailPageSkeleton sections={3} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/estudios"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a estudios
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Detalle de {entityLabel}
          </h1>
          <p className="mt-2 text-gray-600">
            Consulta el catalogo, edita su configuracion y define la plantilla
            de parametros que despues se llenara en servicios.
          </p>
        </div>

        {study ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStudyStatusColor(study.status)}`}
            >
              {study.status === "active" ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <ShieldX className="h-4 w-4" />
              )}
              {getStudyStatusLabel(study.status)}
            </span>

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={savingStudy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveStudy()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={savingStudy}
                >
                  {savingStudy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    router.replace(
                      `/estudios/detalle/${studyId}?modo=editar#editar-estudio`,
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleStatus()}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    study.status === "active"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } disabled:opacity-50`}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : study.status === "active" ? (
                    <ShieldX className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {study.status === "active"
                    ? "Suspender estudio"
                    : "Reactivar estudio"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteStudy()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={deletingStudy}
                >
                  {deletingStudy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Eliminar
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {isRefreshing ? (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando cambios...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : study ? (
        <div className="space-y-6">
          <div
            id="resumen-estudio"
            className="section-anchor-target grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resumen del {entityLabel}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Vista rapida del registro y su configuracion comercial.
                  </p>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
                  study.type === "package" ? "xl:grid-cols-2" : ""
                }`}
              >
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nombre
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {study.name}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Clave
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {study.code}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Tipo
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {getStudyTypeLabel(study.type)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Duracion
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatStudyDuration(study.durationMinutes)}
                  </p>
                </div>
                {study.type !== "package" ? (
                  <>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Metodo
                      </p>
                      <p className="mt-2 text-base font-semibold text-gray-900">
                        {study.method ?? "Sin metodo"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Indicador
                      </p>
                      <p className="mt-2 text-base font-semibold text-gray-900">
                        {study.indicator ?? "Sin indicador"}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div
              className={`rounded-[2rem] border border-gray-200 p-6 text-white shadow-lg ${
                study.type === "package"
                  ? "bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 shadow-sky-600/20"
                  : "bg-gradient-to-br from-red-600 via-red-500 to-rose-500 shadow-red-600/20"
              }`}
            >
              <p
                className={`text-sm uppercase tracking-[0.2em] ${
                  study.type === "package" ? "text-sky-100" : "text-red-100"
                }`}
              >
                Ficha rapida
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{study.code}</h2>
              <p
                className={`mt-2 text-sm ${study.type === "package" ? "text-sky-50" : "text-red-50"}`}
              >
                {study.description || "Sin descripcion configurada."}
              </p>

              <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
                <div>
                  <p
                    className={`text-xs uppercase tracking-wide ${
                      study.type === "package" ? "text-sky-100" : "text-red-100"
                    }`}
                  >
                    Precio normal
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    ${Number(study.normalPrice).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs uppercase tracking-wide ${
                      study.type === "package" ? "text-sky-100" : "text-red-100"
                    }`}
                  >
                    Precio DIF
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    ${Number(study.difPrice).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs uppercase tracking-wide ${
                      study.type === "package" ? "text-sky-100" : "text-red-100"
                    }`}
                  >
                    Descuento sugerido
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {Number(study.defaultDiscountPercent).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div
              id="editar-estudio"
              className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Editar {entityLabel}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Actualiza los datos generales del registro. La plantilla se
                    administra aparte para que la captura sea mas comoda.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStudyTypeColor(study.type)}`}
                  >
                    {getStudyTypeLabel(study.type)}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStudyStatusColor(study.status)}`}
                  >
                    {getStudyStatusLabel(study.status)}
                  </span>
                </div>
              </div>

              <StudyFormFields
                formData={formData}
                errors={formErrors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
                onDurationChange={handleDurationChange}
                onDurationBlur={handleDurationBlur}
                onGenerateCode={handleGenerateCode}
                disabled={savingStudy}
              />
            </div>
          ) : null}

          {study.type === "package" ? (
            <div
              id="contenido-paquete"
              className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contenido del paquete
                  </h2>
                  <p className="text-sm text-gray-500">
                    Aqui eliges los estudios que forman parte del paquete.
                  </p>
                </div>
                <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  Estudios incluidos: {packageStudyIds.length}
                </div>
              </div>

              <div className="mb-5 rounded-[1.5rem] border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
                <p className="font-semibold">Como funciona un paquete</p>
                <p className="mt-2 text-blue-800">
                  Al usar un paquete en un servicio, se agregan automaticamente
                  los estudios que lo componen.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Agregar estudio al paquete
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Busca por nombre, clave o descripcion y agrega solo los
                        estudios activos que aun no esten incluidos.
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      Disponibles: {activePackageCandidateStudies.length}
                    </span>
                  </div>

                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={packageStudySearch}
                      onChange={(e) => setPackageStudySearch(e.target.value)}
                      placeholder="Buscar por nombre, clave, descripcion, metodo o indicador..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      disabled={savingPackageStudies}
                    />
                  </div>

                  <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                    {activePackageCandidateStudies.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                        No hay mas estudios activos disponibles para agregar.
                      </div>
                    ) : filteredPackageCandidateStudies.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                        No encontramos estudios con esa busqueda.
                      </div>
                    ) : (
                      filteredPackageCandidateStudies.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {candidate.name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {candidate.code} ·{" "}
                                {formatStudyDuration(candidate.durationMinutes)}
                              </p>
                              <p className="mt-2 text-xs text-gray-600">
                                {candidate.description || "Sin descripcion"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {candidate.method ? (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                                    Metodo: {candidate.method}
                                  </span>
                                ) : null}
                                {candidate.indicator ? (
                                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                                    Indicador: {candidate.indicator}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddPackageStudy(candidate.id)}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                              disabled={savingPackageStudies}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500">
                      Los cambios se guardan hasta confirmar el paquete.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSavePackageStudies()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                      disabled={savingPackageStudies}
                    >
                      {savingPackageStudies ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Guardar paquete
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Estudios seleccionados
                  </p>
                  {selectedPackageStudies.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      Este paquete aun no contiene estudios.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {selectedPackageStudies.map((packageStudy) => (
                        <div
                          key={packageStudy.id}
                          className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {packageStudy.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {packageStudy.code} ·{" "}
                              {formatStudyDuration(
                                packageStudy.durationMinutes,
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemovePackageStudy(packageStudy.id)
                            }
                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
                            disabled={savingPackageStudies}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                id="plantilla-estudio"
                className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Plantilla del estudio
                    </h2>
                    <p className="text-sm text-gray-500">
                      Agrega categorias y parametros para organizar mejor los
                      resultados del estudio.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <CatalogExcelModal
                      title="Importacion y exportacion de configuracion"
                      subtitle="Importa o exporta categorias y parametros del estudio desde una plantilla con vista previa."
                      trigger={
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Importacion/Exportacion
                        </button>
                      }
                    >
                      <CatalogExcelManager
                        title={`Configuracion de ${study.name}`}
                        description="Trabaja con categorias y parametros en lote. Usa el nombre de la categoria padre para relacionar subcategorias o parametros dentro del estudio."
                        entityLabel="elementos de configuracion"
                        columns={studyDetailExcelColumns}
                        createEmptyRow={createEmptyStudyDetailExcelRow}
                        validateRow={validateStudyDetailExcelRow}
                        rowsForExport={exportableDetailRows}
                        exportFileName={`plantilla-${study.code || study.id}.xlsx`}
                        exportSheetName="Configuracion estudio"
                        templateFileName={`template-config-${study.code || study.id}.xlsx`}
                        templateSheetName="Plantilla configuracion"
                        sortImportRows={sortDetailImportRows}
                        onImportStart={() => {
                          prepareDetailImportSession();
                        }}
                        onImportRow={importStudyDetailRow}
                        onImportFinished={async () => {
                          await refreshDetails(true);
                        }}
                        layout="flat"
                      />
                    </CatalogExcelModal>

                    <button
                      type="button"
                      onClick={() => setCreatingDetailType("category")}
                      className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100"
                    >
                      <Plus className="h-4 w-4" />
                      Nueva categoria
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingDetailType("parameter")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo parametro
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
                  <p className="font-semibold">Como funciona este flujo</p>
                  <p className="mt-2 text-blue-800">
                    Las categorias ayudan a ordenar la informacion y los
                    parametros son los datos que despues se capturan en
                    resultados.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Vista previa
                    </h2>
                    <p className="text-sm text-gray-500">
                      Asi se vera la estructura del estudio al momento de
                      capturar resultados.
                    </p>
                  </div>
                </div>

                {details.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                    Este estudio aun no tiene plantilla. Crea una categoria o un
                    parametro para empezar.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50/70 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Parametros del estudio
                      </p>
                      <div className="mt-4 space-y-4">
                        {groupedParameters.map(({ category, parameters }) => (
                          <div
                            key={category.id}
                            className="rounded-2xl border border-gray-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                                  {category.name}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Categoria | Orden {category.sortOrder}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                  {parameters.length} parametro
                                  {parameters.length === 1 ? "" : "s"}
                                </span>
                                <EntityActionsMenu
                                  buttonLabel="Gestionar"
                                  items={buildDetailActions(category)}
                                />
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {parameters.map((parameter) => (
                                <div
                                  key={parameter.id}
                                  className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 md:grid-cols-[1.2fr_0.7fr_0.85fr_auto]"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {parameter.name}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {getStudyDetailTypeLabel(parameter)} |
                                      Orden {parameter.sortOrder}
                                    </p>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {parameter.unit || "Sin unidad"}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {parameter.referenceValue ||
                                      "Sin referencia"}
                                  </div>
                                  <div className="flex justify-end">
                                    <EntityActionsMenu
                                      buttonLabel="Gestionar"
                                      items={buildDetailActions(parameter)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {standaloneParameters.length > 0 ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-amber-900">
                                Parametros sin categoria
                              </p>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700">
                                {standaloneParameters.length} independiente
                                {standaloneParameters.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="mt-3 space-y-2">
                              {standaloneParameters.map((parameter) => (
                                <div
                                  key={parameter.id}
                                  className="grid gap-3 rounded-xl border border-amber-100 bg-white px-3 py-3 md:grid-cols-[1.2fr_0.7fr_0.85fr_auto]"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {parameter.name}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {getStudyDetailTypeLabel(parameter)} |
                                      Orden {parameter.sortOrder}
                                    </p>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {parameter.unit || "Sin unidad"}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {parameter.referenceValue ||
                                      "Sin referencia"}
                                  </div>
                                  <div className="flex justify-end">
                                    <EntityActionsMenu
                                      buttonLabel="Gestionar"
                                      items={buildDetailActions(parameter)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5">
                        <p className="text-sm font-semibold text-gray-900">
                          Resumen de plantilla
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Parametros
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              {activeParameters.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Categorias
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              {activeCategories.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Sin categoria
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              {standaloneParameters.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {emptyCategories.length > 0 ? (
                        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                          <p className="font-semibold">
                            Categorias aun sin parametros
                          </p>
                          <div className="mt-3 space-y-2">
                            {emptyCategories.map((category) => (
                              <div
                                key={category.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-3 py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {category.name}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Categoria | Orden {category.sortOrder}
                                  </p>
                                </div>
                                <EntityActionsMenu
                                  buttonLabel="Gestionar"
                                  items={buildDetailActions(category)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5">
                        <p className="text-sm font-semibold text-gray-900">
                          Notas utiles
                        </p>
                        <ul className="mt-4 space-y-3 text-sm text-gray-600">
                          <li>
                            Las categorias ayudan a separar mejor los grupos de
                            resultados.
                          </li>
                          <li>
                            Los parametros activos quedan disponibles cuando el
                            estudio se usa en un servicio.
                          </li>
                          <li>
                            Puedes editar o desactivar cada elemento desde su
                            tarjeta.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {editingDetail ? (
        <EditStudyDetailModal
          detail={editingDetail}
          categories={activeCategories}
          saving={updatingDetailId === editingDetail.id}
          onClose={() => setEditingDetail(null)}
          onSave={(payload) =>
            handleSaveDetailEdition(editingDetail.id, payload)
          }
        />
      ) : null}

      {creatingDetailType ? (
        <AddStudyDetailModal
          mode={creatingDetailType}
          categories={activeCategories}
          saving={savingDetail}
          defaultSortOrder={details.length + 1}
          onClose={() => setCreatingDetailType(null)}
          onSave={handleCreateDetail}
        />
      ) : null}
    </div>
  );
}
