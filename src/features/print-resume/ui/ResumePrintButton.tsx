"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ResumePrintButton({ children, className }: Props) {
  return (
    <a
      className={className}
      id="resumeBtn"
      href="/resume.pdf"
      download="Luka-Khimshiashvili-Resume.pdf"
    >
      {children}
    </a>
  );
}
