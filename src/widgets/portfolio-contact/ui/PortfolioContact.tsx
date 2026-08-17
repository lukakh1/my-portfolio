import { contactEmail, urls } from "@/shared/config/portfolio-content";
import { PhysicsText } from "@/features/physics-text";

function IconMail() {
  return (
    <svg
      className="ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}

export function PortfolioContact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-card reveal">
          <div className="eyebrow">Contact · 06</div>
          <h2>
            <PhysicsText lines={[{ text: "Want to work together?" }]} />
          </h2>
          <p className="sub">
            I&apos;m open to remote full-stack roles and freelance work. Email
            is the fastest way to reach me.
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={urls.mailto}>
              <IconMail />
              Email me
            </a>
            <a
              className="btn"
              href={urls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              Connect on LinkedIn
            </a>
            <a
              className="btn"
              href={urls.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              See more on GitHub
            </a>
            <button className="btn" type="button" data-copy={contactEmail}>
              Copy email
            </button>
          </div>

          <div className="contact-grid">
            <div className="contact-item">
              <div className="k">Email</div>
              <a href={urls.mailto}>
                <div className="v">{contactEmail}</div>
              </a>
            </div>
            <div className="contact-item">
              <div className="k">Phone</div>
              <a href={urls.tel}>
                <div className="v">(+995) 591 193 540</div>
              </a>
            </div>
            <div className="contact-item">
              <div className="k">GitHub</div>
              <a href={urls.github} target="_blank" rel="noopener noreferrer">
                <div className="v">github.com/lukakh1</div>
              </a>
            </div>
            <div className="contact-item">
              <div className="k">Location</div>
              <div className="v">Tbilisi, Georgia · UTC+4</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
