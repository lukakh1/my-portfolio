# Keep on Truckin' FW

Display face for the hero lockup and section headings. R. Crumb's 1968 lettering,
digitised by Brad O. Nelson (Brain Eaters Font Co.) in 2003.

## Licence

**FREEware — personal use only.** From the bundled readme, verbatim:

> This font is free to use in a private or recreational manner only. You may use
> this font for your own personal web site or communications, or for personal
> design work you may do for a friend.

A personal portfolio is explicitly in scope. Using it to promote a business,
product or service that makes income — including selling freelance services —
requires a commercial licence from <https://www.braineaters.com>.

> You have permission to redistribute this font freely as long as this PDF
> readme file is included.

That is why `KeepOnTruckin-LICENSE-ReadMe.pdf` sits next to the font file, and
why `nameID 0` (the copyright string) is deliberately preserved in the subset.

Note: the binary carries `OS/2.fsType = 1` (Restricted License embedding), a
Fontographer default that contradicts the readme's own redistribution grant.
Browsers do not enforce `fsType`.

## Regenerating the subset

The source TTF is **not** committed — only this derived subset. To rebuild it,
extract `keep_on_truckin_fw.zip` somewhere outside the repo and run:

```bash
uvx --from "fonttools[woff]" pyftsubset /path/to/KeeponTruckin.ttf \
  --output-file=src/app/fonts/KeepOnTruckin-subset.woff2 \
  --flavor=woff2 \
  --unicodes="U+0020-007E,U+00A9,U+00B0,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D" \
  --layout-features='' \
  --drop-tables+=GSUB,GPOS,LTSH,VDMX,hdmx,DSIG \
  --no-hinting \
  --name-IDs='0,1,2,3,4,5,6' \
  --notdef-outline \
  --recalc-bounds
```

Deliberately a one-time manual step with the output committed, not a build
script — otherwise `fonttools` becomes a permanent CI dependency for a font
that will never change again.

Why each flag:

- `--unicodes` covers all printable ASCII plus smart quotes and dashes. Scoping
  it to just today's headline strings would be ~1.5 KB instead of ~10 KB, but
  would break silently the moment anyone edits a heading.
- `--no-hinting` drops 17,835 bytes — 38% of the `glyf` table. macOS browsers
  ignore TrueType instructions entirely, and this face is only ever set at
  display sizes where hinting is meaningless anyway.
- `--drop-tables` removes 3,756 bytes of ClearType-era bitmap-size tables, plus
  `GPOS`/`GSUB`, which are Fontographer `cpsp`/`frac` stubs with no real
  typographic data.
- `--name-IDs` keeps nameID 0, the copyright.

## Facts worth knowing before using it

- **No kerning at all.** No `kern` table, and the layout tables are stubs. Pairs
  need optical correction by hand; `.u-groovy` applies size-dependent negative
  tracking for this reason.
- **Single weight.** `font-weight: 400` must be set explicitly wherever it is
  used, or the browser synthesises a fake bold and smears the outlines.
- **103 codepoints, Latin only.** `·` (U+00B7), `…`, `→` and every accented
  character are absent. Never bind this family to a content-driven selector —
  a missing glyph falls back mid-word with no build-time warning.
- **Vertical metrics are consistent** (`hhea` = `OS/2` typo = win = 803/−217/0,
  1000 upem), so there are no cross-browser line-height surprises.
- **Outlines are clean where it matters.** Zero overlapping contours across the
  whole face; `F J N P q r 8 !` carry self-intersections or inverted winding,
  which only matters for 3D extrusion. Every glyph in "Luka Khimshiashvili" and
  in all six section headings is clean.
