"use client";

import { useEffect } from "react";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import { notifyDesktopAppReady } from "@/lib/runtime/tauri-bridge";

const READY_RETRY_MS = 250;
const MAX_READY_ATTEMPTS = 8;

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForDesktopPaint() {
  const fonts = (document as Document & {
    fonts?: {
      ready?: Promise<unknown>;
    };
  }).fonts;

  if (fonts?.ready) {
    await fonts.ready.catch(() => undefined);
  }

  await nextAnimationFrame();
  await nextAnimationFrame();
}

export default function DesktopStartupReady() {
  useEffect(() => {
    const runtime = getRuntimeConfig();
    if (!runtime.isDesktop || !runtime.hasDesktopBridge) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let retryTimer: number | null = null;

    const markReady = async () => {
      if (cancelled) {
        return;
      }

      await waitForDesktopPaint();

      const notified = await notifyDesktopAppReady();
      if (cancelled || notified) {
        return;
      }

      if (attempts >= MAX_READY_ATTEMPTS) {
        return;
      }

      attempts += 1;
      retryTimer = window.setTimeout(() => {
        void markReady();
      }, READY_RETRY_MS);
    };

    const handleLoad = () => {
      void markReady();
    };

    if (document.readyState === "complete") {
      void markReady();
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", handleLoad);
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  return null;
}
