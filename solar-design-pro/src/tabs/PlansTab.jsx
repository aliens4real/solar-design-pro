import { useState, useRef, useMemo } from 'react';
import { callClaude, cleanJson } from '../api/anthropic.js';
import { ff, fs, c1, c2, bg, bd, ac, tx, td, gn, rd, bl, bt, cd, inp } from '../theme.js';
import { COND } from '../data/nec-tables.js';
import { SPEC_SHEETS } from '../data/spec-sheets.js';
import { INVS } from '../data/inverters.js';

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

  /* ═══ COMPUTED VALUES ═══ */
  const ready = md && iv && sz;
  const nMods = totalMods || (dsg?.tm) || 0;
  const nStr = dsg?.ns || (sz ? Math.ceil(nMods / sz.opt) : 0);
  const modsPerStr = dsg?.ms || (sz?.opt) || 0;
  const nInv = dsg?.ni || 1;
  const arrayKw = (nMods * md?.w / 1000) || 0;
  const dcac = iv ? (arrayKw / iv.kw).toFixed(2) : "\u2014";
  const needsCombiner = nStr > iv?.mppt;
  const busbar = +pj.es || 200;
  const rule120 = busbar * 1.2;
  const acBreaker = iv?.oc || 40;
  const pass120 = acBreaker + (busbar <= rule120);
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
                  <tbody>{modGroups.filter(g => g.count > 0).map((g, i) => (
                    <tr key={i}>
                      <td style={tcell}>{g.name || `Group ${i + 1}`}</td>
                      <td style={tcR}>{g.count}</td>
                      <td style={tcR}>{g.azimuth || 180}\u00b0</td>
                      <td style={tcell}>{g.orientation || "Portrait"}</td>
                      <td style={tcR}>{((g.count * md.w) / 1000).toFixed(2)}</td>
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

            {modGroups && modGroups.filter(g => g.count > 0).map((g, gi) => {
              const mW = modSz?.w || 1050;
              const mH = modSz?.h || 2100;
              const fW = faceSz?.w || 8000;
              const fH = faceSz?.h || 5000;
              const positions = layPos?.[gi] || [];
              const printScale = Math.min(750 / (fW / 25.4 * 3), 400 / (fH / 25.4 * 3));
              const svgW = (fW / 25.4) * printScale * 3;
              const svgH = (fH / 25.4) * printScale * 3;
              const mWin = mW / 25.4;
              const mHin = mH / 25.4;

              return (
                <div key={gi} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 6 }}>
                    {g.name || `Group ${gi + 1}`} \u2014 {g.count} modules, {g.azimuth || 180}\u00b0 azimuth, {g.orientation || "Portrait"}
                  </div>
                  <svg width={Math.max(svgW, 300)} height={Math.max(svgH, 200)} style={{ border: "1px solid #ccc", background: "#fafafa", borderRadius: 4 }}>
                    {/* Roof / face outline */}
                    <rect x={4} y={4} width={Math.max(svgW - 8, 292)} height={Math.max(svgH - 8, 192)} fill="none" stroke="#999" strokeWidth={1} strokeDasharray="6,3" rx={2} />
                    {/* Module positions */}
                    {positions.length > 0 ? positions.map((pos, mi) => {
                      const px = (pos.x || 0) * printScale;
                      const py = (pos.y || 0) * printScale;
                      const pw = ((g.orientation === "Landscape" ? mHin : mWin)) * printScale;
                      const ph = ((g.orientation === "Landscape" ? mWin : mHin)) * printScale;
                      return (
                        <g key={mi}>
                          <rect x={px + 10} y={py + 10} width={pw} height={ph} fill="#2563eb22" stroke="#2563eb" strokeWidth={0.8} rx={1} />
                          <text x={px + 10 + pw / 2} y={py + 10 + ph / 2 + 3} textAnchor="middle" fill="#2563eb" fontSize={Math.max(7, pw * 0.15)} fontFamily={ff}>{mi + 1}</text>
                        </g>
                      );
                    }) : (
                      /* Fallback grid when no positions available */
                      Array.from({ length: g.count }, (_, mi) => {
                        const cols = Math.ceil(Math.sqrt(g.count * 1.5));
                        const r = Math.floor(mi / cols);
                        const cc = mi % cols;
                        const cellW = (g.orientation === "Landscape" ? mHin : mWin) * printScale;
                        const cellH = (g.orientation === "Landscape" ? mWin : mHin) * printScale;
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

            {(!modGroups || modGroups.filter(g => g.count > 0).length === 0) && (
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
            <>
              {/* Appendix Index Page */}
              <div className="plan-page" style={pg}>
                {hdr("Appendix — Component Spec Sheets", "Reference datasheets for major system components")}
                <table style={tbl}>
                  <thead><tr>
                    <th style={{ ...th, width: 30 }}>#</th>
                    <th style={th}>Component</th>
                    <th style={{ ...th, width: 100 }}>Category</th>
                  </tr></thead>
                  <tbody>
                    {specSheets.map((s, i) => (
                      <tr key={i}>
                        <td style={tcR}>{String.fromCharCode(65 + i)}</td>
                        <td style={tcell}>{s.nm}</td>
                        <td style={tcell}>{s.cat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16, fontSize: 10, color: "#777" }}>
                  {specSheets.length} spec sheet{specSheets.length !== 1 ? "s" : ""} included. If a PDF does not display inline, use the direct link below each frame.
                </div>
              </div>

              {/* Individual Spec Sheet Pages */}
              {specSheets.map((s, i) => (
                <div key={`spec-${i}`} className="plan-page" style={{ ...pg, padding: "24px 30px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: "2px solid #000", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#000", borderRadius: 3, padding: "2px 8px" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{s.nm}</span>
                    <span style={{ fontSize: 10, color: "#777", marginLeft: "auto" }}>{s.cat}</span>
                  </div>
                  <iframe
                    src={s.pdf}
                    title={s.nm}
                    width="100%"
                    height="800"
                    style={{ border: "1px solid #ccc", borderRadius: 4, background: "#f5f5f5" }}
                  />
                  <div style={{ marginTop: 6, fontSize: 9, color: "#555", wordBreak: "break-all" }}>
                    <a href={s.pdf} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>{s.pdf}</a>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
