import StudiesPageClient from "@/components/estudios/StudiesPageClient";
import { getStudiesCatalog } from "./dal";

export default async function EstudiosPage() {
  const { studies, error } = await getStudiesCatalog();

  return <StudiesPageClient initialStudies={studies} initialError={error} />;
}
