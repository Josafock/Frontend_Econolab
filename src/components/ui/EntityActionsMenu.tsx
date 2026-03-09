'use client';

import Link from 'next/link';
import { Settings2 } from 'lucide-react';

type MenuItem = {
  label: string;
  href?: string;
  newTab?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  hint?: string;
};

type EntityActionsMenuProps = {
  items: MenuItem[];
  buttonLabel?: string;
};

export default function EntityActionsMenu({ items, buttonLabel = 'Opciones' }: EntityActionsMenuProps) {
  return (
    <details className="relative group">
      <summary className="list-none cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
        <Settings2 size={14} />
        {buttonLabel}
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        <ul className="py-1">
          {items.map((item) => {
            const baseClassName = `block w-full px-3 py-2 text-left text-sm ${
              item.disabled
                ? 'cursor-not-allowed text-gray-400'
                : item.destructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
            }`;

            return (
              <li key={item.label}>
                {item.href && !item.disabled ? (
                  <Link
                    href={item.href}
                    className={baseClassName}
                    target={item.newTab ? '_blank' : undefined}
                    rel={item.newTab ? 'noopener noreferrer' : undefined}
                  >
                    <div>{item.label}</div>
                    {item.hint && <div className="text-xs text-gray-500">{item.hint}</div>}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={item.onClick}
                    className={baseClassName}
                  >
                    <div>{item.label}</div>
                    {item.hint && <div className="text-xs text-gray-500">{item.hint}</div>}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
