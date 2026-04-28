import { FooterYear } from "@/features/footer-year";

export function PortfolioFooter() {
  return (
    <footer>
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
