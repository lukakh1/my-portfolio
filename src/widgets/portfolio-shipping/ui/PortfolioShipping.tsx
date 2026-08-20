import { PhysicsText } from "@/features/physics-text";
import { shipSteps } from "@/shared/config/portfolio-content";

import { ShipIcon } from "./ship-icons";

/**
 * "How I ship" — the section that says what happens to the code after it is
 * written. Deliberately reuses the .skills-grid / .skill-card system rather
 * than inventing a parallel one: the visual weight should read as a sibling
 * of Skills, not as a louder competitor to it.
 */
export function PortfolioShipping() {
  return (
    <section id="shipping">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">How I ship · 04</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "After the merge." }]} />
          </h2>
          <p className="sub reveal" data-delay="2">
            Writing the code is half of it. This is the other half.
          </p>
        </div>

        <div className="skills-grid">
          {shipSteps.map((step, index) => (
            <div
              key={step.id}
              className="skill-card reveal"
              data-delay={index === 1 || index === 2 ? "1" : undefined}
              style={step.wide ? { gridColumn: "1 / -1" } : undefined}
            >
              <div className="skill-head">
                <div className="skill-ic">
                  <ShipIcon id={step.id} />
                </div>
                <h3>{step.title}</h3>
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--ink-body)",
                  marginBottom: 16,
                }}
              >
                {step.body}
              </p>
              <div className="pill-row">
                {step.pills.map((pill) => (
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
