import StudyDetailClient from "@/components/estudios/StudyDetailClient";
import { getStudyDetail } from "../../dal";

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
  const { study, details, availableStudies, error } =
    await getStudyDetail(studyId);

  return (
    <StudyDetailClient
      studyId={studyId}
      initialStudy={study}
      initialDetails={details}
      initialAvailableStudies={availableStudies}
      initialError={error}
      initialIsEditing={resolvedSearchParams?.modo === "editar"}
    />
  );
}
