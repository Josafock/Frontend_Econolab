'use client';

import { isValidElement, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import {
  Slide,
  toast,
  ToastContainer,
  type Id,
  type ToastContent,
  type ToastOptions,
} from 'react-toastify';
import 'react-toastify/ReactToastify.css';

function AppToastContent({ content }: { content: ReactNode }) {
  return (
    <div className="app-toast__content">
      <p className="app-toast__message">{content}</p>
    </div>
  );
}

function normalizeToastContent(content: ReactNode) {
  if (content == null || typeof content === 'boolean') {
    return content;
  }

  if (isValidElement(content)) {
    return content;
  }

  return <AppToastContent content={content} />;
}

let isToastContentPatched = false;

function patchToastContent() {
  if (isToastContentPatched) {
    return;
  }

  isToastContentPatched = true;

  type ToastMethod = <TData = unknown>(
    content: ToastContent<TData>,
    options?: ToastOptions<TData>
  ) => Id;

  const wrapMethod = (method: ToastMethod): ToastMethod =>
    ((content, options) => {
      if (typeof content === 'function') {
        return method(content, options);
      }

      return method(normalizeToastContent(content), options);
    }) as ToastMethod;

  toast.success = wrapMethod(toast.success);
  toast.error = wrapMethod(toast.error);
  toast.info = wrapMethod(toast.info);
  toast.warning = wrapMethod(toast.warning);
  toast.warn = wrapMethod(toast.warn);
  toast.loading = wrapMethod(toast.loading);
}

patchToastContent();

export default function ToastNotification() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={1800}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="light"
      transition={Slide}
      limit={4}
      icon={({ type }) => {
        const base = "flex items-center justify-center rounded-full p-2";

        if (type === 'success') {
          return (
            <span className={`${base} bg-emerald-100 text-emerald-600`}>
              <CheckCircle2 className="h-5 w-5" />
            </span>
          );
        }

        if (type === 'error') {
          return (
            <span className={`${base} bg-red-100 text-red-600`}>
              <XCircle className="h-5 w-5" />
            </span>
          );
        }

        if (type === 'warning') {
          return (
            <span className={`${base} bg-amber-100 text-amber-600`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
          );
        }

        return (
          <span className={`${base} bg-blue-100 text-blue-600`}>
            <Info className="h-5 w-5" />
          </span>
        );
      }}
      toastClassName={() =>
        [
          "group relative flex items-center gap-3",
          "rounded-2xl border border-slate-200 bg-white",
          "shadow-lg",
          "px-4 py-3",
          "min-h-[64px]",
          "w-[22rem] sm:w-[24rem] max-w-[calc(100vw-1.5rem)]",
          "overflow-hidden", // 🔥 CLAVE para la barra
        ].join(" ")
      }
      progressClassName="h-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200"
      closeButton={({ closeToast }) => (
        <button
          onClick={closeToast}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      className="!top-6 !right-6"
    />
  );
}
