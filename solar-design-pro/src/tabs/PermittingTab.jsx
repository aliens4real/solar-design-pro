import { useState, useMemo, useRef } from 'react';
import { callClaude, cleanJson } from '../api/anthropic.js';
import { lookupJurisdiction } from '../api/jurisdiction.js';
import { PERMIT_FORMS, UTILITY_FORMS } from '../data/permit-forms.js';
import { ff, fs, c1, c2, bg, bd, ac, tx, td, gn, rd, bl, bt, cd, inp, lb } from '../theme.js';
import PdfFiller from '../components/PdfFiller.jsx';

// ── Reusable helpers ──
const Lbl = ({ children }) => <label style={lb}>{children}</label>;
const Inp = ({ v, k, uPm }) => <input value={v || ""} onChange={e => uPm(k, e.target.value)} style={inp} />;
const Row = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;

export default function PermittingTab({ pj, pm, uPm, geo, md, iv, sz, dsg, pk, rack, modGroups, totalMods, totalKw, ivs, totalIvKw }) {

  const [jurBusy, setJurBusy] = useState(false);
  const [jurMsg, setJurMsg] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqMsg, setReqMsg] = useState("");
  const [activeForm, setActiveForm] = useState("building");
  const [openLvl, setOpenLvl] = useState({});
  const [pdfFillerOpen, setPdfFillerOpen] = useState(false);
  const [pdfFillerForm, setPdfFillerForm] = useState(null);
  const printRef = useRef(null);

  // ── Derived ──
  const nMods = totalMods || dsg?.tm || 0;
  const nStr = dsg?.ns || (sz ? Math.ceil(nMods / (sz.opt || 1)) : 0);
  const modsPerStr = dsg?.ms || sz?.opt || 0;
  const nInv = ivs?.length > 0 ? ivs.reduce((s, e) => s + e.qty, 0) : (dsg?.ni || 1);
  const acKw = totalIvKw || (iv ? iv.kw * nInv : 0);
  const dcac = acKw > 0 ? (totalKw / acKw).toFixed(2) : "--";
  const siteAddr = [pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ");
  const busbar = +pj.es || 200;
  const rule120 = busbar * 1.2;
  const ocpd = iv?.oc || 30;
  const sysVoc = sz ? (sz.vc * modsPerStr).toFixed(1) : "--";
  const jur = pm.jur;

  // ── Auto-Fill from project data ──
  const doAutoFill = () => {
    const fills = {};
    // Owner = project name, address = site address
    if (pj.nm && !pm.own) fills.own = pj.nm;
    if (siteAddr && !pm.ownAd) fills.ownAd = siteAddr;
    // Main breaker
    if (pj.es && !pm.pnlBr) fills.pnlBr = `${pj.es}A main breaker`;
    // Rapid shutdown from inverter type
    if (iv && !pm.rsd) {
      if (iv.tp === "micro") fills.rsd = "Module-level shutdown (microinverter)";
      else if (iv.tp === "optimizer") fills.rsd = "Module-level shutdown (DC optimizer)";
      else fills.rsd = "Rapid shutdown device required (NEC 690.12)";
    }
    // Monitoring from inverter brand
    if (iv && !pm.monSys) {
      const n = iv.nm.toLowerCase();
      if (n.includes("enphase") || n.includes("iq")) fills.monSys = "Enphase Envoy / IQ Gateway";
      else if (n.includes("solaredge")) fills.monSys = "SolarEdge Monitoring Portal";
      else if (n.includes("sma")) fills.monSys = "SMA Sunny Portal";
      else if (n.includes("fronius")) fills.monSys = "Fronius Solar.web";
      else if (n.includes("sol-ark") || n.includes("solark")) fills.monSys = "Sol-Ark MySolArk Portal";
      else if (n.includes("tigo")) fills.monSys = "Tigo EI Monitoring";
      else fills.monSys = `${iv.nm} monitoring`;
    }
    // Defaults
    if (!pm.fedPt) fills.fedPt = "30% ITC (IRC Section 48)";
    if (!pm.batSz) fills.batSz = "None";
    // Utility — use matched utility if available, else infer from state
    if (!pm.util && matchedUtility.length > 0) {
      const primary = matchedUtility.find(f => f.cat === "interconnect");
      if (primary) fills.util = primary.ut;
    }
    if (!pm.util && !fills.util && jur?.st?.cd === "OH") fills.util = "Ohio Edison / FirstEnergy";
    if (!pm.util && !fills.util && jur?.st?.cd === "PA") fills.util = "Penn Power / FirstEnergy";
    // Apply all
    Object.entries(fills).forEach(([k, v]) => uPm(k, v));
    return Object.keys(fills).length;
  };

  const [fillMsg, setFillMsg] = useState("");

  // ── Jurisdiction Lookup ──
  const doJurLookup = async () => {
    if (!geo) { setJurMsg("Geocode address on Project tab first"); return; }
    setJurBusy(true); setJurMsg("Looking up jurisdictions...");
    try {
      const r = await lookupJurisdiction(geo.lat, geo.lng, pj.ct);
      uPm("jur", r);
      setJurMsg(r.st ? "Jurisdiction found" : "Partial results — some levels unavailable");
    } catch (e) { setJurMsg("Error: " + e.message); }
    setJurBusy(false);
  };

  // ── AI Permit Lookup ──
  const doReqLookup = async () => {
    if (!jur?.st) { setReqMsg("Run jurisdiction lookup first"); return; }
    setReqBusy(true); setReqMsg("Researching permit requirements...");
    const levels = [
      jur.st && `State: ${jur.st.nm} (FIPS ${jur.st.fips})`,
      jur.co && `County: ${jur.co.nm} (FIPS ${jur.co.fips})`,
      jur.tw && `Township/Subdivision: ${jur.tw.nm} (FIPS ${jur.tw.fips})`,
      jur.pl && `City/Village: ${jur.pl.nm} (FIPS ${jur.pl.fips})`,
    ].filter(Boolean).join("\n");
    const prompt = `Research solar PV permitting requirements for this jurisdiction hierarchy:
${levels}

System: ${totalKw.toFixed(1)} kW DC, ${pj.mt} mount, ${busbar}A service

Return ONLY valid JSON (no markdown, no commentary) with this schema:
{
  "levels": [
    {
      "name": "Government Level Name",
      "type": "state|county|township|city",
      "permits": ["permit type 1", ...],
      "fees": ["fee description 1", ...],
      "notes": ["important note 1", ...],
      "urls": ["relevant URL 1", ...],
      "solarapp": false
    }
  ]
}

Include: building permits, electrical permits, zoning requirements, HOA considerations, utility interconnection, fire department reviews. Check if jurisdiction participates in SolarAPP+ instant permitting. If a level typically does not require a separate permit (e.g., townships often defer to county), note that.`;
    try {
      const txt = await callClaude({ system: "You are a solar permitting expert. Return only valid JSON.", messages: [{ role: "user", content: prompt }], max_tokens: 4000 });
      const data = JSON.parse(cleanJson(txt));
      uPm("reqs", data);
      setReqMsg("Requirements loaded");
    } catch (e) { setReqMsg("Error: " + e.message); }
    setReqBusy(false);
  };

  // ── Print active form ──
  const doPrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${pj.nm || "Solar"} — ${activeForm} Permit</title><style>
      @media print { @page { size: letter; margin: 0.5in; } body { margin: 0; } .plan-page { page-break-after: always; } .plan-page:last-child { page-break-after: auto; } }
      body { font-family: ${ff}; margin: 0; padding: 0; color: #000; }
      .plan-page { padding: 36px 44px; font-size: 12px; line-height: 1.6; }
      table { border-collapse: collapse; width: 100%; font-size: 11px; margin: 8px 0; }
      th { padding: 6px 8px; background: #e8e8e8; border: 1px solid #bbb; font-weight: 700; text-align: left; font-size: 10px; }
      td { padding: 5px 8px; border: 1px solid #ccc; }
      h2 { font-size: 16px; margin: 0 0 4px; } h3 { font-size: 13px; margin: 14px 0 6px; }
      .sig-line { border-bottom: 1px solid #000; width: 250px; display: inline-block; margin: 4px 12px 4px 0; }
    </style></head><body>`);
    const pages = printRef.current?.querySelectorAll(".plan-page");
    if (pages) pages.forEach(p => w.document.write(p.outerHTML));
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // ── Form Assist: field definitions by category ──
  const getFormFields = (cat) => {
    const f = (section, label, value, status) => ({ section, label, value: value || "", status });
    const has = (val) => val && val !== "--" && val !== "";
    const ok = (val) => has(val) ? "ok" : "missing";
    const verify = (val) => has(val) ? "verify" : "missing";

    if (cat === "building") return [
      f("Property Information", "Site Address", siteAddr, has(siteAddr) ? "ok" : "missing"),
      f("Property Information", "Parcel / PIN", pm.pid, ok(pm.pid)),
      f("Property Information", "Property Owner", pm.own, ok(pm.own)),
      f("Property Information", "Owner Address", pm.ownAd, ok(pm.ownAd)),
      f("Property Information", "Owner Phone", pm.ownPh, ok(pm.ownPh)),
      f("Property Information", "Owner Email", pm.ownEm, ok(pm.ownEm)),
      f("Contractor", "Company Name", pm.cnm, ok(pm.cnm)),
      f("Contractor", "License #", pm.clic, ok(pm.clic)),
      f("Contractor", "Phone", pm.cph, ok(pm.cph)),
      f("Contractor", "Email", pm.cem, ok(pm.cem)),
      f("Contractor", "Address", pm.cad, ok(pm.cad)),
      f("System Specifications", "System Size (DC)", totalKw > 0 ? `${totalKw.toFixed(2)} kW` : "", verify(totalKw > 0 ? "y" : "")),
      f("System Specifications", "System Size (AC)", acKw > 0 ? `${acKw.toFixed(2)} kW` : "", verify(acKw > 0 ? "y" : "")),
      f("System Specifications", "Module", md ? `${md.nm} — ${md.w}W` : "", verify(md ? "y" : "")),
      f("System Specifications", "Module Qty", nMods > 0 ? String(nMods) : "", verify(nMods > 0 ? "y" : "")),
      f("System Specifications", "Inverter(s)", invSummary !== "--" ? invSummary : "", verify(invSummary !== "--" ? "y" : "")),
      f("System Specifications", "Mount Type", pj.mt ? (pj.mt === "roof" ? `Roof Mount (${pj.rf})` : pj.mt) : "", verify(pj.mt ? "y" : "")),
      f("System Specifications", "Est. Annual Production", dsg?.kwh ? `${dsg.kwh.toLocaleString()} kWh` : "", verify(dsg?.kwh ? "y" : "")),
      f("Structural / Racking", "Racking System", rackSummary !== "Not calculated" ? rackSummary : "", verify(rackSummary !== "Not calculated" ? "y" : "")),
      f("Structural / Racking", "Roof Type", pj.rf, verify(pj.rf)),
      f("Structural / Racking", "Roof Pitch", pj.rp ? `${pj.rp}°` : "", verify(pj.rp ? "y" : "")),
      f("Structural / Racking", "Total Array Weight", md && nMods > 0 ? `${(nMods * (md.wt || 22) * 2.205).toFixed(0)} lbs` : "", verify(md ? "y" : "")),
      f("Fire Safety", "Rapid Shutdown", pm.rsd || (iv?.tp === "micro" ? "Module-level (microinverter)" : iv?.tp === "optimizer" ? "Module-level (optimizer)" : ""), pm.rsd ? "ok" : iv?.tp ? "verify" : "missing"),
    ];

    if (cat === "electrical") return [
      f("Site & Contractor", "Site Address", siteAddr, has(siteAddr) ? "ok" : "missing"),
      f("Site & Contractor", "Contractor", pm.cnm, ok(pm.cnm)),
      f("Site & Contractor", "License #", pm.clic, ok(pm.clic)),
      f("Site & Contractor", "Phone", pm.cph, ok(pm.cph)),
      f("PV System — NEC 690", "Module", md ? `${md.nm} — ${md.w}W, Voc=${md.voc}V, Isc=${md.isc}A` : "", verify(md ? "y" : "")),
      f("PV System — NEC 690", "Total Modules", nMods > 0 ? String(nMods) : "", verify(nMods > 0 ? "y" : "")),
      f("PV System — NEC 690", "System DC Rating", totalKw > 0 ? `${totalKw.toFixed(2)} kW` : "", verify(totalKw > 0 ? "y" : "")),
      f("PV System — NEC 690", "Inverter(s)", invSummary !== "--" ? invSummary : "", verify(invSummary !== "--" ? "y" : "")),
      f("PV System — NEC 690", "Inverter AC Rating", acKw > 0 ? `${acKw.toFixed(2)} kW` : "", verify(acKw > 0 ? "y" : "")),
      f("String Config — NEC 690.7", "Strings", nStr > 0 ? `${nStr} strings x ${modsPerStr} modules` : "", verify(nStr > 0 ? "y" : "")),
      f("String Config — NEC 690.7", "Max System Voc", sz ? `${sysVoc} V (limit ${iv?.dv || "--"}V)` : "", verify(sz ? "y" : "")),
      f("String Config — NEC 690.7", "Max String Isc x 1.25", sz ? `${sz.ci?.toFixed(1) || (md.isc * 1.25).toFixed(1)} A` : "", verify(sz ? "y" : "")),
      f("String Config — NEC 690.7", "OCPD per String", sz ? `${sz.oc} A` : "", verify(sz ? "y" : "")),
      f("Conductors & Conduit", "PV Source (DC)", sz?.dc ? `${sz.dc} AWG THWN-2, ${sz.dcc || "3/4"}" EMT` : "", verify(sz?.dc ? "y" : "")),
      f("Conductors & Conduit", "AC Branch", sz?.ac ? `${sz.ac} AWG THWN-2, ${sz.acc || "3/4"}" EMT` : "", verify(sz?.ac ? "y" : "")),
      f("Conductors & Conduit", "EGC", sz?.eg ? `${sz.eg} AWG Bare Cu` : "", verify(sz?.eg ? "y" : "")),
      f("Conductors & Conduit", "GEC", sz?.ge ? `${sz.ge} AWG Bare Cu` : "", verify(sz?.ge ? "y" : "")),
      f("OCPD & Grounding", "DC OCPD", sz?.oc ? `${sz.oc} A fuse/breaker per string` : "", verify(sz?.oc ? "y" : "")),
      f("OCPD & Grounding", "AC OCPD", `${ocpd} A breaker`, "verify"),
      f("OCPD & Grounding", "Grounding Electrode", "2x 8ft ground rods, #6 Cu GEC", "verify"),
      f("NEC 705.12 — Busbar", "Existing Service", `${busbar} A`, pj.es ? "ok" : "missing"),
      f("NEC 705.12 — Busbar", "120% Allowable", `${rule120.toFixed(0)} A`, "verify"),
      f("NEC 705.12 — Busbar", "PV Breaker", `${ocpd} A`, "verify"),
      f("NEC 705.12 — Busbar", "Compliant?", (busbar + ocpd) <= rule120 ? "YES" : "NO — line-side tap required", "verify"),
      f("Rapid Shutdown", "Compliance Method", pm.rsd || (iv?.tp === "micro" ? "Module-level (microinverter)" : iv?.tp === "optimizer" ? "Module-level (optimizer)" : ""), pm.rsd ? "ok" : iv?.tp ? "verify" : "missing"),
      f("Rapid Shutdown", "Monitoring System", pm.monSys, ok(pm.monSys)),
      f("Rapid Shutdown", "Battery Storage", pm.batSz, ok(pm.batSz)),
    ];

    if (cat === "zoning") return [
      f("Property Information", "Site Address", siteAddr, has(siteAddr) ? "ok" : "missing"),
      f("Property Information", "Parcel / PIN", pm.pid, ok(pm.pid)),
      f("Property Information", "Property Owner", pm.own, ok(pm.own)),
      f("Property Information", "Owner Phone", pm.ownPh, ok(pm.ownPh)),
      f("System Overview", "System Size (DC)", totalKw > 0 ? `${totalKw.toFixed(2)} kW` : "", verify(totalKw > 0 ? "y" : "")),
      f("System Overview", "Module Qty", nMods > 0 ? String(nMods) : "", verify(nMods > 0 ? "y" : "")),
      f("System Overview", "Mount Type", pj.mt ? (pj.mt === "roof" ? `Roof Mount (${pj.rf})` : pj.mt) : "", verify(pj.mt ? "y" : "")),
      f("System Overview", "Array Area", md && nMods > 0 ? `${(nMods * (md.lm || 1722) * (md.wm || 1134) / 1e6).toFixed(0)} m\u00B2 (${(nMods * (md.lm || 1722) * (md.wm || 1134) / 929030).toFixed(0)} ft\u00B2)` : "", verify(md ? "y" : "")),
      f("Setbacks", "Ridge Setback", "3 ft from ridge", "verify"),
      f("Setbacks", "Eave Setback", "12 in from eave", "verify"),
      f("Setbacks", "Property Line Setback", "Per local zoning code", "missing"),
    ];

    if (cat === "interconnect" || cat === "netmeter") return [
      f("Customer Information", "Customer Name", pm.own, ok(pm.own)),
      f("Customer Information", "Service Address", siteAddr, has(siteAddr) ? "ok" : "missing"),
      f("Customer Information", "Mailing Address", pm.ownAd || siteAddr, has(pm.ownAd || siteAddr) ? "ok" : "missing"),
      f("Customer Information", "Phone", pm.ownPh, ok(pm.ownPh)),
      f("Customer Information", "Email", pm.ownEm, ok(pm.ownEm)),
      f("Utility Information", "Utility Provider", pm.util, ok(pm.util)),
      f("Utility Information", "Account Number", pm.uact, ok(pm.uact)),
      f("Utility Information", "Meter Number", pm.umtr, ok(pm.umtr)),
      f("Utility Information", "Existing Service", pj.es ? `${busbar} A, 240V 1-phase` : "", pj.es ? "ok" : "missing"),
      f("Contractor / Installer", "Company", pm.cnm, ok(pm.cnm)),
      f("Contractor / Installer", "License #", pm.clic, ok(pm.clic)),
      f("Contractor / Installer", "Phone", pm.cph, ok(pm.cph)),
      f("Contractor / Installer", "Email", pm.cem, ok(pm.cem)),
      f("Generation Facility", "Nameplate DC Rating", totalKw > 0 ? `${totalKw.toFixed(2)} kW` : "", verify(totalKw > 0 ? "y" : "")),
      f("Generation Facility", "AC Output Rating", acKw > 0 ? `${acKw.toFixed(2)} kW` : "", verify(acKw > 0 ? "y" : "")),
      f("Generation Facility", "Module", md ? `${md.nm} — ${md.w}W x ${nMods}` : "", verify(md ? "y" : "")),
      f("Generation Facility", "Inverter", invSummary !== "--" ? invSummary : "", verify(invSummary !== "--" ? "y" : "")),
      f("Generation Facility", "Est. Annual Production", dsg?.kwh ? `${dsg.kwh.toLocaleString()} kWh` : "", verify(dsg?.kwh ? "y" : "")),
      f("Interconnection Details", "Point of Interconnection", pm.pnlBr || "Main service panel — load side", pm.pnlBr ? "ok" : "verify"),
      f("Interconnection Details", "PV Backfeed Breaker", `${ocpd} A`, "verify"),
      f("Interconnection Details", "NEC 705.12 Compliant", (busbar + ocpd) <= rule120 ? "YES" : "NO", "verify"),
      f("Interconnection Details", "Anti-Islanding", iv ? `IEEE 1547 — ${iv.nm}` : "", verify(iv ? "y" : "")),
      f("Interconnection Details", "Interconnection Type", acKw > 0 ? (acKw <= 25 ? "Level 1 — Simplified" : acKw <= 100 ? "Level 2 — Fast Track" : "Level 3 — Study Required") : "", verify(acKw > 0 ? "y" : "")),
      f("Net Metering", "Federal Tax Credit", pm.fedPt || "30% ITC", pm.fedPt ? "ok" : "verify"),
      f("Net Metering", "Meter Type", "Bi-directional / net meter", "verify"),
    ];

    return [];
  };

  // ── Form Assist: popup window ──
  const doFormAssist = (form) => {
    const fields = getFormFields(form.cat);
    if (fields.length === 0) { window.open(form.url, "_blank"); return; }

    const nOk = fields.filter(r => r.status === "ok").length;
    const nMiss = fields.filter(r => r.status === "missing").length;
    const nVer = fields.filter(r => r.status === "verify").length;
    const sections = [...new Set(fields.map(r => r.section))];

    const sBg = { ok: "#f0fdf4", missing: "#fef2f2", verify: "#fffbeb" };
    const sBd = { ok: "#bbf7d0", missing: "#fecaca", verify: "#fde68a" };
    const sTx = { ok: "#166534", missing: "#991b1b", verify: "#92400e" };

    const w = window.open("", "_blank", "width=720,height=820,scrollbars=yes");
    if (!w) return;

    const safeUrl = (form.url || "").replace(/&/g, "&amp;").replace(/'/g, "&#39;");
    let h = `<!DOCTYPE html><html><head><title>Form Assistant — ${(form.nm || "").replace(/</g, "&lt;")}</title><style>
body{font-family:${ff};margin:0;padding:20px;background:#f8fafc;color:#1e293b}
.hd{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:16px}
.hd h2{margin:0 0 4px;font-size:16px} .hd .dept{font-size:11px;color:#64748b} .hd .acts{margin-top:10px;display:flex;gap:8px}
.btn{padding:6px 14px;border-radius:6px;border:none;font-size:12px;font-weight:600;cursor:pointer}
.btn-pdf{background:#2563eb;color:#fff} .btn-pdf:hover{background:#1d4ed8}
.btn-print{background:#f1f5f9;color:#334155;border:1px solid #cbd5e1} .btn-print:hover{background:#e2e8f0}
.sum{display:flex;gap:10px;margin-bottom:16px}
.chip{padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700}
.sec{background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;overflow:hidden}
.sec h3{font-size:12px;font-weight:700;padding:8px 14px;margin:0;background:#f1f5f9;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse}
td{padding:6px 14px;font-size:11px;border-bottom:1px solid #f1f5f9}
td.lb{font-weight:600;width:40%} .miss td.lb{color:#991b1b;font-weight:700}
.bdg{display:inline-block;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:6px;vertical-align:middle}
@media print{body{padding:10px} .no-print{display:none!important}}
</style></head><body>`;

    h += `<div class="hd"><h2>${(form.nm || "").replace(/</g, "&lt;")}</h2>`;
    h += `<div class="dept">${(form.dept || "").replace(/</g, "&lt;")}${form.ph ? ` — ${form.ph}` : ""}</div>`;
    h += `<div class="acts no-print"><button class="btn btn-pdf" onclick="window.open('${safeUrl}','_blank')">Open PDF</button>`;
    h += `<button class="btn btn-print" onclick="window.print()">Print This</button></div></div>`;

    h += `<div class="sum">`;
    h += `<span class="chip" style="background:${sBg.ok};color:${sTx.ok};border:1px solid ${sBd.ok}">${nOk} filled</span>`;
    h += `<span class="chip" style="background:${sBg.missing};color:${sTx.missing};border:1px solid ${sBd.missing}">${nMiss} missing</span>`;
    h += `<span class="chip" style="background:${sBg.verify};color:${sTx.verify};border:1px solid ${sBd.verify}">${nVer} verify</span>`;
    h += `</div>`;

    sections.forEach(sec => {
      const rows = fields.filter(r => r.section === sec);
      h += `<div class="sec"><h3>${sec}</h3><table>`;
      rows.forEach(r => {
        const bg = sBg[r.status];
        const cls = r.status === "missing" ? ' class="miss"' : "";
        const badge = r.status === "verify" ? `<span class="bdg" style="background:${sBd.verify};color:${sTx.verify}">verify</span>` : "";
        const val = r.value || '<em style="color:#991b1b">\u2014 required \u2014</em>';
        h += `<tr${cls} style="background:${bg}"><td class="lb">${r.label}${badge}</td><td>${val}</td></tr>`;
      });
      h += `</table></div>`;
    });

    h += `</body></html>`;
    w.document.write(h);
    w.document.close();
  };

  // ── PDF Fill handler — opens interactive overlay ──
  const doAutoFillPdf = (form) => {
    setPdfFillerForm(form);
    setPdfFillerOpen(true);
  };

  // ── Style helpers ──
  const card = { ...cd, marginBottom: 12 };
  const toolbar = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 };
  const pg = { background: "#fff", color: "#000", padding: "36px 44px", fontFamily: ff, fontSize: 12, lineHeight: 1.6, border: "1px solid #ccc", borderRadius: 8, marginBottom: 16, position: "relative" };
  const th = { padding: "6px 8px", background: "#e8e8e8", border: "1px solid #bbb", fontWeight: 700, textAlign: "left", fontSize: 10 };
  const tc = { padding: "5px 8px", border: "1px solid #ccc" };
  const tcR = { ...tc, textAlign: "right" };
  const hdr = { fontSize: 16, fontWeight: 700, margin: "0 0 4px" };
  const sub = { fontSize: 13, fontWeight: 700, margin: "14px 0 6px" };
  const sigLine = { borderBottom: "1px solid #000", width: 250, display: "inline-block", margin: "4px 12px 4px 0" };
  const fld = (label, val) => <tr><td style={{ ...tc, fontWeight: 600, width: "40%" }}>{label}</td><td style={tc}>{val || ""}</td></tr>;

  // ── Permit Forms matching ──
  const catColors = { building: "#2563eb", electrical: "#d97706", zoning: "#7c3aed", reference: "#6b7280" };
  const catLabels = { building: "Building", electrical: "Electrical", zoning: "Zoning", reference: "Reference" };
  const ci = (a, b) => a && b && a.toLowerCase().includes(b.toLowerCase());
  const findForms = (j) => {
    if (!j?.st) return [];
    const sc = j.st.cd || j.st.nm;
    return PERMIT_FORMS.filter(f => {
      if (!ci(sc, f.st) && !ci(f.st, sc)) return false;
      if (f.co && !ci(j.co?.nm, f.co)) return false;
      if (f.pl && !ci(j.pl?.nm, f.pl) && !ci(j.tw?.nm, f.pl)) return false;
      return true;
    });
  };
  const matchedForms = jur ? findForms(jur) : [];
  const groupedForms = ["building", "electrical", "zoning", "reference"]
    .map(cat => ({ cat, forms: matchedForms.filter(f => f.cat === cat) }))
    .filter(g => g.forms.length > 0);

  // ── Utility Forms matching ──
  const utCatColors = { interconnect: "#059669", netmeter: "#0891b2", reference: "#6b7280" };
  const utCatLabels = { interconnect: "Interconnection", netmeter: "Net Metering", reference: "Reference" };
  const findUtilityForms = (j) => {
    if (!j?.st) return [];
    const sc = j.st.cd || j.st.nm;
    const co = j.co?.nm;
    return UTILITY_FORMS.filter(f => {
      if (!ci(sc, f.st) && !ci(f.st, sc)) return false;
      if (co && f.counties?.length > 0 && !f.counties.some(c => ci(co, c))) return false;
      return true;
    });
  };
  const matchedUtility = jur ? findUtilityForms(jur) : [];
  // Group by utility, then by category
  const utilityGroups = [...new Set(matchedUtility.map(f => f.ut))].map(ut => ({
    ut,
    forms: ["interconnect", "netmeter", "reference"]
      .map(cat => ({ cat, items: matchedUtility.filter(f => f.ut === ut && f.cat === cat) }))
      .filter(g => g.items.length > 0)
  }));

  // ── Inverter summary ──
  const invSummary = ivs?.length > 0
    ? ivs.map(e => `${e.qty}x ${e.inv.nm} (${e.inv.kw}kW)`).join(", ")
    : iv ? `${nInv}x ${iv.nm} (${iv.kw}kW)` : "--";

  // ── Racking summary ──
  const rackSummary = rack
    ? `${rack.railFamily || "IronRidge"} — ${rack.totalRailFt?.toFixed(0) || "?"} ft rail, ${rack.totalClamps || "?"} clamps, ${rack.totalMounts || "?"} mounts`
    : "Not calculated";

  // ── Project data for PdfFiller ──
  const projectData = useMemo(() => ({
    siteAddress: siteAddr,
    propertyOwner: pm.own, ownerAddress: pm.ownAd, ownerPhone: pm.ownPh, ownerEmail: pm.ownEm,
    parcelId: pm.pid,
    contractor: "Canopy Solar", contractorLicense: pm.clic, contractorPhone: pm.cph, contractorEmail: pm.cem, contractorAddress: pm.cad,
    systemSizeDC: totalKw > 0 ? `${totalKw.toFixed(2)} kW` : "",
    systemSizeAC: acKw > 0 ? `${acKw.toFixed(2)} kW` : "",
    module: md ? `${md.nm} — ${md.w}W` : "",
    moduleQty: nMods > 0 ? String(nMods) : "",
    inverter: invSummary !== "--" ? invSummary : "",
    mountType: pj.mt === "roof" ? `Roof Mount (${pj.rf})` : pj.mt || "",
    roofType: pj.rf || "", roofPitch: pj.rp ? `${pj.rp} degrees` : "",
    annualProduction: dsg?.kwh ? `${dsg.kwh.toLocaleString()} kWh` : "",
    existingService: pj.es ? `${busbar} A` : "",
    rapidShutdown: pm.rsd || "",
    monitoringSystem: pm.monSys || "",
    batteryStorage: pm.batSz || "None",
    utility: pm.util || "", utilityAccount: pm.uact || "", meterNumber: pm.umtr || "",
    jurisdiction: jur?.co?.nm ? `${jur.co.nm} County, ${jur.st?.nm || ""}` : "",
    city: pj.ct || "", state: pj.st || "", zip: pj.zp || "",
  }), [siteAddr, pm, totalKw, acKw, md, nMods, invSummary, pj, dsg, busbar, jur]);

  // ═══════════════════════════════════════════
  // BUILDING PERMIT FORM
  // ═══════════════════════════════════════════
  const BuildingForm = () => (
    <div className="plan-page" style={pg}>
      <h2 style={hdr}>BUILDING PERMIT APPLICATION — Solar Photovoltaic System</h2>
      <p style={{ fontSize: 10, color: "#666", margin: "0 0 12px" }}>Jurisdiction: {jur?.co?.nm || "--"} County, {jur?.st?.nm || "--"}{jur?.pl?.nm ? ` | ${jur.pl.nm}` : ""}</p>

      <h3 style={sub}>1. Property Information</h3>
      <table><tbody>
        {fld("Site Address", siteAddr)}
        {fld("Parcel / PIN", pm.pid)}
        {fld("Property Owner", pm.own)}
        {fld("Owner Address", pm.ownAd)}
        {fld("Owner Phone", pm.ownPh)}
        {fld("Owner Email", pm.ownEm)}
      </tbody></table>

      <h3 style={sub}>2. Contractor Information</h3>
      <table><tbody>
        {fld("Company Name", pm.cnm)}
        {fld("License #", pm.clic)}
        {fld("Contact Phone", pm.cph)}
        {fld("Contact Email", pm.cem)}
        {fld("Company Address", pm.cad)}
      </tbody></table>

      <h3 style={sub}>3. System Specifications</h3>
      <table><tbody>
        {fld("System Size (DC)", `${totalKw.toFixed(2)} kW`)}
        {fld("System Size (AC)", `${acKw.toFixed(2)} kW`)}
        {fld("DC:AC Ratio", dcac)}
        {fld("Module", md ? `${md.nm} — ${md.w}W` : "--")}
        {fld("Module Qty", nMods)}
        {fld("Inverter(s)", invSummary)}
        {fld("Mount Type", pj.mt === "roof" ? `Roof Mount (${pj.rf})` : pj.mt)}
        {fld("Estimated Annual Production", dsg?.kwh ? `${dsg.kwh.toLocaleString()} kWh` : "--")}
      </tbody></table>

      <h3 style={sub}>4. Structural / Racking</h3>
      <table><tbody>
        {fld("Racking System", rackSummary)}
        {fld("Roof Type", pj.rf || "--")}
        {fld("Roof Pitch", pj.rp ? `${pj.rp} degrees` : "--")}
        {fld("Module Weight", md ? `${((md.wt || 22) * 2.205).toFixed(1)} lbs each` : "--")}
        {fld("Total Array Weight", md ? `${(nMods * (md.wt || 22) * 2.205).toFixed(0)} lbs` : "--")}
        {fld("PSF Loading", md && modGroups[0] ? `${((md.wt || 22) * 2.205 / ((md.lm || 1722) * (md.wm || 1134) / 645160)).toFixed(1)} psf` : "--")}
      </tbody></table>

      <h3 style={sub}>5. Fire Safety (IFC 605.11)</h3>
      <table><tbody>
        {fld("Ridge Setback", "3 ft from ridge")}
        {fld("Eave Setback", "12 in from eave")}
        {fld("Pathway — Hip Roof", "36 in from ridge to eave on each side")}
        {fld("Pathway — Valley", "18 in on each side of valley")}
        {fld("Rapid Shutdown", pm.rsd || (iv?.tp === "micro" ? "Module-level (microinverter)" : iv?.tp === "optimizer" ? "Module-level (optimizer)" : "Required per NEC 690.12"))}
      </tbody></table>

      <h3 style={sub}>6. Signatures</h3>
      <div style={{ marginTop: 16, lineHeight: 2.8, fontSize: 12 }}>
        <div>Property Owner: <span style={sigLine}>&nbsp;</span> Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
        <div>Contractor: <span style={sigLine}>&nbsp;</span> Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // ELECTRICAL PERMIT FORM
  // ═══════════════════════════════════════════
  const ElectricalForm = () => (
    <div className="plan-page" style={pg}>
      <h2 style={hdr}>ELECTRICAL PERMIT APPLICATION — Solar Photovoltaic System</h2>
      <p style={{ fontSize: 10, color: "#666", margin: "0 0 12px" }}>Jurisdiction: {jur?.co?.nm || "--"} County, {jur?.st?.nm || "--"}{jur?.pl?.nm ? ` | ${jur.pl.nm}` : ""}</p>

      <h3 style={sub}>1. Site & Contractor</h3>
      <table><tbody>
        {fld("Site Address", siteAddr)}
        {fld("Contractor", pm.cnm)}
        {fld("License #", pm.clic)}
        {fld("Phone", pm.cph)}
      </tbody></table>

      <h3 style={sub}>2. PV System — NEC Article 690</h3>
      <table><tbody>
        {fld("Module", md ? `${md.nm} — ${md.w}W, Voc=${md.voc}V, Isc=${md.isc}A` : "--")}
        {fld("Total Modules", nMods)}
        {fld("System DC Rating", `${totalKw.toFixed(2)} kW`)}
        {fld("Inverter(s)", invSummary)}
        {fld("Inverter AC Rating", `${acKw.toFixed(2)} kW`)}
        {fld("DC:AC Ratio", dcac)}
      </tbody></table>

      <h3 style={sub}>3. String Configuration (NEC 690.7 / 690.8)</h3>
      <table><tbody>
        {fld("Strings", `${nStr} strings x ${modsPerStr} modules`)}
        {fld("Max System Voltage (Voc corrected)", sz ? `${sysVoc} V (limit ${iv?.dv || "--"}V)` : "--")}
        {fld("Max String Current (Isc x 1.25)", sz ? `${sz.ci?.toFixed(1) || (md.isc * 1.25).toFixed(1)} A` : "--")}
        {fld("OCPD per String", sz ? `${sz.oc} A` : "--")}
      </tbody></table>

      <h3 style={sub}>4. Conductors & Conduit</h3>
      <table>
        <thead><tr><th style={th}>Circuit</th><th style={th}>Wire Size</th><th style={th}>Type</th><th style={th}>Conduit</th></tr></thead>
        <tbody>
          <tr><td style={tc}>PV Source (DC)</td><td style={tc}>{sz?.dc || "--"} AWG</td><td style={tc}>THWN-2 / USE-2</td><td style={tc}>{sz?.dcc || "3/4"}" EMT</td></tr>
          <tr><td style={tc}>DC Homerun</td><td style={tc}>{sz?.dc || "--"} AWG</td><td style={tc}>THWN-2</td><td style={tc}>{sz?.dcc || "3/4"}" EMT</td></tr>
          <tr><td style={tc}>AC Branch</td><td style={tc}>{sz?.ac || "--"} AWG</td><td style={tc}>THWN-2</td><td style={tc}>{sz?.acc || "3/4"}" EMT</td></tr>
          <tr><td style={tc}>EGC</td><td style={tc}>{sz?.eg || "--"} AWG</td><td style={tc}>Bare Cu</td><td style={tc}>w/ circuit</td></tr>
          <tr><td style={tc}>GEC</td><td style={tc}>{sz?.ge || "--"} AWG</td><td style={tc}>Bare Cu</td><td style={tc}>--</td></tr>
        </tbody>
      </table>

      <h3 style={sub}>5. Overcurrent Protection & Grounding</h3>
      <table><tbody>
        {fld("DC OCPD", `${sz?.oc || "--"} A fuse/breaker per string`)}
        {fld("AC OCPD (Inverter Output)", `${ocpd} A breaker`)}
        {fld("Grounding Electrode", "2x 8ft ground rods (NEC 250.53), #6 Cu GEC")}
        {fld("Equipment Grounding", `${sz?.eg || "#10"} AWG Cu per NEC 250.122`)}
      </tbody></table>

      <h3 style={sub}>6. NEC 705.12 — Busbar Calculation</h3>
      <table><tbody>
        {fld("Existing Service", `${busbar} A`)}
        {fld("120% Allowable", `${rule120.toFixed(0)} A`)}
        {fld("PV Breaker", `${ocpd} A`)}
        {fld("Main Breaker + PV", `${busbar + ocpd} A`)}
        {fld("Compliant?", (busbar + ocpd) <= rule120 ? "YES — within 120% rule" : "NO — requires line-side tap or service upgrade")}
      </tbody></table>

      <h3 style={sub}>7. Rapid Shutdown (NEC 690.12)</h3>
      <table><tbody>
        {fld("Compliance Method", pm.rsd || (iv?.tp === "micro" ? "Module-level shutdown (microinverter)" : iv?.tp === "optimizer" ? "Module-level shutdown (optimizer)" : "Rapid shutdown device required"))}
        {fld("Monitoring System", pm.monSys || "--")}
        {fld("Battery Storage", pm.batSz || "None")}
      </tbody></table>

      <h3 style={sub}>8. Signatures</h3>
      <div style={{ marginTop: 12, lineHeight: 2.8, fontSize: 12 }}>
        <div>Licensed Electrician: <span style={sigLine}>&nbsp;</span> License #: <span style={{ ...sigLine, width: 150 }}>&nbsp;</span></div>
        <div>Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // UTILITY INTERCONNECTION FORM
  // ═══════════════════════════════════════════
  const InterconnectForm = () => (
    <div className="plan-page" style={pg}>
      <h2 style={hdr}>UTILITY INTERCONNECTION APPLICATION — Solar Photovoltaic System</h2>
      <p style={{ fontSize: 10, color: "#666", margin: "0 0 12px" }}>Jurisdiction: {jur?.co?.nm || "--"} County, {jur?.st?.nm || "--"}{jur?.pl?.nm ? ` | ${jur.pl.nm}` : ""}</p>

      <h3 style={sub}>1. Customer Information</h3>
      <table><tbody>
        {fld("Customer Name", pm.own)}
        {fld("Service Address", siteAddr)}
        {fld("Mailing Address", pm.ownAd || siteAddr)}
        {fld("Phone", pm.ownPh)}
        {fld("Email", pm.ownEm)}
      </tbody></table>

      <h3 style={sub}>2. Utility Information</h3>
      <table><tbody>
        {fld("Utility Provider", pm.util)}
        {fld("Account Number", pm.uact)}
        {fld("Meter Number", pm.umtr)}
        {fld("Existing Service", `${busbar} A, 240V 1-phase`)}
      </tbody></table>

      <h3 style={sub}>3. Contractor / Installer</h3>
      <table><tbody>
        {fld("Company", pm.cnm)}
        {fld("License #", pm.clic)}
        {fld("Phone", pm.cph)}
        {fld("Email", pm.cem)}
        {fld("Address", pm.cad)}
      </tbody></table>

      <h3 style={sub}>4. Generation Facility</h3>
      <table><tbody>
        {fld("Technology", "Solar Photovoltaic")}
        {fld("Nameplate DC Rating", `${totalKw.toFixed(2)} kW`)}
        {fld("AC Output Rating", `${acKw.toFixed(2)} kW`)}
        {fld("Module", md ? `${md.nm} — ${md.w}W x ${nMods}` : "--")}
        {fld("Inverter", invSummary)}
        {fld("Estimated Annual Production", dsg?.kwh ? `${dsg.kwh.toLocaleString()} kWh` : "--")}
        {fld("Energy Source", "Solar — intermittent, non-dispatchable")}
      </tbody></table>

      <h3 style={sub}>5. Interconnection Details</h3>
      <table><tbody>
        {fld("Point of Interconnection", pm.pnlBr || "Main service panel — load side")}
        {fld("Panel Brand / Model", pm.pnlBr || "--")}
        {fld("Main Breaker", `${busbar} A`)}
        {fld("PV Backfeed Breaker", `${ocpd} A`)}
        {fld("NEC 705.12 Compliant", (busbar + ocpd) <= rule120 ? `YES — ${busbar + ocpd}A <= ${rule120.toFixed(0)}A (120% rule)` : "NO — line-side tap required")}
        {fld("Anti-Islanding", `IEEE 1547 compliant — ${iv?.nm || "inverter"} certified`)}
        {fld("Interconnection Type", acKw <= 25 ? "Level 1 — Simplified (< 25 kW)" : acKw <= 100 ? "Level 2 — Fast Track (25-100 kW)" : "Level 3 — Study Required (> 100 kW)")}
      </tbody></table>

      <h3 style={sub}>6. Net Metering</h3>
      <table><tbody>
        {fld("Requesting Net Metering", "Yes")}
        {fld("Federal Investment Tax Credit", pm.fedPt || "30% ITC (IRC Section 48)")}
        {fld("Meter Type Requested", "Bi-directional / net meter")}
      </tbody></table>

      <h3 style={sub}>7. Signatures</h3>
      <div style={{ marginTop: 12, lineHeight: 2.8, fontSize: 12 }}>
        <div>Customer: <span style={sigLine}>&nbsp;</span> Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
        <div>Installer: <span style={sigLine}>&nbsp;</span> Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
        <div>Utility Representative: <span style={sigLine}>&nbsp;</span> Date: <span style={{ ...sigLine, width: 120 }}>&nbsp;</span></div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* ── [A] Toolbar ── */}
      <div className="no-print" style={toolbar}>
        <button style={bt(false)} onClick={doJurLookup} disabled={jurBusy}>
          {jurBusy ? "Looking up..." : "Lookup Jurisdiction"}
        </button>
        <button style={bt(false)} onClick={doReqLookup} disabled={reqBusy || !jur?.st}>
          {reqBusy ? "Researching..." : "AI Permit Lookup"}
        </button>
        <button style={bt(false)} onClick={() => { const n = doAutoFill(); setFillMsg(n > 0 ? `Filled ${n} fields` : "All fields already set"); setTimeout(() => setFillMsg(""), 3000); }}>
          Auto-Fill
        </button>
        <span style={{ flex: 1 }} />
        {["building", "electrical", "interconnect"].map(f => (
          <button key={f} style={bt(activeForm === f)} onClick={() => setActiveForm(f)}>
            {f === "building" ? "Building" : f === "electrical" ? "Electrical" : "Interconnect"}
          </button>
        ))}
        <button style={{ ...bt(true), background: bl }} onClick={doPrint}>Print</button>
      </div>

      {/* Status messages */}
      {jurMsg && <div style={{ fontSize: 11, color: td, marginBottom: 8 }}>{jurMsg}</div>}
      {reqMsg && <div style={{ fontSize: 11, color: td, marginBottom: 8 }}>{reqMsg}</div>}
      {fillMsg && <div style={{ fontSize: 11, color: gn, marginBottom: 8 }}>{fillMsg}</div>}

      {/* ── [B] Jurisdiction Hierarchy ── */}
      {jur && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Jurisdiction Hierarchy</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {[
              { lbl: "State", d: jur.st, ic: "🏛" },
              { lbl: "County", d: jur.co, ic: "🏢" },
              { lbl: "Township", d: jur.tw, ic: "🏘" },
              { lbl: "City/Village", d: jur.pl, ic: "🏙" },
            ].map(({ lbl, d, ic }) => (
              <div key={lbl} style={{ background: d ? c2 : "#fafafa", borderRadius: 6, padding: "8px 10px", border: `1px solid ${d ? bd : "#eee"}`, opacity: d ? 1 : 0.5 }}>
                <div style={{ fontSize: 10, color: td, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ic} {lbl}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{d?.nm || "N/A"}</div>
                {d?.fips && <div style={{ fontSize: 9, color: td }}>FIPS {d.fips}{d.cd ? ` (${d.cd})` : ""}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── [B2] Permit Forms ── */}
      {groupedForms.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Permit Forms & Applications</div>
          {groupedForms.map(({ cat, forms }) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: catColors[cat], padding: "1px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{catLabels[cat]}</span>
              </div>
              {forms.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < forms.length - 1 ? `1px solid ${c2}` : "none" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>&#128196;</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" onClick={e => { if (cat !== "reference") { e.preventDefault(); doFormAssist(f); } }} style={{ color: bl, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>{f.nm}</a>
                    <div style={{ fontSize: 10, color: td }}>
                      {f.dept}{f.ph ? ` — ${f.ph}` : ""}
                    </div>
                  </div>
                  {cat !== "reference" && f.url?.toLowerCase().endsWith(".pdf") && (
                    <button
                      onClick={() => doAutoFillPdf(f)}
                      style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "none", background: gn, color: "#fff", cursor: "pointer" }}
                    >
                      Fill PDF
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── [B3] Utility Interconnection Forms ── */}
      {utilityGroups.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Utility Interconnection Forms</div>
          {utilityGroups.map(({ ut, forms }) => (
            <div key={ut} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tx, marginBottom: 4 }}>{ut}</div>
              {forms.map(({ cat, items }) => (
                <div key={cat} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: utCatColors[cat], padding: "1px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{utCatLabels[cat]}</span>
                  {items.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < items.length - 1 ? `1px solid ${c2}` : "none" }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>&#9889;</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" onClick={e => { if (cat !== "reference") { e.preventDefault(); doFormAssist(f); } }} style={{ color: bl, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>{f.nm}</a>
                        <div style={{ fontSize: 10, color: td }}>
                          {f.dept}{f.ph ? ` — ${f.ph}` : ""}{f.em ? ` — ${f.em}` : ""}
                        </div>
                      </div>
                      {cat !== "reference" && f.url?.toLowerCase().endsWith(".pdf") && (
                        <button
                          onClick={() => doAutoFillPdf(f)}
                          style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "none", background: gn, color: "#fff", cursor: "pointer" }}
                        >
                          Fill PDF
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── [C] AI Permit Requirements ── */}
      {pm.reqs?.levels && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Permit Requirements</div>
          <div style={{ fontSize: 9, color: rd, marginBottom: 8 }}>AI-generated. Verify with local AHJ before submitting applications.</div>
          {pm.reqs.levels.map((lvl, i) => {
            const open = openLvl[i] !== false;
            return (
              <div key={i} style={{ marginBottom: 6, border: `1px solid ${bd}`, borderRadius: 6, overflow: "hidden" }}>
                <div
                  onClick={() => setOpenLvl(p => ({ ...p, [i]: !open }))}
                  style={{ padding: "8px 12px", background: c2, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}
                >
                  <span style={{ fontSize: 10 }}>{open ? "▼" : "▶"}</span>
                  {lvl.name}
                  {lvl.solarapp && <span style={{ fontSize: 9, background: gn, color: "#fff", padding: "1px 6px", borderRadius: 10, marginLeft: 8 }}>SolarAPP+</span>}
                </div>
                {open && (
                  <div style={{ padding: "8px 12px", fontSize: 11 }}>
                    {lvl.permits?.length > 0 && <div style={{ marginBottom: 6 }}><strong>Permits:</strong><ul style={{ margin: "2px 0 0 16px", padding: 0 }}>{lvl.permits.map((p, j) => <li key={j}>{p}</li>)}</ul></div>}
                    {lvl.fees?.length > 0 && <div style={{ marginBottom: 6 }}><strong>Fees:</strong><ul style={{ margin: "2px 0 0 16px", padding: 0 }}>{lvl.fees.map((f, j) => <li key={j}>{f}</li>)}</ul></div>}
                    {lvl.notes?.length > 0 && <div style={{ marginBottom: 6 }}><strong>Notes:</strong><ul style={{ margin: "2px 0 0 16px", padding: 0 }}>{lvl.notes.map((n, j) => <li key={j}>{n}</li>)}</ul></div>}
                    {lvl.urls?.length > 0 && <div><strong>Links:</strong><ul style={{ margin: "2px 0 0 16px", padding: 0 }}>{lvl.urls.map((u, j) => <li key={j}><a href={u} target="_blank" rel="noopener noreferrer" style={{ color: bl, wordBreak: "break-all" }}>{u}</a></li>)}</ul></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── [D] Additional Info ── */}
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Additional Information</div>
        <Row>
          <div><Lbl>Property Owner</Lbl><Inp v={pm.own} k="own" uPm={uPm} /></div>
          <div><Lbl>Owner Address</Lbl><Inp v={pm.ownAd} k="ownAd" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Owner Phone</Lbl><Inp v={pm.ownPh} k="ownPh" uPm={uPm} /></div>
          <div><Lbl>Owner Email</Lbl><Inp v={pm.ownEm} k="ownEm" uPm={uPm} /></div>
        </Row>
        <div style={{ height: 8 }} />
        <Row>
          <div><Lbl>Contractor Name</Lbl><Inp v={pm.cnm} k="cnm" uPm={uPm} /></div>
          <div><Lbl>Contractor License #</Lbl><Inp v={pm.clic} k="clic" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Contractor Phone</Lbl><Inp v={pm.cph} k="cph" uPm={uPm} /></div>
          <div><Lbl>Contractor Email</Lbl><Inp v={pm.cem} k="cem" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Contractor Address</Lbl><Inp v={pm.cad} k="cad" uPm={uPm} /></div>
          <div><Lbl>Parcel / PIN</Lbl><Inp v={pm.pid} k="pid" uPm={uPm} /></div>
        </Row>
        <div style={{ height: 8 }} />
        <Row>
          <div><Lbl>Utility Provider</Lbl><Inp v={pm.util} k="util" uPm={uPm} /></div>
          <div><Lbl>Utility Account #</Lbl><Inp v={pm.uact} k="uact" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Meter Number</Lbl><Inp v={pm.umtr} k="umtr" uPm={uPm} /></div>
          <div><Lbl>Panel Brand / Main Breaker</Lbl><Inp v={pm.pnlBr} k="pnlBr" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Rapid Shutdown Method</Lbl><Inp v={pm.rsd} k="rsd" uPm={uPm} /></div>
          <div><Lbl>Monitoring System</Lbl><Inp v={pm.monSys} k="monSys" uPm={uPm} /></div>
        </Row>
        <Row>
          <div><Lbl>Battery Storage</Lbl><Inp v={pm.batSz} k="batSz" uPm={uPm} /></div>
          <div><Lbl>Federal Tax Credit</Lbl><Inp v={pm.fedPt} k="fedPt" uPm={uPm} /></div>
        </Row>
      </div>

      {/* ── [E] Active Form ── */}
      <div ref={printRef}>
        {activeForm === "building" && <BuildingForm />}
        {activeForm === "electrical" && <ElectricalForm />}
        {activeForm === "interconnect" && <InterconnectForm />}
      </div>

      {/* ── PDF Filler Overlay ── */}
      {pdfFillerOpen && pdfFillerForm && (
        <PdfFiller
          form={pdfFillerForm}
          projectData={projectData}
          onClose={() => { setPdfFillerOpen(false); setPdfFillerForm(null); }}
        />
      )}
    </div>
  );
}
