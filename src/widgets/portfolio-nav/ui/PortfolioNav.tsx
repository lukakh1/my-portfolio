import { NavClock, NavIndicator } from "@/features/nav-runtime";
import { navLinks } from "@/shared/config/portfolio-content";

import { BrandMark } from "./BrandMark";

const mainLinks = navLinks.filter((l) => l.className !== "nav-cta");
const ctaLink = navLinks.find((l) => l.className === "nav-cta");

export function PortfolioNav() {
  return (
    <nav className="nav" id="nav">
      <NavIndicator />
      <div className="nav-shell">
        <a href="#top" className="brand" data-magnetic aria-label="Luka Khimshiashvili — home">
          <BrandMark />
          <span className="brand-name">Luka Khimshiashvili</span>
        </a>

        <div className="nav-links">
          <span className="nav-ind" aria-hidden />
          {mainLinks.map((link) => (
            <a key={link.href} href={link.href} className={link.className}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <NavClock />
          {ctaLink ? (
            <a href={ctaLink.href} className="nav-cta">
              {ctaLink.label}
            </a>
          ) : null}
          {/* Below 880px the .nav-links row is hidden and this takes over. */}
          <button
            type="button"
            className="nav-burger"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="navSheet"
            data-nav-toggle
          >
            <span className="nav-burger-bar" aria-hidden />
            <span className="nav-burger-bar" aria-hidden />
          </button>
        </div>
      </div>

      {/* Full-screen section menu for narrow viewports. Deliberately NOT
          `.nav-links` — NavIndicator does a bare querySelector(".nav-links")
          and would otherwise measure this instead of the desktop row.
          `hidden` is cleared by MobileNavRoot one frame before the open
          class lands, so the clip-path transition actually runs. */}
      <div className="nav-sheet" id="navSheet" hidden>
        <nav className="nav-sheet-links" aria-label="Sections">
          {mainLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              style={{ "--i": i } as React.CSSProperties}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {ctaLink ? (
          <a href={ctaLink.href} className="btn btn-primary nav-sheet-cta">
            {ctaLink.label}
          </a>
        ) : null}
      </div>
    </nav>
  );
}
