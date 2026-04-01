'use client';

import type { ChangeEvent, FocusEvent, ReactNode } from 'react';
import {
  AlignLeft,
  Clock3,
  DollarSign,
  FlaskConical,
  Hash,
  Percent,
  RefreshCw,
  Tag,
} from 'lucide-react';
import {
  REQUIRED_STUDY_FIELDS,
  splitDurationValue,
  type StudyDurationPart,
  type StudyFormErrors,
  type StudyFormField,
  type StudyFormTouched,
  type StudyFormValues,
} from '@/components/estudios/studyFormUtils';

type StudyFormFieldsProps = {
  formData: StudyFormValues;
  errors?: StudyFormErrors;
  touched?: StudyFormTouched;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onDurationChange?: (part: StudyDurationPart, value: string) => void;
  onDurationBlur?: () => void;
  onGenerateCode?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

const baseInputClassName =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500';

const baseIconInputClassName =
  'w-full rounded-xl border bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500';

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );
}

function getInputClass(hasError: boolean, withIcon = false) {
  const base = withIcon ? baseIconInputClassName : baseInputClassName;

  if (hasError) {
    return `${base} border-red-300 focus:border-red-500 focus:ring-red-500/20`;
  }

  return `${base} border-gray-200 focus:border-red-500 focus:ring-red-500/20`;
}

function getErrorState(
  field: StudyFormField,
  errors?: StudyFormErrors,
  touched?: StudyFormTouched,
) {
  const isTouched = touched?.[field] ?? false;
  const message = isTouched ? errors?.[field] : undefined;
  return {
    hasError: Boolean(message),
    message,
  };
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}

export default function StudyFormFields({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  onDurationChange,
  onDurationBlur,
  onGenerateCode,
  disabled = false,
  compact = false,
}: StudyFormFieldsProps) {
  const isPackage = formData.tipo === 'package';
  const sectionClassName = compact
    ? 'rounded-2xl border border-gray-200 bg-gray-50/70 p-4'
    : 'rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-red-50/40 p-5 shadow-sm';

  const nombreError = getErrorState('nombre', errors, touched);
  const claveError = getErrorState('clave', errors, touched);
  const descripcionError = getErrorState('descripcion', errors, touched);
  const duracionError = getErrorState('duracion', errors, touched);
  const precioNormalError = getErrorState('precioNormal', errors, touched);
  const precioDifError = getErrorState('precioDif', errors, touched);
  const precioEspecialError = getErrorState('precioEspecial', errors, touched);
  const precioHospitalError = getErrorState('precioHospital', errors, touched);
  const otrosError = getErrorState('otros', errors, touched);
  const descuentoError = getErrorState('descuento', errors, touched);
  const metodoError = getErrorState('metodo', errors, touched);
  const indicadorError = getErrorState('indicador', errors, touched);
  const durationParts = splitDurationValue(formData.duracion);

  return (
    <div className="space-y-4">
      <div className={sectionClassName}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Datos generales</h3>
            <p className="text-xs text-gray-500">
              Informacion base del {isPackage ? 'paquete' : 'estudio'}.
            </p>
          </div>
          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            * Campos obligatorios
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FieldLabel required={REQUIRED_STUDY_FIELDS.includes('nombre')}>
              {isPackage ? 'Nombre del paquete' : 'Nombre del estudio'}
            </FieldLabel>
            <div className="relative">
              <AlignLeft className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-400" />
              <textarea
                name="nombre"
                value={formData.nombre}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={
                  isPackage
                    ? 'Check up ejecutivo, perfil prenatal...'
                    : 'Biometria hematica, quimica sanguinea...'
                }
                className={`${getInputClass(nombreError.hasError, true)} min-h-[96px] resize-none pl-11`}
                disabled={disabled}
              />
            </div>
            <ErrorText message={nombreError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_STUDY_FIELDS.includes('clave')}>
              Clave o referencia
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="clave"
                  value={formData.clave}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="BH, QS6, CHECK"
                  className={getInputClass(claveError.hasError, true)}
                  disabled={disabled}
                />
              </div>
              {onGenerateCode ? (
                <button
                  type="button"
                  onClick={onGenerateCode}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                >
                  <RefreshCw className="h-4 w-4" />
                  Auto
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Puedes capturar la clave manualmente o generarla automaticamente.
            </p>
            <ErrorText message={claveError.message} />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel required>
              {isPackage ? 'Descripcion del paquete' : 'Descripcion del estudio'}
            </FieldLabel>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={
                isPackage
                  ? 'Descripcion comercial del paquete'
                  : 'Descripcion clinica del estudio'
              }
              className={`${getInputClass(descripcionError.hasError)} min-h-[110px] resize-none`}
              disabled={disabled}
            />
            <ErrorText message={descripcionError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_STUDY_FIELDS.includes('duracion')}>
              Duracion
            </FieldLabel>
            <div
              className={`rounded-xl border bg-white p-3 transition-all ${
                duracionError.hasError
                  ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
                  : 'border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                <Clock3 className="h-4 w-4 text-gray-400" />
                Duracion estimada
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationParts.hours}
                  onChange={(event) => onDurationChange?.('hours', event.target.value)}
                  onBlur={onDurationBlur}
                  placeholder="1"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:bg-gray-100"
                  disabled={disabled}
                />
                <span className="text-sm font-semibold text-gray-600">hrs</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationParts.minutes}
                  onChange={(event) => onDurationChange?.('minutes', event.target.value)}
                  onBlur={onDurationBlur}
                  placeholder="30"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:bg-gray-100"
                  disabled={disabled}
                />
                <span className="text-sm font-semibold text-gray-600">min</span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Captura solo la duracion estimada del estudio.
              </p>
            </div>
            <ErrorText message={duracionError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_STUDY_FIELDS.includes('tipo')}>Tipo</FieldLabel>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                name="tipo"
                value={formData.tipo}
                onChange={onChange}
                onBlur={onBlur}
                className={`${getInputClass(false, true)} modal-select appearance-none`}
                disabled={disabled}
              >
                <option value="study">Estudio</option>
                <option value="package">Paquete</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Estatus</FieldLabel>
            <select
              name="estatus"
              value={formData.estatus}
              onChange={onChange}
              onBlur={onBlur}
              className={`${getInputClass(false)} modal-select appearance-none`}
              disabled={disabled}
            >
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
        </div>
      </div>

      <div className={sectionClassName}>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Precios y condiciones</h3>
          <p className="text-xs text-gray-500">Configura los importes del catálogo.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <FieldLabel required={REQUIRED_STUDY_FIELDS.includes('precioNormal')}>
              Precio normal
            </FieldLabel>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                name="precioNormal"
                value={formData.precioNormal}
                onChange={onChange}
                onBlur={onBlur}
                className={getInputClass(precioNormalError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={precioNormalError.message} />
          </div>

          <div>
            <FieldLabel>Precio DIF</FieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precioDif"
              value={formData.precioDif}
              onChange={onChange}
              onBlur={onBlur}
              className={getInputClass(precioDifError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={precioDifError.message} />
          </div>

          <div>
            <FieldLabel>Precio especial</FieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precioEspecial"
              value={formData.precioEspecial}
              onChange={onChange}
              onBlur={onBlur}
              className={getInputClass(precioEspecialError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={precioEspecialError.message} />
          </div>

          <div>
            <FieldLabel>Precio hospital</FieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precioHospital"
              value={formData.precioHospital}
              onChange={onChange}
              onBlur={onBlur}
              className={getInputClass(precioHospitalError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={precioHospitalError.message} />
          </div>

          <div>
            <FieldLabel>Otros</FieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              name="otros"
              value={formData.otros}
              onChange={onChange}
              onBlur={onBlur}
              className={getInputClass(otrosError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={otrosError.message} />
          </div>

          <div>
            <FieldLabel>% Descuento</FieldLabel>
            <div className="relative">
              <Percent className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                name="descuento"
                value={formData.descuento}
                onChange={onChange}
                onBlur={onBlur}
                className={getInputClass(descuentoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={descuentoError.message} />
          </div>
        </div>
      </div>

      {!isPackage ? (
        <div className={sectionClassName}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Método e indicador</h3>
            <p className="text-xs text-gray-500">Campos complementarios del estudio.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Método</FieldLabel>
              <div className="relative">
                <FlaskConical className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="metodo"
                  value={formData.metodo}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Espectrofotometria, ELISA..."
                  className={getInputClass(metodoError.hasError, true)}
                  disabled={disabled}
                />
              </div>
              <ErrorText message={metodoError.message} />
            </div>

            <div>
              <FieldLabel>Indicador</FieldLabel>
              <input
                type="text"
                name="indicador"
                value={formData.indicador}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Ayuno, muestra serum..."
                className={getInputClass(indicadorError.hasError)}
                disabled={disabled}
              />
              <ErrorText message={indicadorError.message} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
