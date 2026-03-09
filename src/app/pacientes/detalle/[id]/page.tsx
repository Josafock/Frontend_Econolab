'use client';

import { getPatientById } from '@/actions/patients/patientsActions';
import { ArrowLeft, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type ViewPatient = {
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  document: string;
  createdAt: string;
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<ViewPatient | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de paciente invalido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await getPatientById(id);
      if (!response.ok) {
        setError(response.errors[0] ?? 'No se pudo cargar el paciente.');
        setLoading(false);
        return;
      }

      const p = response.data;
      setPatient({
        fullName: `${p.firstName} ${p.lastName} ${p.middleName ?? ''}`.trim(),
        birthDate: p.birthDate,
        gender: p.gender,
        phone: p.phone ?? '-',
        email: p.email ?? '-',
        city: p.addressCity ?? '-',
        address: p.addressLine ?? '-',
        document: p.documentType && p.documentNumber ? `${p.documentType}: ${p.documentNumber}` : '-',
        createdAt: p.createdAt ?? '',
      });
      setLoading(false);
    };

    void load();
  }, [id]);

  const age = useMemo(() => {
    if (!patient?.birthDate) return '-';
    const birth = new Date(patient.birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const month = now.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) years -= 1;
    return Number.isNaN(years) ? '-' : String(years);
  }, [patient?.birthDate]);

  const genre = patient?.gender === 'male' ? 'Masculino' : patient?.gender === 'female' ? 'Femenino' : '-';

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/pacientes" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Regresar a pacientes
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-gray-600 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando detalle...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : patient ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">Detalle de paciente</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{patient.fullName}</span></div>
            <div><span className="text-gray-500">Genero:</span> <span className="font-medium">{genre}</span></div>
            <div><span className="text-gray-500">Fecha de nacimiento:</span> <span className="font-medium">{new Date(patient.birthDate).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Edad:</span> <span className="font-medium">{age}</span></div>
            <div className="inline-flex items-center gap-2"><Phone size={14} className="text-gray-500" />{patient.phone}</div>
            <div className="inline-flex items-center gap-2"><Mail size={14} className="text-gray-500" />{patient.email}</div>
            <div className="inline-flex items-center gap-2"><MapPin size={14} className="text-gray-500" />{patient.address}</div>
            <div><span className="text-gray-500">Ciudad:</span> <span className="font-medium">{patient.city}</span></div>
            <div><span className="text-gray-500">Documento:</span> <span className="font-medium">{patient.document}</span></div>
            <div><span className="text-gray-500">Registro:</span> <span className="font-medium">{patient.createdAt ? new Date(patient.createdAt).toLocaleString() : '-'}</span></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
