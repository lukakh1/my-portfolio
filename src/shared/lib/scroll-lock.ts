/**
 * Background scroll lock, shared by the experience modal and the mobile nav
 * sheet.
 *
 * `overflow: hidden` on <html> is enough on desktop, but iOS Safari ignores
 * it — the page behind still rubber-bands and scrolls, so dismissing the
 * overlay dropped you somewhere else on the page. The only thing iOS honours
 * is taking the body out of flow, which then means restoring the scroll
 * position by hand.
 *
 * Note this cannot be left to Lenis: `lenis.stop()` is a no-op on phones,
 * because SmoothScroll never instantiates Lenis on touch in the first place.
 *
 * Reference counted, so an overlay opened on top of another can't release the
 * lock the first one is still holding.
 */

let depth = 0;
let savedY = 0;
/** Which strategy the current lock used — the release has to match. */
let pinnedBody = false;

export function lockScroll(): void {
  depth += 1;
  if (depth > 1) return;

  const root = document.documentElement;
  const body = document.body;
  savedY = window.scrollY;
  pinnedBody = window.matchMedia("(hover: none)").matches;

  if (pinnedBody) {
    body.style.position = "fixed";
    body.style.top = `-${savedY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  } else {
    // Hiding overflow removes the scrollbar, so pay its width back as padding
    // or the entire page jumps right by ~15px as the overlay opens.
    const gutter = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
  }
}

export function unlockScroll(): void {
  if (depth === 0) return;
  depth -= 1;
  if (depth > 0) return;

  const root = document.documentElement;
  const body = document.body;

  if (pinnedBody) {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    /**
     * Two things beyond the obvious scrollTo:
     *  1. Force layout first. Until the document re-measures, the scrollable
     *     range is still one viewport, so the browser CLAMPS the target —
     *     restoring 4513px landed at 4317px.
     *  2. behavior "instant". `html` sets `scroll-behavior: smooth`, so a
     *     plain scrollTo animates the restore over hundreds of ms, which reads
     *     as the page sliding away as the overlay closes.
     */
    void root.scrollHeight;
    window.scrollTo({ top: savedY, left: 0, behavior: "instant" });
  } else {
    root.style.overflow = "";
    root.style.paddingRight = "";
  }
}
