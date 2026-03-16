import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Mi Perfil - Econolab",
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
