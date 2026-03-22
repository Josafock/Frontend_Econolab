import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import type { User } from "@/schemas";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: User["rol"][];
};

export default async function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user } = await verifySession();

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    redirect("/home");
  }

  return <>{children}</>;
}
