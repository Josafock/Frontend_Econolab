import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import Breadcrumbs from "@/components/ui/BreadCrumbs";
import { Sidebar } from "@/components/ui/sidebar";
import ToastNotification from "@/components/ui/ToastNotification";
import type { User } from "@/schemas";

type ProtectedAppLayoutProps = {
  children: React.ReactNode;
  allowedRoles?: User["rol"][];
};

export default async function ProtectedAppLayout({
  children,
  allowedRoles,
}: ProtectedAppLayoutProps) {
  const { user } = await verifySession();

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-[1920px] md:items-start">
        <Sidebar {...user} />

        <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:px-6 sm:pb-8 md:px-8 md:pt-8 xl:px-10">
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1440px] flex-col">
            <div className="mb-6 rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-slate-200/60 backdrop-blur sm:px-6">
              <Breadcrumbs />
            </div>

            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      </div>

      <ToastNotification />
    </div>
  );
}
