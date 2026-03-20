'use client';

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type ConfirmTone = 'danger' | 'warning';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
  }>({
    open: false,
    title: '',
    message: '',
  });

  const closeDialog = (confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setDialogState((current) => ({ ...current, open: false }));
  };

  const value = useMemo<ConfirmDialogContextValue>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setDialogState({
            open: true,
            title: options.title,
            message: options.message,
            confirmLabel: options.confirmLabel,
            cancelLabel: options.cancelLabel,
            tone: options.tone,
          });
        }),
    }),
    [],
  );

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        tone={dialogState.tone}
        onClose={() => closeDialog(false)}
        onConfirm={() => closeDialog(true)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error('useConfirmDialog debe usarse dentro de ConfirmDialogProvider.');
  }

  return context.confirm;
}
