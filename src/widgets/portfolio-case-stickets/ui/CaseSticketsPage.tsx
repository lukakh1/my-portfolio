import { PortfolioFooter } from "@/widgets/portfolio-footer";

/**
 * sTickets case study.
 *
 * Everything here is either something Luka stated about his own work or
 * something observable on stickets.ge today. Where the mechanism behind a
 * decision isn't confirmed, the section says what the constraint was rather
 * than inventing how it was solved.
 */

const STACK = [
  { k: "Frontend", v: "Next.js" },
  { k: "API", v: "Express" },
  { k: "Database", v: "PostgreSQL" },
  { k: "Media", v: "AWS S3" },
  { k: "Payments", v: "Fastoo" },
  { k: "Ticket layer", v: "On-chain NFT" },
  { k: "Repo & CI", v: "GitLab" },
  { k: "Hosting", v: "Vercel + Render" },
];

const LIFECYCLE = [
  {
    n: "01",
    t: "Browse",
    d: "A public marketplace of events across nine categories, in English and Georgian, with live availability.",
  },
  {
    n: "02",
    t: "Purchase",
    d: "Payment clears through Fastoo, and the ticket is minted on completion — not before. The purchase and the mint have to agree.",
  },
  {
    n: "03",
    t: "Own",
    d: "The ticket sits in the buyer's wallet with its full ownership history. Not a PDF, not a screenshot.",
  },
  {
    n: "04",
    t: "Resell",
    d: "Listed back to the marketplace at a capped price. The transfer is verified, the seller is paid out, and the organizer takes a 5% royalty on the resale.",
  },
  {
    n: "05",
    t: "Admit",
    d: "On event day a one-time QR appears in the holder's profile. It validates once at the door and cannot be duplicated or replayed.",
  },
];

export function CaseSticketsPage() {
  return (
    <>
      <a className="skip-link" href="#case">
        Skip to content
      </a>
      <div className="bg-fx" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="case-top">
        <div className="container case-top-inner">
          <a className="case-back" href="/#projects">
            ← Luka Khimshiashvili
          </a>
          <a
            className="case-live"
            href="https://stickets.ge"
            target="_blank"
            rel="noopener noreferrer"
          >
            stickets.ge ↗
          </a>
        </div>
      </header>

      <main id="case" tabIndex={-1}>
        <section className="case-hero">
          <div className="container">
            <div className="eyebrow">Case study · Feb — Aug 2025</div>
            <h1 className="case-h1">
              An event ticket you can&apos;t counterfeit, resell in the dark, or
              use twice.
            </h1>
            <p className="case-lede">
              sTickets is an NFT-based event ticketing platform for the Georgian
              market. I built it end to end — frontend, API, database and the
              on-chain ticket layer — then deployed it and kept it running. It
              went live with around ten organizers and sold thousands of
              tickets.
            </p>
            <div className="case-facts">
              <div>
                <span className="case-fact-k">Role</span>
                <span className="case-fact-v">Sole developer</span>
              </div>
              <div>
                <span className="case-fact-k">Scope</span>
                <span className="case-fact-v">Frontend, API, DB, deploy, ops</span>
              </div>
              <div>
                <span className="case-fact-k">Status</span>
                <span className="case-fact-v">Live</span>
              </div>
            </div>
          </div>
        </section>

        <section className="case-sec">
          <div className="container case-prose">
            <h2>The problem</h2>
            <p>
              A paper or PDF ticket is a promise that nobody can check. It can be
              screenshotted, forwarded and sold twice, and the buyer only finds
              out at the door. The resale market that grows around that is
              invisible to the people who actually put the event on: once a
              ticket is sold, the organizer has no view of where it goes and no
              share of what it goes for.
            </p>
            <p>
              So the platform had to answer two separate questions at once.{" "}
              <strong>Is this ticket real?</strong> — which is about provenance.
              And <strong>who profits when it changes hands?</strong> — which is
              about the secondary market. Solving only the first gets you a
              verification tool. Solving both gets you something an organizer has
              a reason to switch to.
            </p>
          </div>
        </section>

        <section className="case-sec">
          <div className="container">
            <h2 className="case-h2">The life of one ticket</h2>
            <ol className="case-steps">
              {LIFECYCLE.map((s) => (
                <li key={s.n}>
                  <span className="case-step-n">{s.n}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="case-sec">
          <div className="container case-prose">
            <h2>Two sources of truth</h2>
            <p>
              The chain is authoritative about ownership. It is also a poor place
              to run a storefront: you cannot filter a category, sort by date or
              show live availability against it at the speed a marketplace needs.
              So the product reads from PostgreSQL and settles on-chain — and
              those two records are never allowed to disagree.
            </p>
            <p>
              That is the constraint the whole build turns on, and it shows up
              everywhere. A payment that clears but a mint that fails, a resale
              that transfers on-chain while the database still shows the old
              holder, a QR generated against a ticket that has since moved — each
              of those is the same bug wearing a different hat. Keeping the
              on-chain ticket layer in sync with Postgres was the part of this
              project I spent the most care on.
            </p>
          </div>
        </section>

        <section className="case-sec">
          <div className="container">
            <h2 className="case-h2">What I built</h2>
            <div className="case-grid">
              <div className="case-card">
                <h3>Organizer dashboard</h3>
                <p>
                  Publishing for both paid and free events, behind an approval
                  workflow — an organizer submits, and an event only reaches the
                  public marketplace once it has been reviewed.
                </p>
              </div>
              <div className="case-card">
                <h3>Customer marketplace</h3>
                <p>
                  Browse and buy across nine event categories, bilingual in
                  English and Georgian, with live availability and prices in GEL.
                </p>
              </div>
              <div className="case-card">
                <h3>Resale flow</h3>
                <p>
                  A holder lists a ticket back to the marketplace; the transfer
                  is verified, the seller is paid out, and the organizer earns a
                  5% royalty on the resale.
                </p>
              </div>
              <div className="case-card">
                <h3>Payments</h3>
                <p>
                  Live payments through Fastoo, wired so that the money clearing
                  and the ticket being minted stay tied to each other.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="case-sec case-incident">
          <div className="container case-prose">
            <div className="eyebrow">Production incident</div>
            <h2>The API went down, and the API was fine</h2>
            <p>
              The frontend ran on Vercel and the API on Render. Requests started
              failing, and the obvious read — the backend is down — was the wrong
              one.
            </p>
            <p>
              Before touching the API I checked whether the request was even
              leaving the frontend. That is the cheap question, and it splits the
              problem in half: if nothing is going out, no amount of backend
              debugging helps. Requests were going out — a great many of them.
              Then I looked at what Render was actually returning, rather than
              what the frontend reported.
            </p>
            <p>
              A loop in the frontend was firing enough calls to trip the rate
              limiter, and the limiter was doing exactly its job: blocking the
              endpoint. The service was healthy the whole time. It was being
              attacked by its own client.
            </p>
            <p>
              I unblocked the endpoint to restore service, then fixed the request
              pattern that caused it.{" "}
              <strong>
                Leaving the limiter switched off would have been the faster
                fix and the wrong one
              </strong>{" "}
              — it was the only thing that noticed the bug.
            </p>
          </div>
        </section>

        <section className="case-sec">
          <div className="container">
            <h2 className="case-h2">Stack, and how it shipped</h2>
            <dl className="case-stack">
              {STACK.map((s) => (
                <div key={s.k}>
                  <dt>{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>
            <p className="case-note">
              Next.js and Express rather than one framework, because the ticket
              layer needed a long-lived API surface of its own rather than route
              handlers attached to the storefront. Everything shipped from GitLab
              with separate dev and prod environments, the frontend deploying to
              Vercel and the API to Render on merge. I was the only person on it,
              so the deployment story had to be boring.
            </p>
          </div>
        </section>

        <section className="case-sec">
          <div className="container case-prose">
            <h2>Outcome</h2>
            <p>
              Live at <a href="https://stickets.ge" target="_blank" rel="noopener noreferrer">stickets.ge</a>{" "}
              with around ten organizers and thousands of tickets sold, running
              in English and Georgian across nine event categories. The parts I
              am most pleased with are not the visible ones: a ticket that can
              only be admitted once, and a resale that the organizer earns from
              instead of losing to.
            </p>
            <a className="btn btn-primary case-cta" href="/#projects">
              ← Back to the rest of my work
            </a>
          </div>
        </section>
      </main>

      <PortfolioFooter />
    </>
  );
}
