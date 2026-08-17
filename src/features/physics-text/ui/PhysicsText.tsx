import { Fragment } from "react";

export interface PhysicsLine {
  text: string;
  className?: string;
}

/**
 * Splits text into per-letter spans so PhysicsTextRoot can push them around.
 *
 * Letters are grouped into WORDS, and this is load-bearing rather than tidy:
 * every letter is its own `inline-block`, which hands the browser a line-break
 * opportunity between each pair of them. Without a nowrap wrapper per word,
 * headings break mid-word ("Six years of buildi / ng."). The break
 * opportunities are the real spaces emitted between the word spans.
 *
 * Deliberately hook-free, so it can be used directly inside the server-rendered
 * widgets. The letters are server-rendered too, which is what keeps this zero
 * CLS and fully readable with JavaScript off — the physics is pure enhancement
 * layered onto markup that already says the right thing.
 */
export function PhysicsText({
  lines,
  className,
}: {
  lines: PhysicsLine[];
  className?: string;
}) {
  const label = lines.map((l) => l.text).join(" ");
  return (
    <span
      className={className ? `phys-text ${className}` : "phys-text"}
      data-phys-text
    >
      {/* Real text in the accessibility tree. The visual letters below are
          aria-hidden, so screen readers read this once and never hear a
          character-by-character spelling of the heading. */}
      <span className="sr-only">{label}</span>
      {lines.map((line, li) => (
        <span key={li} className={line.className} aria-hidden>
          {line.text.split(" ").map((word, wi, all) => (
            <Fragment key={wi}>
              <span className="phys-word">
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} data-letter className="phys-letter">
                    {ch}
                  </span>
                ))}
              </span>
              {/* A real space BETWEEN the nowrap word spans — the only place a
                  line is allowed to break. Inside the span it would be
                  unbreakable and the heading would overflow instead. */}
              {wi < all.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}
