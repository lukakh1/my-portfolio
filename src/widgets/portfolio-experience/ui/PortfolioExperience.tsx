import { PhysicsText } from "@/features/physics-text";
import {
  experience,
  type ExperienceEntry,
} from "@/shared/config/portfolio-content";

function Bullet({
  item,
}: {
  item: string | { strong: string; rest: string };
}) {
  if (typeof item === "string") {
    return <li>{item}</li>;
  }
  return (
    <li>
      <strong style={{ color: "var(--ink)" }}>{item.strong}</strong>
      {item.rest}
    </li>
  );
}

const REVEAL_DELAY_INDICES = new Set([1, 2, 4, 6]);

function TimelineItem({
  entry,
  index,
}: {
  entry: ExperienceEntry;
  index: number;
}) {
  const revealDelay = REVEAL_DELAY_INDICES.has(index) ? "1" : undefined;
  const className = ["tl-item", "reveal", entry.current ? "current" : ""]
    .filter(Boolean)
    .join(" ");
  const product = entry.product;

  return (
    <li className={className} data-delay={revealDelay}>
      <span className="tl-dot" />
      {/* The card keeps [data-exp] so a click anywhere on it still opens the
          modal, but it is no longer a fake button: it contains an <h3> and a
          <ul>, which a real <button> may not. The keyboard affordance is the
          real button rendered in place of .tl-hint below. */}
      <div className="tl-card" data-exp={product ? entry.id : undefined}>
        <div className="tl-card-inner">
          <div className="tl-card-face tl-card-front">
            <div className="tl-meta">
              {entry.badge ? (
                <span className="tl-badge">{entry.badge}</span>
              ) : null}
              <span className="tl-date">{entry.date}</span>
            </div>
            <h3>{entry.title}</h3>
            <div className="tl-company">
              <span className="org">{entry.companyAccent}</span>
              {entry.companySuffix}
            </div>
            <ul className="tl-list">
              {entry.bullets.map((b, i) => (
                <Bullet
                  key={
                    typeof b === "string"
                      ? `${entry.id}-${i}`
                      : `${entry.id}-${b.strong}`
                  }
                  item={b}
                />
              ))}
            </ul>
            {product ? (
              <button
                type="button"
                className="tl-hint tl-open"
                data-exp={entry.id}
                aria-label={`Open ${product.name} details — ${entry.title} at ${entry.companyAccent}`}
              >
                Hover to preview · click for details →
              </button>
            ) : null}
          </div>
          {product ? (
            <div className="tl-card-face tl-card-back" aria-hidden>
              <img
                src={product.images[0]}
                alt={`${product.name} preview`}
                loading="lazy"
              />
              <div className="tl-back-overlay">
                <span className="tl-back-name">{product.name}</span>
                <span className="tl-back-cta">View details →</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function PortfolioExperience() {
  return (
    <section id="experience">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">Experience · 02</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "Where I’ve worked." }]} />
          </h2>
          <p className="sub reveal" data-delay="2">
            From mobile apps at 15, to full-stack work today.
          </p>
        </div>

        <ol className="timeline" id="timeline">
          {experience.map((entry, index) => (
            <TimelineItem key={entry.id} entry={entry} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
