'use client';

import { useState } from 'react';
import { X, Plus, Hash, Clock3, DollarSign, AlignLeft } from 'lucide-react';
import type { CreateStudyPayload, StudyStatus, StudyType } from '@/actions/studies/studiesActions';

interface AddStudyModalProps {
  setOpen: (open: boolean) => void;
  addStudy: (payload: CreateStudyPayload) => Promise<void>;
  isSaving: boolean;
}

export default function AddStudyModal({ setOpen, addStudy, isSaving }: AddStudyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    durationMinutes: '60',
    type: 'study' as StudyType,
    normalPrice: '0',
    difPrice: '0',
    specialPrice: '0',
    hospitalPrice: '0',
    otherPrice: '0',
    defaultDiscountPercent: '0',
    status: 'active' as StudyStatus,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Nombre y clave son obligatorios.');
      return;
    }

    await addStudy({
      name: formData.name.trim().toUpperCase(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      durationMinutes: Number(formData.durationMinutes),
      type: formData.type,
      normalPrice: Number(formData.normalPrice),
      difPrice: Number(formData.difPrice),
      specialPrice: Number(formData.specialPrice),
      hospitalPrice: Number(formData.hospitalPrice),
      otherPrice: Number(formData.otherPrice),
      defaultDiscountPercent: Number(formData.defaultDiscountPercent),
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50">
              <Plus className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Estudio</h2>
              <p className="text-sm text-gray-500">Registrar estudio en el catalogo</p>
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
                <AlignLeft className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Clave</label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="code" value={formData.code} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Duracion (min)</label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="number" min="1" name="durationMinutes" value={formData.durationMinutes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tipo</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500">
                <option value="study">Estudio</option>
                <option value="package">Paquete</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio normal</label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="number" step="0.01" min="0" name="normalPrice" value={formData.normalPrice} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio DIF</label>
              <input type="number" step="0.01" min="0" name="difPrice" value={formData.difPrice} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio especial</label>
              <input type="number" step="0.01" min="0" name="specialPrice" value={formData.specialPrice} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio hospital</label>
              <input type="number" step="0.01" min="0" name="hospitalPrice" value={formData.hospitalPrice} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio otro</label>
              <input type="number" step="0.01" min="0" name="otherPrice" value={formData.otherPrice} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Descuento %</label>
              <input type="number" step="0.01" min="0" name="defaultDiscountPercent" value={formData.defaultDiscountPercent} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Estatus</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500">
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Descripcion</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500" />
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
              {isSaving ? 'Guardando...' : 'Registrar Estudio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
