import { ResumePrintButton } from "@/features/print-resume";
import { RoleRotator } from "@/features/role-rotator";
import { urls } from "@/shared/config/portfolio-content";

function IconDownload() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-.99-.02-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.74.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.66.8.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.84v1.64h.05c.54-1.02 1.86-2.1 3.83-2.1 4.1 0 4.86 2.7 4.86 6.21V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.86V21h-4V9Z" />
    </svg>
  );
}

function IconPin() {
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
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconClock() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCheck() {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function PortfolioHero() {
  return (
    <section className="hero" id="hero">
      <div className="mesh" aria-hidden>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="status-pill reveal">
              <span className="status-dot" />
              Open to remote full-stack roles
            </div>
            <h1 className="reveal" data-delay="1">
              <span className="grad-name">Luka</span>
              <br />
              Khimshiashvili.
            </h1>
            <div className="role-line reveal" data-delay="2">
              <span className="prompt">~ $</span>
              <span>whoami →</span>
              <RoleRotator />
            </div>
            <p className="hero-tag reveal" data-delay="3">
              I&apos;ve been building things with React since I was 15. Now I
              work full-stack at{" "}
              <span style={{ color: "#cbb6ff" }}>Ruby Labs</span>, and I take
              the craft seriously.
            </p>
            <div className="hero-cta reveal" data-delay="4">
              <ResumePrintButton className="btn btn-primary">
                <IconDownload />
                Download résumé
              </ResumePrintButton>
              <a
                className="btn"
                href={urls.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconGithub />
                GitHub
              </a>
              <a
                className="btn"
                href={urls.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconLinkedin />
                LinkedIn
              </a>
            </div>
            <div className="hero-meta reveal" data-delay="5">
              <span>
                <IconPin /> Kutaisi, Georgia · UTC+4
              </span>
              <span>
                <IconClock /> Available June 2026
              </span>
              <span>
                <IconCheck /> Remote-first
              </span>
            </div>
          </div>

          <div className="reveal" data-delay="3">
            <div className="term" aria-hidden>
              <div className="term-head">
                <span className="term-dot r" />
                <span className="term-dot y" />
                <span className="term-dot g" />
                <span className="term-title">~/luka — about.ts</span>
              </div>
              <div className="term-body">
                <span className="c">{"// quick facts"}</span>
                {"\n"}
                <span className="k">const</span> <span className="b">luka</span>{" "}
                = {"{"}
                {"\n  "}
                <span className="k">role</span>:{" "}
                <span className="s">&quot;Full-Stack Developer&quot;</span>,
                {"\n  "}
                <span className="k">since</span>:{" "}
                <span className="n">2019</span>,{" "}
                <span className="c">{"// age 15"}</span>
                {"\n  "}
                <span className="k">stack</span>: [
                <span className="s">&quot;TS&quot;</span>,{" "}
                <span className="s">&quot;React&quot;</span>,{" "}
                <span className="s">&quot;RN&quot;</span>,{" "}
                <span className="s">&quot;Next&quot;</span>,{" "}
                <span className="s">&quot;Node&quot;</span>],{"\n  "}
                <span className="k">db</span>: [
                <span className="s">&quot;Postgres&quot;</span>,{" "}
                <span className="s">&quot;Mongo&quot;</span>,{" "}
                <span className="s">&quot;Supabase&quot;</span>],{"\n  "}
                <span className="k">now</span>:{" "}
                <span className="s">&quot;@RubyLabs&quot;</span>,{"\n  "}
                <span className="k">edu</span>:{" "}
                <span className="s">
                  &quot;Kutaisi Intl. University&quot;
                </span>
                ,{"\n  "}
                <span className="k">scholarship</span>:{" "}
                <span className="n">100</span>,{" "}
                <span className="c">{"// percent"}</span>
                {"\n  "}
                <span className="k">openTo</span>:{" "}
                <span className="s">&quot;remote, ambitious teams&quot;</span>,
                {"\n"}
                {"}"}
                {";"}
                {"\n"}
                <span className="b">export default</span> luka;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
