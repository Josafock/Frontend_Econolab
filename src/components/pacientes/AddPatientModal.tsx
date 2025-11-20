'use client';

import { useState } from 'react';
import { X, User, Calendar, Phone, Mail, MapPin, UserPlus } from 'lucide-react';

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

// Define la estructura de datos que el modal enviará al padre
type PatientFormData = Omit<Paciente, 'id' | 'fechaRegistro' | 'colonia'> & {
  edad: string; // La edad se usa para calcular la fechaNacimiento
  apellidoPaterno: string;
  apellidoMaterno: string;
};

// Define la interfaz de las props del modal
interface AddPatientModalProps {
  setOpen: (open: boolean) => void;
  // La función addPatient recibe los datos sin ID ni fecha de registro
  addPatient: (newPatient: Omit<Paciente, 'id' | 'fechaRegistro'>) => void;
}


// Función utilitaria para estimar la fecha de nacimiento a partir de la edad
const calculateDOBFromAge = (age: number): string => {
  const today = new Date();
  const year = today.getFullYear() - age;
  // Retorna la fecha de hoy del año correspondiente, en formato YYYY-MM-DD
  return `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function AddPatientModal( { setOpen, addPatient }: AddPatientModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '', // Nuevo campo
    apellidoMaterno: '', // Nuevo campo
    edad: '', // Usaremos este campo para calcular la fechaNacimiento
    genero: '',
    telefono: '',
    email: '',
    colonia: '', // Nuevo campo
    ciudad: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validación (puedes hacerla más detallada)
    const requiredFields = ['nombre', 'edad', 'genero', 'telefono', 'ciudad'];
    const isFormValid = requiredFields.every(field => formData[field as keyof typeof formData]);

    if (!isFormValid || isNaN(parseInt(formData.edad)) || parseInt(formData.edad) < 0) {
      alert('Por favor, completa todos los campos válidos para registrar al paciente.');
      return;
    }

    const age = parseInt(formData.edad);
    const fechaNacimiento = calculateDOBFromAge(age);

    // 2. Preparar el objeto del nuevo paciente
    const newPatient: Omit<Paciente, 'id' | 'fechaRegistro'> = {
      nombre: formData.nombre.toUpperCase(),
      apellidoPaterno: formData.apellidoPaterno.toUpperCase(),
      apellidoMaterno: formData.apellidoMaterno.toUpperCase(),
      fechaNacimiento: fechaNacimiento,
      genero: formData.genero.charAt(0).toUpperCase() + formData.genero.slice(1) as Paciente['genero'],
      telefono: formData.telefono,
      email: formData.email,
      colonia: formData.colonia,
      ciudad: formData.ciudad
    };

    // 3. Llamar a la función del componente padre
    addPatient(newPatient);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50">
              <UserPlus className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
              <p className="text-sm text-gray-500">Registrar nuevo paciente en el sistema</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="María González López"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>

            {/* Edad */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Edad
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  placeholder="30"
                  min="0"
                  max="120"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>

            {/* Género */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Género
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 appearance-none"
                >
                  <option value="">Seleccionar género...</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                  <option value="prefiero-no-decir">Prefiero no decir</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teléfono */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+52 123 456 7890"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="paciente@ejemplo.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ciudad */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  placeholder="Pachuca"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>
            {/* Colonia */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Colonia
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  placeholder="Centro"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold border border-red-500 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Registrar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}