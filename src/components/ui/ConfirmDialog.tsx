"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import AppModal from "@/components/ui/AppModal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const toneClasses =
    tone === "warning"
      ? {
          badge: "border-amber-200 bg-amber-50 text-amber-700",
          icon: "bg-amber-100 text-amber-700",
          button: "bg-amber-600 hover:bg-amber-700",
        }
      : {
          badge: "border-rose-200 bg-rose-50 text-rose-700",
          icon: "bg-rose-100 text-rose-700",
          button: "bg-red-600 hover:bg-red-700",
        };

  return (
    <AppModal>
      <div className="mx-auto w-full max-w-xl">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-2xl sm:rounded-[2rem]">
          <div className="border-b border-gray-200 bg-gradient-to-r from-slate-950 via-slate-900 to-red-800 p-4 text-white sm:p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
              <span
                className={`rounded-full border px-2 py-1 ${toneClasses.badge}`}
              >
                Confirmacion
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className={`rounded-2xl p-3 ${toneClasses.icon}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-white/75">{message}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:flex-row sm:p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="app-interactive-button flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-gray-50 hover:shadow-md hover:shadow-red-100/50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`app-interactive-button inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:shadow-lg disabled:opacity-50 ${toneClasses.button}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
