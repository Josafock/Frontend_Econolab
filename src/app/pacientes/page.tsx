'use client';

import AddPatientModal from '@/components/pacientes/AddPatientModal';
import { Search, Plus, Filter, Edit, Trash2, Eye, Phone, Mail, MapPin, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

export interface Paciente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: 'Femenino' | 'Masculino' | 'Otro' | 'Prefiero no decir';
  telefono: string;
  email: string;
  colonia: string; // Faltaba en el modal, lo agregaremos allí
  ciudad: string;
  fechaRegistro: string;
}

// Datos de ejemplo iniciales (Ahora son el estado inicial)
const initialPacientes: Paciente[] = [
  { id: 1, nombre: 'MARIA', apellidoPaterno: 'HERNANDEZ', apellidoMaterno: 'HERNANDEZ', fechaNacimiento: '1985-03-15', genero: 'Femenino', telefono: '7712345678', email: 'maria.hernandez@email.com', colonia: 'Centro', ciudad: 'Pachuca', fechaRegistro: '2023-01-15' },
  { id: 2, nombre: 'JUAN CARLOS', apellidoPaterno: 'GARCIA', apellidoMaterno: 'LOPEZ', fechaNacimiento: '1990-07-22', genero: 'Masculino', telefono: '7719876543', email: 'juan.garcia@email.com', colonia: 'San Javier', ciudad: 'Pachuca', fechaRegistro: '2023-02-10' },
  { id: 3, nombre: 'ANA KAREN', apellidoPaterno: 'MARTINEZ', apellidoMaterno: 'RODRIGUEZ', fechaNacimiento: '1988-11-30', genero: 'Femenino', telefono: '7715551234', email: 'ana.martinez@email.com', colonia: 'Platina', ciudad: 'Pachuca', fechaRegistro: '2023-03-05' },
  { id: 4, nombre: 'PEDRO', apellidoPaterno: 'RAMIREZ', apellidoMaterno: 'SANCHEZ', fechaNacimiento: '1975-12-10', genero: 'Masculino', telefono: '7714447890', email: 'pedro.ramirez@email.com', colonia: 'Venta Prieta', ciudad: 'Pachuca', fechaRegistro: '2023-01-28' },
  { id: 5, nombre: 'SOFIA', apellidoPaterno: 'DIAZ', apellidoMaterno: 'CASTILLO', fechaNacimiento: '1995-05-18', genero: 'Femenino', telefono: '7713334567', email: 'sofia.diaz@email.com', colonia: 'Camelia', ciudad: 'Pachuca', fechaRegistro: '2023-04-12' },
  { id: 6, nombre: 'LUIS MIGUEL', apellidoPaterno: 'TORRES', apellidoMaterno: 'FLORES', fechaNacimiento: '1982-09-03', genero: 'Masculino', telefono: '7712223456', email: 'luis.torres@email.com', colonia: 'San Cayetano', ciudad: 'Pachuca', fechaRegistro: '2023-02-22' },
  { id: 7, nombre: 'CAROLINA', apellidoPaterno: 'VARGAS', apellidoMaterno: 'MORALES', fechaNacimiento: '1992-02-14', genero: 'Femenino', telefono: '7716667891', email: 'carolina.vargas@email.com', colonia: 'Palmillas', ciudad: 'Pachuca', fechaRegistro: '2023-03-18' },
  { id: 8, nombre: 'ROBERTO', apellidoPaterno: 'CASTRO', apellidoMaterno: 'MENDOZA', fechaNacimiento: '1980-06-25', genero: 'Masculino', telefono: '7717772345', email: 'roberto.castro@email.com', colonia: 'Santa Julia', ciudad: 'Pachuca', fechaRegistro: '2023-01-08' }
];

// Define el tipo de dato que el modal enviará (omitimos 'id' y 'fechaRegistro' que se generan aquí)
type NewPatientData = Omit<Paciente, 'id' | 'fechaRegistro'>;

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>(initialPacientes);

  const addPatient = (newPatient: NewPatientData) => {
    // Lógica para generar ID y fecha de registro
    const newId = Math.max(...pacientes.map(p => p.id)) + 1; // Genera el siguiente ID
    const now = new Date().toISOString().substring(0, 10); // Formato YYYY-MM-DD
    
    const fullNewPatient: Paciente = {
      ...newPatient,
      id: newId,
      fechaRegistro: now,
      // Asegurar que el género esté capitalizado si se almacena así
      genero: newPatient.genero.charAt(0).toUpperCase() + newPatient.genero.slice(1) as Paciente['genero'],
    };
    
    // Agrega el nuevo paciente al array (al inicio para que sea visible)
    setPacientes(prevPacientes => [fullNewPatient, ...prevPacientes]);
    setOpenAddModal(false); // Cierra el modal al agregar
    
    toast.success(`Paciente ${newPatient.nombre} ${newPatient.apellidoPaterno} registrado con éxito.`);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const getGeneroColor = (genero: 'Femenino' | 'Masculino'): string => {
    const colors: Record<string, string> = {
      'Femenino': 'bg-pink-100 text-pink-800',
      'Masculino': 'bg-blue-100 text-blue-800'
    };
    return colors[genero] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pacientes</h1>
          <p className="text-gray-600">Gestión de información de pacientes</p>
        </div>
        
        <button className="flex rounded-lg bg-white px-4 py-3 text-sm font-medium border border-red-500 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={() => setOpenAddModal(true)}
        >
          <Plus size={20} />
          Nuevo Paciente
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o colonia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex gap-3">
            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <option value="">Todos los géneros</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
            
            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <option value="">Todas las colonias</option>
              <option value="Centro">Centro</option>
              <option value="San Javier">San Javier</option>
              <option value="Platina">Platina</option>
              <option value="Venta Prieta">Venta Prieta</option>
              <option value="Camelia">Camelia</option>
            </select>
            
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Más Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{pacientes.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mujeres</p>
              <p className="text-2xl font-bold text-gray-900">
                {pacientes.filter(p => p.genero === 'Femenino').length}
              </p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <User size={20} className="text-pink-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hombres</p>
              <p className="text-2xl font-bold text-gray-900">
                {pacientes.filter(p => p.genero === 'Masculino').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Edad Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(pacientes.reduce((acc, p) => acc + calcularEdad(p.fechaNacimiento), 0) / pacientes.length)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <User size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pacientes - Versión Desktop */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header de la tabla */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          <div className="col-span-3">Nombre Completo</div>
          <div className="col-span-1">Edad</div>
          <div className="col-span-1">Género</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2">Ubicación</div>
          <div className="col-span-2">Fecha Registro</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Lista de pacientes */}
        <div className="divide-y divide-gray-200">
          {pacientes.map((paciente) => (
            <div key={paciente.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              {/* Nombre Completo */}
              <div className="col-span-3">
                <h3 className="font-medium text-gray-900 text-sm">
                  {paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno}
                </h3>
                <p className="text-xs text-gray-500">
                  Nac: {new Date(paciente.fechaNacimiento).toLocaleDateString()}
                </p>
              </div>

              {/* Edad */}
              <div className="col-span-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {calcularEdad(paciente.fechaNacimiento)} años
                </span>
              </div>

              {/* Género */}
              <div className="col-span-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGeneroColor(paciente.genero as 'Femenino' | 'Masculino')}`}>
                  {paciente.genero}
                </span>
              </div>

              {/* Contacto */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900">{paciente.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900 truncate">{paciente.email}</span>
                </div>
              </div>

              {/* Ubicación */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900">{paciente.colonia}</span>
                </div>
                <p className="text-xs text-gray-500 ml-6">{paciente.ciudad}</p>
              </div>

              {/* Fecha Registro */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900">
                  {new Date(paciente.fechaRegistro).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(paciente.fechaRegistro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                </p>
              </div>

              {/* Acciones */}
              <div className="col-span-1">
                <div className="flex items-center justify-end space-x-1">
                  <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Ver expediente">
                    <Eye size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Editar">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer de la tabla */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{pacientes.length}</span> pacientes
            </p>
            
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                Anterior
              </button>
              <span className="px-3 py-1 bg-red-600 text-white rounded text-sm">1</span>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Versión Móvil */}
      <div className="lg:hidden space-y-4">
        {pacientes.map((paciente) => (
          <div key={paciente.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* Header con Nombre y Género */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">
                  {paciente.nombre} {paciente.apellidoPaterno}
                </h3>
                <p className="text-xs text-gray-500">{paciente.apellidoMaterno}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGeneroColor(paciente.genero as 'Femenino' | 'Masculino')}`}>
                {paciente.genero}
              </span>
            </div>

            {/* Información personal */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-gray-500 text-xs">Edad</p>
                <p className="text-gray-900 font-medium">{calcularEdad(paciente.fechaNacimiento)} años</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Nacimiento</p>
                <p className="text-gray-900 text-xs">{new Date(paciente.fechaNacimiento).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contacto */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900">{paciente.telefono}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900 truncate">{paciente.email}</span>
              </div>
            </div>

            {/* Ubicación */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900">{paciente.colonia}, {paciente.ciudad}</span>
              </div>
            </div>

            {/* Fecha de registro */}
            <div className="text-xs text-gray-500 mb-3">
              Registrado: {new Date(paciente.fechaRegistro).toLocaleDateString()}
            </div>

            {/* Acciones */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">ID: {paciente.id}</span>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Eye size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                  <Edit size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Agregar Patient Modal */}
      {openAddModal && <AddPatientModal setOpen={setOpenAddModal} addPatient={addPatient} />}
    </div>
  );
}