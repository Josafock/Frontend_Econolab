"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import AppModal from "@/components/ui/AppModal";

type ModalProps = {
  children: ReactNode;
};

type ModalPanelProps = {
  children: ReactNode;
  widthClassName?: string;
  className?: string;
};

type ModalHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
  closeDisabled?: boolean;
  className?: string;
  descriptionClassName?: string;
};

type ModalSectionProps = {
  children: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Modal({ children }: ModalProps) {
  return <AppModal>{children}</AppModal>;
}

export function ModalPanel({
  children,
  widthClassName = "max-w-5xl",
  className,
}: ModalPanelProps) {
  return (
    <div className={joinClasses("mx-auto w-full", widthClassName)}>
      <div
        className={joinClasses(
          "flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  description,
  icon,
  onClose,
  closeDisabled = false,
  className,
  descriptionClassName,
}: ModalHeaderProps) {
  return (
    <div
      className={joinClasses(
        "border-b border-gray-200 p-4 text-white sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/30 bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
              {icon}
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
            {description ? (
              <p className={joinClasses("mt-1 text-sm", descriptionClassName)}>
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            disabled={closeDisabled}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ModalBody({ children, className }: ModalSectionProps) {
  return (
    <div
      className={joinClasses(
        "min-h-0 flex-1 overflow-y-auto p-4 pb-6 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalSectionProps) {
  return (
    <div
      className={joinClasses(
        "flex flex-col gap-3 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 md:flex-row",
        className,
      )}
    >
      {children}
    </div>
  );
}
