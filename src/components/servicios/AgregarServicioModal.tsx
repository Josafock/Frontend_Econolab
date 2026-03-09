'use client';

import { useMemo, useState } from 'react';
import { X, Search, Calendar, DollarSign, Building, Users, Stethoscope } from 'lucide-react';
import type { Patient } from '@/actions/patients/patientsActions';
import type { Study } from '@/actions/studies/studiesActions';
import type { Doctor } from '@/actions/doctors/doctorsActions';
import Link from 'next/link';
import AppModal from '@/components/ui/AppModal';

type CreateServiceForm = {
  folio: string;
  patientId: number;
  doctorId?: number;
  studyId: number;
  branchName: string;
  deliveryAt: string;
};

interface AddServiceModalProps {
  setOpen: (open: boolean) => void;
  addService: (newService: CreateServiceForm) => Promise<void>;
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
  isSaving: boolean;
}

const branches = [
  { id: 'Sucursal 1', name: 'Sucursal 1' },
  { id: 'Sucursal 2', name: 'Sucursal 2' },
];

export default function AddServiceModal({ setOpen, addService, patients, doctors, studies, isSaving }: AddServiceModalProps) {
  const [folio, setFolio] = useState('');
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const selectedStudy = useMemo(
    () => studies.find((s) => String(s.id) === selectedStudyId),
    [selectedStudyId, studies],
  );

  const selectedPrice = selectedStudy ? Number(selectedStudy.normalPrice).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folio || !selectedStudyId || !selectedPatientId || !selectedBranchId || !deliveryDate) {
      alert('Completa los campos obligatorios para agregar el servicio.');
      return;
    }

    const branchName = branches.find((b) => b.id === selectedBranchId)?.name ?? '';

    await addService({
      folio: folio.trim().toUpperCase(),
      patientId: Number(selectedPatientId),
      doctorId: selectedDoctorId ? Number(selectedDoctorId) : undefined,
      studyId: Number(selectedStudyId),
      branchName,
      deliveryAt: `${deliveryDate}T14:00:00.000Z`,
    });
  };

  return (
    <AppModal>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50">
              <Stethoscope className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Servicio</h2>
              <p className="text-sm text-gray-500">Agregar nuevo estudio de laboratorio</p>
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
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Folio</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="ECO-0001"
                className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Estudio o Analisis</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedStudyId}
                onChange={(e) => setSelectedStudyId(e.target.value)}
                className="modal-select w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 appearance-none"
              >
                <option className="bg-white text-gray-900" value="">Seleccionar estudio...</option>
                {studies.map((study) => (
                  <option className="bg-white text-gray-900" key={study.id} value={study.id}>
                    {study.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-right">
              <Link onClick={() => setOpen(false)} className="text-xs text-red-600 hover:underline" href="/estudios">
                + Crear nuevo estudio
              </Link>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Paciente</label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="modal-select w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 appearance-none"
              >
                <option className="bg-white text-gray-900" value="">Seleccionar paciente...</option>
                {patients.map((patient) => (
                  <option className="bg-white text-gray-900" key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} {patient.middleName ?? ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-right">
              <Link onClick={() => setOpen(false)} className="text-xs text-red-600 hover:underline" href="/pacientes">
                + Crear nuevo paciente
              </Link>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Doctor (opcional)</label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="modal-select w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 appearance-none"
              >
                <option className="bg-white text-gray-900" value="">Sin doctor asignado</option>
                {doctors.map((doctor) => (
                  <option className="bg-white text-gray-900" key={doctor.id} value={doctor.id}>
                    {doctor.firstName} {doctor.lastName} {doctor.middleName ?? ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-right">
              <Link onClick={() => setOpen(false)} className="text-xs text-red-600 hover:underline" href="/medicos">
                + Crear nuevo doctor
              </Link>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sucursal</label>
            <div className="relative">
              <Building className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="modal-select w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 appearance-none"
              >
                <option className="bg-white text-gray-900" value="">Seleccionar sucursal...</option>
                {branches.map((branch) => (
                  <option className="bg-white text-gray-900" key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fecha de Entrega</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Costo</label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={selectedPrice}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-10 py-3 text-sm text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold border border-red-500 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Agregar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </AppModal>
  );
}
