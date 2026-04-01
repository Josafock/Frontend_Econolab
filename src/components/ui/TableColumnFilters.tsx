type TableColumnFilterInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number";
  ariaLabel: string;
};

type TableColumnFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  ariaLabel: string;
};

const sharedClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export function TableColumnFilterInput({
  value,
  onChange,
  placeholder,
  type = "text",
  ariaLabel,
}: TableColumnFilterInputProps) {
  return (
    <input
      type={type}
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={sharedClassName}
    />
  );
}

export function TableColumnFilterSelect({
  value,
  onChange,
  options,
  placeholder = "Todos",
  ariaLabel,
}: TableColumnFilterSelectProps) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={sharedClassName}
    >
      <option value="all">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
