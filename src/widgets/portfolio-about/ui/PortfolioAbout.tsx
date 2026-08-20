import { profileRows } from "@/shared/config/portfolio-content";
import { PhysicsText } from "@/features/physics-text";

export function PortfolioAbout() {
  return (
    <section id="about">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">About · 01</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "Six years of building. Still learning." }]} />
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
              I&apos;m a full-stack software engineer with{" "}
              <span className="accent">
                six years of professional experience
              </span>{" "}
              — I started at 15, writing React Native apps for a small studio in
              Georgia, and just kept going from there.
            </p>
            <p className="reveal" data-delay="1">
              I went to{" "}
              <strong style={{ color: "var(--ink)" }}>Komarovi School Pansion</strong>{" "}
              in Tbilisi for high school, specializing in mathematics and
              physics. After national exams I went to{" "}
              <strong style={{ color: "var(--ink)" }}>
                Kutaisi International University
              </strong>{" "}
              on a full scholarship, where I earned a Computer Science degree.
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
              What I&apos;ve picked up alongside that is{" "}
              <span className="accent">what happens after the merge</span>. I
              write the GitLab pipelines that gate my own code — lint,
              typecheck, tests, dependency scanning, secret detection — because
              I used to find those problems at deploy time instead. I&apos;ve
              deployed to Vercel, Render and Supabase in production, and
              I&apos;ve built the whole stack myself on AWS: EC2, nginx, a load
              balancer, CloudFront, RDS and Memcached.
            </p>
            <p className="reveal" data-delay="4">
              I&apos;m currently at{" "}
              <strong style={{ color: "var(--ink)" }}>Alien Lab</strong>, where
              I&apos;ve built two of the company&apos;s products on my own. When
              something breaks in production, I know how to work out which side
              of the boundary it broke on.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
