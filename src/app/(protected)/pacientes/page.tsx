import PatientsPageClient from "@/components/pacientes/PatientsPageClient";
import { getPatientsCatalog } from "./dal";

export default async function PacientesPage() {
  const { patients, error } = await getPatientsCatalog();

  return <PatientsPageClient initialPatients={patients} initialError={error} />;
}
