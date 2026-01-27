import { Sidebar } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { verifySession } from "@/auth/dal";
import Breadcrumbs from "@/components/ui/BreadCrumbs";

export const metadata: Metadata = {
  title: "Medicos - Econolab",
};

export default async function MedicosLayout({ children }: { children: React.ReactNode }) {
    const { user } = await verifySession();

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] min-h-screen">
                <Sidebar {...user}/>
                <main className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    );
}
