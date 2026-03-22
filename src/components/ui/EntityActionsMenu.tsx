"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";

type MenuItem = {
  label: string;
  href?: string;
  newTab?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  hint?: string;
  icon?: ReactNode;
};

type EntityActionsMenuProps = {
  items: MenuItem[];
  buttonLabel?: string;
};

const OPEN_MENU_EVENT = "entity-actions-menu:open";

export default function EntityActionsMenu({
  items,
  buttonLabel = "Opciones",
}: EntityActionsMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenMenu = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== menuId) {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener(OPEN_MENU_EVENT, handleOpenMenu as EventListener);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        OPEN_MENU_EVENT,
        handleOpenMenu as EventListener,
      );
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuId]);

  const toggleMenu = () => {
    const nextOpen = !isOpen;
    if (nextOpen) {
      window.dispatchEvent(
        new CustomEvent(OPEN_MENU_EVENT, { detail: menuId }),
      );
    }
    setIsOpen(nextOpen);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        className="app-interactive-button inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-red-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:shadow-red-100/60"
      >
        <Settings2 size={14} />
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <ul className="py-1.5">
            {items.map((item) => {
              const baseClassName = `block w-full px-4 py-3 text-left text-sm ${
                item.disabled
                  ? "cursor-not-allowed text-gray-400"
                  : item.destructive
                    ? "app-interactive-list-item text-red-600 hover:bg-red-50"
                    : "app-interactive-list-item text-gray-700 hover:bg-gray-50"
              }`;

              const content = (
                <div className="flex items-start gap-3">
                  {item.icon ? (
                    <span className="mt-0.5 shrink-0 text-gray-400">
                      {item.icon}
                    </span>
                  ) : null}
                  <div>
                    <div className="font-medium">{item.label}</div>
                  </div>
                </div>
              );

              return (
                <li key={item.label}>
                  {item.href && !item.disabled ? (
                    <Link
                      href={item.href}
                      className={baseClassName}
                      target={item.newTab ? "_blank" : undefined}
                      rel={item.newTab ? "noopener noreferrer" : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        item.onClick?.();
                        setIsOpen(false);
                      }}
                      className={baseClassName}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
