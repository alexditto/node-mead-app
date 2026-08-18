# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not an application codebase** — it currently contains only a design-canvas export for "Mead Makers" (a mead-brewing tracker app: batches, recipes, calendar, community recipes). There is no package.json, build tool, linter config, or test suite to run. Do not assume standard JS/web tooling exists here; check before invoking any build/lint/test command.

## Structure

- `wireframes/Application screens wireframe/Mead Makers Wireframes.dc.html` — the actual wireframe content. It's a single self-contained HTML file (design_doc_mode: canvas) with inline styles per screen option, organized into numbered "turns" (e.g. turn 4 = dark mode) each containing lettered options (e.g. `4a` = dark dashboard, `4b` = ...). Anchors like `#4a` jump to a specific screen variant. Open this file directly in a browser to view the wireframes.
- `wireframes/Application screens wireframe/support.js` — loader/runtime script referenced by the `.dc.html` file; required for the canvas page to render correctly.
- `wireframes/Application screens wireframe/_ds/classical-ab6f8ef6-.../` — a vendored design system named "Classical" that the wireframes draw on:
  - `styles.css` — the only stylesheet: design tokens (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`) plus a component class layer (`.btn`, `.tag`, `.field`/`.input`, `.card`, `.nav`, `.table`, `.dialog`, `.plate`, `.hr`).
  - `readme.md` — full design-system guidance (palette, type, components, do/don't rules). Read this before producing any new markup that should match the system's look.
  - `theme.json` / `_ds_manifest.json` / `_ds_bundle.js` — machine-readable theme parameters and a component bundle stub for tooling that consumes this design system; not meant to be hand-edited directly (edit tokens in `styles.css` instead, per the readme).

## Design system rules (Classical), when producing UI for this project

These come directly from the vendored `readme.md` — follow them for any new wireframe/mockup markup so it matches the existing screens:

- Take every color/font/spacing/radius/shadow value from the CSS variables in `styles.css` (`var(--color-*)`, etc.) — never hard-code a hex, font name, or px value the tokens already carry.
- Color is applied as **stroke, not fill**: buttons are outlined, not solid; cards are bordered, not filled. Don't fill cards or buttons with solid accent color.
- Type: Cormorant Garamond for headings (`--font-heading`), Lora for body (`--font-body`). Avoid bold — headings cap at semibold, and larger display text goes lighter, not heavier. Numbers (kickers, tables, figures) set tabular (`tnum`); running prose keeps text figures.
- Icons: Lucide (lucide.dev) throughout.
- Interactive states are themed, not browser defaults: hover tint + one-step-further pressed state from the accent ramp, and `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` instead of the default focus ring.
- Images go through the `.plate` wrapper (matted, archival-look treatment) rather than being used as raw/banner images.
- Keep leading loose and margins generous (density 1.15× is baked into the spacing scale) — don't tighten it.

## Working with the wireframe file

- Because the whole deliverable is one large HTML file organized by numbered turns/lettered options, when asked to add a new screen variant, follow the existing pattern: a new `.dv-opt` block with an `id` matching the next letter, inside the relevant `.dv-turn` section (or a new turn section for a new exploration round).
- When asked to iterate on a specific screen, locate it by its anchor id (e.g. search for `id="4a"`) rather than reading the entire 1400+ line file.
