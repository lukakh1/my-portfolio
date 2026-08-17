/**
 * The brand mark: a 70s sunburst, the same drawing as `app/icon.svg` and the
 * 3D chrome sun that travels down the page — one idea in three places.
 *
 * Rendered as inline SVG rather than an <img> so the rays can be a real
 * element the stylesheet animates, and so the whole thing inherits the page's
 * colour tokens. Server component: there is no state here, only CSS motion.
 */
export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg viewBox="0 0 64 64" className="brand-sun" focusable="false">
        <g className="brand-sun-rays">
          <path d="M29.77 18.69 L29.88 3.58 L34.12 3.58 L34.23 18.69 Z" />
          <path d="M38.02 19.92 L46.99 7.76 L50.42 10.26 L41.63 22.54 Z" />
          <path d="M43.97 25.77 L58.37 21.20 L59.69 25.24 L45.35 30.00 Z" />
          <path d="M45.35 34.00 L59.69 38.76 L58.37 42.80 L43.97 38.23 Z" />
          <path d="M41.63 41.46 L50.42 53.74 L46.99 56.24 L38.02 44.08 Z" />
          <path d="M34.23 45.31 L34.12 60.42 L29.88 60.42 L29.77 45.31 Z" />
          <path d="M25.98 44.08 L17.01 56.24 L13.58 53.74 L22.37 41.46 Z" />
          <path d="M20.03 38.23 L5.63 42.80 L4.31 38.76 L18.65 34.00 Z" />
          <path d="M18.65 30.00 L4.31 25.24 L5.63 21.20 L20.03 25.77 Z" />
          <path d="M22.37 22.54 L13.58 10.26 L17.01 7.76 L25.98 19.92 Z" />
        </g>
        <circle className="brand-sun-core" cx="32" cy="32" r="11.5" />
        <circle className="brand-sun-eye" cx="32" cy="32" r="7.5" />
      </svg>
    </span>
  );
}
