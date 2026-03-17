import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Historial - Econolab",
};

export default function HistorialLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout allowedRoles={["admin"]}>{children}</ProtectedAppLayout>;
}
