import { profileRows } from "@/shared/config/portfolio-content";

export function PortfolioAbout() {
  return (
    <section id="about">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">About · 01</div>
          <h2 className="reveal" data-delay="1">
            Six years of building. Still learning.
          </h2>
          <p className="sub reveal" data-delay="2">
            A short version of how I got here.
          </p>
        </div>

        <div className="about-grid">
          <aside className="about-card reveal">
            <div className="label">Profile</div>
            <div className="name">Luka Khimshiashvili</div>
            <hr />
            {profileRows.map((row) => (
              <div key={row.key} className="row">
                <span className="k">{row.key}</span>
                <span className="v">{row.value}</span>
              </div>
            ))}
          </aside>

          <div className="story">
            <p className="reveal">
              I&apos;m a full-stack developer with{" "}
              <span className="accent">
                six years of professional experience
              </span>{" "}
              — I started at 15, writing React Native apps for a small studio in
              Georgia, and just kept going from there.
            </p>
            <p className="reveal" data-delay="1">
              I went to{" "}
              <strong style={{ color: "#fff" }}>Komarovi School Pansion</strong>{" "}
              in Tbilisi for high school, specializing in mathematics and
              physics. After national exams I went to{" "}
              <strong style={{ color: "#fff" }}>
                Kutaisi International University
              </strong>{" "}
              on a full scholarship, where I&apos;m finishing a Computer Science
              degree.
            </p>
            <p className="reveal" data-delay="2">
              Most of my work has been in the modern JavaScript ecosystem —
              React and React Native first, then Next.js, Node, and the database
              layer underneath. Over the years I&apos;ve built end-to-end
              platforms — a browser-based PDF product and an NFT
              event-ticketing marketplace — admin tooling for a smart-TV
              network, and a handful of mobile apps.
            </p>
            <p className="reveal" data-delay="3">
              I&apos;m currently at{" "}
              <strong style={{ color: "#fff" }}>Alien Lab</strong> while
              finishing my CS degree. I like working on products that people
              actually use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
