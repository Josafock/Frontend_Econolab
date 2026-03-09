'use client';

import { getDoctorById } from '@/actions/doctors/doctorsActions';
import { ArrowLeft, Loader2, Mail, Phone, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ViewDoctor = {
  fullName: string;
  specialty: string;
  license: string;
  phone: string;
  email: string;
};

export default function DoctorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState<ViewDoctor | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de medico invalido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await getDoctorById(id);
      if (!response.ok) {
        setError(response.errors[0] ?? 'No se pudo cargar el medico.');
        setLoading(false);
        return;
      }

      const d = response.data;
      setDoctor({
        fullName: `${d.firstName} ${d.lastName} ${d.middleName ?? ''}`.trim(),
        specialty: d.specialty ?? '-',
        license: d.licenseNumber ?? '-',
        phone: d.phone ?? '-',
        email: d.email ?? '-',
      });
      setLoading(false);
    };

    void load();
  }, [id]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/medicos" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Regresar a medicos
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-gray-600 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando detalle...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : doctor ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">Detalle de medico</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{doctor.fullName}</span></div>
            <div className="inline-flex items-center gap-2"><Stethoscope size={14} className="text-gray-500" />{doctor.specialty}</div>
            <div><span className="text-gray-500">Cedula:</span> <span className="font-medium">{doctor.license}</span></div>
            <div className="inline-flex items-center gap-2"><Phone size={14} className="text-gray-500" />{doctor.phone}</div>
            <div className="inline-flex items-center gap-2"><Mail size={14} className="text-gray-500" />{doctor.email}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
