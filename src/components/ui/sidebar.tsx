'use client';

import {
  ChevronRight,
  ClipboardList,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/actions/auth/logoutAction';
import { User as UserType } from '@/schemas';

type MenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
};

export function Sidebar(user: UserType) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const rol =
    user.rol === 'admin'
      ? 'Administrador'
      : user.rol === 'recepcionista'
        ? 'Recepcionista'
        : 'Sin rol';

  const menuItems: MenuItem[] = [
    { name: 'Inicio', icon: LayoutDashboard, path: '/home' },
    { name: 'Servicios', icon: ClipboardList, path: '/servicios' },
    { name: 'Mi perfil', icon: UserRound, path: '/perfil' },
    { name: 'Estudios', icon: FlaskConical, path: '/estudios' },
    { name: 'Pacientes', icon: Users, path: '/pacientes' },
    { name: 'Medicos', icon: Stethoscope, path: '/medicos' },
  ];
  const visibleMenuItems =
    user.rol === 'admin'
      ? [
          menuItems[0],
          menuItems[1],
          { name: 'Historial', icon: History, path: '/historial' },
          ...menuItems.slice(2),
        ]
      : menuItems;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen((current) => !current);

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    void logout();
  };

  const isItemActive = (path: string) => {
    if (path === '/home') {
      return pathname === '/home' || pathname === '/';
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-[70] cursor-pointer rounded-2xl border border-red-200 bg-white p-3 text-red-600 shadow-lg shadow-red-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-xl hover:shadow-red-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 md:hidden"
        aria-label={isOpen ? 'Cerrar menu lateral' : 'Abrir menu lateral'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && isMobile ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
          onClick={toggleSidebar}
        />
      ) : null}

      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-50 w-[17rem] transform border-r border-red-100 bg-white/95 shadow-2xl shadow-red-200/30 backdrop-blur transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-xl md:shadow-slate-200/40`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-red-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
                <Stethoscope size={26} className="text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-red-600">ECONO</span>LAB
                </h1>
                <p className="text-xs text-gray-500">Sistema de laboratorios</p>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="scroll-panel flex-1 space-y-2 overflow-y-auto px-4 py-6">
              {visibleMenuItems.map((item) => {
                const isActive = isItemActive(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    onMouseEnter={() => {
                      void router.prefetch(item.path);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'border-red-200 bg-gradient-to-r from-red-50 via-white to-white text-red-700 shadow-sm shadow-red-100/80'
                        : 'border-transparent text-gray-600 hover:-translate-y-0.5 hover:border-red-100 hover:bg-white hover:text-gray-900 hover:shadow-lg hover:shadow-red-100/70'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-3 left-2 w-1 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-red-500 opacity-100'
                          : 'bg-red-300 opacity-0 group-hover:opacity-100'
                      }`}
                    />

                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-200 ${
                        isActive
                          ? 'from-red-100/70 via-transparent to-transparent opacity-100'
                          : 'from-red-50/80 via-transparent to-transparent opacity-0 group-hover:opacity-100'
                      }`}
                    />

                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-red-600 shadow-sm shadow-red-100'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-red-50 group-hover:text-red-600 group-hover:shadow-sm group-hover:shadow-red-100'
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="relative z-10 truncate transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.name}
                    </span>

                    <span className="relative z-10 ml-auto flex items-center gap-2">
                      {!isActive ? (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500 opacity-0 transition-all duration-200 group-hover:opacity-100">
                          Ir
                        </span>
                      ) : null}

                      <ChevronRight
                        size={16}
                        className={`transition-all duration-200 ${
                          isActive
                            ? 'translate-x-0 text-red-600'
                            : 'translate-x-2 text-red-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                        }`}
                      />

                      {isActive ? (
                        <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(254,202,202,0.75)]" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-red-100 bg-white px-4 pb-4 pt-4">
              <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
                    <UserRound size={18} className="text-red-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.nombre}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                  {rol}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
