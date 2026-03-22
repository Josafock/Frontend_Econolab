"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type UseHashSectionScrollOptions = {
  enabled?: boolean;
  behavior?: ScrollBehavior;
  retries?: number;
  retryDelayMs?: number;
};

export function useHashSectionScroll({
  enabled = true,
  behavior = "smooth",
  retries = 12,
  retryDelayMs = 90,
}: UseHashSectionScrollOptions = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let timeoutId: number | null = null;
    let cancelled = false;

    const scrollToHashTarget = (attempt = 0) => {
      if (cancelled) {
        return;
      }

      const rawHash = window.location.hash.replace(/^#/, "");
      if (!rawHash) {
        return;
      }

      const target = document.getElementById(decodeURIComponent(rawHash));

      if (!target) {
        if (attempt < retries) {
          timeoutId = window.setTimeout(() => {
            scrollToHashTarget(attempt + 1);
          }, retryDelayMs);
        }
        return;
      }

      target.scrollIntoView({
        behavior,
        block: "start",
      });
    };

    scrollToHashTarget();

    const handleHashChange = () => {
      scrollToHashTarget();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [behavior, enabled, pathname, retries, retryDelayMs, searchKey]);
}
