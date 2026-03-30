import StudyDetailClient from "@/components/estudios/StudyDetailClient";

type StudyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ modo?: string }>;
};

export default async function StudyDetailPage({
  params,
  searchParams,
}: StudyDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const studyId = Number(resolvedParams.id);

  return (
    <StudyDetailClient
      studyId={studyId}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
