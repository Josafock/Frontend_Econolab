import { isDesktopApp } from "@/lib/runtime/platform";
import { isTauriBridgeAvailable } from "@/lib/runtime/tauri-bridge";

export type RuntimeConfig = {
  apiBaseUrl: string;
  platform: "web" | "desktop";
  isDesktop: boolean;
  isOfflineCapable: boolean;
  hasDesktopBridge: boolean;
};

function normalizeBaseUrl(value?: string): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function getRuntimeConfig(): RuntimeConfig {
  const apiBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "",
  );
  const isDesktop = isDesktopApp();
  const hasDesktopBridge = isTauriBridgeAvailable();

  return {
    apiBaseUrl,
    platform: isDesktop ? "desktop" : "web",
    isDesktop,
    isOfflineCapable: isDesktop,
    hasDesktopBridge,
  };
}
