import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

export type AdminManagedUserRole = "admin" | "recepcionista" | "unassigned";
export type AdminAssignableRole = Exclude<AdminManagedUserRole, "unassigned">;

export type AdminManagedUser = {
  id: string;
  nombre: string;
  email: string;
  rol: AdminManagedUserRole;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

type UpdateUserRoleResponse = {
  message: string;
  usuario: AdminManagedUser;
};

async function createAdminUsersRequestContext() {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (!token) {
    return null;
  }

  return {
    baseUrl: runtime.apiBaseUrl,
    token,
  };
}

export async function getUnassignedUsers(): Promise<ApiResult<AdminManagedUser[]>> {
  const context = await createAdminUsersRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<AdminManagedUser[]>(context, "/admin/users/unassigned");
}

export async function getUsersWithRole(): Promise<ApiResult<AdminManagedUser[]>> {
  const context = await createAdminUsersRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<AdminManagedUser[]>(context, "/admin/users/with-role");
}

export async function updateUserRole(
  userId: string,
  rol: AdminAssignableRole,
): Promise<ApiResult<UpdateUserRoleResponse>> {
  const context = await createAdminUsersRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<UpdateUserRoleResponse>(
    context,
    `/admin/users/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ rol }),
    },
  );
}
