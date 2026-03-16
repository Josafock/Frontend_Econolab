'use client';

import type { ChangeEvent, FocusEvent, ReactNode } from 'react';
import {
  BadgeCheck,
  FileText,
  Mail,
  Phone,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  REQUIRED_DOCTOR_FIELDS,
  type DoctorFormErrors,
  type DoctorFormField,
  type DoctorFormTouched,
  type DoctorFormValues,
} from '@/components/medicos/doctorFormUtils';

type DoctorFormFieldsProps = {
  formData: DoctorFormValues;
  errors?: DoctorFormErrors;
  touched?: DoctorFormTouched;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
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
  field: DoctorFormField,
  errors?: DoctorFormErrors,
  touched?: DoctorFormTouched,
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

export default function DoctorFormFields({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  disabled = false,
  compact = false,
}: DoctorFormFieldsProps) {
  const sectionClassName = compact
    ? 'rounded-2xl border border-gray-200 bg-gray-50/70 p-4'
    : 'rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-red-50/40 p-5 shadow-sm';

  const nombreError = getErrorState('nombre', errors, touched);
  const apellidoPaternoError = getErrorState('apellidoPaterno', errors, touched);
  const apellidoMaternoError = getErrorState('apellidoMaterno', errors, touched);
  const especialidadError = getErrorState('especialidad', errors, touched);
  const cedulaError = getErrorState('cedulaProfesional', errors, touched);
  const telefonoError = getErrorState('telefono', errors, touched);
  const emailError = getErrorState('email', errors, touched);
  const notasError = getErrorState('notas', errors, touched);

  return (
    <div className="space-y-4">
      <div className={sectionClassName}>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Datos del médico</h3>
          <p className="text-xs text-gray-500">Información general y profesional</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            * Campos obligatorios
          </span>
          <span className="hidden rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
            Validación en tiempo real
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <FieldLabel required={REQUIRED_DOCTOR_FIELDS.includes('nombre')}>Nombre</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Juan"
                className={getInputClass(nombreError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={nombreError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_DOCTOR_FIELDS.includes('apellidoPaterno')}>
              Apellido paterno
            </FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="apellidoPaterno"
                value={formData.apellidoPaterno}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Perez"
                className={getInputClass(apellidoPaternoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={apellidoPaternoError.message} />
          </div>

          <div>
            <FieldLabel>Apellido materno</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="apellidoMaterno"
                value={formData.apellidoMaterno}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Lopez"
                className={getInputClass(apellidoMaternoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={apellidoMaternoError.message} />
          </div>

          <div>
            <FieldLabel>Especialidad</FieldLabel>
            <div className="relative">
              <Stethoscope className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="especialidad"
                value={formData.especialidad}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Cardiología"
                className={getInputClass(especialidadError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={especialidadError.message} />
          </div>

          <div>
            <FieldLabel>Cédula profesional</FieldLabel>
            <div className="relative">
              <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="cedulaProfesional"
                value={formData.cedulaProfesional}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="12345678"
                className={getInputClass(cedulaError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={cedulaError.message} />
          </div>

          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="7711234567"
                className={getInputClass(telefonoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={telefonoError.message} />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Correo electrónico</FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="medico@ejemplo.com"
                className={getInputClass(emailError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={emailError.message} />
          </div>
        </div>
      </div>

      <div className={sectionClassName}>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Observaciones</h3>
          <p className="text-xs text-gray-500">Notas internas del médico</p>
        </div>

        <div>
          <FieldLabel>Notas</FieldLabel>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-400" />
            <textarea
              name="notas"
              value={formData.notas}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Comentarios, observaciones o datos adicionales..."
              className={`${getInputClass(notasError.hasError, true)} min-h-[120px] resize-none pl-11`}
              disabled={disabled}
            />
          </div>
          <ErrorText message={notasError.message} />
        </div>
      </div>
    </div>
  );
}
