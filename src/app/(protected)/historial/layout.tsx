import { Metadata } from "next";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

export const metadata: Metadata = {
  title: "Historial - Econolab",
};

export default function HistorialLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}
