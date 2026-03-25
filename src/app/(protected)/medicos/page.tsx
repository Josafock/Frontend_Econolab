import DoctorsPageClient from "@/components/medicos/DoctorsPageClient";
import { getDoctorsCatalog } from "./dal";

export default async function MedicosPage() {
  const { doctors, error } = await getDoctorsCatalog();

  return <DoctorsPageClient initialDoctors={doctors} initialError={error} />;
}
