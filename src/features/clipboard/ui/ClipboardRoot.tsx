"use client";

import { useEffect } from "react";

/**
 * Global copy-to-clipboard for any `[data-copy]` element (e.g. the contact
 * "Copy email" button). Briefly swaps the label to a confirmation.
 */
export function ClipboardRoot() {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-copy]",
      );
      if (!btn) return;
      e.preventDefault();
      const text = btn.dataset.copy ?? "";
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return;
      }
      if (btn.dataset.label == null) {
        btn.dataset.label = btn.textContent ?? "";
      }
      btn.classList.add("copied");
      btn.textContent = "Copied ✓";
      window.setTimeout(() => {
        btn.textContent = btn.dataset.label ?? "";
        btn.classList.remove("copied");
      }, 1600);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
