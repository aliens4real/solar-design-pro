# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Solar Design Pro** — A NABCEP-compliant PV system designer for Canopy Solar, used to create residential and commercial solar installation plans. Migrated from a single-file artifact to a multi-file Vite + React architecture.

## Tech Stack

- **Vite + React** (functional components with hooks)
- **Tailwind CSS v3** (PostCSS pipeline, config in `tailwind.config.js`)
- **Inline styles** preserved from original code — SVG diagrams especially use inline styles (Tailwind doesn't work in SVG)
- **NASA POWER API** for solar irradiance/climate data
- **Anthropic API** (`claude-sonnet-4-20250514`) for AI design features, address autocomplete, and climate data fallback

## Commands

```bash
npm run dev     # Start dev server (Vite)
npm run build   # Production build
npm run preview # Preview production build
```

## Architecture

### Key Design Decisions
1. **Props only, no Context/Redux** — Component tree is flat (App → Tab). Prop drilling at 1 level is explicit and simple.
2. **All state in App.jsx** — 21 useState hooks + derived values. Tab components are pure render functions receiving data + callbacks.
3. **useAddress custom hook** — Only extraction: self-contained state (6 useState, 3 useRef, debounce, click-outside) consumed only by ProjectTab.
4. **Layout handlers stay in App.jsx** — They mutate `modGroups`, `layPos`, and `laySel` simultaneously. Co-locating with state is cleaner than passing 6+ setters.
5. **SVG diagrams keep inline styles** — Tailwind doesn't work inside SVG. Rest of app uses inline style objects from theme.js.
6. **Compressed names preserved** — `pj`, `sPj`, `md`, `iv`, `sz` etc. stay as-is per original convention.

### File Structure (31 files)

```
solar-design-pro/
├── index.html              — Entry HTML with Google Fonts
├── vite.config.js          — Vite + React plugin
├── tailwind.config.js      — Tailwind v3 config
├── postcss.config.js       — PostCSS config
├── package.json
├── CLAUDE.md               — This file
├── src/
│   ├── main.jsx            — React entry point
│   ├── index.css           — Tailwind directives + keyframes + print CSS
│   ├── App.jsx             — ALL state, derived values, effects, handlers, tab routing
│   ├── theme.js            — Fonts, colors, reusable style objects (inp, lb, cd, bt)
│   ├── data/
│   │   ├── modules.js      — MODS array (26 panels: Qcells, Silfab, REC)
│   │   ├── inverters.js    — INVS array (33 models: SMA, SolarEdge, Fronius, Sol-Ark, Tigo, Enphase)
│   │   ├── nec-tables.js   — COND, OCPDS, WIRE_AREA, CONDUIT_FILL, EGC/GEC/SE tables
│   │   ├── markers.js      — MCATS (marker categories), SC (string colors)
│   │   └── logo.js         — DEFAULT_LOGO base64 data URL
│   ├── calc/
│   │   ├── nec-sizing.js   — minConduit, egcSize, gecSize, seSize
│   │   ├── string-calc.js  — strCalc (NEC 690.7 string sizing)
│   │   └── pack-list.js    — mkPack (BOM generator)
│   ├── api/
│   │   ├── anthropic.js    — callClaude shared fetch wrapper
│   │   ├── climate.js      — geocodeAddr, lookupClimateData (NASA POWER + ASHRAE fallback)
│   │   └── address.js      — fetchAddressSuggestions
│   ├── hooks/
│   │   └── useAddress.js   — Address autocomplete state + handlers
│   ├── components/
│   │   ├── Header.jsx      — App header with logo
│   │   └── TabBar.jsx      — Tab navigation
│   ├── tabs/
│   │   ├── ProjectTab.jsx      — Customer info, address, system config, module/inverter selection
│   │   ├── AiDesignTab.jsx     — AI chat interface
│   │   ├── ElectricalTab.jsx   — NEC 690 string sizing calculations
│   │   ├── LayoutTab.jsx       — Drag-and-drop roof layout designer
│   │   ├── SiteElectricalTab.jsx — Wire spec + SVG diagram selector
│   │   ├── PlansTab.jsx        — 5-page print-ready installation plans
│   │   ├── PhotosTab.jsx       — Photo upload + marker annotation
│   │   └── PackListTab.jsx     — Material BOM
│   └── diagrams/
│       ├── shared.jsx              — eqBox, dashLine, badge, specTag, calcConduit, wireSchedule, legend
│       ├── ResidentialRoofDiagram.jsx
│       ├── CommercialRoofDiagram.jsx
│       ├── GroundMountDiagram.jsx
│       └── CarportDiagram.jsx
```

## Which Files to Edit for Each Feature

| Feature Area | Primary Files | Supporting Files |
|---|---|---|
| Add a module/inverter | `data/modules.js` or `data/inverters.js` | `tabs/ProjectTab.jsx` (optgroup) |
| String sizing logic | `calc/string-calc.js` | `tabs/ElectricalTab.jsx` (display) |
| Wire spec / conduit | `calc/nec-sizing.js`, `diagrams/shared.jsx` | `tabs/SiteElectricalTab.jsx` |
| SVG diagrams | `diagrams/<Type>Diagram.jsx` | `diagrams/shared.jsx` |
| AI design chat | `App.jsx` (chat function) | `tabs/AiDesignTab.jsx` |
| Climate data | `api/climate.js` | `App.jsx` (lookupClimate) |
| Address autocomplete | `api/address.js`, `hooks/useAddress.js` | `tabs/ProjectTab.jsx` |
| Layout designer | `tabs/LayoutTab.jsx` | `App.jsx` (layout handlers) |
| Print plans | `tabs/PlansTab.jsx` | — |
| BOM / Pack List | `calc/pack-list.js` | `tabs/PackListTab.jsx` |
| Photos | `tabs/PhotosTab.jsx` | — |
| Wire run lengths (TODO) | `tabs/SiteElectricalTab.jsx` | `diagrams/*.jsx`, `calc/pack-list.js` |
| Theme / colors | `theme.js` | All components |

## Coding Conventions

- **Compressed state**: `pj` not `projectInfo`, `sPj` not `setProjectInfo`
- **Short object keys**: `w`=watts, `voc`, `isc`, `vmp`, `imp`, `tkV`=temp coefficient, `c`=cells, `lm/wm`=dimensions mm, `$`=cost
- **Inverter keys**: `kw`, `dv`=max DC voltage, `ml/mh`=MPPT range, `ai`=max input current, `oc`=OCPD, `tp`=type, `mppt`=count
- **Branding**: Light theme, accent color `#d48c00`

## Pending Feature: Wire Run Lengths & BOM

Next feature to implement — manual wire run length inputs with automatic material tabulation:

1. **New state variables** for each wire run segment length in all four SVG diagram types
2. **Input fields** positioned below each SVG diagram for entering run lengths per segment
3. **BOM calculation** aggregating: wire totals by gauge/type, conduit totals by size, fittings estimates
4. **Display table** showing material quantities

Wire segments correspond to the labeled runs in each elevation diagram (e.g., PV source circuits, DC homerun, AC branch, service entrance).
