import { projects } from "@/shared/config/portfolio-content";

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

const DELAY_INDICES = new Set([1, 2, 4, 5]);

export function PortfolioProjects() {
  return (
    <section id="projects">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">Projects · 04</div>
          <h2 className="reveal" data-delay="1">
            Some things I&apos;ve built.
          </h2>
          <p className="sub reveal" data-delay="2">
            A few public projects on GitHub — apps, APIs, and tools.
          </p>
        </div>

        <div className="proj-grid" id="projGrid">
          {projects.map((proj, index) => (
            <a
              key={proj.href + proj.title}
              className="proj reveal"
              data-delay={DELAY_INDICES.has(index) ? "1" : undefined}
              href={proj.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="proj-head">
                <span className="proj-tag">{proj.tag}</span>
              </div>
              <h3>{proj.title}</h3>
              <p>{proj.description}</p>
              <div className="proj-foot">
                <div className="pill-row">
                  {proj.pills.map((p) => (
                    <span key={p} className="pill">
                      {p}
                    </span>
                  ))}
                </div>
                <span className="proj-link" aria-label="View on GitHub">
                  <ExternalIcon />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
