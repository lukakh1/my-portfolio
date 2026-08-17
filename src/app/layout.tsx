import type { Metadata } from "next";
import { Familjen_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next"

// globals.css (Tailwind) first: its preflight lives in `@layer base`, and the
// unlayered design system below must come after it in source order too, so the
// intent is unambiguous no matter how layers evolve.
import "./globals.css";
import "@/shared/styles/index.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * Keep on Truckin' FW — the 1970s display face, used ONLY at display sizes
 * (hero lockup, section h2s, marquee, footer mark). See ./fonts/README.md for
 * the licence and the exact subsetting command.
 *
 * Deliberately a NEW variable rather than repointing `--font-display`: that one
 * is bound to `h1,h2,h3,h4` globally, and the print stylesheet never resets
 * `font-family` — so repointing it would set the printed résumé header in
 * psychedelic type at 22pt, and would also hit `.stat .num`, `.brand` and
 * `.about-card .name`.
 *
 * `adjustFontFallback: "Arial"` makes Next synthesise a metric-matched fallback
 * face from the real file (size-adjust 105.72%, ascent 75.96%, descent 20.53%).
 * Don't hand-write those via `declarations` — that targets the real font's
 * @font-face, not the synthetic fallback, and desynchronises the two.
 */
const keepOnTruckin = localFont({
  src: "./fonts/KeepOnTruckin-subset.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-groovy",
  display: "swap",
  preload: true,
  fallback: ["Familjen Grotesk", "Georgia", "serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Luka Khimshiashvili — Full-Stack Developer",
  description:
    "Luka Khimshiashvili — Full-Stack Developer. React, React Native, Next.js. Building production software since age 15.",
};

/**
 * Runs before first paint (inline, top of <body>): marks the document while the
 * display face is still loading so the hero lockup and section headings stay
 * hidden until the real glyphs are ready — otherwise the fallback flashes for a
 * frame and ghosts the first letter. `data-fonts` is an attribute React never
 * manages, so hydration won't clobber it.
 *
 * Waits on that ONE family, not `document.fonts.ready`. The latter is a
 * document-wide signal, so a slow Inter or JetBrains Mono response would hold
 * the hero name hostage over fonts it doesn't even use.
 *
 * `.then(r, r)` matters: `document.fonts.load()` REJECTS if the family name
 * matches no @font-face, and a rejection with no handler would leave the
 * headline invisible until the 1.2s timeout rescued it.
 */
const GATE_FONT = JSON.stringify(`1em ${keepOnTruckin.style.fontFamily}`);
const GATE_TEXT = JSON.stringify("Luka Khimshiashvili");
const FONT_GATE = `(function(){var e=document.documentElement;e.setAttribute('data-fonts','loading');var d=0;function r(){if(d)return;d=1;e.setAttribute('data-fonts','ready')}try{if(document.fonts&&document.fonts.load){document.fonts.load(${GATE_FONT},${GATE_TEXT}).then(r,r);setTimeout(r,1200)}else{r()}}catch(_){r()}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${familjenGrotesk.variable} ${jetbrainsMono.variable} ${keepOnTruckin.variable}`}
      // The pre-paint FONT_GATE script sets data-fonts on <html> before React
      // hydrates; suppress the expected attribute mismatch (same pattern as
      // theme scripts). Only affects this element's own attributes.
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: FONT_GATE }} />
        {children}
      </body>
    </html>
  );
}
