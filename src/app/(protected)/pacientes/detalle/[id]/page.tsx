import PatientDetailClient from "@/components/pacientes/PatientDetailClient";

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

  return (
    <PatientDetailClient
      patientId={patientId}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
