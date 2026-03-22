"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

const AppModal = dynamic(() => import("@/components/ui/AppModal"));

type CatalogExcelModalProps = {
  trigger: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function CatalogExcelModal({
  trigger,
  title,
  subtitle,
  children,
}: CatalogExcelModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>

      {open ? (
        <AppModal>
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]">
              <div className="border-b border-gray-200 bg-gradient-to-r from-slate-900 via-slate-800 to-red-700 p-4 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold sm:text-2xl">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-white/80">{subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6">
                {children}
              </div>
            </div>
          </div>
        </AppModal>
      ) : null}
    </>
  );
}
