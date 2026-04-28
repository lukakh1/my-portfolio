import { navLinks } from "@/shared/config/portfolio-content";

export function PortfolioNav() {
  return (
    <nav className="nav" id="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand">
          <span className="brand-mark">L</span>
          <span>Luka Khimshiashvili</span>
        </a>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={link.className}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
