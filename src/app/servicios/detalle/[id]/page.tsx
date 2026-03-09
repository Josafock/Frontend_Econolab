'use client';

import { getServiceById, type ServiceOrder } from '@/actions/services/servicesActions';
import { ArrowLeft, Calendar, Loader2, MapPin, Phone, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de servicio invalido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await getServiceById(id);
      if (!response.ok) {
        setError(response.errors[0] ?? 'No se pudo cargar el servicio.');
        setLoading(false);
        return;
      }

      setService(response.data);
      setLoading(false);
    };

    void load();
  }, [id]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/servicios" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Regresar a servicios
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-gray-600 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando detalle...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : service ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">Detalle de servicio</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Folio:</span> <span className="font-medium">{service.folio}</span></div>
            <div><span className="text-gray-500">Estatus:</span> <span className="font-medium">{service.status}</span></div>
            <div><span className="text-gray-500">Paciente:</span> <span className="font-medium">{service.patient ? `${service.patient.firstName} ${service.patient.lastName}` : '-'}</span></div>
            <div className="inline-flex items-center gap-2"><Phone size={14} className="text-gray-500" />{service.patient?.phone ?? '-'}</div>
            <div className="inline-flex items-center gap-2"><MapPin size={14} className="text-gray-500" />{service.branchName ?? '-'}</div>
            <div className="inline-flex items-center gap-2"><Calendar size={14} className="text-gray-500" />{service.deliveryAt ? new Date(service.deliveryAt).toLocaleString() : '-'}</div>
            <div className="inline-flex items-center gap-2"><ReceiptText size={14} className="text-gray-500" />${Number(service.totalAmount).toFixed(2)} MXN</div>
            <div><span className="text-gray-500">Estudios:</span> <span className="font-medium">{(service.items ?? []).map((i) => i.studyNameSnapshot).join(', ') || '-'}</span></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
