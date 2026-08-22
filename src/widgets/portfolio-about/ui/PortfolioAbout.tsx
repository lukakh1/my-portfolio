import {
  profileRows,
  yearsShippingWord,
} from "@/shared/config/portfolio-content";
import { PhysicsText } from "@/features/physics-text";

export function PortfolioAbout() {
  return (
    <section id="about">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow reveal">About · 01</div>
          <h2 className="reveal" data-delay="1">
            <PhysicsText lines={[{ text: "Building since 2019." }]} />
          </h2>
          <p className="sub reveal" data-delay="2">
            The short version of how I got here.
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
                {yearsShippingWord()} years of professional experience
              </span>
              . I started at 15, writing React Native apps for a studio in
              Tbilisi, and haven&apos;t stopped shipping since.
            </p>
            <p className="reveal" data-delay="1">
              Most of my work is in the JavaScript ecosystem: Next.js and React
              on the front, Node with Express or NestJS behind it, PostgreSQL
              underneath. I&apos;ve built the core surfaces of a browser-based
              PDF platform used by 100,000 people a month, an NFT ticketing
              marketplace end to end, the admin tooling for a smart-TV network,
              and a handful of mobile apps.
            </p>
            <p className="reveal" data-delay="2">
              I work the way a team works — merge requests both ways, reviewing
              other people&apos;s code as well as having mine reviewed, building
              from designer handoffs, and being the one who gets called when
              production breaks. What I&apos;ve picked up alongside the product
              work is <span className="accent">what happens after the merge</span>
              : I write the GitLab pipelines that gate my own code — lint,
              typecheck, tests, dependency scanning, secret detection — because
              I used to find those problems at deploy time instead.
            </p>
            <p className="reveal" data-delay="3">
              I&apos;ve deployed to Vercel, Render and Supabase in production.
              I&apos;ve also stood up a full server stack from scratch — EC2,
              nginx, a load balancer, CloudFront, RDS and Memcached — though
              that one was university coursework rather than a production
              system.
            </p>
            <p className="reveal" data-delay="4">
              I studied Computer Science at{" "}
              <strong style={{ color: "var(--ink)" }}>
                Kutaisi International University
              </strong>{" "}
              on a full scholarship, finishing in 2026, alongside the day job
              rather than instead of it. I&apos;m currently at{" "}
              <strong style={{ color: "var(--ink)" }}>Alien Lab</strong>, where
              I&apos;ve built two of the company&apos;s products on my own.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
