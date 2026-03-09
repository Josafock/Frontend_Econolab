'use client';

import { getStudyById, type Study } from '@/actions/studies/studiesActions';
import { ArrowLeft, Clock3, DollarSign, Hash, Loader2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StudyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [study, setStudy] = useState<Study | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID de estudio invalido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      const response = await getStudyById(id);
      if (!response.ok) {
        setError(response.errors[0] ?? 'No se pudo cargar el estudio.');
        setLoading(false);
        return;
      }

      setStudy(response.data);
      setLoading(false);
    };

    void load();
  }, [id]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/estudios" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Regresar a estudios
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-gray-600 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando detalle...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : study ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">Detalle de estudio</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{study.name}</span></div>
            <div className="inline-flex items-center gap-2"><Hash size={14} className="text-gray-500" />{study.code}</div>
            <div className="inline-flex items-center gap-2"><Tag size={14} className="text-gray-500" />{study.type}</div>
            <div><span className="text-gray-500">Estatus:</span> <span className="font-medium">{study.status}</span></div>
            <div className="inline-flex items-center gap-2"><Clock3 size={14} className="text-gray-500" />{study.durationMinutes} min</div>
            <div className="inline-flex items-center gap-2"><DollarSign size={14} className="text-gray-500" />{Number(study.normalPrice).toFixed(2)} MXN</div>
            <div className="md:col-span-2"><span className="text-gray-500">Descripcion:</span> <span className="font-medium">{study.description || '-'}</span></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
