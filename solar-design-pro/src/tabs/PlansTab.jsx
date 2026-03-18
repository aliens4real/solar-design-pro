import { useState, useRef, useMemo } from 'react';
import { callClaude, cleanJson } from '../api/anthropic.js';
import { ff, fs, c1, c2, bg, bd, ac, tx, td, gn, rd, bl, bt, cd, inp } from '../theme.js';
import { COND } from '../data/nec-tables.js';
import { SPEC_SHEETS } from '../data/spec-sheets.js';

const LVL = {
  1: { label: "Level 1 Installer", short: "L1", color: "#059669", bg: "#f0fdf4" },
  2: { label: "Level 2 Installer", short: "L2", color: "#2563eb", bg: "#eff6ff" },
  3: { label: "Level 3 Electrician", short: "L3", color: "#d97706", bg: "#fffbeb" },
  4: { label: "Foreman", short: "FM", color: "#dc2626", bg: "#fef2f2" },
};

export default function PlansTab({ md, iv, sz, pj, dsg, pk, totalMods, totalKw, modGroups, logo, setLogo, logoRef, printRef, modSz, faceSz, layPos, ivs, totalIvKw, rack }) {

  const [manual, setManual] = useState(null);
  const [manBusy, setManBusy] = useState(false);
  const [manErr, setManErr] = useState("");
  const manualRef = useRef(null);
  const commRef = useRef(null);

  /* ═══ COMPUTED VALUES ═══ */
  const ready = md && iv && sz;
  const nMods = totalMods || (dsg?.tm) || 0;
  const nStr = dsg?.ns || (sz ? Math.ceil(nMods / sz.opt) : 0);
  const modsPerStr = dsg?.ms || (sz?.opt) || 0;
  const nInv = dsg?.ni || 1;
  const arrayKw = (nMods * md?.w / 1000) || 0;
  const dcac = totalIvKw > 0 ? (arrayKw / totalIvKw).toFixed(2) : iv ? (arrayKw / iv.kw).toFixed(2) : "\u2014";
  const needsCombiner = nStr > iv?.mppt;
  const busbar = +pj.es || 200;
  const rule120 = busbar * 1.2;
  const acBreaker = iv?.oc || 40;
  const pass120 = (acBreaker + busbar) <= rule120;
  const sysVoc = sz ? (sz.vc * modsPerStr).toFixed(1) : "\u2014";
  const sysVmp = sz ? (sz.vh * modsPerStr).toFixed(1) : "\u2014";

  /* ═══ SPEC SHEET APPENDIX COLLECTION ═══ */
  const specSheets = useMemo(() => {
    const sheets = [];
    const seen = new Set();
    const add = (nm, cat, pdf) => {
      if (!pdf || seen.has(pdf)) return;
      seen.add(pdf);
      sheets.push({ nm, cat, pdf });
    };
    // Module spec sheet
    if (md?.pdf) add(md.nm, "Module", md.pdf);
    // Inverter spec sheets (unique across multi-inverter list)
    if (ivs?.length > 0) {
      ivs.forEach(e => { if (e.inv?.pdf) add(e.inv.nm, "Inverter", e.inv.pdf); });
    } else if (iv?.pdf) {
      add(iv.nm, "Inverter", iv.pdf);
    }
    // Racking rail
    const railKey = rack?.railFamily;
    if (railKey && SPEC_SHEETS[railKey]) {
      const s = SPEC_SHEETS[railKey];
      add(s.nm, s.cat, s.pdf);
    }
    // FlashFoot2 (roof mount only)
    if (pj.mt !== "ground" && SPEC_SHEETS.ff2) {
      const s = SPEC_SHEETS.ff2;
      add(s.nm, s.cat, s.pdf);
    }
    // UFO clamp (always)
    if (SPEC_SHEETS.ufo) {
      const s = SPEC_SHEETS.ufo;
      add(s.nm, s.cat, s.pdf);
    }
    // SolaDeck roof box (roof mount only)
    if (pj.mt !== "ground" && SPEC_SHEETS.soladeck) {
      const s = SPEC_SHEETS.soladeck;
      add(s.nm, s.cat, s.pdf);
    }
    return sheets;
  }, [md, iv, ivs, rack, pj.mt]);

  /* ═══ PAGE STYLES ═══ */
  const pg = { background: "#fff", color: "#000", padding: "36px 44px", borderRadius: 8, marginBottom: 16, fontFamily: ff, fontSize: 13, lineHeight: 1.7, border: "1px solid #ccc", minHeight: 500, position: "relative", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" };
  const logoImg = logo ? <img src={logo} style={{ height: 32, objectFit: "contain" }} alt="Company Logo" /> : null;

  /* ═══ HEADER BUILDER ═══ */
  const hdr = (title, sub) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10, borderBottom: "3px solid #000", marginBottom: 12 }}>
        {logoImg}
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right", fontSize: 10, color: "#555", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{pj.nm || "Solar Installation"}</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#000" }}>{title}</div>
      <div style={{ fontSize: 11, color: "#555" }}>{sub}</div>
    </div>
  );

  /* ═══ TABLE STYLES ═══ */
  const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: ff };
  const th = { padding: "7px 10px", background: "#e8e8e8", border: "1px solid #bbb", fontWeight: 700, textAlign: "left", color: "#000", fontSize: 11 };
  const tcell = { padding: "6px 10px", border: "1px solid #ccc", color: "#000" };
  const tcR = { ...tcell, textAlign: "right" };

  /* ═══ PRINT FUNCTION ═══ */
  const doPrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${pj.nm || "Solar Plans"}</title><style>
      @media print { @page { size: letter; margin: 0.5in; } body { margin: 0; } .plan-page { page-break-after: always; break-after: page; } .plan-page:last-child { page-break-after: auto; break-after: auto; } }
      body { font-family: ${ff}; margin: 0; padding: 0; }
      .plan-page { padding: 36px 44px; font-size: 13px; line-height: 1.7; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th { padding: 7px 10px; background: #e8e8e8; border: 1px solid #bbb; font-weight: 700; text-align: left; font-size: 11px; }
      td { padding: 6px 10px; border: 1px solid #ccc; }
    </style></head><body>`);
    const pages = printRef.current?.querySelectorAll(".plan-page");
    if (pages) pages.forEach(p => w.document.write(p.outerHTML));
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  /* ═══ COMBINER WIRE LOOKUP ═══ */
  const combinerWire = () => {
    const isc = md?.isc || 10;
    const combinedA = isc * nStr * 1.56;
    const wire = COND.find(c => c.a75 >= combinedA) || COND[COND.length - 1];
    return wire;
  };

  /* ═══ INSTALLATION MANUAL ═══ */
  const generateManual = async () => {
    setManBusy(true); setManErr("");
    const pkSummary = pk?.length > 0 ? pk.map(it => `${it.q}x ${it.d} (${it.c})`).join(", ") : "No pack list";
    const system = `You are a NABCEP-certified solar installation foreman creating a detailed installation manual.
Return ONLY valid JSON (no markdown fences, no commentary).

PROJECT: ${pj.nm || "Solar Installation"} | ${[pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ")}
MOUNT: ${pj.mt || "roof"} (${pj.rf || "asphalt"}) | Service: ${pj.es || 200}A
MODULE: ${md?.nm || "?"} ${md?.w || 0}W x ${nMods} = ${arrayKw.toFixed(1)}kW
INVERTER: ${iv?.nm || "?"} ${iv?.kw || 0}kW x ${nInv} (${iv?.tp || "string"})
STRINGS: ${nStr} strings x ${modsPerStr} modules | DC:AC ${dcac}
MODULE GROUPS: ${modGroups.map(g => `${g.nm}: ${g.cnt || 0} mods @ ${g.az}° ${g.ori === "L" ? "landscape" : "portrait"}`).join("; ")}
PACK LIST: ${pkSummary}

Generate a chronological installation manual with exactly 10 phases. Each task is assigned a skill level 1-4:
Level 1: Entry installer — layout, material staging, simple assembly
Level 2: Experienced installer — racking, module placement, torquing
Level 3: Licensed electrician — wiring, conduit, connections, grounding
Level 4: Foreman — inspections, coordination, final checks, commissioning

JSON schema: { "phases": [{ "name": "Phase Name", "tasks": [{ "step": 1, "task": "Task description", "level": 1-4, "duration": "Xmin", "details": "Detailed instructions", "safety": "Safety note or empty string" }] }], "safety": ["General safety rule 1", ...], "tools": ["Tool 1", ...] }

Phases should be: 1-Site Prep, 2-Material Staging, 3-Roof Prep/Layout, 4-Racking Installation, 5-Module Placement, 6-DC Wiring, 7-Inverter/Equipment, 8-AC Wiring, 9-Grounding, 10-Cleanup/Inspection Prep`;
    try {
      const txt = await callClaude({ system, messages: [{ role: "user", content: "Generate the installation manual JSON now." }], max_tokens: 8000 });
      const json = cleanJson(txt);
      const data = JSON.parse(json);
      if (!data.phases || !Array.isArray(data.phases)) throw new Error("Invalid manual format");
      setManual(data);
    } catch (e) {
      setManErr(e.message || "Failed to generate manual");
    }
    setManBusy(false);
  };

  const doPrintManual = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${pj.nm || "Solar"} — Installation Manual</title><style>
      @media print { @page { size: letter; margin: 0.5in; } body { margin: 0; } .plan-page { page-break-after: always; break-after: page; } .plan-page:last-child { page-break-after: auto; break-after: auto; } }
      body { font-family: ${ff}; margin: 0; padding: 0; }
      .plan-page { padding: 36px 44px; font-size: 13px; line-height: 1.7; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th { padding: 7px 10px; background: #e8e8e8; border: 1px solid #bbb; font-weight: 700; text-align: left; font-size: 11px; }
      td { padding: 6px 10px; border: 1px solid #ccc; }
    </style></head><body>`);
    const pages = manualRef.current?.querySelectorAll(".plan-page");
    if (pages) pages.forEach(p => w.document.write(p.outerHTML));
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  const doPrintComm = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${pj.nm || "Solar"} — Commissioning Packet</title><style>
      @media print { @page { size: letter; margin: 0.5in; } body { margin: 0; } .plan-page { page-break-after: always; break-after: page; } .plan-page:last-child { page-break-after: auto; break-after: auto; } }
      body { font-family: ${ff}; margin: 0; padding: 0; }
      .plan-page { padding: 36px 44px; font-size: 13px; line-height: 1.7; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th { padding: 7px 10px; background: #e8e8e8; border: 1px solid #bbb; font-weight: 700; text-align: left; font-size: 11px; }
      td { padding: 6px 10px; border: 1px solid #ccc; }
    </style></head><body>`);
    const pages = commRef.current?.querySelectorAll(".plan-page");
    if (pages) pages.forEach(p => w.document.write(p.outerHTML));
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  /* ═══ COMMISSIONING DATA ═══ */
  const isMicro = iv?.tp === "micro";
  const isOptimizer = iv?.tp === "optimizer";
  const isHybrid = iv?.tp === "hybrid";
  const isString = iv?.tp === "string";
  const brand = iv?.nm?.split(" ")[0] || "";
  const isEnphase = brand === "Enphase";
  const isSolarEdge = brand === "SolarEdge";
  const isSMA = brand === "SMA";
  const isFronius = brand === "Fronius";
  const isSolArk = iv?.nm?.includes("Sol-Ark");
  const isTigo = brand === "Tigo";

  // Expected per-string values
  const expVoc = sz ? (sz.vc * modsPerStr).toFixed(1) : "—";
  const expVmp = sz ? ((md?.vmp || 0) * modsPerStr).toFixed(1) : "—";
  const expIsc = md?.isc ? md.isc.toFixed(2) : "—";
  const expImp = md?.imp ? md.imp.toFixed(2) : "—";

  // Build string rows for testing table
  const stringTestRows = [];
  for (let s = 1; s <= nStr; s++) {
    const mpptNum = iv?.mppt > 1 ? Math.ceil(s / Math.ceil(nStr / iv.mppt)) : 1;
    stringTestRows.push({ str: s, mppt: mpptNum, mods: modsPerStr });
  }

  /* ═══ RENDER ═══ */
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }} className="fi">
      {/* ──── TOOLBAR (no-print) ──── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }} className="no-print">
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>INSTALLATION PLANS</h2>
        <div style={{ flex: 1 }} />
        <input type="file" accept="image/*" ref={logoRef} style={{ display: "none" }} onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = ev => setLogo(ev.target.result); r.readAsDataURL(f);
        }} />
        <button style={{ ...bt(false), fontSize: 11 }} onClick={() => logoRef.current?.click()}>Upload Logo</button>
        <button style={{ ...bt(false), fontSize: 11 }} onClick={generateManual} disabled={!ready || manBusy}>
          {manBusy ? "Generating..." : "Generate Install Manual"}
        </button>
        {manual && <button style={{ ...bt(false), fontSize: 11 }} onClick={doPrintManual}>Print Manual</button>}
        {ready && <button style={{ ...bt(false), fontSize: 11 }} onClick={doPrintComm}>Print Commissioning</button>}
        <button style={{ ...bt(true), fontSize: 11 }} onClick={doPrint}>Print / Save PDF</button>
      </div>

      {/* ──── NOT READY STATE ──── */}
      {!ready && (
        <div style={{ ...cd, textAlign: "center", padding: 50, color: td }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>&#9638;</div>
          <div style={{ fontFamily: ff, fontSize: 13 }}>Select module, inverter, and run string sizing to generate plans</div>
        </div>
      )}

      {/* ──── PLAN PAGES ──── */}
      {ready && (
        <div ref={printRef}>

          {/* ═══════════════ PAGE 1 — COVER SHEET ═══════════════ */}
          <div className="plan-page" style={pg}>
            {hdr("System Design Summary", "Cover Sheet \u2014 Project Overview & Equipment Specifications")}

            {/* Project Info */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 14 }}>PROJECT INFORMATION</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Project Name</td><td style={tcell}>{pj.nm || "\u2014"}</td><td style={th}>Service Size</td><td style={tcR}>{pj.es || 200}A</td></tr>
              <tr><td style={th}>Address</td><td style={tcell} colSpan={3}>{[pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ") || "\u2014"}</td></tr>
              <tr><td style={th}>Mount Type</td><td style={tcell}>{pj.mt || "roof"}</td><td style={th}>Target kW</td><td style={tcR}>{pj.kw || "\u2014"} kW</td></tr>
              <tr><td style={th}>Actual Array kW</td><td style={tcR}>{arrayKw.toFixed(2)} kW</td><td style={th}>DC:AC Ratio</td><td style={tcR}>{dcac}</td></tr>
            </tbody></table>

            {/* Climate Data */}
            {sz && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>CLIMATE DATA (ASHRAE)</div>
                <table style={tbl}><tbody>
                  <tr><td style={th}>Min Temperature</td><td style={tcR}>{sz.tL}\u00b0C ({(sz.tL * 9/5 + 32).toFixed(0)}\u00b0F)</td><td style={th}>Max Temperature</td><td style={tcR}>{sz.tH}\u00b0C ({(sz.tH * 9/5 + 32).toFixed(0)}\u00b0F)</td></tr>
                  <tr><td style={th}>Solar Irradiance</td><td style={tcR}>{pj.ir || "\u2014"} kWh/m\u00b2/day</td><td style={th}>Peak Sun Hours</td><td style={tcR}>{pj.ps || "\u2014"} hrs</td></tr>
                </tbody></table>
              </>
            )}

            {/* Equipment */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>EQUIPMENT</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Module</td><td style={tcell}>{md.nm}</td><td style={th}>Qty</td><td style={tcR}>{nMods}</td></tr>
              {ivs && ivs.length > 1 ? ivs.map((e, i) => (
                <tr key={e.id}><td style={th}>Inverter {i + 1}{i === 0 ? " (Primary)" : ""}</td><td style={tcell}>{e.inv.nm} ({e.inv.kw}kW)</td><td style={th}>Qty</td><td style={tcR}>{e.qty}</td></tr>
              )) : <tr><td style={th}>Inverter</td><td style={tcell}>{iv.nm}</td><td style={th}>Qty</td><td style={tcR}>{nInv}</td></tr>}
              <tr><td style={th}>Strings</td><td style={tcR}>{nStr}</td><td style={th}>Modules/String</td><td style={tcR}>{modsPerStr}</td></tr>
              <tr><td style={th}>Inverter Type</td><td style={tcell}>{iv.tp}</td><td style={th}>DC:AC</td><td style={tcR}>{ivs && ivs.length > 1 && totalIvKw > 0 ? (totalKw / totalIvKw).toFixed(2) : dcac}</td></tr>
            </tbody></table>

            {/* Module Groups */}
            {modGroups && modGroups.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>MODULE GROUPS</div>
                <table style={tbl}>
                  <thead><tr>
                    <th style={th}>Group</th><th style={th}>Qty</th><th style={th}>Azimuth</th><th style={th}>Orientation</th><th style={{ ...th, textAlign: "right" }}>kW</th>
                  </tr></thead>
                  <tbody>{modGroups.filter(g => (+g.cnt || 0) > 0).map((g, i) => (
                    <tr key={i}>
                      <td style={tcell}>{g.nm || `Group ${i + 1}`}</td>
                      <td style={tcR}>{g.cnt}</td>
                      <td style={tcR}>{g.az || 180}\u00b0</td>
                      <td style={tcell}>{g.ori === "L" ? "Landscape" : "Portrait"}</td>
                      <td style={tcR}>{((+g.cnt * md.w) / 1000).toFixed(2)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}

            {/* Design Notes */}
            {dsg?.notes?.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>DESIGN NOTES</div>
                <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7, padding: "8px 12px", background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 4 }}>
                  {dsg.notes.map((n, i) => <div key={i}>{"\u2022"} {n}</div>)}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════ PAGE 2 — ARRAY LAYOUT ═══════════════ */}
          <div className="plan-page" style={pg}>
            {hdr("Array Layout", "Module Placement \u2014 Roof / Ground Layout Diagram")}

            {modGroups && modGroups.filter(g => (+g.cnt || 0) > 0).map((g, gi) => {
              const msz = modSz(g.ori);
              const mW = msz?.w || 1050;
              const mH = msz?.h || 2100;
              const fsz = faceSz(g.ori, g.fw);
              const fW = fsz?.w || 8000;
              const fH = fsz?.h || 5000;
              const positions = layPos?.[g.id] || [];
              const printScale = Math.min(750 / (fW / 25.4 * 3), 400 / (fH / 25.4 * 3));
              const svgW = (fW / 25.4) * printScale * 3;
              const svgH = (fH / 25.4) * printScale * 3;
              const mWin = mW / 25.4;
              const mHin = mH / 25.4;

              return (
                <div key={gi} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 6 }}>
                    {g.nm || `Group ${gi + 1}`} \u2014 {g.cnt} modules, {g.az || 180}\u00b0 azimuth, {g.ori === "L" ? "Landscape" : "Portrait"}
                  </div>
                  <svg width={Math.max(svgW, 300)} height={Math.max(svgH, 200)} style={{ border: "1px solid #ccc", background: "#fafafa", borderRadius: 4 }}>
                    {/* Roof / face outline */}
                    <rect x={4} y={4} width={Math.max(svgW - 8, 292)} height={Math.max(svgH - 8, 192)} fill="none" stroke="#999" strokeWidth={1} strokeDasharray="6,3" rx={2} />
                    {/* Module positions */}
                    {positions.length > 0 ? positions.map((pos, mi) => {
                      const px = (pos.x || 0) * printScale;
                      const py = (pos.y || 0) * printScale;
                      const pw = ((g.ori === "L" ? mHin : mWin)) * printScale;
                      const ph = ((g.ori === "L" ? mWin : mHin)) * printScale;
                      return (
                        <g key={mi}>
                          <rect x={px + 10} y={py + 10} width={pw} height={ph} fill="#2563eb22" stroke="#2563eb" strokeWidth={0.8} rx={1} />
                          <text x={px + 10 + pw / 2} y={py + 10 + ph / 2 + 3} textAnchor="middle" fill="#2563eb" fontSize={Math.max(7, pw * 0.15)} fontFamily={ff}>{mi + 1}</text>
                        </g>
                      );
                    }) : (
                      /* Fallback grid when no positions available */
                      Array.from({ length: +g.cnt || 0 }, (_, mi) => {
                        const cols = Math.ceil(Math.sqrt((+g.cnt || 0) * 1.5));
                        const r = Math.floor(mi / cols);
                        const cc = mi % cols;
                        const cellW = (g.ori === "L" ? mHin : mWin) * printScale;
                        const cellH = (g.ori === "L" ? mWin : mHin) * printScale;
                        const gap = 2;
                        return (
                          <g key={mi}>
                            <rect x={12 + cc * (cellW + gap)} y={12 + r * (cellH + gap)} width={cellW} height={cellH} fill="#2563eb22" stroke="#2563eb" strokeWidth={0.8} rx={1} />
                            <text x={12 + cc * (cellW + gap) + cellW / 2} y={12 + r * (cellH + gap) + cellH / 2 + 3} textAnchor="middle" fill="#2563eb" fontSize={Math.max(7, cellW * 0.15)} fontFamily={ff}>{mi + 1}</text>
                          </g>
                        );
                      })
                    )}
                    {/* Dimension label */}
                    <text x={Math.max(svgW, 300) / 2} y={Math.max(svgH, 200) - 6} textAnchor="middle" fill="#888" fontSize={9} fontFamily={ff}>
                      Module: {(mW / 25.4).toFixed(1)}" x {(mH / 25.4).toFixed(1)}"
                    </text>
                  </svg>
                </div>
              );
            })}

            {(!modGroups || modGroups.filter(g => (+g.cnt || 0) > 0).length === 0) && (
              <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 12 }}>No module groups configured. Add groups on the Layout tab.</div>
            )}
          </div>

          {/* ═══════════════ PAGE 3 — SINGLE-LINE DIAGRAM ═══════════════ */}
          <div className="plan-page" style={pg}>
            {hdr("Single-Line Diagram", "Electrical One-Line \u2014 NEC 690 / 705 Compliant")}

            {(() => {
              const svW = 780, svH = 520;
              const hasComb = nStr > 1;
              const ox = hasComb ? 60 : 0;
              const isMicro = iv?.tp === "micro";
              const dcWire = sz?.dc || "10";
              const acWire = sz?.ac || "10";
              const combWire = hasComb ? combinerWire() : null;

              return (
                <svg width={svW} height={svH} style={{ border: "1px solid #ccc", background: "#fefefe", borderRadius: 4 }}>
                  <defs>
                    <marker id="arw" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" fill="#333" />
                    </marker>
                  </defs>

                  {/* ── PV Array ── */}
                  <rect x={20} y={80} width={80} height={100} rx={4} fill="#fff8e1" stroke="#f59e0b" strokeWidth={1.5} />
                  <text x={60} y={100} textAnchor="middle" fill="#b45309" fontSize={10} fontWeight={700} fontFamily={ff}>PV ARRAY</text>
                  <text x={60} y={115} textAnchor="middle" fill="#78350f" fontSize={8} fontFamily={ff}>{nMods} modules</text>
                  <text x={60} y={128} textAnchor="middle" fill="#78350f" fontSize={8} fontFamily={ff}>{arrayKw.toFixed(1)} kW</text>
                  <text x={60} y={141} textAnchor="middle" fill="#78350f" fontSize={8} fontFamily={ff}>{nStr}S x {modsPerStr}M</text>
                  {/* +/- terminals */}
                  <circle cx={45} cy={180} r={5} fill="#dc2626" stroke="#dc2626" strokeWidth={1} />
                  <text x={45} y={183} textAnchor="middle" fill="#fff" fontSize={7} fontWeight={700}>+</text>
                  <circle cx={75} cy={180} r={5} fill="#1e40af" stroke="#1e40af" strokeWidth={1} />
                  <text x={75} y={183} textAnchor="middle" fill="#fff" fontSize={7} fontWeight={700}>\u2212</text>

                  {/* ── DC Wire Labels ── */}
                  <line x1={60} y1={185} x2={60} y2={210} stroke="#dc2626" strokeWidth={1.5} markerEnd="url(#arw)" />
                  <text x={60} y={222} textAnchor="middle" fill="#dc2626" fontSize={7} fontFamily={ff}>#{dcWire} PV Wire</text>
                  <text x={60} y={232} textAnchor="middle" fill="#666" fontSize={7} fontFamily={ff}>Voc={sysVoc}V Vmp={sysVmp}V</text>

                  {/* ── Combiner (conditional) ── */}
                  {hasComb && (
                    <g>
                      <line x1={60} y1={235} x2={60} y2={255} stroke="#dc2626" strokeWidth={1.2} />
                      <rect x={20} y={255} width={80} height={44} rx={4} fill="#fef3c7" stroke="#d97706" strokeWidth={1.2} />
                      <text x={60} y={272} textAnchor="middle" fill="#92400e" fontSize={9} fontWeight={700} fontFamily={ff}>COMBINER</text>
                      <text x={60} y={284} textAnchor="middle" fill="#92400e" fontSize={7} fontFamily={ff}>{nStr} strings \u2192 1 output</text>
                      <text x={60} y={294} textAnchor="middle" fill="#666" fontSize={7} fontFamily={ff}>#{combWire?.awg || "8"} THWN-2</text>
                      <line x1={60} y1={299} x2={60} y2={318} stroke="#dc2626" strokeWidth={1.2} markerEnd="url(#arw)" />
                    </g>
                  )}

                  {/* ── DC Disconnect ── */}
                  {(() => {
                    const dcY = hasComb ? 320 : 245;
                    return (
                      <g>
                        <line x1={60} y1={dcY - 10} x2={60} y2={dcY} stroke="#dc2626" strokeWidth={1.2} />
                        <rect x={25} y={dcY} width={70} height={40} rx={4} fill="#fef2f2" stroke="#dc2626" strokeWidth={1.2} />
                        <text x={60} y={dcY + 16} textAnchor="middle" fill="#991b1b" fontSize={9} fontWeight={700} fontFamily={ff}>DC DISC.</text>
                        {/* Switch symbol */}
                        <line x1={42} y1={dcY + 24} x2={52} y2={dcY + 24} stroke="#991b1b" strokeWidth={1.5} />
                        <line x1={52} y1={dcY + 24} x2={68} y2={dcY + 20} stroke="#991b1b" strokeWidth={1.5} />
                        <line x1={68} y1={dcY + 24} x2={78} y2={dcY + 24} stroke="#991b1b" strokeWidth={1.5} />
                        <text x={60} y={dcY + 36} textAnchor="middle" fill="#666" fontSize={7} fontFamily={ff}>{sz?.oc || 20}A fused</text>
                      </g>
                    );
                  })()}

                  {/* ── Inverter ── */}
                  {(() => {
                    const invY = hasComb ? 375 : 300;
                    const invX = 130 + ox;
                    return (
                      <g>
                        <line x1={60} y1={invY - 15} x2={invX + 45} y2={invY - 15} stroke="#dc2626" strokeWidth={1.2} />
                        <line x1={invX + 45} y1={invY - 15} x2={invX + 45} y2={invY} stroke="#dc2626" strokeWidth={1.2} markerEnd="url(#arw)" />
                        <rect x={invX} y={invY} width={90} height={60} rx={4} fill="#eff6ff" stroke="#2563eb" strokeWidth={1.5} />
                        <text x={invX + 45} y={invY + 16} textAnchor="middle" fill="#1e40af" fontSize={10} fontWeight={700} fontFamily={ff}>INVERTER</text>
                        <text x={invX + 45} y={invY + 28} textAnchor="middle" fill="#1e40af" fontSize={7} fontFamily={ff}>{iv.nm?.substring(0, 20) || "Inverter"}</text>
                        <text x={invX + 45} y={invY + 39} textAnchor="middle" fill="#1e40af" fontSize={7} fontFamily={ff}>{iv.kw} kW / {iv.dv}V max</text>
                        <text x={invX + 45} y={invY + 50} textAnchor="middle" fill="#1e40af" fontSize={7} fontFamily={ff}>{nInv > 1 ? `Qty: ${nInv}` : `${iv.mppt || 1} MPPT`}{isMicro ? " (micro)" : ""}</text>
                      </g>
                    );
                  })()}

                  {/* ── AC Output ── */}
                  {(() => {
                    const invX = 130 + ox;
                    const acStartY = hasComb ? 435 : 360;
                    const panelX = 380 + ox;
                    return (
                      <g>
                        {/* AC wire from inverter */}
                        <line x1={invX + 45} y1={acStartY} x2={invX + 45} y2={acStartY + 20} stroke="#2563eb" strokeWidth={1.2} />
                        {/* AC wire labels */}
                        <text x={invX + 70} y={acStartY + 10} fill="#2563eb" fontSize={7} fontFamily={ff}>L1/L2/N</text>
                        <text x={invX + 70} y={acStartY + 20} fill="#666" fontSize={7} fontFamily={ff}>#{acWire} THWN-2</text>

                        {/* Horizontal run to OCPD */}
                        <line x1={invX + 45} y1={acStartY + 20} x2={panelX - 50} y2={acStartY + 20} stroke="#2563eb" strokeWidth={1.2} markerEnd="url(#arw)" />

                        {/* AC OCPD */}
                        <rect x={panelX - 50} y={acStartY + 6} width={60} height={30} rx={4} fill="#f0fdf4" stroke="#059669" strokeWidth={1.2} />
                        <text x={panelX - 20} y={acStartY + 20} textAnchor="middle" fill="#065f46" fontSize={8} fontWeight={700} fontFamily={ff}>AC OCPD</text>
                        <text x={panelX - 20} y={acStartY + 30} textAnchor="middle" fill="#065f46" fontSize={7} fontFamily={ff}>{acBreaker}A breaker</text>

                        {/* Wire to panel */}
                        <line x1={panelX + 10} y1={acStartY + 21} x2={panelX + 50} y2={acStartY + 21} stroke="#059669" strokeWidth={1.2} markerEnd="url(#arw)" />

                        {/* Main Panel */}
                        <rect x={panelX + 50} y={acStartY - 30} width={100} height={90} rx={4} fill="#f8fafc" stroke="#334155" strokeWidth={1.5} />
                        <text x={panelX + 100} y={acStartY - 12} textAnchor="middle" fill="#0f172a" fontSize={9} fontWeight={700} fontFamily={ff}>MAIN PANEL</text>
                        <text x={panelX + 100} y={acStartY} textAnchor="middle" fill="#475569" fontSize={7} fontFamily={ff}>{busbar}A Bus</text>
                        {/* Bus bar lines */}
                        <line x1={panelX + 65} y1={acStartY + 8} x2={panelX + 135} y2={acStartY + 8} stroke="#334155" strokeWidth={2} />
                        <line x1={panelX + 65} y1={acStartY + 16} x2={panelX + 135} y2={acStartY + 16} stroke="#334155" strokeWidth={2} />
                        <text x={panelX + 100} y={acStartY + 32} textAnchor="middle" fill="#475569" fontSize={7} fontFamily={ff}>Service: {busbar}A</text>
                        <text x={panelX + 100} y={acStartY + 44} textAnchor="middle" fill="#475569" fontSize={7} fontFamily={ff}>Main breaker</text>
                      </g>
                    );
                  })()}

                  {/* ── Grounding ── */}
                  {(() => {
                    const gndY = hasComb ? 480 : 410;
                    const invX = 130 + ox;
                    return (
                      <g>
                        <text x={20} y={gndY} fill="#059669" fontSize={9} fontWeight={700} fontFamily={ff}>GROUNDING</text>
                        <text x={20} y={gndY + 13} fill="#333" fontSize={7} fontFamily={ff}>EGC: #{sz?.egc || "10"} Cu (NEC 250.122)</text>
                        <text x={20} y={gndY + 24} fill="#333" fontSize={7} fontFamily={ff}>GEC: #{sz?.gec || "6"} Cu (NEC 250.66)</text>
                        <text x={20} y={gndY + 35} fill="#333" fontSize={7} fontFamily={ff}>Bonding: equipment grounding per 250.134</text>
                        {/* Ground symbol */}
                        <line x1={180 + ox} y1={gndY + 5} x2={180 + ox} y2={gndY + 22} stroke="#059669" strokeWidth={1.2} />
                        <line x1={170 + ox} y1={gndY + 22} x2={190 + ox} y2={gndY + 22} stroke="#059669" strokeWidth={1.5} />
                        <line x1={173 + ox} y1={gndY + 26} x2={187 + ox} y2={gndY + 26} stroke="#059669" strokeWidth={1.2} />
                        <line x1={176 + ox} y1={gndY + 30} x2={184 + ox} y2={gndY + 30} stroke="#059669" strokeWidth={0.8} />
                      </g>
                    );
                  })()}

                  {/* ── NEC 705.12 120% Rule ── */}
                  {(() => {
                    const ruleY = 30;
                    const ruleX = svW - 250;
                    const totalOcpd = acBreaker + busbar;
                    const ruleLimit = busbar * 1.2;
                    const passes = totalOcpd <= ruleLimit;
                    return (
                      <g>
                        <rect x={ruleX} y={ruleY} width={230} height={65} rx={4} fill={passes ? "#f0fdf4" : "#fef2f2"} stroke={passes ? "#059669" : "#dc2626"} strokeWidth={1} />
                        <text x={ruleX + 115} y={ruleY + 14} textAnchor="middle" fill={passes ? "#065f46" : "#991b1b"} fontSize={9} fontWeight={700} fontFamily={ff}>NEC 705.12 \u2014 120% RULE</text>
                        <text x={ruleX + 10} y={ruleY + 28} fill="#333" fontSize={7} fontFamily={ff}>PV breaker: {acBreaker}A + Main bus: {busbar}A = {totalOcpd}A</text>
                        <text x={ruleX + 10} y={ruleY + 40} fill="#333" fontSize={7} fontFamily={ff}>Limit: {busbar}A x 1.20 = {ruleLimit}A</text>
                        <text x={ruleX + 115} y={ruleY + 56} textAnchor="middle" fill={passes ? "#059669" : "#dc2626"} fontSize={10} fontWeight={700} fontFamily={ff}>{passes ? "\u2713 PASS" : "\u2717 FAIL"} ({totalOcpd}A {passes ? "\u2264" : ">"} {ruleLimit}A)</text>
                      </g>
                    );
                  })()}

                  {/* ── NEC 690.12 Rapid Shutdown ── */}
                  {(() => {
                    const rsX = svW - 250;
                    const rsY = 105;
                    return (
                      <g>
                        <rect x={rsX} y={rsY} width={230} height={35} rx={4} fill="#eff6ff" stroke="#2563eb" strokeWidth={1} />
                        <text x={rsX + 115} y={rsY + 14} textAnchor="middle" fill="#1e40af" fontSize={9} fontWeight={700} fontFamily={ff}>NEC 690.12 RAPID SHUTDOWN</text>
                        <text x={rsX + 115} y={rsY + 27} textAnchor="middle" fill="#1e40af" fontSize={7} fontFamily={ff}>{iv?.tp === "micro" || iv?.tp === "optimizer" ? "Module-level: compliant via MLPE" : "Array-level: requires RSD equipment"}</text>
                      </g>
                    );
                  })()}

                  {/* ── Legend ── */}
                  <g>
                    <rect x={svW - 200} y={svH - 50} width={185} height={42} rx={4} fill="#fff" stroke="#ccc" strokeWidth={0.8} />
                    <text x={svW - 190} y={svH - 34} fill="#000" fontSize={8} fontWeight={700} fontFamily={ff}>LEGEND</text>
                    <line x1={svW - 190} y1={svH - 24} x2={svW - 170} y2={svH - 24} stroke="#dc2626" strokeWidth={1.5} />
                    <text x={svW - 165} y={svH - 21} fill="#333" fontSize={7} fontFamily={ff}>DC Circuit</text>
                    <line x1={svW - 115} y1={svH - 24} x2={svW - 95} y2={svH - 24} stroke="#2563eb" strokeWidth={1.5} />
                    <text x={svW - 90} y={svH - 21} fill="#333" fontSize={7} fontFamily={ff}>AC Circuit</text>
                    <line x1={svW - 190} y1={svH - 14} x2={svW - 170} y2={svH - 14} stroke="#059669" strokeWidth={1.5} />
                    <text x={svW - 165} y={svH - 11} fill="#333" fontSize={7} fontFamily={ff}>Grounding</text>
                  </g>
                </svg>
              );
            })()}
          </div>

          {/* ═══════════════ PAGE 4 — WIRE & CONDUIT SCHEDULE ═══════════════ */}
          <div className="plan-page" style={pg}>
            {hdr("Wire & Conduit Schedule", "Conductor Sizing & Conduit Fill \u2014 NEC 310/690/705")}

            {/* Circuit Table */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>CIRCUIT SCHEDULE</div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Circuit</th><th style={th}>Conductor</th><th style={th}>Type</th><th style={th}>Amps</th><th style={th}>OCPD</th><th style={th}>Notes</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={tcell}>DC PV String</td>
                  <td style={tcell}>#{sz?.dc || "10"} Cu</td>
                  <td style={tcell}>PV Wire / USE-2</td>
                  <td style={tcR}>{sz?.im || "\u2014"}A</td>
                  <td style={tcR}>{sz?.oc || "\u2014"}A</td>
                  <td style={tcell}>{nStr} string(s), {modsPerStr} modules each</td>
                </tr>
                {needsCombiner && (
                  <tr>
                    <td style={tcell}>DC Combined</td>
                    <td style={tcell}>#{combinerWire()?.awg || "8"} Cu</td>
                    <td style={tcell}>THWN-2</td>
                    <td style={tcR}>{((md?.isc || 10) * nStr * 1.25).toFixed(1)}A</td>
                    <td style={tcR}>{sz?.oc || "\u2014"}A</td>
                    <td style={tcell}>Combiner output to DC disconnect</td>
                  </tr>
                )}
                <tr>
                  <td style={tcell}>AC Output</td>
                  <td style={tcell}>#{sz?.ac || "10"} Cu</td>
                  <td style={tcell}>THWN-2</td>
                  <td style={tcR}>{(iv?.ai * 1.25)?.toFixed(1) || "\u2014"}A</td>
                  <td style={tcR}>{acBreaker}A</td>
                  <td style={tcell}>Inverter to AC OCPD</td>
                </tr>
                <tr>
                  <td style={tcell}>AC to Panel</td>
                  <td style={tcell}>#{sz?.ac || "10"} Cu</td>
                  <td style={tcell}>THWN-2</td>
                  <td style={tcR}>{(iv?.ai * 1.25)?.toFixed(1) || "\u2014"}A</td>
                  <td style={tcR}>{acBreaker}A</td>
                  <td style={tcell}>AC OCPD to main service panel</td>
                </tr>
                <tr>
                  <td style={tcell}>EGC</td>
                  <td style={tcell}>#{sz?.egc || "10"} Cu</td>
                  <td style={tcell}>Bare / Green THWN-2</td>
                  <td style={tcR}>\u2014</td>
                  <td style={tcR}>\u2014</td>
                  <td style={tcell}>NEC 250.122 per OCPD rating</td>
                </tr>
                <tr>
                  <td style={tcell}>GEC</td>
                  <td style={tcell}>#{sz?.gec || "6"} Cu</td>
                  <td style={tcell}>Bare Cu</td>
                  <td style={tcR}>\u2014</td>
                  <td style={tcR}>\u2014</td>
                  <td style={tcell}>NEC 250.66 per service size</td>
                </tr>
              </tbody>
            </table>

            {/* Conduit Fill Table */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>CONDUIT FILL CALCULATION (40% MAX \u2014 NEC Table 1, Ch. 9)</div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Run</th><th style={th}>Conductors</th><th style={th}>Total Area (in\u00b2)</th><th style={th}>Min Conduit</th><th style={th}>Fill %</th>
              </tr></thead>
              <tbody>
                {(() => {
                  const runs = [];
                  const dcG = sz?.dc || "10";
                  const acG = sz?.ac || "10";
                  const egcG = sz?.egc || "10";

                  // DC run
                  const dcArea = ((COND.find(c => c.awg === dcG)?.ohm || 0.02) > 0 ? 0.0211 : 0.0211) * 2 + 0.0211;
                  runs.push({ name: "DC PV to Disconnect", conds: `2x #${dcG} PV + #${egcG} EGC`, area: "Per NEC Ch.9", conduit: "Per calc", fill: "\u226440%" });

                  // AC run
                  runs.push({ name: "AC Inverter to Panel", conds: `2x #${acG} + 1x #${acG} N + #${egcG} EGC`, area: "Per NEC Ch.9", conduit: "Per calc", fill: "\u226440%" });

                  return runs.map((r, i) => (
                    <tr key={i}>
                      <td style={tcell}>{r.name}</td>
                      <td style={tcell}>{r.conds}</td>
                      <td style={tcR}>{r.area}</td>
                      <td style={tcR}>{r.conduit}</td>
                      <td style={tcR}>{r.fill}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            {/* String Voltage Table */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>STRING VOLTAGE \u2014 NEC 690.7(A)</div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Parameter</th><th style={th}>Per Module</th><th style={th}>String ({modsPerStr} modules)</th><th style={th}>Limit</th><th style={th}>Status</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={tcell}>Voc (corrected, cold)</td>
                  <td style={tcR}>{sz?.vc || "\u2014"}V</td>
                  <td style={tcR}>{sysVoc}V</td>
                  <td style={tcR}>{iv?.dv || "\u2014"}V max</td>
                  <td style={{ ...tcR, color: (sz?.vc * modsPerStr) <= iv?.dv ? "#059669" : "#dc2626", fontWeight: 700 }}>
                    {(sz?.vc * modsPerStr) <= iv?.dv ? "\u2713 OK" : "\u2717 OVER"}
                  </td>
                </tr>
                <tr>
                  <td style={tcell}>Vmp (hot, degraded)</td>
                  <td style={tcR}>{sz?.vh || "\u2014"}V</td>
                  <td style={tcR}>{sysVmp}V</td>
                  <td style={tcR}>{iv?.ml || "\u2014"}V min MPPT</td>
                  <td style={{ ...tcR, color: (sz?.vh * modsPerStr) >= iv?.ml ? "#059669" : "#dc2626", fontWeight: 700 }}>
                    {(sz?.vh * modsPerStr) >= iv?.ml ? "\u2713 OK" : "\u2717 LOW"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══════════════ PAGE 5 — EQUIPMENT SCHEDULE ═══════════════ */}
          <div className="plan-page" style={pg}>
            {hdr("Equipment Schedule", "Bill of Materials & NEC Required Labels")}

            {/* Equipment BOM */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>EQUIPMENT BILL OF MATERIALS</div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Item</th><th style={th}>Description</th><th style={{ ...th, textAlign: "right" }}>Qty</th><th style={th}>Notes</th>
              </tr></thead>
              <tbody>
                <tr><td style={tcell}>PV Module</td><td style={tcell}>{md.nm} ({md.w}W)</td><td style={tcR}>{nMods}</td><td style={tcell}>{nStr} strings x {modsPerStr} modules</td></tr>
                {ivs && ivs.length > 1 ? ivs.map((e, i) => (
                  <tr key={e.id}><td style={tcell}>Inverter {i + 1}{i === 0 ? " (Primary)" : ""}</td><td style={tcell}>{e.inv.nm} ({e.inv.kw}kW)</td><td style={tcR}>{e.qty}</td><td style={tcell}>{e.inv.tp} type, {e.inv.mppt || 1} MPPT</td></tr>
                )) : <tr><td style={tcell}>Inverter</td><td style={tcell}>{iv.nm} ({iv.kw}kW)</td><td style={tcR}>{nInv}</td><td style={tcell}>{iv.tp} type, {iv.mppt || 1} MPPT</td></tr>}
                {iv.tp === "micro" && (
                  <tr><td style={tcell}>Q-Cable / Trunk</td><td style={tcell}>Microinverter trunk cable</td><td style={tcR}>{nMods}</td><td style={tcell}>1 per module</td></tr>
                )}
                {iv.tp === "optimizer" && (
                  <tr><td style={tcell}>DC Optimizer</td><td style={tcell}>Module-level power optimizer</td><td style={tcR}>{nMods}</td><td style={tcell}>1 per module</td></tr>
                )}
                <tr><td style={tcell}>Racking</td><td style={tcell}>{pj.mt === "ground" ? "Ground mount racking system" : pj.mt === "carport" ? "Carport structure" : "Roof mount racking (rail + clamps)"}</td><td style={tcR}>{nMods}</td><td style={tcell}>Sized per module count</td></tr>
                <tr><td style={tcell}>Flashing / Attachments</td><td style={tcell}>{pj.mt === "ground" ? "Concrete piers / driven piles" : "Roof flashing / L-feet"}</td><td style={tcR}>{Math.ceil(nMods * 0.5)}</td><td style={tcell}>Per engineering / layout</td></tr>
                <tr><td style={tcell}>DC Disconnect</td><td style={tcell}>Fused DC disconnect switch</td><td style={tcR}>{nInv}</td><td style={tcell}>NEC 690.15</td></tr>
                <tr><td style={tcell}>AC OCPD</td><td style={tcell}>{acBreaker}A 2-pole breaker</td><td style={tcR}>{nInv}</td><td style={tcell}>NEC 705.12</td></tr>
                {needsCombiner && (
                  <tr><td style={tcell}>Combiner Box</td><td style={tcell}>{nStr}-string combiner box</td><td style={tcR}>1</td><td style={tcell}>With fuse holders, rated for Isc x 1.56</td></tr>
                )}
                <tr><td style={tcell}>Junction Box</td><td style={tcell}>NEMA 3R junction box</td><td style={tcR}>{Math.ceil(nStr * 0.5) || 1}</td><td style={tcell}>Weatherproof, for wire transitions</td></tr>
                <tr><td style={tcell}>Ground Rod</td><td style={tcell}>8ft copper-clad ground rod + clamp</td><td style={tcR}>1</td><td style={tcell}>NEC 250.52 / 250.53</td></tr>
                <tr><td style={tcell}>Labels</td><td style={tcell}>NEC 690 compliant label set</td><td style={tcR}>1 set</td><td style={tcell}>See label requirements below</td></tr>
              </tbody>
            </table>

            {/* NEC 690 Labels */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>REQUIRED NEC 690 LABELS</div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Label</th><th style={th}>Location</th><th style={th}>Required Information</th><th style={th}>NEC Reference</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={tcell}>DC Disconnect</td>
                  <td style={tcell}>At DC disconnect switch</td>
                  <td style={tcell}>Max Voc: {sysVoc}V, Max Isc: {((md?.isc || 0) * nStr).toFixed(1)}A, rated {sz?.oc || 20}A</td>
                  <td style={tcell}>690.13(B)</td>
                </tr>
                <tr>
                  <td style={tcell}>AC Interconnection</td>
                  <td style={tcell}>At point of connection to panel</td>
                  <td style={tcell}>AC output: {iv?.kw || "\u2014"}kW, {acBreaker}A OCPD, 240V</td>
                  <td style={tcell}>705.10</td>
                </tr>
                <tr>
                  <td style={tcell}>PV System Rating</td>
                  <td style={tcell}>Main service panel</td>
                  <td style={tcell}>Array: {arrayKw.toFixed(1)}kW DC, Inverter: {(iv?.kw * nInv) || "\u2014"}kW AC</td>
                  <td style={tcell}>690.53</td>
                </tr>
                <tr>
                  <td style={tcell}>Rapid Shutdown</td>
                  <td style={tcell}>At service entrance / main disconnect</td>
                  <td style={tcell}>{iv?.tp === "micro" || iv?.tp === "optimizer" ? "Module-level shutdown via MLPE" : "Rapid shutdown initiator at service point"}</td>
                  <td style={tcell}>690.12</td>
                </tr>
                <tr>
                  <td style={tcell}>Ground Fault</td>
                  <td style={tcell}>At inverter / ground-fault device</td>
                  <td style={tcell}>Ground-fault protection provided by inverter, EGC #{sz?.egc || "10"} Cu</td>
                  <td style={tcell}>690.41</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 20, fontSize: 10, color: "#777", lineHeight: 1.6, borderTop: "1px solid #ddd", paddingTop: 10 }}>
              This equipment schedule is for reference only. Final quantities and specifications subject to AHJ review, site conditions, and engineering approval.
              All work shall comply with NEC 2020/2023 Articles 690, 705, and 250 as applicable. Permit drawings require PE stamp where required by jurisdiction.
            </div>
          </div>

        </div>
      )}

      {/* ═══ MANUAL LOADING STATE ═══ */}
      {manBusy && (
        <div style={{ ...cd, textAlign: "center", padding: 40, marginTop: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 10, animation: "pulse 1.5s infinite" }}>&#9881;</div>
          <div style={{ fontFamily: ff, fontSize: 13, color: tx }}>Generating installation manual...</div>
          <div style={{ fontFamily: ff, fontSize: 11, color: td, marginTop: 4 }}>This may take 10-15 seconds</div>
          <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
      )}

      {/* ═══ MANUAL ERROR ═══ */}
      {manErr && (
        <div style={{ ...cd, marginTop: 14, border: "2px solid #dc2626", padding: "16px 20px" }}>
          <div style={{ fontFamily: ff, fontSize: 13, color: "#dc2626", fontWeight: 700 }}>Manual Generation Failed</div>
          <div style={{ fontFamily: ff, fontSize: 11, color: tx, marginTop: 4 }}>{manErr}</div>
          <button style={{ ...bt(false), fontSize: 11, marginTop: 8 }} onClick={() => setManErr("")}>Dismiss</button>
        </div>
      )}

      {/* ═══ INSTALLATION MANUAL PAGES ═══ */}
      {manual && (
        <div ref={manualRef} style={{ marginTop: 14 }}>

          {/* ──── MANUAL COVER PAGE ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Installation Manual", "Chronological Task Guide — By Skill Level")}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 14 }}>PROJECT SUMMARY</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Project</td><td style={tcell}>{pj.nm || "—"}</td><td style={th}>System</td><td style={tcR}>{arrayKw.toFixed(1)} kW</td></tr>
              <tr><td style={th}>Address</td><td style={tcell} colSpan={3}>{[pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ") || "—"}</td></tr>
              <tr><td style={th}>Modules</td><td style={tcell}>{nMods}x {md?.nm}</td><td style={th}>Inverter</td><td style={tcell}>{nInv}x {iv?.nm}</td></tr>
              <tr><td style={th}>Mount</td><td style={tcell}>{pj.mt}</td><td style={th}>Strings</td><td style={tcR}>{nStr}S x {modsPerStr}M</td></tr>
            </tbody></table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>SKILL LEVEL LEGEND</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {Object.entries(LVL).map(([k, v]) => (
                <div key={k} style={{ padding: "6px 14px", borderRadius: 6, background: v.bg, border: `1px solid ${v.color}`, fontFamily: ff, fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: v.color }}>{v.short}</span> — {v.label}
                </div>
              ))}
            </div>

            {manual.safety?.length > 0 && <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 14 }}>GENERAL SAFETY</div>
              <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4 }}>
                {manual.safety.map((s, i) => <div key={i}>{"\u26a0"} {s}</div>)}
              </div>
            </>}

            {manual.tools?.length > 0 && <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 14 }}>REQUIRED TOOLS</div>
              <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7, padding: "8px 12px", background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 4, columns: 2 }}>
                {manual.tools.map((t, i) => <div key={i}>{"\u2022"} {t}</div>)}
              </div>
            </>}
          </div>

          {/* ──── MASTER TIMELINE PAGE ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Master Timeline", "All Phases — Chronological Order")}
            {manual.phases.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 4, background: "#f3f4f6", padding: "4px 8px", borderRadius: 3 }}>
                  Phase {pi + 1}: {phase.name}
                </div>
                <table style={tbl}>
                  <thead><tr>
                    <th style={{ ...th, width: 30 }}>#</th><th style={th}>Task</th><th style={{ ...th, width: 40 }}>Level</th>
                    <th style={{ ...th, width: 50 }}>Time</th><th style={th}>Details</th><th style={{ ...th, width: 120 }}>Safety</th>
                  </tr></thead>
                  <tbody>{phase.tasks.map((t, ti) => {
                    const lv = LVL[t.level] || LVL[1];
                    return (
                      <tr key={ti}>
                        <td style={tcR}>{t.step || ti + 1}</td>
                        <td style={{ ...tcell, fontWeight: 600 }}>{t.task}</td>
                        <td style={{ ...tcell, textAlign: "center" }}>
                          <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 3, background: lv.bg, color: lv.color, fontWeight: 700, fontSize: 9 }}>{lv.short}</span>
                        </td>
                        <td style={{ ...tcR, fontSize: 10 }}>{t.duration}</td>
                        <td style={{ ...tcell, fontSize: 10 }}>{t.details}</td>
                        <td style={{ ...tcell, fontSize: 10, color: t.safety ? "#dc2626" : "#999" }}>{t.safety || "—"}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ))}
          </div>

          {/* ──── ROLE-SPECIFIC PAGES ──── */}
          {Object.entries(LVL).map(([lvlKey, lvl]) => {
            const lvlNum = +lvlKey;
            const roleTasks = manual.phases.map(phase => ({
              name: phase.name,
              tasks: phase.tasks.filter(t => t.level === lvlNum)
            })).filter(p => p.tasks.length > 0);
            if (roleTasks.length === 0) return null;
            const totalMin = roleTasks.reduce((s, p) => s + p.tasks.reduce((s2, t) => s2 + (parseInt(t.duration) || 0), 0), 0);
            return (
              <div key={lvlKey} className="plan-page" style={pg}>
                {hdr(`${lvl.label} Tasks`, `Role-Specific Task Sheet — ${lvl.short}`)}
                <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                  <div style={{ padding: "4px 12px", borderRadius: 4, background: lvl.bg, border: `1px solid ${lvl.color}`, fontFamily: ff, fontSize: 11, fontWeight: 700, color: lvl.color }}>
                    {roleTasks.reduce((s, p) => s + p.tasks.length, 0)} tasks
                  </div>
                  <div style={{ fontFamily: ff, fontSize: 11, color: "#555", paddingTop: 5 }}>
                    Estimated time: {totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m`}
                  </div>
                </div>
                {roleTasks.map((phase, pi) => (
                  <div key={pi} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: lvl.color, marginBottom: 4 }}>{phase.name}</div>
                    <table style={tbl}>
                      <thead><tr>
                        <th style={{ ...th, width: 24 }}>{"\u2610"}</th><th style={th}>Task</th>
                        <th style={{ ...th, width: 50 }}>Time</th><th style={th}>Details</th><th style={{ ...th, width: 110 }}>Safety</th>
                      </tr></thead>
                      <tbody>{phase.tasks.map((t, ti) => (
                        <tr key={ti}>
                          <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                          <td style={{ ...tcell, fontWeight: 600 }}>{t.task}</td>
                          <td style={{ ...tcR, fontSize: 10 }}>{t.duration}</td>
                          <td style={{ ...tcell, fontSize: 10 }}>{t.details}</td>
                          <td style={{ ...tcell, fontSize: 10, color: t.safety ? "#dc2626" : "#999" }}>{t.safety || "—"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })}

          {/* ═══════════════ APPENDIX — SPEC SHEETS ═══════════════ */}
          {specSheets.length > 0 && (
            <div className="plan-page" style={pg}>
              {hdr("Appendix — Component Spec Sheets", "Reference datasheets for major system components")}

              {/* Open All button (screen only, hidden in print) */}
              <div className="no-print" style={{ marginBottom: 14 }}>
                <button style={{ ...bt(true), fontSize: 11 }} onClick={() => specSheets.forEach(s => window.open(s.pdf, "_blank"))}>
                  Open All Spec Sheets ({specSheets.length})
                </button>
              </div>

              <table style={tbl}>
                <thead><tr>
                  <th style={{ ...th, width: 24 }}>#</th>
                  <th style={th}>Component</th>
                  <th style={{ ...th, width: 90 }}>Category</th>
                  <th style={th}>Datasheet URL</th>
                </tr></thead>
                <tbody>
                  {specSheets.map((s, i) => (
                    <tr key={i}>
                      <td style={{ ...tcR, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</td>
                      <td style={{ ...tcell, fontWeight: 600 }}>{s.nm}</td>
                      <td style={tcell}>{s.cat}</td>
                      <td style={{ ...tcell, fontSize: 9, wordBreak: "break-all" }}>
                        <a href={s.pdf} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>{s.pdf}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 16, fontSize: 10, color: "#555", lineHeight: 1.6 }}>
                <strong>{specSheets.length} spec sheet{specSheets.length !== 1 ? "s" : ""}</strong> for this installation.
                Click any URL above or scan the QR code to download the manufacturer datasheet.
                Printed copies of spec sheets should be kept on-site during installation per AHJ requirements.
              </div>
            </div>
          )}
        </div>
      )}
      {/* ═══ COMMISSIONING PACKET ═══ */}
      {ready && (
        <div ref={commRef} style={{ marginTop: 14 }}>

          {/* ──── COMM PAGE 1 — PRE-ENERGIZATION INSPECTION ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Commissioning Packet", "Pre-Energization Inspection")}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>SYSTEM INFORMATION</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Project</td><td style={tcell}>{pj.nm || "—"}</td><td style={th}>Date</td><td style={tcell}>_______________</td></tr>
              <tr><td style={th}>Address</td><td style={tcell} colSpan={3}>{[pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ") || "—"}</td></tr>
              <tr><td style={th}>System Size</td><td style={tcR}>{arrayKw.toFixed(2)} kW DC</td><td style={th}>Inverter</td><td style={tcell}>{iv?.nm} ({iv?.tp})</td></tr>
              <tr><td style={th}>Modules</td><td style={tcell}>{nMods}x {md?.nm}</td><td style={th}>Strings</td><td style={tcR}>{nStr}S x {modsPerStr}M</td></tr>
              <tr><td style={th}>Mount Type</td><td style={tcell}>{pj.mt || "roof"}</td><td style={th}>Service</td><td style={tcR}>{pj.es || 200}A</td></tr>
              <tr><td style={th}>Inspector</td><td style={tcell}>_______________</td><td style={th}>Weather</td><td style={tcell}>_______________</td></tr>
            </tbody></table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>VISUAL INSPECTION — MECHANICAL</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Check Item</th><th style={th}>Notes / Findings</th></tr></thead>
              <tbody>
                {[
                  "All modules mounted securely — no cracked glass, damaged frames, or loose clamps",
                  "Module nameplates visible and legible on all modules",
                  `Racking torqued to manufacturer spec (mid clamps, end clamps, L-feet / ${pj.mt === "ground" ? "pier" : "roof"} attachments)`,
                  pj.mt !== "ground" ? "All roof penetrations properly sealed/flashed — no exposed fasteners" : "Ground mount foundations level, plumb, and set to spec",
                  pj.mt !== "ground" ? "Fire code setbacks maintained (3ft ridge, 18\" eave per IFC/local)" : "Array clear of vegetation and drainage paths",
                  "All conduit runs complete — straps within 3ft of boxes, every 10ft per NEC 358.30",
                  "Conduit fittings tight — connectors, LBs, couplings, no open knockouts",
                  "Junction boxes / combiner box covers installed, NEMA rating appropriate for location",
                  "All wire management complete — zip ties, cable clips, no hanging wires",
                  "Inverter mounted plumb, clearances per manufacturer (ventilation space)",
                  "DC disconnect / rapid shutdown device installed and accessible",
                  "AC disconnect installed (if required by AHJ)",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>VISUAL INSPECTION — ELECTRICAL</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Check Item</th><th style={th}>Notes / Findings</th></tr></thead>
              <tbody>
                {[
                  "All MC4 connectors fully engaged and latched (pull test each connection)",
                  isMicro ? "All microinverter trunk cable connections secure and weatherproofed" : "Home run wiring landed correctly at inverter / combiner DC inputs",
                  "Wire gauge matches plan — PV source: #" + (sz?.dc || "10") + ", AC branch: #" + (sz?.ac || "10"),
                  `EGC (#${sz?.egc || "10"} Cu) continuous from array to inverter to panel`,
                  `GEC (#${sz?.gec || "6"} Cu) connected from panel to grounding electrode`,
                  "Ground rod(s) driven to code depth — clamp(s) tight",
                  "Bonding bushing installed at service panel",
                  "All wire terminations torqued to spec (use calibrated torque driver)",
                  isOptimizer ? "All optimizer-to-module DC connections verified" : isMicro ? "Microinverter under each module connected and clipped to rail" : "String home runs labeled at both ends",
                  "No exposed copper at any junction or termination",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ──── COMM PAGE 2 — DC STRING TESTING ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Commissioning Packet", "DC String Testing — Pre-Inverter Energization")}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>EXPECTED VALUES (from design)</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Voc per string (cold-corrected)</td><td style={tcR}>{expVoc} V</td><td style={th}>Max inverter DC input</td><td style={tcR}>{iv?.dv || "—"} V</td></tr>
              <tr><td style={th}>Isc per string</td><td style={tcR}>{expIsc} A</td><td style={th}>Modules per string</td><td style={tcR}>{modsPerStr}</td></tr>
              <tr><td style={th}>Vmp per string (STC)</td><td style={tcR}>{expVmp} V</td><td style={th}>MPPT window</td><td style={tcR}>{iv?.ml || "—"}–{iv?.mh || "—"} V</td></tr>
            </tbody></table>

            <div style={{ padding: "6px 10px", background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 4, fontSize: 10, color: "#92400e", marginTop: 10, marginBottom: 10, lineHeight: 1.5 }}>
              <strong>Acceptance criteria:</strong> Measured Voc within {"\u00b1"}5% of expected. Strings in same orientation should read within {"\u00b1"}2% of each other.
              Isc varies with irradiance — compare ratios between strings rather than absolute values. All polarity must be correct (positive to positive).
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 14 }}>
              {isMicro ? "PER-BRANCH CIRCUIT TESTING" : "PER-STRING OPEN CIRCUIT VOLTAGE & SHORT CIRCUIT CURRENT"}
            </div>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>{isMicro ? "Branch" : "String"}</th>
                <th style={th}>{isMicro ? "Micros" : "MPPT"}</th>
                <th style={th}>Modules</th>
                <th style={th}>Exp. Voc</th>
                <th style={th}>Meas. Voc</th>
                <th style={th}>{isMicro ? "—" : "Exp. Isc"}</th>
                <th style={th}>{isMicro ? "—" : "Meas. Isc"}</th>
                <th style={{ ...th, width: 30 }}>Pol.</th>
                <th style={th}>Pass</th>
              </tr></thead>
              <tbody>
                {isMicro ? (
                  // For micros, show per-branch rows (1 branch per ~15 micros on a 20A circuit)
                  Array.from({ length: Math.ceil(nMods / 15) || 1 }, (_, i) => {
                    const cnt = Math.min(15, nMods - i * 15);
                    return (
                      <tr key={i}>
                        <td style={tcell}>Branch {i + 1}</td>
                        <td style={tcR}>{cnt}</td>
                        <td style={tcR}>{cnt}</td>
                        <td style={tcR}>~240 VAC</td>
                        <td style={tcell}></td>
                        <td style={tcell}>—</td>
                        <td style={tcell}>—</td>
                        <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                        <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                      </tr>
                    );
                  })
                ) : (
                  stringTestRows.map(r => (
                    <tr key={r.str}>
                      <td style={tcell}>String {r.str}</td>
                      <td style={tcR}>MPPT {r.mppt}</td>
                      <td style={tcR}>{r.mods}</td>
                      <td style={tcR}>{expVoc} V</td>
                      <td style={tcell}></td>
                      <td style={tcR}>{expIsc} A</td>
                      <td style={tcell}></td>
                      <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                      <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!isMicro && <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>INSULATION RESISTANCE TEST (MEGGER)</div>
              <div style={{ padding: "6px 10px", background: "#f0f9ff", border: "1px solid #93c5fd", borderRadius: 4, fontSize: 10, color: "#1e40af", marginBottom: 8, lineHeight: 1.5 }}>
                Test at 500V or 1000V DC between: (1) positive conductor to ground, (2) negative conductor to ground, (3) positive to negative (strings isolated).
                Minimum acceptable reading: 1 M{"\u2126"} per string (IEC 62446). Record readings below.
              </div>
              <table style={tbl}>
                <thead><tr>
                  <th style={th}>String</th><th style={th}>+ to GND (M{"\u2126"})</th><th style={th}>- to GND (M{"\u2126"})</th><th style={th}>+ to - (M{"\u2126"})</th><th style={th}>Pass</th>
                </tr></thead>
                <tbody>
                  {stringTestRows.map(r => (
                    <tr key={r.str}>
                      <td style={tcell}>String {r.str}</td>
                      <td style={tcell}></td>
                      <td style={tcell}></td>
                      <td style={tcell}></td>
                      <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>}
          </div>

          {/* ──── COMM PAGE 3 — INVERTER COMMISSIONING ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Commissioning Packet", `Inverter Commissioning — ${iv?.nm || "Inverter"}`)}

            {/* ── PRE-ENERGIZATION CHECKS ── */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>PRE-ENERGIZATION CHECKS</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Check</th><th style={th}>Details / Reading</th></tr></thead>
              <tbody>
                {[
                  `Confirm inverter nameplate: ${iv?.nm}, ${iv?.kw}kW, ${iv?.dv}V max DC`,
                  ...(isEnphase ? [
                    "No DC disconnect required — module-level AC conversion",
                    "Verify AC disconnect is OFF at service panel",
                    "All Q-Cable trunk connectors fully clicked; sealing caps on unused ports",
                    `IQ Gateway connected to router via Ethernet or WiFi (2.4GHz only)`,
                  ] : isSolarEdge ? [
                    "Verify DC disconnect is OFF",
                    "Verify AC breaker is OFF at main panel",
                    "All DC/AC terminals torqued to spec",
                    `Verify clearances: 8″ horizontal, 4″ vertical, 16″ front ventilation`,
                    `Check all ${nMods} optimizer LEDs — each should flash green (DC present)`,
                  ] : isSMA ? [
                    "Verify DC disconnect is OFF",
                    "Verify AC breaker is OFF at main panel",
                    "All DC/AC terminals torqued to spec",
                    "Verify clearances: 12″ sides, 36″ from ground, vertical mount only",
                    "WiFi: Confirm 2.4GHz network available (SMA does not support 5GHz)",
                  ] : isFronius ? [
                    "Verify DC disconnect is OFF",
                    "Verify AC breaker is OFF at main panel",
                    "DC terminals torqued to 1.3–1.5 Nm (TX20 driver)",
                    "AC union nut torqued to 6–7 Nm",
                    "Verify clearances: 2m from ventilation openings; mount bracket at 4 points, arrow up",
                    "CRITICAL: Verify external RSD device installed (Fronius RSD Box Quattro or Duo)",
                  ] : isSolArk ? [
                    "Verify ALL switches OFF: battery, PV DC, grid breaker, load/gen breakers",
                    "No impact drivers used on any inverter fasteners",
                    "Battery cells balanced within 0.5V; polarity triple-checked (DO NOT reverse)",
                    "CTs installed: dual 30A on L1/L2, CT wires twisted, extended w/ CAT6 shielded only",
                    "Verify clearances: 6″ top, 2″ sides minimum",
                    "Battery actuation levers at max 45° angle",
                  ] : isTigo ? [
                    "Verify BAT switch OFF, inverter DC switch OFF, grid disconnect OFF, PV DC OFF",
                    "All DC/AC terminals torqued to spec",
                    "Verify clearances: 12″ (300mm) on all sides",
                    "All TS4 MLPE units connected and seated on module junction boxes",
                    `Max DC input: 600V — verify string design is within limit`,
                  ] : [
                    "Verify DC disconnect is OFF",
                    "Verify AC breaker is OFF at main panel",
                    "All DC/AC terminals torqued to spec",
                  ]),
                  "Equipment grounding conductor (EGC) connected to ground/bonding lug",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>

            {/* ── STARTUP & COMMISSIONING SEQUENCE ── */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>STARTUP & COMMISSIONING SEQUENCE</div>
            {isSMA && <div style={{ padding: "5px 10px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 4, fontSize: 10, color: "#166534", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>SMA Sunny Boy SE:</strong> DC switch ON first → AC breaker ON last. Shutdown: AC first off, DC last off. Grid country standard locks after 10 hours of feed-in (need Grid Guard code to change after).
            </div>}
            {isSolarEdge && <div style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 4, fontSize: 10, color: "#1e40af", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>SolarEdge:</strong> AC breaker ON first → DC switch ON second (opposite of most string inverters!). Each optimizer outputs safe 1V when unpaired or shutdown.
            </div>}
            {isFronius && <div style={{ padding: "5px 10px", background: "#fefce8", border: "1px solid #fde047", borderRadius: 4, fontSize: 10, color: "#854d0e", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Fronius GEN24:</strong> DC disconnect ON first → AC breaker ON second. 2 independent MPPTs, 4 string inputs (2 per MPPT). Requires EXTERNAL rapid shutdown hardware.
            </div>}
            {isSolArk && <div style={{ padding: "5px 10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, fontSize: 10, color: "#991b1b", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Sol-Ark Hybrid:</strong> 5-step startup order is critical. Defaults to 120/240V split-phase 60Hz. Contact Sol-Ark (972-575-8875) for firmware updates.
            </div>}
            {isTigo && <div style={{ padding: "5px 10px", background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 4, fontSize: 10, color: "#5b21b6", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Tigo EI:</strong> 4-step startup order. Bluetooth commissioning takes &lt;10 min (no internet needed initially). TS4 MLPE uses PLC signal for rapid shutdown.
            </div>}
            {isEnphase && <div style={{ padding: "5px 10px", background: "#fdf4ff", border: "1px solid #e879f9", borderRadius: 4, fontSize: 10, color: "#86198f", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Enphase IQ8:</strong> Grid profile MUST be applied before micros will produce. Use Installer Toolkit app (NOT the homeowner Enphase App). Scan barcodes — do NOT use gateway PLC button for IQ8.
            </div>}
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>Order</th><th style={th}>Step</th><th style={{ ...th, width: 30 }}>{"\u2610"}</th></tr></thead>
              <tbody>
                {(isEnphase ? [
                  "Power on IQ Gateway — wait 2–3 min for boot (LEDs flash amber/red during boot)",
                  "Open Enphase Installer Toolkit app → scan each microinverter barcode",
                  `Verify gateway discovers all ${nMods} microinverters via PLC (count must match)`,
                  "Apply grid profile: IEEE 1547-2018 (REQUIRED before micros produce)",
                  `Close AC disconnect — micros begin grid sync (1–5 min per UL 1741)`,
                  "Verify all micros producing — check Installer Toolkit for per-micro status",
                  "Install consumption monitoring CTs if applicable (arrow toward loads)",
                ] : isSolarEdge ? [
                  "Close AC breaker at main panel FIRST",
                  "Close DC disconnect — inverter powers on",
                  `Connect to WiFi AP \"SEDG-xxxxxxxxx\" via SolarEdge SetApp`,
                  `Pair optimizers: long-press button 10 sec → turn ON within 5 sec → wait 10–15 min`,
                  `Verify P_OK count in SetApp = ${nMods} (must match installed optimizer count)`,
                  "Set grid code: SetApp > Commissioning > Configuration > IEEE 1547:2018",
                  "Configure WiFi/Ethernet: SetApp > Communication settings",
                  "Activate on monitoring.solaredge.com portal",
                  "Verify inverter LED: solid green = producing",
                ] : isSMA ? [
                  "Turn DC switch ON — inverter display activates",
                  `Verify DC voltage on display: expected ${expVoc}V Voc`,
                  "Open SMA 360° app → scan QR code on inverter",
                  "Connect to inverter WiFi AP (tap lid 2× for WPS, or connect via app)",
                  "Set country standard = USA (locks after 10 hours of feed-in!)",
                  `Close AC breaker at main panel (${acBreaker}A, 240V)`,
                  "Inverter begins grid sync — wait 1–5 min per UL 1741",
                  "Register on Sunny Portal (sunnyportal.com) — need PIC + RID codes from Connection Unit",
                  "Verify LEDs: 3 ON = startup; green flash = initializing; green solid = producing",
                  "Set inverter installer password to match Sunny Portal password",
                ] : isFronius ? [
                  "Turn DC disconnect ON — inverter powers from PV",
                  `Verify DC voltage: expected ${expVoc}V Voc`,
                  "Open Fronius Solar.start app → scan QR code on inverter",
                  "Connect to WiFi AP \"FroniusMeter_xxxxx\" — password: 12345678",
                  "Open Web UI at 192.168.250.181 in browser for full configuration",
                  "Set Country Setup per utility requirements (need access code from Fronius support)",
                  `Close AC breaker at main panel (${acBreaker}A, 240V)`,
                  "Inverter begins grid sync — verify green solid LED = producing",
                  "Register on Solar.web (solarweb.com) — need V.Code from nameplate (register within 2 years!)",
                  "Verify EXTERNAL RSD is functional (Fronius RSD Box Quattro or Duo)",
                ] : isSolArk ? [
                  "Step 1: Turn Battery switch ON",
                  "Step 2: Press and hold Power button on inverter",
                  "Step 3: Turn PV DC disconnect ON",
                  `Step 4: Close GRID breaker at main panel (${acBreaker}A, 240V)`,
                  "Step 5: Close LOAD and GEN breakers ON",
                  "Open MySol-Ark app → scan QR on SA-ETH-PWR dongle (or enter serial + key)",
                  "Verify grid settings: Settings > Grid Settings (120/240V split-phase 60Hz)",
                  "Configure mode: Grid Sell, Limited Power, Off-Grid, or TOU as specified",
                  "Set battery charge/discharge parameters",
                  "Verify LEDs: green NORMAL = OK, green DC = PV, green AC = grid synced",
                  "Verify RSD: external relay wired to sensor board pins 9&10 (or 11&12)",
                ] : isTigo ? [
                  "Step 1: Turn Battery BAT switch ON (if battery installed)",
                  "Step 2: Turn inverter DC switch ON",
                  "Step 3: Close grid service disconnect ON",
                  "Step 4: Turn PV DC disconnect ON",
                  "If inverter does not start: remove green button cover, hold until green leaf LED flashes rapidly",
                  "Open Tigo Energy Intelligence app → Bluetooth auto-scan (no internet needed)",
                  "Complete commissioning wizard — auto-selects US 120/240V 60Hz",
                  "Verify all TS4 units detected via PLC",
                  "Verify LED: solid green = producing; 3s ON / 1s OFF = DC online, AC offline",
                  "Test RSD button: stops PLC signal → all TS4s drop to <0.6V within 30 seconds",
                ] : [
                  "Close DC disconnect — verify inverter shows DC input voltage",
                  `Expected DC: ${expVoc}V Voc (drops to ~${expVmp}V Vmp under load)`,
                  `Connect to inverter via ${brand} manufacturer app`,
                  "Set grid profile per utility requirements (IEEE 1547)",
                  `Close AC breaker at main panel (${acBreaker}A, 240V)`,
                  "Inverter begins grid sync (1–5 min per UL 1741)",
                  "Verify inverter status: producing / grid-tied (no fault codes)",
                ]).map((item, i) => (
                  <tr key={i}><td style={{ ...tcR, fontWeight: 700 }}>{i + 1}</td><td style={tcell}>{item}</td><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td></tr>
                ))}
              </tbody>
            </table>

            {/* ── LED STATUS REFERENCE ── */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>LED STATUS REFERENCE</div>
            <table style={tbl}>
              <thead><tr><th style={th}>LED / Indicator</th><th style={th}>Meaning</th></tr></thead>
              <tbody>
                {(isEnphase ? [
                  ["All LEDs flash amber/red", "Gateway booting (2–3 min)"],
                  ["Solid green", "Producing normally"],
                  ["Flashing green", "Grid-connected, no production"],
                  ["Blue", "Communications OK"],
                  ["Red", "Fault — check Installer Toolkit for code"],
                ] : isSolarEdge ? [
                  ["Solid green", "Producing normally"],
                  ["Flashing green", "Grid-connected, no production"],
                  ["Blue", "Communications OK"],
                  ["Red", "Fault — check SetApp for error code"],
                ] : isSMA ? [
                  ["All 3 LEDs ON", "Startup / initializing"],
                  ["Green flashing", "Initializing / grid search"],
                  ["Green solid", "Producing normally"],
                  ["Red", "Fault — check SMA 360° app for code"],
                ] : isFronius ? [
                  ["Green solid", "Producing normally"],
                  ["Green flashing", "Startup / connecting to grid"],
                  ["Yellow (daytime)", "Non-critical fault / warning"],
                  ["Red", "Critical fault — check Solar.start app"],
                ] : isSolArk ? [
                  ["Green NORMAL", "System OK"],
                  ["Green DC", "PV source connected"],
                  ["Green AC", "Grid synced"],
                  ["Red", "Fault — check MySol-Ark app"],
                ] : isTigo ? [
                  ["Solid green", "Producing normally"],
                  ["3s ON / 1s OFF flash", "DC online, AC offline"],
                  ["Red + audible buzzer", "Arc fault detected (AFCI)"],
                  ["Green leaf rapid flash", "Force-start mode active"],
                ] : [
                  ["Green solid/flashing", "Normal operation / initializing"],
                  ["Red / fault indicator", "Error — check manufacturer app"],
                ]).map(([led, meaning], i) => (
                  <tr key={i}><td style={{ ...tcell, fontWeight: 600, whiteSpace: "nowrap" }}>{led}</td><td style={tcell}>{meaning}</td></tr>
                ))}
              </tbody>
            </table>

            {/* ── MONITORING & PORTAL SETUP ── */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>MONITORING & PORTAL SETUP</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Step</th><th style={th}>Account / Notes</th></tr></thead>
              <tbody>
                {[
                  ...(isEnphase ? [
                    "Register system on Enlighten (enlighten.enphaseenergy.com)",
                    "Send homeowner email invitation from Enlighten portal",
                    "Set PTO status in Installer Toolkit (required before utility allows operation)",
                    "Install Enphase App (homeowner app) on customer phone — NOT Installer Toolkit",
                  ] : isSolarEdge ? [
                    "Activate system on monitoring.solaredge.com",
                    "Add customer email to monitoring portal",
                    "Verify per-optimizer production data visible in portal",
                    "Install mySolarEdge app (homeowner app) on customer phone",
                  ] : isSMA ? [
                    "Register on Sunny Portal (sunnyportal.com) — enter PIC + RID from Connection Unit",
                    "IMPORTANT: Portal password MUST match inverter Installer password",
                    "Add customer email to portal",
                    "Install SMA Energy App (homeowner app) on customer phone",
                  ] : isFronius ? [
                    "Register on Solar.web (solarweb.com) — enter V.Code from nameplate",
                    "NOTE: Must register within 2 years of installation",
                    "Add customer email to Solar.web portal",
                    "Install Fronius Solar.web App (homeowner app) on customer phone",
                  ] : isSolArk ? [
                    "Verify SA-ETH-PWR dongle connected and reporting",
                    "Register on sol-ark.com portal or via MySol-Ark app",
                    "Add customer email for monitoring access",
                    "Install MySol-Ark app (homeowner app) on customer phone",
                  ] : isTigo ? [
                    "Verify Tigo EI app shows system online",
                    "Register system on Tigo monitoring portal",
                    "Add customer email for monitoring access",
                    "Install Tigo EI app (homeowner app) on customer phone",
                  ] : [
                    `Register on ${brand} monitoring portal`,
                    "Add customer email for monitoring access",
                    `Install ${brand} homeowner app on customer phone`,
                  ]),
                  "Verify real-time production data visible in portal/app",
                  "Screenshot or record monitoring account credentials for customer handoff",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ──── COMM PAGE 4 — AC VERIFICATION & PERFORMANCE ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Commissioning Packet", "AC Verification, Safety Tests & Performance")}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>AC VOLTAGE & CURRENT MEASUREMENTS</div>
            <table style={tbl}>
              <thead><tr><th style={th}>Measurement</th><th style={th}>Expected</th><th style={th}>Measured</th><th style={th}>Pass</th></tr></thead>
              <tbody>
                {[
                  ["L1–L2 Voltage (at inverter)", "240V {\\u00b1}5%", "", ""],
                  ["L1–N Voltage", "120V {\\u00b1}5%", "", ""],
                  ["L2–N Voltage", "120V {\\u00b1}5%", "", ""],
                  ["L1–L2 Voltage (at panel)", "240V {\\u00b1}5%", "", ""],
                  ["AC Frequency", "60.00 Hz {\\u00b1}0.5", "", ""],
                  ["AC Current (producing)", "Varies w/ irradiance", "", ""],
                  [`Inverter power output`, `${iv?.kw || "—"}kW rated max`, "", ""],
                ].map(([meas, exp], i) => (
                  <tr key={i}>
                    <td style={tcell}>{meas}</td>
                    <td style={tcR}>{exp}</td>
                    <td style={tcell}></td>
                    <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>RAPID SHUTDOWN TEST — NEC 690.12</div>
            <div style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, fontSize: 10, color: "#991b1b", marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Required for all systems.</strong> {isMicro || isOptimizer
                ? "MLPE (module-level power electronics) provides module-level shutdown. Verify that opening the AC disconnect or triggering the rapid shutdown initiator causes all module-level DC voltage to drop below 80V within 30 seconds."
                : "Rapid shutdown must reduce conductors outside the array boundary to {\\u226480}V within 30 seconds of initiator activation. Verify rapid shutdown device is installed and functional."
              }
            </div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Test Step</th><th style={th}>Result</th></tr></thead>
              <tbody>
                {[
                  "System producing normally — record current output: _______ W",
                  isMicro || isOptimizer
                    ? "Open AC disconnect (or activate rapid shutdown initiator)"
                    : "Activate rapid shutdown initiator at service point",
                  "Start timer — verify array DC voltage drops below 80V within 30 seconds",
                  isMicro ? "Verify all microinverters stop producing (check gateway)" : isOptimizer ? "Verify all optimizers enter safe mode (1V per optimizer)" : "Verify rapid shutdown device indicator shows activated state",
                  "Measure DC voltage at array boundary conductors — must be < 80V",
                  "Re-energize system — verify normal operation resumes",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>GROUNDING CONTINUITY</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Test</th><th style={th}>Reading ({"\u2126"})</th></tr></thead>
              <tbody>
                {[
                  "EGC continuity: array frame to inverter ground lug",
                  "EGC continuity: inverter ground lug to panel ground bus",
                  "GEC continuity: panel ground bus to grounding electrode",
                  "Bonding: racking to EGC (each rail section bonded)",
                  "Ground rod resistance (if meter available): < 25\u2126 per NEC 250.53",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>LABELING VERIFICATION — NEC 690</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Label</th><th style={th}>Location</th><th style={th}>NEC Ref</th></tr></thead>
              <tbody>
                {[
                  ["PV System Disconnect", "At DC disconnect", "690.13(B)"],
                  ["PV System Rating", "At main service panel", "690.53"],
                  ["AC Interconnection Point", "At breaker in panel", "705.10"],
                  ["Rapid Shutdown Placard", "At service entrance / main disconnect", "690.12(B)(3)"],
                  ["Ground-Fault Warning", "At inverter / GFP device", "690.41(B)"],
                  ["Conduit / Raceway Markings", "All DC conduit runs", "690.31(G)"],
                  ["Arc-Fault Protection", "At inverter (if AFCI equipped)", "690.11"],
                ].map(([label, loc, ref], i) => (
                  <tr key={i}>
                    <td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td>
                    <td style={{ ...tcell, fontWeight: 600 }}>{label}</td>
                    <td style={tcell}>{loc}</td>
                    <td style={tcR}>{ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ──── COMM PAGE 5 — PERFORMANCE & SIGN-OFF ──── */}
          <div className="plan-page" style={pg}>
            {hdr("Commissioning Packet", "Performance Verification & Sign-Off")}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6 }}>PRODUCTION VERIFICATION</div>
            <table style={tbl}><tbody>
              <tr><td style={th}>Array DC Rating</td><td style={tcR}>{arrayKw.toFixed(2)} kW</td><td style={th}>Inverter AC Rating</td><td style={tcR}>{iv?.kw || "—"} kW</td></tr>
              <tr><td style={th}>Time of Test</td><td style={tcell}>_______________</td><td style={th}>Sky Conditions</td><td style={tcell}>_______________</td></tr>
              <tr><td style={th}>Irradiance (if meter avail.)</td><td style={tcell}>_______ W/m{"\u00b2"}</td><td style={th}>Ambient Temp</td><td style={tcell}>_______ {"\u00b0"}F</td></tr>
              <tr><td style={th}>Inverter Display Power</td><td style={tcell}>_______ kW</td><td style={th}>Inverter Display Energy (today)</td><td style={tcell}>_______ kWh</td></tr>
              <tr><td style={th}>Panel Meter Reading (if avail.)</td><td style={tcell}>_______ kW</td><td style={th}>Est. Annual Production</td><td style={tcR}>{dsg?.kwh ? dsg.kwh.toLocaleString() + " kWh" : "—"}</td></tr>
            </tbody></table>
            <div style={{ padding: "6px 10px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 4, fontSize: 10, color: "#14532d", marginTop: 8, marginBottom: 14, lineHeight: 1.5 }}>
              <strong>Quick check:</strong> On a clear day near solar noon, system should produce ~70–85% of DC nameplate ({(arrayKw * 0.7).toFixed(1)}–{(arrayKw * 0.85).toFixed(1)} kW).
              Lower readings may indicate shading, soiling, high temp derating, or wiring issues. Compare string-to-string production if possible.
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>CUSTOMER WALKTHROUGH</div>
            <table style={tbl}>
              <thead><tr><th style={{ ...th, width: 30 }}>{"\u2610"}</th><th style={th}>Item</th><th style={th}>Notes</th></tr></thead>
              <tbody>
                {[
                  "Showed customer how to read inverter display / status lights",
                  "Installed monitoring app on customer phone and verified login",
                  "Explained rapid shutdown location and operation",
                  "Explained AC disconnect location and when to use it",
                  "Reviewed expected production and seasonal variation",
                  "Provided warranty documentation (module, inverter, workmanship)",
                  "Explained net metering / utility billing changes",
                  "Provided emergency contact information for service calls",
                  "Reviewed system maintenance (annual visual inspection, keep panels clear)",
                ].map((item, i) => (
                  <tr key={i}><td style={{ ...tcell, textAlign: "center", fontSize: 14 }}>{"\u2610"}</td><td style={tcell}>{item}</td><td style={tcell}></td></tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 6, marginTop: 18 }}>FINAL SIGN-OFF</div>
            <table style={tbl}><tbody>
              <tr>
                <td style={{ ...th, width: "50%" }}>Commissioning Technician</td>
                <td style={{ ...th, width: "50%" }}>Customer / Property Owner</td>
              </tr>
              <tr>
                <td style={{ ...tcell, height: 50 }}>
                  <div style={{ fontSize: 10, color: "#999" }}>Name: ________________________________</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 8 }}>Signature: _____________________________</div>
                </td>
                <td style={{ ...tcell, height: 50 }}>
                  <div style={{ fontSize: 10, color: "#999" }}>Name: ________________________________</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 8 }}>Signature: _____________________________</div>
                </td>
              </tr>
              <tr>
                <td style={tcell}><span style={{ fontSize: 10, color: "#999" }}>Date: _______________</span></td>
                <td style={tcell}><span style={{ fontSize: 10, color: "#999" }}>Date: _______________</span></td>
              </tr>
            </tbody></table>

            <div style={{ marginTop: 14, padding: "8px 12px", background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 4, fontSize: 10, color: "#555", lineHeight: 1.6 }}>
              <strong>Record Retention:</strong> This commissioning packet should be kept on file for the duration of the system warranty.
              A copy should be provided to the customer and the AHJ (if required). Photos of all test measurements are recommended.
              <br /><br />
              <strong>System:</strong> {nMods}x {md?.nm} ({md?.w}W) + {nInv}x {iv?.nm} ({iv?.kw}kW) = {arrayKw.toFixed(2)} kW DC | {pj.mt} mount | {pj.es || 200}A service
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
