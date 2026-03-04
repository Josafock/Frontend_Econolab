import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import { Sidebar } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/ui/BreadCrumbs";
import ToastNotification from "@/components/ui/ToastNotification";

export const metadata: Metadata = {
  title: "Administracion BD - Econolab",
};

export default async function DatabaseAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await verifySession();

  if (user.rol !== "admin") {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] min-h-screen">
        <Sidebar {...user} />
        <main className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <ToastNotification />
    </div>
  );
}
