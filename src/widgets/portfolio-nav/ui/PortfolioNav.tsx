import { NavClock, NavIndicator } from "@/features/nav-runtime";
import { navLinks } from "@/shared/config/portfolio-content";

const mainLinks = navLinks.filter((l) => l.className !== "nav-cta");
const ctaLink = navLinks.find((l) => l.className === "nav-cta");

export function PortfolioNav() {
  return (
    <nav className="nav" id="nav">
      <NavIndicator />
      <div className="nav-shell">
        <a href="#top" className="brand" data-magnetic aria-label="Luka Khimshiashvili — home">
          <span className="brand-mark" aria-hidden>
            L
          </span>
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
        </div>
      </div>
    </nav>
  );
}
