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
      autoClose={2600}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="light"
      transition={Slide}
      limit={4}
      icon={({ type }) => {
        if (type === 'success') {
          return (
            <span className="app-toast__icon app-toast__icon--success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          );
        }

        if (type === 'error') {
          return (
            <span className="app-toast__icon app-toast__icon--error">
              <XCircle className="h-4 w-4" />
            </span>
          );
        }

        if (type === 'warning') {
          return (
            <span className="app-toast__icon app-toast__icon--warning">
              <AlertTriangle className="h-4 w-4" />
            </span>
          );
        }

        return (
          <span className="app-toast__icon app-toast__icon--info">
            <Info className="h-4 w-4" />
          </span>
        );
      }}
      toastClassName={(context) =>
        [
          'app-toast group overflow-hidden rounded-[1.4rem] border bg-white shadow-2xl',
          'min-h-[80px] w-[25rem] max-w-[calc(100vw-1rem)] text-slate-900 ring-1 ring-white/80',
          context?.type === 'success' ? 'app-toast--success' : '',
          context?.type === 'error' ? 'app-toast--error' : '',
          context?.type === 'warning' ? 'app-toast--warning' : '',
          context?.type === 'info' ? 'app-toast--info' : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
      progressClassName="app-toast__progress"
      closeButton={({ closeToast }) => (
        <button
          type="button"
          onClick={closeToast}
          className="app-toast__close"
          aria-label="Cerrar notificacion"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      className="!top-5 !right-5 text-sm"
    />
  );
}
