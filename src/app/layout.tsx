import type { Metadata } from "next";
import { Familjen_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

import "@/shared/styles/portfolio.css";
import "@/shared/styles/interactions.css";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Luka Khimshiashvili — Full-Stack Developer",
  description:
    "Luka Khimshiashvili — Full-Stack Developer. React, React Native, Next.js. Building production software since age 15.",
};

/**
 * Runs before first paint (inline, top of <body>): marks the document while the
 * display font is still loading so the gradient hero name stays hidden until the
 * real glyphs are ready — otherwise the fallback font flashes for a frame and
 * ghosts the first letter. `data-fonts` is an attribute React never manages, so
 * hydration won't clobber it. Falls back to "ready" if the Font Loading API is
 * missing, and after a 1.2s safety timeout so the name can never get stuck.
 */
const FONT_GATE = `(function(){var e=document.documentElement;e.setAttribute('data-fonts','loading');function r(){e.setAttribute('data-fonts','ready')}try{if(document.fonts&&document.fonts.ready){document.fonts.ready.then(r);setTimeout(r,1200)}else{r()}}catch(_){r()}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${familjenGrotesk.variable} ${jetbrainsMono.variable}`}
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
