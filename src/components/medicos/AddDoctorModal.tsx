'use client';

import { useState } from 'react';
import { X, UserPlus, User, Mail, Phone, BadgeCheck, Stethoscope } from 'lucide-react';
import type { CreateDoctorPayload } from '@/actions/doctors/doctorsActions';
import { toast } from 'react-toastify';
import AppModal from '@/components/ui/AppModal';

interface AddDoctorModalProps {
  setOpen: (open: boolean) => void;
  addDoctor: (payload: CreateDoctorPayload) => Promise<void>;
  isSaving: boolean;
}

export default function AddDoctorModal({ setOpen, addDoctor, isSaving }: AddDoctorModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    specialty: '',
    licenseNumber: '',
    phone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.info('Nombre y apellido paterno son obligatorios.');
      return;
    }

    await addDoctor({
      firstName: formData.firstName.trim().toUpperCase(),
      lastName: formData.lastName.trim().toUpperCase(),
      middleName: formData.middleName.trim().toUpperCase() || undefined,
      specialty: formData.specialty.trim() || undefined,
      licenseNumber: formData.licenseNumber.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    });
  };

  return (
    <AppModal>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50">
              <UserPlus className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Medico</h2>
              <p className="text-sm text-gray-500">Registrar medico en el sistema</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Apellido paterno</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Apellido materno</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="middleName" value={formData.middleName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Especialidad</label>
              <div className="relative">
                <Stethoscope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="specialty" value={formData.specialty} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cedula profesional</label>
              <div className="relative">
                <BadgeCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Telefono</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Correo</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold border border-red-500 text-red-500 shadow-sm hover:bg-red-500 hover:text-white disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Registrar Medico'}
            </button>
          </div>
        </form>
      </div>
    </AppModal>
  );
}
