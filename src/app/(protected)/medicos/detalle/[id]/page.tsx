import DoctorDetailClient from "@/components/medicos/DoctorDetailClient";

type DoctorDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ modo?: string }>;
};

export default async function DoctorDetailPage({
  params,
  searchParams,
}: DoctorDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const doctorId = Number(resolvedParams.id);

  return (
    <DoctorDetailClient
      doctorId={doctorId}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
