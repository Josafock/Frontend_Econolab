function readGlobalFlag(flag: string): unknown {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as typeof window & Record<string, unknown>)[flag];
}

export function isDesktopApp(): boolean {
  return Boolean(readGlobalFlag("__TAURI__") ?? readGlobalFlag("__TAURI_INTERNALS__"));
}

export function isWebApp(): boolean {
  return !isDesktopApp();
}

