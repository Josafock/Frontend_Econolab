import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";
export const metadata: Metadata = {
  title: "Estudios - Econolab",
};

export default function EstudiosLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
