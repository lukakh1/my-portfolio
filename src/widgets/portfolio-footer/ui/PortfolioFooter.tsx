import { FooterYear } from "@/features/footer-year";

export function PortfolioFooter() {
  return (
    <footer>
      <div className="container foot-telemetry" aria-hidden>
        <span>● Signal nominal</span>
        <span>End of transmission</span>
        <span>42.27°N 42.70°E</span>
      </div>
      <div className="container foot-inner">
        <div>
          © <FooterYear /> Luka Khimshiashvili — built with Next.js, React, and
          TypeScript.
        </div>
        <div className="foot-right">
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
