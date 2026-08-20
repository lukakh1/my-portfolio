# Résumé source

`resume.html` is the source of truth for `../public/resume.pdf` — the file the
portfolio's "Download résumé" button serves.

## Regenerating the PDF

The previous PDF was printed from a browser with headers and footers left on,
which stamped a tool URL and a page number into the footer of every copy a
recruiter downloaded. Generate it headlessly instead, which never adds them:

```bash
node -e '
import("playwright").then(async ({ chromium }) => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  await p.goto("file://" + process.cwd() + "/resume/resume.html", { waitUntil: "networkidle" });
  await p.emulateMedia({ media: "print" });
  await p.pdf({
    path: "public/resume.pdf",
    format: "Letter",
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: "0.45in", bottom: "0.45in", left: "0.5in", right: "0.5in" },
  });
  await b.close();
});'
```

If you print from Chrome by hand instead, open **More settings** and turn
**Headers and footers** OFF before saving.

## Open edits

- The contact line still carries the auto-generated LinkedIn slug
  (`luka-khimshiashvili-57283224b`). Claim `linkedin.com/in/lukakhimshiashvili`
  and swap it in — there is a comment marking the spot.
- The portfolio URL is deliberately absent: `lukakhimshiashvili.com` has no DNS
  record. Add it back once the domain resolves.
