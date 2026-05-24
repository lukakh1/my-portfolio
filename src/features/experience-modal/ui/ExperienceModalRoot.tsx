"use client";

import { useCallback, useEffect, useState } from "react";

import { lenisInstance } from "@/features/smooth-scroll/lib/lenis-instance";
import { experience } from "@/shared/config/portfolio-content";

/**
 * Opens a detail modal when an experience card ([data-exp]) is clicked or
 * activated via keyboard. Shows the product's screenshot gallery, role/dates,
 * achievements, and a live link. Locks background scroll (stops Lenis) while open.
 */
export function ExperienceModalRoot() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const entry = activeId
    ? experience.find((e) => e.id === activeId) ?? null
    : null;
  const product = entry?.product ?? null;

  const open = useCallback((id: string) => {
    setActiveId(id);
    setImgIndex(0);
  }, []);
  const close = useCallback(() => setActiveId(null), []);

  // Delegated open (click + keyboard) on experience cards.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-exp]",
      );
      if (card?.dataset.exp) open(card.dataset.exp);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-exp]",
      );
      if (card?.dataset.exp) {
        e.preventDefault();
        open(card.dataset.exp);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Scroll-lock + ESC while open.
  useEffect(() => {
    if (!entry) return;
    const lenis = lenisInstance.get();
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [entry, close]);

  if (!entry || !product) return null;

  let host: string | null = null;
  if (product.url) {
    try {
      host = new URL(product.url).hostname.replace(/^www\./, "");
    } catch {
      host = product.url;
    }
  }

  return (
    <div className="exp-modal-backdrop" role="presentation" onClick={close}>
      <div
        className="exp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="exp-modal-close"
          onClick={close}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="exp-modal-media">
          <img
            className="exp-modal-img"
            src={product.images[imgIndex]}
            alt={`${product.name} screenshot ${imgIndex + 1}`}
          />
          {product.images.length > 1 ? (
            <div className="exp-modal-thumbs">
              {product.images.map((src, i) => (
                <button
                  type="button"
                  key={src}
                  className={`exp-thumb${i === imgIndex ? " active" : ""}`}
                  onClick={() => setImgIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="exp-modal-body">
          <div className="exp-modal-meta">
            {entry.badge ? <span className="tl-badge">{entry.badge}</span> : null}
            <span className="tl-date">{entry.date}</span>
          </div>
          <h3 className="exp-modal-title">{product.name}</h3>
          <div className="exp-modal-role">
            {entry.title} · <span className="org">{entry.companyAccent}</span>
          </div>
          <p className="exp-modal-blurb">{product.blurb}</p>
          <ul className="tl-list exp-modal-list">
            {entry.bullets.map((b) =>
              typeof b === "string" ? (
                <li key={b}>{b}</li>
              ) : (
                <li key={b.strong}>
                  <strong style={{ color: "#fff" }}>{b.strong}</strong>
                  {b.rest}
                </li>
              ),
            )}
          </ul>
          {product.url ? (
            <a
              className="btn btn-primary exp-modal-link"
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit {host} ↗
            </a>
          ) : (
            <span className="exp-modal-soon">Live preview coming soon</span>
          )}
        </div>
      </div>
    </div>
  );
}
