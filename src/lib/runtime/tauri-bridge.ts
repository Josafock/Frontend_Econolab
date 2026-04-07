"use client";

import type { FilePayload } from "@/lib/files/file-service";

type TauriGlobal = {
  core?: {
    invoke?: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
  };
};

function getTauriGlobal(): TauriGlobal | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as typeof window & { __TAURI__?: TauriGlobal })
    .__TAURI__;
  if (!candidate?.core?.invoke) {
    return null;
  }

  return candidate;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

async function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T | null> {
  const tauri = getTauriGlobal();
  if (!tauri?.core?.invoke) {
    return null;
  }

  try {
    return await tauri.core.invoke<T>(command, args);
  } catch {
    return null;
  }
}

export function isTauriBridgeAvailable(): boolean {
  return Boolean(getTauriGlobal()?.core?.invoke);
}

export async function saveDesktopFile(
  file: FilePayload,
  options?: { openAfterSave?: boolean },
): Promise<{ path?: string | null } | null> {
  const base64 = await blobToBase64(file.blob);
  return invokeTauri<{ path?: string | null }>("desktop_save_file", {
    filename: file.filename,
    contentType: file.contentType,
    dataBase64: base64,
    openAfterSave: options?.openAfterSave ?? false,
  });
}

export async function getDesktopStoredValue(key: string): Promise<string | null> {
  return invokeTauri<string | null>("desktop_store_get", { key });
}

export async function setDesktopStoredValue(
  key: string,
  value: string,
): Promise<boolean> {
  const result = await invokeTauri<boolean>("desktop_store_set", { key, value });
  return Boolean(result);
}

export async function deleteDesktopStoredValue(key: string): Promise<boolean> {
  const result = await invokeTauri<boolean>("desktop_store_delete", { key });
  return Boolean(result);
}

export async function notifyDesktopAppReady(): Promise<boolean> {
  const result = await invokeTauri<boolean>("desktop_notify_app_ready");
  return Boolean(result);
}
