# Solar Design Pro

A NABCEP-compliant PV system design platform built for **Canopy Solar** — a small residential and commercial solar installer in Ohio and Pennsylvania. Replaces a 8+ hour manual workflow (measurements → spreadsheets → hand-drawn layouts → manual NEC lookups) with a single React app that runs the full design end-to-end: roof layout, NEC-compliant electrical calcs, IronRidge racking BOM, and permit-ready plan-set PDFs.

Built in **4 weeks** with AI-assisted development.

---

## Impact

| Metric | Before | After | Change |
|---|---|---|---|
| Design time | 3+ hours | 20 minutes | **−85%** |
| Inspection error rate | ~15% | <2% | **−87%** |
| Designs per day | 1–2 | 6–8 | **4× throughput** |
| Who can design | Owner only | Any trained crew | **Bottleneck removed** |


---

## Features

The app is organized as 8 workflow tabs that mirror how a designer actually thinks through an install.

**Project setup** — Customer info, address autocomplete with geocoding, NASA POWER irradiance + climate lookup (with ASHRAE design-temperature fallback), system kW target, mount type, roof type, service size.

**AI Design** — Natural-language interface backed by the Anthropic API for auto string sizing, inverter recommendations, and design review. Used as a co-pilot for tricky multi-array configurations.

**Electrical** — NEC 690.7 string sizing engine. Temperature-corrected Voc / Vmp using each module's `tkV` coefficient and the project's design temperatures, calculating min and max modules per string for the selected inverter's MPPT and max-DC-voltage windows. Wire sizing per NEC Ch. 9 with voltage drop, EGC sizing per 250.122, GEC per 250.66.

**Module Layout** — Drag-and-drop roof designer with multi-array, multi-azimuth support. Each array group has its own roof pitch and frame dimensions. Obstruction and setback mapping; automatic spacing.

**Site Electrical Layout** — Auto-generated SVG elevation diagrams for four mount types (residential roof, commercial roof, ground mount, carport). Live-annotated wire specs, conduit sizing, equipment legends, and wire schedule tables. All reactive to design changes.

**Installation Plans** — Five-page print-ready PDF plan set: cover sheet, site plan with dimensions, layout diagram, single-line electrical diagram, and equipment schedule with linked spec sheets. Drops straight into permit packages.

**Photos** — Site photo upload with categorized marker overlays (electrical, mechanical, structural) for inspection-ready documentation, tied to the project record.

**Pack List** — Automatic BOM generation from the design: modules, inverters, IronRidge racking (rails + clamps + flashings), conduit runs (couplings / connectors / locknuts / bushings / straps / LBs), grounding hardware (rods, acorn clamps, intersystem bonding terminal), and SolaDeck roof-box internals. Quantities roll up by category for ordering.

---

## Tech stack

- **Vite + React 19** with functional components and hooks
- **Tailwind CSS v3** via PostCSS
- **SVG** for all electrical elevation diagrams (no charting libs)
- **pdf-lib + pdfjs-dist** for permit plan-set generation
- **NASA POWER API** for solar irradiance and climate data
- **Anthropic API** (Claude Sonnet) for AI design features and address autocomplete
- **26 modules + 33 inverters** in the catalog (Qcells, Silfab, REC; SMA, SolarEdge, Fronius, Sol-Ark, Tigo EI, Enphase IQ8)

---

## Run it locally

```bash
git clone <repo>
cd solar-design-pro
npm install
cp .env.example .env       # add ANTHROPIC_API_KEY
npm run dev                # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

---

## Architecture

```
src/
├── App.jsx              all state (21 useState), tab routing
├── theme.js             colors, fonts, reusable style objects
├── data/                modules, inverters, NEC tables, markers
├── calc/                NEC sizing, string calc, BOM generator
├── api/                 Anthropic, NASA POWER climate, geocoding
├── hooks/               useAddress (autocomplete + debounce)
├── components/          Header, TabBar
├── tabs/                one file per workflow tab
└── diagrams/            four SVG mount-type diagrams + shared primitives
```

Design notes (full detail in `CLAUDE.md`):

- **Props only** — no Context/Redux. Tree is flat: `App → Tab`.
- **All state in App.jsx** — tab components are pure render functions receiving data + callbacks. Easier to reason about and trivial to debug.
- **Compressed names** — `pj` not `projectInfo`, `sPj` not `setProjectInfo`. Kept from the original artifact-mode design where token efficiency mattered.
- **Inline styles inside SVG** — Tailwind doesn't apply inside SVG; the rest of the app uses inline style objects from `theme.js`.

---

## What this proves

This was a small-business operations problem that the market priced at $150K and 9 months. Built it in 4 weeks for a fraction of the cost, with the operator (the actual domain expert) driving the design decisions. The pattern generalizes — scheduling, estimating, inventory, quoting, dispatch — anywhere a small operator is bottlenecked by tools that don't fit.

---

## Built by

**Michael Kerrigan**
[michael.v.kerrigan@gmail.com](mailto:michael.v.kerrigan@gmail.com)

Built with Claude Code as the engineering pair. Domain expertise + AI-assisted development as a force multiplier.
