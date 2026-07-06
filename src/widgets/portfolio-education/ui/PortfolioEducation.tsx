import { kiuCoursePills } from "@/shared/config/portfolio-content";

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
          <div className="eyebrow reveal">Education · 05</div>
          <h2 className="reveal" data-delay="1">
            Theory and practice, side by side.
          </h2>
          <p className="sub reveal" data-delay="2">
            A scholarship-funded CS degree built on Georgia&apos;s strongest
            math-and-physics foundation.
          </p>
        </div>

        <div className="edu-grid">
          <div className="edu reveal">
            <div className="badge-row">
              <span className="edu-badge grad">Expected 2026</span>
              <span className="edu-badge">B.Sc. Computer Science</span>
            </div>
            <h3>Kutaisi International University</h3>
            <div className="deg">B.Sc. Computer Science · Kutaisi, Georgia</div>
            <p className="note">
              Building a rigorous CS foundation alongside the day job — DSA,
              software engineering, OS, computer architecture, and theory of
              computation, taught in English.
            </p>
            <div className="scholarship">
              <IconGradCap />
              <span>
                <strong style={{ color: "var(--ink)" }}>
                  100% tuition scholarship
                </strong>{" "}
                — earned via national exam results.
              </span>
            </div>
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

          <div className="edu reveal" data-delay="1">
            <div className="badge-row">
              <span className="edu-badge gold">
                ★ National exam high achiever
              </span>
              <span className="edu-badge">Graduated 2022</span>
            </div>
            <h3>Komarovi School Pansion</h3>
            <div className="deg">High School Diploma · Tbilisi, Georgia</div>
            <p className="note">
              Specialization in{" "}
              <strong>Mathematics & Physics</strong> at Komarovi — widely
              regarded as the most prestigious boarding school in Georgia, and
              the country&apos;s strongest pipeline into competitive STEM
              programs.
            </p>
            <div className="scholarship">
              <IconStar />
              <span>
                National-exam results that translated directly into a full
                university scholarship.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
