'use client';

import type { ChangeEvent, FocusEvent, ReactNode } from 'react';
import type { StudyDetail } from '@/features/studies/api/studies';
import type {
  StudyDetailFormErrors,
  StudyDetailFormField,
  StudyDetailFormTouched,
  StudyDetailFormValues,
} from '@/components/estudios/studyDetailFormUtils';

type StudyDetailFormFieldsProps = {
  formData: StudyDetailFormValues;
  errors?: StudyDetailFormErrors;
  touched?: StudyDetailFormTouched;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  disabled?: boolean;
  categories: StudyDetail[];
  excludeParentId?: number;
  compact?: boolean;
  showTypeField?: boolean;
};

const baseInputClassName =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500';

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-gray-700">{children}</label>;
}

function getInputClass(hasError: boolean) {
  if (hasError) {
    return `${baseInputClassName} border-red-300 focus:border-red-500 focus:ring-red-500/20`;
  }

  return `${baseInputClassName} border-gray-200 focus:border-red-500 focus:ring-red-500/20`;
}

function getErrorState(
  field: StudyDetailFormField,
  errors?: StudyDetailFormErrors,
  touched?: StudyDetailFormTouched,
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

export default function StudyDetailFormFields({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  disabled = false,
  categories,
  excludeParentId,
  compact = false,
  showTypeField = true,
}: StudyDetailFormFieldsProps) {
  const wrapperClassName = compact
    ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
    : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4';

  const parentOptions = categories.filter((category) => category.id !== excludeParentId);
  const isParameter = formData.dataType === 'parameter';
  const parentLabel = isParameter ? 'Categoria (opcional)' : 'Pertenece a (opcional)';
  const parentPlaceholder = isParameter ? 'Sin categoria' : 'Categoria raiz';
  const typeHelperText = isParameter
    ? 'Este parametro sera el que se capture en resultados dentro del servicio.'
    : 'La categoria solo organiza el estudio y no requiere captura de resultado.';

  const parentError = getErrorState('parentId', errors, touched);
  const nameError = getErrorState('name', errors, touched);
  const orderError = getErrorState('sortOrder', errors, touched);

  return (
    <div className={wrapperClassName}>
      {showTypeField ? (
        <div>
          <FieldLabel>Tipo de elemento</FieldLabel>
          <select
            name="dataType"
            value={formData.dataType}
            onChange={onChange}
            onBlur={onBlur}
            className={`${getInputClass(false)} modal-select appearance-none`}
            disabled={disabled}
          >
            <option value="category">Categoria / encabezado</option>
            <option value="parameter">Parametro</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-500">{typeHelperText}</p>
        </div>
      ) : (
        <div>
          <FieldLabel>Tipo de elemento</FieldLabel>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            {isParameter ? 'Parametro' : 'Categoria / encabezado'}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{typeHelperText}</p>
        </div>
      )}

      <div>
        <FieldLabel>{parentLabel}</FieldLabel>
        <select
          name="parentId"
          value={formData.parentId}
          onChange={onChange}
          onBlur={onBlur}
          className={`${getInputClass(parentError.hasError)} modal-select appearance-none`}
          disabled={disabled}
        >
          <option value="">{parentPlaceholder}</option>
          {parentOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <ErrorText message={parentError.message} />
        <p className="mt-1.5 text-xs text-gray-500">
          {isParameter
            ? 'Si la dejas vacia, el parametro aparecera como independiente.'
            : 'Usala solo si quieres anidar esta categoria dentro de otra.'}
        </p>
      </div>

      <div>
        <FieldLabel>{isParameter ? 'Nombre del parametro' : 'Nombre de la categoria'}</FieldLabel>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={isParameter ? 'Glucosa' : 'Quimica sanguinea'}
          className={getInputClass(nameError.hasError)}
          disabled={disabled}
        />
        <ErrorText message={nameError.message} />
      </div>

      <div>
        <FieldLabel>Orden</FieldLabel>
        <input
          type="number"
          min="1"
          name="sortOrder"
          value={formData.sortOrder}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="1"
          className={getInputClass(orderError.hasError)}
          disabled={disabled}
        />
        <ErrorText message={orderError.message} />
      </div>

      {isParameter ? (
        <>
          <div>
            <FieldLabel>Unidad (opcional)</FieldLabel>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="mg/dL"
              className={getInputClass(false)}
              disabled={disabled}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Ejemplo: mg/dL, g/dL, %, UI/L.
            </p>
          </div>

          <div className={compact ? 'md:col-span-2' : 'xl:col-span-2'}>
            <FieldLabel>Valor de referencia (opcional)</FieldLabel>
            <input
              type="text"
              name="referenceValue"
              value={formData.referenceValue}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="60.0 a 110.0 mg/dL"
              className={getInputClass(false)}
              disabled={disabled}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Puedes capturar rango, texto libre o interpretacion clinica corta.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
