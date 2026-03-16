"use server";

import { fetchApi } from "@/actions/_lib/api";

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

export async function getUnassignedUsersAction() {
  return fetchApi<AdminManagedUser[]>("/admin/users/unassigned");
}

export async function getUsersWithRoleAction() {
  return fetchApi<AdminManagedUser[]>("/admin/users/with-role");
}

export async function updateUserRoleAction(
  userId: string,
  rol: AdminAssignableRole,
) {
  return fetchApi<UpdateUserRoleResponse>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ rol }),
  });
}
