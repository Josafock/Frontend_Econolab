import DoctorDetailClient from "@/components/medicos/DoctorDetailClient";
import { getDoctorDetail } from "../../dal";

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
  const { doctor, error } = await getDoctorDetail(doctorId);

  return (
    <DoctorDetailClient
      doctorId={doctorId}
      initialDoctor={doctor}
      initialError={error}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
