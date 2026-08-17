import { contactEmail, urls } from "@/shared/config/portfolio-content";

export function PortfolioPrintHeader() {
  return (
    <header className="print-only print-header">
      <div>
        <h1>Luka Khimshiashvili</h1>
        <div className="role">
          Full-Stack Software Developer · Building since age 15
        </div>
      </div>
      <div className="print-meta">
        <div>
          <a href={urls.mailto}>{contactEmail}</a>
        </div>
        <div>(+995) 591 193 540 · Tbilisi, Georgia</div>
        <div>
          <a href={urls.github}>github.com/lukakh1</a>
          {" · "}
          <a href={urls.linkedin}>linkedin.com/in/luka-khimshiashvili</a>
        </div>
      </div>
    </header>
  );
}
