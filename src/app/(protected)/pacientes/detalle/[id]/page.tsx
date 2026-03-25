import PatientDetailClient from "@/components/pacientes/PatientDetailClient";
import { getPatientDetail } from "../../dal";

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ modo?: string }>;
};

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const patientId = Number(resolvedParams.id);
  const { patient, error } = await getPatientDetail(patientId);

  return (
    <PatientDetailClient
      patientId={patientId}
      initialPatient={patient}
      initialError={error}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
