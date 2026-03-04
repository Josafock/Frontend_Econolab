'use client';

import { 
  Home, 
  History, 
  User, 
  BookOpen, 
  Users, 
  Stethoscope,
  LogOut,
  Menu,
  X,
  Monitor,
  Database
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User as UserType } from '@/schemas';
import { logout } from '@/actions/auth/logoutAction';
import { toast } from 'react-toastify';

export function Sidebar(user: UserType) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const rol = user.rol === 'admin' ? "Administrador" : "Recepcionista";

  const menuItems = [
    { name: 'Tablero', icon: <Home size={20} />, path: '/home' },
    { name: 'Servicios', icon: <Monitor size={20} />, path: '/servicios' },
    { name: 'Historial', icon: <History size={20} />, path: '/historial' },
    { name: 'Mi perfil', icon: <User size={20} />, path: '/perfil' },
    { name: 'Estudios', icon: <BookOpen size={20} />, path: '/estudios' },
    { name: 'Pacientes', icon: <Users size={20} />, path: '/pacientes' },
    { name: 'Medicos', icon: <Stethoscope size={20} />, path: '/medicos' },
    ...(user.rol === 'admin'
      ? [{ name: 'Admin BD', icon: <Database size={20} />, path: '/admin/database' }]
      : []),
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(o => !o);

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-red-600 text-white p-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transform transition-transform duration-300 ease-in-out
          w-64 min-h-screen fixed md:relative z-40 border-r border-red-200 bg-white shadow-xl`}
      >
        {/* Logo */}
        <div className="p-6 text-center border-b border-red-100">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={28} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900"><span className='text-red-600'>ECONO</span>LAB</h1>
              <p className="text-xs text-gray-500">Sistema de Laboratorios</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  isActive
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`${isActive ? 'text-red-600' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-red-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-red-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500">{rol}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full
              text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
