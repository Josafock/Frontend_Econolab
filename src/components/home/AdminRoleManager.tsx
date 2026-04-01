'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-toastify';
import {
  getUnassignedUsers,
  getUsersWithRole,
  updateUserRole,
  type AdminAssignableRole,
  type AdminManagedUser,
} from '@/features/admin-users/api/admin-users';
import { formatDate } from '@/helpers/date';
import { Loader2, RefreshCw, ShieldAlert, ShieldCheck, UserCog, Users } from 'lucide-react';

type AdminRoleManagerProps = {
  currentUserId: string;
  initialUnassignedUsers: AdminManagedUser[];
  initialUsersWithRole: AdminManagedUser[];
  initialError?: string | null;
};

function sortUsers(users: AdminManagedUser[]) {
  return [...users].sort((left, right) => {
    if (left.rol !== right.rol) {
      if (left.rol === 'admin') return -1;
      if (right.rol === 'admin') return 1;
    }

    return left.nombre.localeCompare(right.nombre, 'es-MX');
  });
}

function countByRole(users: AdminManagedUser[], role: AdminManagedUser['rol']) {
  return users.filter((user) => user.rol === role).length;
}

export default function AdminRoleManager({
  currentUserId,
  initialUnassignedUsers,
  initialUsersWithRole,
  initialError,
}: AdminRoleManagerProps) {
  const [pendingUsers, setPendingUsers] = useState(initialUnassignedUsers);
  const [usersWithRole, setUsersWithRole] = useState(sortUsers(initialUsersWithRole));
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [refreshing, startRefreshTransition] = useTransition();
  const [saving, startSavingTransition] = useTransition();

  const refreshUsers = () => {
    startRefreshTransition(async () => {
      const [pendingResponse, withRoleResponse] = await Promise.all([
        getUnassignedUsers(),
        getUsersWithRole(),
      ]);

      if (!pendingResponse.ok) {
        toast.error(pendingResponse.errors[0] ?? 'No se pudieron cargar los usuarios pendientes.');
        return;
      }

      if (!withRoleResponse.ok) {
        toast.error(withRoleResponse.errors[0] ?? 'No se pudieron cargar los usuarios con rol.');
        return;
      }

      setPendingUsers(pendingResponse.data);
      setUsersWithRole(sortUsers(withRoleResponse.data));
      toast.success('Panel de roles actualizado.');
    });
  };

  const assignRole = (userId: string, rol: AdminAssignableRole) => {
    setLoadingUserId(userId);

    startSavingTransition(async () => {
      const response = await updateUserRole(userId, rol);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el rol.');
        setLoadingUserId(null);
        return;
      }

      const updatedUser = response.data.usuario;

      setPendingUsers((current) => current.filter((user) => user.id !== userId));
      setUsersWithRole((current) =>
        sortUsers([updatedUser, ...current.filter((user) => user.id !== userId)]),
      );
      setLoadingUserId(null);

      toast.success(
        rol === 'admin'
          ? 'Usuario promovido a admin.'
          : 'Usuario asignado como recepcionista.',
      );
    });
  };

  const adminCount = countByRole(usersWithRole, 'admin');
  const receptionistCount = countByRole(usersWithRole, 'recepcionista');

  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Acceso pendiente</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Asignación de roles
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Los usuarios confirmados no entran al sistema hasta que aquí se les asigne
              un rol operativo.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshUsers}
            disabled={refreshing || saving}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualizar
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingUsers.length}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admins</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{adminCount}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recepción</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{receptionistCount}</p>
          </div>
        </div>

        {initialError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {initialError}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {pendingUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-white/80 p-5 text-sm text-slate-600">
              No hay usuarios pendientes por activar en este momento.
            </div>
          ) : (
            pendingUsers.map((user) => {
              const isWorking = loadingUserId === user.id;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-amber-200 bg-white/90 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.nombre}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Confirmado. Alta: {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => assignRole(user.id, 'recepcionista')}
                        disabled={isWorking || saving || refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
                      >
                        {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                        Recepcionista
                      </button>
                      <button
                        type="button"
                        onClick={() => assignRole(user.id, 'admin')}
                        disabled={isWorking || saving || refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                      >
                        {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Admin
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Usuarios activos</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Roles ya asignados
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Los usuarios admin quedan protegidos aquí: no se pueden cambiar entre admins.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-3 text-gray-700">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {usersWithRole.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
              Aún no hay usuarios con rol asignado.
            </div>
          ) : (
            usersWithRole.map((user) => {
              const isWorking = loadingUserId === user.id;
              const isAdmin = user.rol === 'admin';
              const isCurrentUser = user.id === currentUserId;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{user.nombre}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAdmin
                              ? 'bg-slate-900 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'Recepcionista'}
                        </span>
                        {isCurrentUser ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Tu cuenta
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        Alta: {formatDate(user.createdAt)}
                      </p>
                    </div>

                    {isAdmin ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        <ShieldAlert className="h-4 w-4" />
                        Protegido entre admins
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => assignRole(user.id, 'recepcionista')}
                          disabled={isWorking || saving || refreshing}
                          className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
                        >
                          {isWorking && user.rol !== 'admin' ? 'Guardando...' : 'Mantener recepción'}
                        </button>
                        <button
                          type="button"
                          onClick={() => assignRole(user.id, 'admin')}
                          disabled={isWorking || saving || refreshing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                        >
                          {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Promover a admin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
