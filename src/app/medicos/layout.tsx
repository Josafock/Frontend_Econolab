import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Medicos - Econolab",
};

export default function MedicosLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
