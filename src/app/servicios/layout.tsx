import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Servicios - Econolab",
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
