'use client';

import {
  ArrowLeft,
  Calendar,
  Phone,
  User,
  MapPin,
  CreditCard,
  Activity,
  Droplet,
  FileText,
  Download,
  QrCode
} from 'lucide-react';
import Image from 'next/image';

type ServicioStatus = 'CONCURSO' | 'PENDIENTE' | 'EN PROCESO' | 'COMPLETADO' | 'CANCELADO';

interface ServicioDetalle {
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServicioStatus;
  indicaciones: string;
  notas: string;
}

const servicioGlucosaDetalle: ServicioDetalle = {
  folio: 'GLU-006',
  estudio: 'GLUCOSA EN SANGRE EN AYUNAS',
  paciente: 'JUAN PÉREZ LÓPEZ',
  telefono: '7711234567',
  sucursal: 'Matriz',
  creador: '2025-09-25 09:15:00',
  fechaEntrega: '2025-09-25 12:00:00',
  costo: '180',
  status: 'PENDIENTE',
  indicaciones:
    'Ayuno mínimo de 8 horas. Evitar consumo de bebidas azucaradas, refrescos o café con azúcar antes del estudio.',
  notas:
    'Paciente refiere mareos ocasionales. Se recomienda revisar resultados con el médico tratante para ajustar tratamiento si es necesario.'
};

const getStatusColor = (status: ServicioStatus): string => {
  const base =
    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ';
  const map: Record<ServicioStatus, string> = {
    CONCURSO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PENDIENTE: 'bg-blue-100 text-blue-800 border-blue-200',
    'EN PROCESO': 'bg-orange-100 text-orange-800 border-orange-200',
    COMPLETADO: 'bg-green-100 text-green-800 border-green-200',
    CANCELADO: 'bg-red-100 text-red-800 border-red-200'
  };
  // @ts-ignore
  return base + (map[status] ?? 'bg-gray-100 text-gray-800 border-gray-200');
};

export default function DetalleServicioPage() {
  const servicio = servicioGlucosaDetalle;

  const [fechaCreacion, horaCreacion] = servicio.creador.split(' ');
  const [fechaEntrega, horaEntrega] = servicio.fechaEntrega.split(' ');

  return (
    <div className="p-6 lg:p-8">
      {/* Header superior */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              // TODO: navegación al listado (router.back(), router.push('/servicios'), etc.)
            }}
          >
            <ArrowLeft className="mr-1" size={18} />
            Regresar
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Detalle del servicio
            </h1>
            <p className="text-gray-600 text-sm">
              Visualiza la información completa del estudio y el resultado de glucosa.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2">
          <span className="font-mono text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Folio: {servicio.folio}
          </span>
          <span className={getStatusColor(servicio.status)}>{servicio.status}</span>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del paciente */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <User size={18} className="text-red-500" />
              Datos del paciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Nombre completo</p>
                <p className="text-gray-900 font-medium">{servicio.paciente}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Teléfono</p>
                <p className="text-gray-900 font-medium inline-flex items-center gap-1">
                  <Phone size={14} className="text-gray-500" />
                  {servicio.telefono || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Sucursal</p>
                <p className="text-gray-900 font-medium inline-flex items-center gap-1">
                  <MapPin size={14} className="text-blue-500" />
                  {servicio.sucursal}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fecha de creación</p>
                <p className="text-gray-900 font-medium inline-flex items-center gap-1">
                  <Calendar size={14} className="text-gray-500" />
                  {fechaCreacion}{' '}
                  <span className="text-xs text-gray-500">| {horaCreacion}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del estudio */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Droplet size={18} className="text-red-500" />
              Detalles del estudio
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Estudio solicitado</p>
                <p className="text-gray-900 font-semibold">{servicio.estudio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Fecha de entrega</p>
                  <p className="text-gray-900 font-medium inline-flex items-center gap-1">
                    <Calendar size={14} className="text-green-500" />
                    {fechaEntrega}{' '}
                    <span className="text-xs text-gray-500">| {horaEntrega}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Costo</p>
                  <p className="text-gray-900 font-medium inline-flex items-center gap-1">
                    <CreditCard size={14} className="text-emerald-500" />
                    ${servicio.costo} MXN
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Tipo de muestra</p>
                  <p className="text-gray-900 font-medium flex items-center gap-1">
                    <Activity size={14} className="text-orange-500" />
                    Sangre (suero) – Ayuno
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Indicaciones para el paciente</p>
                <p className="text-gray-800 leading-relaxed">{servicio.indicaciones}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Notas adicionales</p>
                <p className="text-gray-800 leading-relaxed">{servicio.notas}</p>
              </div>
            </div>
          </div>

          {/* Resultados de glucosa (lo que se ve sobre el QR) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Activity size={18} className="text-red-500" />
              Resultados de glucosa
            </h2>

            {/* Título grande tipo overlay */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">04/12/2025</p>
              <p className="text-xs text-gray-500">Paciente: {servicio.paciente}</p>
              <h3 className="mt-2 text-3xl font-extrabold tracking-[0.25em] text-gray-700">
                GLUCOSA
              </h3>
            </div>

            {/* Valor + Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-gray-600 font-semibold">Valor:</span>
                <span className="text-2xl font-bold text-gray-900">95</span>
                <span className="text-xs text-gray-500">mg/dL</span>
              </div>
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-gray-600 font-semibold">Estado:</span>
                <span className="text-lg font-bold text-green-600 uppercase tracking-wide">
                  NORMAL
                </span>
              </div>
            </div>

            {/* Barra Bajo / Normal / Alto */}
            <div className="space-y-2 mb-3">
              {/* Barra de rango */}
              <div className="w-full max-w-md mx-auto">
                <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-200">
                  <div className="flex-1 bg-yellow-200" />
                  <div className="flex-1 bg-green-400" />
                  <div className="flex-1 bg-red-200" />
                </div>
                {/* Indicador en la zona normal */}
                <div className="relative mt-2 h-4">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0">
                    <div className="w-2.5 h-4 bg-green-600 rounded-sm mx-auto" />
                  </div>
                </div>
              </div>

              {/* Etiquetas Bajo / Normal / Alto */}
              <div className="flex justify-between max-w-md mx-auto text-[11px] font-medium">
                <span className="text-yellow-600">Bajo</span>
                <span className="text-green-700">Normal</span>
                <span className="text-red-600">Alto</span>
              </div>
            </div>

            {/* Texto de interpretación */}
            <ul className="mt-4 text-[11px] text-gray-700 space-y-1">
              <li>
                <span className="font-semibold">*</span> Rango de referencia / normal:{' '}
                <span className="font-medium">70 – 110 mg/dL</span>
              </li>
              <li>
                <span className="font-semibold">*</span> Interpretación:{' '}
                <span className="font-medium">Dentro de rango normal.</span>
              </li>
              <li>
                <span className="font-semibold">*</span> Recomendación:{' '}
                <span className="font-medium">
                  Continuar con controles periódicos.
                </span>
              </li>
            </ul>
          </div>

          {/* Timeline simple */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Línea de tiempo del servicio
            </h2>
            <ol className="relative border-l border-gray-200 text-sm">
              <li className="mb-6 ml-4">
                <div className="absolute w-3 h-3 bg-green-500 rounded-full mt-1.5 -left-1.5 border border-white" />
                <p className="text-xs text-gray-500">2025-09-25 09:15:00</p>
                <p className="font-medium text-gray-900">Servicio creado</p>
                <p className="text-gray-600 text-xs">
                  Captura de datos del paciente y generación del folio.
                </p>
              </li>
              <li className="mb-6 ml-4">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full mt-1.5 -left-1.5 border border-white" />
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="font-medium text-gray-900">Muestra en espera</p>
                <p className="text-gray-600 text-xs">
                  El paciente debe presentarse para la toma de muestra en ayunas.
                </p>
              </li>
              <li className="ml-4">
                <div className="absolute w-3 h-3 bg-gray-300 rounded-full mt-1.5 -left-1.5 border border-white" />
                <p className="text-xs text-gray-500">Próximo</p>
                <p className="font-medium text-gray-900">Procesamiento de laboratorio</p>
                <p className="text-gray-600 text-xs">
                  Una vez tomada la muestra, se procesará y se generarán resultados.
                </p>
              </li>
            </ol>
          </div>
        </div>

        {/* Columna derecha: resumen + QR */}
        <div className="space-y-6">
          {/* Resumen rápido */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={18} className="text-red-500" />
              Resumen del servicio
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total a pagar</span>
                <span className="text-gray-900 font-semibold">
                  ${servicio.costo} MXN
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estatus</span>
                <span className="text-gray-900 font-medium">
                  {servicio.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Sucursal</span>
                <span className="text-gray-900">{servicio.sucursal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Entrega estimada</span>
                <span className="text-gray-900 text-xs">
                  {fechaEntrega} {horaEntrega && `| ${horaEntrega}`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button className="inline-flex items-center justify-center w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                <FileText size={16} className="mr-2" />
                Imprimir orden
              </button>
              <button className="inline-flex items-center justify-center w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Download size={16} className="mr-2" />
                Descargar resultados (PDF)
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <QrCode size={18} className="text-red-500" />
              Código QR para AR
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Escanea este código con la app Econolab AR para visualizar el resultado de glucosa en realidad aumentada.
            </p>

            <div className="flex flex-col items-center justify-center">
              <Image
                src="/qr.jpeg"
                alt="QR Examen de Glucosa"
                width={180}
                height={180}
                className="rounded-lg border border-gray-200"
              />

              <p className="text-[11px] text-gray-500 text-center mt-3">
                Reemplaza este contenedor por la imagen del QR real cuando la tengas
                disponible en <code>/public</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
