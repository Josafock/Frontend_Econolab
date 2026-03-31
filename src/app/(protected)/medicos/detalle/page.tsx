"use client";

import { useSearchParams } from "next/navigation";
import DoctorDetailClient from "@/components/medicos/DoctorDetailClient";

export default function DoctorDetailQueryPage() {
  const searchParams = useSearchParams();
  const doctorId = Number(searchParams.get("id") ?? "");

  return (
    <DoctorDetailClient
      doctorId={doctorId}
      initialIsEditing={searchParams.get("modo") === "editar"}
    />
  );
}
