'use client';

import type { ChangeEvent, FocusEvent, ReactNode } from 'react';
import { Calendar, CreditCard, Mail, MapPin, Phone, User } from 'lucide-react';
import {
  REQUIRED_PATIENT_FIELDS,
  calculateAge,
  type PatientFormErrors,
  type PatientFormField,
  type PatientFormTouched,
  type PatientFormValues,
} from '@/components/pacientes/patientFormUtils';

type PatientFormFieldsProps = {
  formData: PatientFormValues;
  errors?: PatientFormErrors;
  touched?: PatientFormTouched;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
  field: PatientFormField,
  errors?: PatientFormErrors,
  touched?: PatientFormTouched,
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

export default function PatientFormFields({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  disabled = false,
  compact = false,
}: PatientFormFieldsProps) {
  const age = calculateAge(formData.fechaNacimiento);
  const sectionClassName = compact
    ? 'rounded-2xl border border-gray-200 bg-gray-50/70 p-4'
    : 'rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-red-50/40 p-5 shadow-sm';

  const nombreError = getErrorState('nombre', errors, touched);
  const apellidoPaternoError = getErrorState('apellidoPaterno', errors, touched);
  const apellidoMaternoError = getErrorState('apellidoMaterno', errors, touched);
  const fechaNacimientoError = getErrorState('fechaNacimiento', errors, touched);
  const generoError = getErrorState('genero', errors, touched);
  const telefonoError = getErrorState('telefono', errors, touched);
  const emailError = getErrorState('email', errors, touched);
  const direccionError = getErrorState('direccion', errors, touched);
  const entreCallesError = getErrorState('entreCalles', errors, touched);
  const ciudadError = getErrorState('ciudad', errors, touched);
  const estadoError = getErrorState('estado', errors, touched);
  const codigoPostalError = getErrorState('codigoPostal', errors, touched);
  const tipoDocumentoError = getErrorState('tipoDocumento', errors, touched);
  const numeroDocumentoError = getErrorState('numeroDocumento', errors, touched);

  return (
    <div className="space-y-4">
      <div className={sectionClassName}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Datos personales</h3>
            <p className="text-xs text-gray-500">Información base del paciente</p>
          </div>
          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Edad: {age} años
          </div>
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
            <FieldLabel required={REQUIRED_PATIENT_FIELDS.includes('nombre')}>Nombre</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="María"
                className={getInputClass(nombreError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={nombreError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_PATIENT_FIELDS.includes('apellidoPaterno')}>
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
                placeholder="Hernández"
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
                placeholder="López"
                className={getInputClass(apellidoMaternoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={apellidoMaternoError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_PATIENT_FIELDS.includes('fechaNacimiento')}>
              Fecha de nacimiento
            </FieldLabel>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={onChange}
                onBlur={onBlur}
                max={new Date().toISOString().split('T')[0]}
                className={getInputClass(fechaNacimientoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={fechaNacimientoError.message} />
          </div>

          <div>
            <FieldLabel required={REQUIRED_PATIENT_FIELDS.includes('genero')}>Género</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                name="genero"
                value={formData.genero}
                onChange={onChange}
                onBlur={onBlur}
                className={`${getInputClass(generoError.hasError, true)} modal-select appearance-none`}
                disabled={disabled}
              >
                <option value="">Seleccionar género...</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <ErrorText message={generoError.message} />
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
                placeholder="paciente@ejemplo.com"
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
          <h3 className="text-base font-semibold text-gray-900">Dirección y ubicación</h3>
          <p className="text-xs text-gray-500">Datos para localizar al paciente</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>Dirección</FieldLabel>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-400" />
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Colonia 5 de mayo"
                className={`${getInputClass(direccionError.hasError, true)} min-h-[96px] resize-none pl-11`}
                disabled={disabled}
              />
            </div>
            <ErrorText message={direccionError.message} />
          </div>

          <div>
            <FieldLabel>Entre calles</FieldLabel>
            <input
              type="text"
              name="entreCalles"
              value={formData.entreCalles}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Av. Juárez y Morelos"
              className={getInputClass(entreCallesError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={entreCallesError.message} />
          </div>

          <div>
            <FieldLabel>Ciudad</FieldLabel>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Pachuca"
              className={getInputClass(ciudadError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={ciudadError.message} />
          </div>

          <div>
            <FieldLabel>Estado</FieldLabel>
            <input
              type="text"
              name="estado"
              value={formData.estado}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Hidalgo"
              className={getInputClass(estadoError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={estadoError.message} />
          </div>

          <div>
            <FieldLabel>Código postal</FieldLabel>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="42000"
              className={getInputClass(codigoPostalError.hasError)}
              disabled={disabled}
            />
            <ErrorText message={codigoPostalError.message} />
          </div>
        </div>
      </div>

      <div className={sectionClassName}>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Identificación</h3>
          <p className="text-xs text-gray-500">Documento o referencia del paciente</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Tipo de documento</FieldLabel>
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="INE, CURP, ID CARD"
                className={getInputClass(tipoDocumentoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={tipoDocumentoError.message} />
          </div>

          <div>
            <FieldLabel>Número de documento</FieldLabel>
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="ABC123456"
                className={getInputClass(numeroDocumentoError.hasError, true)}
                disabled={disabled}
              />
            </div>
            <ErrorText message={numeroDocumentoError.message} />
          </div>
        </div>
      </div>
    </div>
  );
}
