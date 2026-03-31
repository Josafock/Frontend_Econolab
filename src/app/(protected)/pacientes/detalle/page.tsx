"use client";

import { useSearchParams } from "next/navigation";
import PatientDetailClient from "@/components/pacientes/PatientDetailClient";

export default function PatientDetailQueryPage() {
  const searchParams = useSearchParams();
  const patientId = Number(searchParams.get("id") ?? "");

  return (
    <PatientDetailClient
      patientId={patientId}
      initialIsEditing={searchParams.get("modo") === "editar"}
    />
  );
}
