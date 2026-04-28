import { stats } from "@/shared/config/portfolio-content";

export function PortfolioStats() {
  return (
    <section className="stats container" id="stats" style={{ paddingTop: 0 }}>
      <div className="stats-grid reveal">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div className="num">
              <span className="counter" data-to={s.value}>
                0
              </span>
              {s.suffix}
            </div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
