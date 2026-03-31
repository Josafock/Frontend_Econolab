"use client";

import { useSearchParams } from "next/navigation";
import StudyDetailClient from "@/components/estudios/StudyDetailClient";

export default function StudyDetailQueryPage() {
  const searchParams = useSearchParams();
  const studyId = Number(searchParams.get("id") ?? "");

  return (
    <StudyDetailClient
      studyId={studyId}
      initialIsEditing={searchParams.get("modo") === "editar"}
    />
  );
}
