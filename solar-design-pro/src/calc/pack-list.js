import { egcSize, gecSize, seSize } from './nec-sizing.js';
import { calcConduit } from '../diagrams/shared.jsx';

// Unicode → ASCII fraction map (NEC table sizes → inventory names)
const SZ_ASCII = { '½"': '1/2"', '¾"': '3/4"', '1"': '1"', '1¼"': '1-1/4"', '1½"': '1-1/2"', '2"': '2"' };

// Unit prices per conduit size for each accessory type (from Canopy inventory)
const COND_ACC = {
  '1/2"':   { stick: 7.00, coupling: 0.30, connector: 0.33, locknut: 0.12, bushing: 0.18, strap: 0.15, lb: 2.50 },
  '3/4"':   { stick: 8.50, coupling: 0.36, connector: 0.39, locknut: 0.14, bushing: 0.21, strap: 0.18, lb: 2.91 },
  '1"':     { stick: 12.00, coupling: 0.55, connector: 0.58, locknut: 0.18, bushing: 0.30, strap: 0.25, lb: 4.50 },
  '1-1/4"': { stick: 16.50, coupling: 0.80, connector: 0.85, locknut: 0.25, bushing: 0.42, strap: 0.35, lb: 6.00 },
  '1-1/2"': { stick: 20.00, coupling: 1.00, connector: 1.10, locknut: 0.30, bushing: 0.50, strap: 0.42, lb: 7.50 },
  '2"':     { stick: 26.00, coupling: 1.30, connector: 1.40, locknut: 0.40, bushing: 0.65, strap: 0.55, lb: 10.00 },
};

// Emit conduit accessory line items for a conduit run
// endpoints: number of enclosure entries (default 2; AC runs through disconnect = 4)
function addConduitRun(a, szRaw, runLen, label, endpoints) {
  const sz = SZ_ASCII[szRaw] || szRaw.replace(/[""\u201d]/g, '"');
  const p = COND_ACC[sz] || COND_ACC['3/4"'];
  const lbl = label ? ` (${label})` : '';
  const ep = endpoints || 2;
  const sticks = Math.ceil(runLen / 10);
  const couplings = Math.max(0, sticks - 1);
  const straps = Math.ceil(runLen / 10) + 1;   // NEC 358.30: within 3ft of box + every 10ft
  const lbs = Math.max(1, Math.ceil(runLen / 25)); // at least 1 direction change per run

  a('Conduit', `${sz} EMT 10ft${lbl}`,              sticks,    'ea', p.stick);
  a('Conduit', `${sz} EMT Set Screw Coupling${lbl}`, couplings, 'ea', p.coupling);
  a('Conduit', `${sz} EMT Set Screw Connector${lbl}`, ep,       'ea', p.connector);
  a('Conduit', `${sz} Locknut${lbl}`,                ep,        'ea', p.locknut);
  a('Conduit', `${sz} Insulating Bushing${lbl}`,     ep,        'ea', p.bushing);
  a('Conduit', `${sz} One-Hole Strap${lbl}`,         straps,    'ea', p.strap);
  a('Conduit', `${sz} LB Fitting${lbl}`,             lbs,       'ea', p.lb);
}

export function mkPack(m, iv, d, sz, wr, es, pht) {
  if (!m || !iv || !d) return [];
  const n = d.tm || 0, ni = d.ni || 1, mi = iv.tp === "micro", oi = iv.tp === "optimizer";
  const L = [];
  const a = (c, ds, q, u, $) => L.push({ c, d: ds, q, u, $: +$, t: +(q * $).toFixed(2) });
  const w = wr || {};
  const svc = +(es || 200);
  const isComm = svc >= 320;
  const hasWr = (w.pv || 0) + (w.dc || 0) + (w.ac || 0) + (w.se || 0) + (w.gec || 0) > 0;

  a("Modules", m.nm, n, "ea", m.$);
  a("Inverters", iv.nm, mi ? n : ni, "ea", iv.$);
  if (mi) { a("Enphase", "Q Cable raw", n * 6, "ft", 1.44); a("Enphase", "IQ Gateway/Combiner", 1, "ea", 628); }
  if (oi) { a("Optimizer", "SolarEdge P505", n, "ea", 70); }

  const rl = Math.ceil(n / 4) * 2;
  a("Racking", "XR100 Rail 168\"", rl, "ea", 48.5);
  a("Racking", "FlashFoot2", rl * 2, "ea", 14.5);
  a("Racking", "Mid Clamp", Math.max(0, (n - rl) * 2), "ea", 1.75);
  a("Racking", "End Clamp", rl * 2, "ea", 1.75);
  a("Racking", "WEEB Ground Clip", n, "ea", 3.25);

  if (!hasWr) {
    // ── Original hard-coded fallback ──
    a("Wiring", "10AWG PV Wire Blk", n * 12 + 40, "ft", 0.43);
    a("Wiring", "10AWG PV Wire Red", n * 12 + 40, "ft", 0.43);
    if (!mi && sz) { a("Wiring", sz.ac + "AWG THWN-2 Blk", 60, "ft", 0.58); a("Wiring", sz.ac + "AWG THWN-2 Red", 60, "ft", 0.58); a("Wiring", sz.ac + "AWG THWN-2 Wht", 60, "ft", 0.58); }
    a("Wiring", "10AWG Green EGC", 60, "ft", 0.35);
    a("Wiring", "#6 Bare Cu GEC", 25, "ft", 0.85);
    addConduitRun(a, '¾"', 35, "");
  } else {
    // ── Calculated from wire run lengths ──
    const ceil = v => Math.ceil(v * 1.1);
    const ocpd = sz?.oc || 20;
    const egc = egcSize(ocpd);
    const gecG = gecSize(svc);
    const se_ = seSize(svc);

    // PV source circuit
    const pvFt = w.pv > 0 ? ceil(w.pv) : 40;
    a("Wiring", "#10 PV Wire USE-2 Blk", n * 12 + pvFt, "ft", 0.43);
    a("Wiring", "#10 PV Wire USE-2 Red", n * 12 + pvFt, "ft", 0.43);

    // DC home run
    if (!mi && sz) {
      const ft = w.dc > 0 ? ceil(w.dc) : 30;
      a("Wiring", `#${sz.dc} THWN-2 Blk (DC)`, ft, "ft", 0.58);
      a("Wiring", `#${sz.dc} THWN-2 Red (DC)`, ft, "ft", 0.58);
      a("Wiring", `#${egc} Cu EGC Grn (DC)`, ft, "ft", 0.35);
      if (w.dc > 0) {
        const c = calcConduit([{ n: 2, g: sz.dc, t: "THWN-2" }, { n: 1, g: egc, t: "EGC" }]);
        addConduitRun(a, c.conduit, w.dc, "DC");
      }
    }

    // AC branch
    if (sz) {
      const ft = w.ac > 0 ? ceil(w.ac) : 30;
      const ph = isComm ? 3 : 2;
      ["Blk", "Red", "Blu"].slice(0, ph).forEach(clr =>
        a("Wiring", `#${sz.ac} THWN-2 ${clr} (AC)`, ft, "ft", 0.58));
      a("Wiring", `#${sz.ac} THWN-2 Wht (AC)`, ft, "ft", 0.58);
      a("Wiring", `#${egc} Cu EGC Grn (AC)`, ft, "ft", 0.35);
      if (w.ac > 0) {
        const c = calcConduit([{ n: ph, g: sz.ac, t: "THWN-2" }, { n: 1, g: sz.ac, t: "N" }, { n: 1, g: egc, t: "EGC" }]);
        addConduitRun(a, c.conduit, w.ac, "AC", 4); // inverter + disconnect (in/out) + panel
      }
    }

    // Service entrance
    if (w.se > 0) {
      const ft = ceil(w.se);
      const ph = isComm ? 3 : 2;
      ["Blk", "Red", "Blu"].slice(0, ph).forEach(clr =>
        a("Wiring", `#${se_.cu} THWN-2 ${clr} (SE)`, ft, "ft", 0.85));
      a("Wiring", `#${se_.cu} THWN-2 Wht (SE)`, ft, "ft", 0.85);
      a("Wiring", `#${gecG} Cu EGC Grn (SE)`, ft, "ft", 0.35);
      const c = calcConduit([{ n: ph, g: se_.cu, t: "THWN-2" }, { n: 1, g: se_.cu, t: "N" }, { n: 1, g: gecG, t: "EGC" }]);
      addConduitRun(a, c.conduit, w.se, "SE");
    }

    // GEC
    const gecFt = w.gec > 0 ? ceil(w.gec) : 25;
    a("Wiring", `#${gecG} Bare Cu GEC`, gecFt, "ft", 0.85);

    // Default conduit if no segment-specific conduit was added
    if (!(w.dc > 0) && !(w.ac > 0) && !(w.se > 0)) {
      addConduitRun(a, '¾"', 35, "");
    }
  }

  // ── Photo-annotated conduit runs (exclude site runs to avoid double-counting) ──
  if (pht && pht.length > 0) {
    const photoLines = pht.flatMap(p => (p.ln || []).filter(ln => !ln.site));
    photoLines.forEach(ln => {
      const wg = ln.wire;
      const wt = ln.wireType || "THWN-2";
      const qty = +(ln.qty || 3);
      const cond = ln.conduit || "";
      const lbl = ln.label ? ` (${ln.label})` : " (Photo)";
      if (wg) {
        a("Wiring", `#${wg} ${wt}${lbl}`, qty * 10, "ft", 0.58);
      }
      if (cond && cond !== "None/Open") {
        addConduitRun(a, cond, 10, ln.label || "Photo");
      }
    });
  }

  a("OCPD", "Breaker " + (sz?.oc || d.aoc || 40) + "A 2p", 1, "ea", 24.65);
  if (!mi) a("Disconnect", "DC Disconnect 600V", 1, "ea", 51);
  a("Ground", "5/8\"x8' CU Ground Rod", 2, "ea", 18.5);   // NEC 250.53(A)(2)
  a("Ground", "Acorn Ground Rod Clamp", 2, "ea", 2.79);    // 1 per rod
  a("Ground", "Grounding Bus Bar", 1, "ea", 8.50);
  a("Ground", "Bonding Bushing + Jumper", 1, "ea", 4.25);  // NEC 250.92(B) SE raceway
  a("Ground", "Intersystem Bonding Term.", 1, "ea", 12.00); // NEC 250.94
  a("BOS", "MC4 Pairs", n + 4, "pr", 2.5);
  a("BOS", "JBox PVC 8x8x4", 1, "ea", 12.5);
  a("BOS", "NEC 690 Label Set", 1, "set", 25);
  a("BOS", "Tap Box Kit", 1, "ea", 85);
  a("BOS", "Wire Pulling Lubricant", 1, "ea", 8.50);
  return L;
}
