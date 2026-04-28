"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ResumePrintButton({ children, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      id="resumeBtn"
      onClick={() => window.print()}
    >
      {children}
    </button>
  );
}
