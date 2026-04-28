import { skillCategories } from "@/shared/config/portfolio-content";

import { SkillIcon } from "./skill-icons";

const DELAY_PATTERN = new Set([1, 2, 4, 5]);

export function PortfolioSkills() {
  return (
    <section id="skills">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">Skills · 03</div>
          <h2 className="reveal" data-delay="1">
            My stack.
          </h2>
          <p className="sub reveal" data-delay="2">
            The tools I reach for day-to-day.
          </p>
        </div>

        <div className="skills-grid">
          {skillCategories.map((cat, index) => (
            <div
              key={cat.id}
              className="skill-card reveal"
              data-delay={DELAY_PATTERN.has(index) ? "1" : undefined}
              style={cat.wide ? { gridColumn: "1 / -1" } : undefined}
            >
              <div className="skill-head">
                <div className="skill-ic">
                  <SkillIcon id={cat.id} />
                </div>
                <h3>
                  {cat.title}
                  {cat.subtitle ? (
                    <span
                      style={{
                        color: "var(--ink-mute)",
                        fontWeight: 400,
                        fontSize: 13,
                        marginLeft: 8,
                      }}
                    >
                      {cat.subtitle}
                    </span>
                  ) : null}
                </h3>
              </div>
              <div className="pill-row">
                {cat.pills.map((pill) => (
                  <span key={pill} className="pill">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
