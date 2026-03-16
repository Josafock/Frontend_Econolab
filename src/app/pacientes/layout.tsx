import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Pacientes - Econolab",
};

export default function PacientesLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
