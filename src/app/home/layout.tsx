import { Metadata } from "next";
import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export const metadata: Metadata = {
  title: "Inicio - Econolab",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
