import { projects } from "@/shared/config/portfolio-content";
import { PhysicsText } from "@/features/physics-text";

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
          <div className="eyebrow reveal">Projects · 05</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "Some things I’ve built." }]} />
          </h2>
          <p className="sub reveal" data-delay="2">
            Products I built and shipped — most of them on my own.
            <span className="proj-hint" aria-hidden>
              {" "}
              Psst — on desktop you can toss these cards around.
            </span>
          </p>
          <button className="btn tidy-btn" data-tidy hidden type="button">
            Tidy up
          </button>
        </div>

        <div className="proj-grid" id="projGrid">
          {projects.map((proj, index) => {
            const delay = DELAY_INDICES.has(index) ? "1" : undefined;
            const body = (
              <>
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
                  {proj.href ? (
                    <span className="proj-link" aria-label="Open project">
                      <ExternalIcon />
                    </span>
                  ) : null}
                </div>
              </>
            );

            // Coursework and unpublished work have no public URL. Rendering a
            // plain <div> keeps the card in .proj-grid — and in the drag and
            // glow features, which both query .proj — without shipping an
            // anchor that goes nowhere.
            return proj.href ? (
              <a
                key={proj.href + proj.title}
                className="proj reveal"
                data-delay={delay}
                href={proj.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={proj.title} className="proj reveal" data-delay={delay}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
