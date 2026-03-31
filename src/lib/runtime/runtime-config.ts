import { isDesktopApp } from "@/lib/runtime/platform";
import { isTauriBridgeAvailable } from "@/lib/runtime/tauri-bridge";

export type RuntimeConfig = {
  apiBaseUrl: string;
  platform: "web" | "desktop";
  isDesktop: boolean;
  isOfflineCapable: boolean;
  hasDesktopBridge: boolean;
};

export const DESKTOP_API_BASE_URL_STORAGE_KEY = "econolab.runtime.api-base-url";
export const DEFAULT_DESKTOP_API_BASE_URL = "http://127.0.0.1:3000/api";

function normalizeBaseUrl(value?: string): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

function readStoredDesktopApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeBaseUrl(
      window.localStorage.getItem(DESKTOP_API_BASE_URL_STORAGE_KEY) ?? "",
    );
  } catch {
    return "";
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  const isDesktop = isDesktopApp();
  const hasDesktopBridge = isTauriBridgeAvailable();
  const sharedApiBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "",
  );
  const desktopApiBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_DESKTOP_API_URL ?? "",
  );
  const storedDesktopApiBaseUrl = isDesktop ? readStoredDesktopApiBaseUrl() : "";
  const apiBaseUrl = isDesktop
    ? storedDesktopApiBaseUrl ||
      desktopApiBaseUrl ||
      DEFAULT_DESKTOP_API_BASE_URL ||
      sharedApiBaseUrl
    : sharedApiBaseUrl;

  return {
    apiBaseUrl,
    platform: isDesktop ? "desktop" : "web",
    isDesktop,
    isOfflineCapable: isDesktop,
    hasDesktopBridge,
  };
}
