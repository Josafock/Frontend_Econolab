import { Metadata } from "next";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

export const metadata: Metadata = {
  title: "Cortes - Econolab",
};

export default function CortesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}
