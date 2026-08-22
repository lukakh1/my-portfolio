import { kiuCoursePills } from "@/shared/config/portfolio-content";
import { PhysicsText } from "@/features/physics-text";

function IconGradCap() {
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
      <circle cx="12" cy="8" r="6" />
      <polyline points="8 14 8 22 12 19 16 22 16 14" />
    </svg>
  );
}

function IconStar() {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function PortfolioEducation() {
  return (
    <section id="education">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">Education · 06</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "Theory and practice, side by side." }]} />
          </h2>
          <p className="sub reveal" data-delay="2">
            A CS degree earned alongside the day job — and where the
            infrastructure work happened.
          </p>
        </div>

        {/*
          Stacked full-width rows, NOT two columns.
          Side by side, the two cards were stretched to a common 867px while the
          school card's content ended at 317px — 550px of dead white space, 63%
          of the card empty. Stacked, each row is only as tall as it needs to be.
          Inside each row, .edu-head / .edu-body split into two columns on wide
          screens so the full-width rows don't produce unreadable line lengths.
        */}
        <div className="edu-grid">
          <div className="edu reveal">
            <div className="edu-head">
              <div className="badge-row">
                <span className="edu-badge grad">Graduated 2026</span>
                <span className="edu-badge">B.Sc. Computer Science</span>
              </div>
              <h3>Kutaisi International University</h3>
              <div className="deg">
                B.Sc. Computer Science · Kutaisi, Georgia
              </div>
              <div className="scholarship">
                <IconGradCap />
                <span>
                  <strong style={{ color: "var(--ink)" }}>
                    100% tuition scholarship
                  </strong>{" "}
                  — earned via national exam results.
                </span>
              </div>
            </div>
            <div className="edu-body">
              <p className="note">
                A rigorous CS foundation built alongside the day job —
                algorithms and data structures, software engineering, operating
                systems and systems programming, computer architecture,
                databases and theory of computation, taught in English.
              </p>
              <p className="note" style={{ marginTop: 12 }}>
                For the{" "}
                <strong>
                  DevOps and Software Engineering practical courses
                </strong>{" "}
                I set up and ran an AWS deployment stack from scratch — EC2 on
                Ubuntu, nginx as reverse proxy, a load balancer, CloudFront,
                RDS MySQL, Memcached and Docker — used by students and faculty
                across the year.
              </p>
              <div className="courses">
                <div className="label">Coursework</div>
                <div className="pill-row">
                  {kiuCoursePills.map((pill) => (
                    <span key={pill} className="pill">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="edu reveal" data-delay="1">
            <div className="edu-head">
              <div className="badge-row">
                <span className="edu-badge gold">
                  ★ National exam high achiever
                </span>
                <span className="edu-badge">Graduated 2022</span>
              </div>
              <h3>Komarovi Physics &amp; Mathematics School</h3>
              <div className="deg">High School Diploma · Tbilisi, Georgia</div>
              <div className="scholarship">
                <IconStar />
                <span>
                  National-exam results that translated directly into a full
                  university scholarship.
                </span>
              </div>
            </div>
            <div className="edu-body">
              <p className="note">
                Six years in the{" "}
                {/* Explicit {" "} after </strong>: the text node that follows
                    spans several lines, and the JSX transform trims its leading
                    whitespace — which rendered "Physicsstream at Komarovi". */}
                <strong>Mathematics &amp; Physics</strong>{" "}
                stream at Komarovi — public school N199, one of Georgia&apos;s
                most selective. Entry is by examination from the seventh grade,
                and the specialization runs ten mathematics and physics
                examinations a year.
              </p>
              <p className="note" style={{ marginTop: 12 }}>
                I took my first developer job in 2019, three years before
                finishing here, and worked through the rest of school. The
                national exams at the end of it covered my university tuition
                in full.
              </p>
              <div className="courses">
                <div className="label">Focus</div>
                <div className="pill-row">
                  <span className="pill">Mathematics</span>
                  <span className="pill">Physics</span>
                  <span className="pill">National exams, 2022</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
