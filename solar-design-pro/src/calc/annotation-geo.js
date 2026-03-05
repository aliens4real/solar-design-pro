import { calcConduit } from '../diagrams/shared.jsx';

// ── Defaults ──
export const DEF_W = 36, DEF_H = 36, DEF_BEND = 12;
export const PARALLEL_GAP = 10;

// ── Wire & conduit options ──
export const WIRE_OPTS = ["14","12","10","8","6","4","3","2","1","1/0","2/0","3/0","4/0","250kcm","350kcm","500kcm"];
export const WIRE_TYPES = ["THWN-2","XHHW-2","USE-2","PV Wire","Bare Cu","Cu EGC"];
export const CONDUIT_OPTS = ["½\" EMT","¾\" EMT","1\" EMT","1¼\" EMT","1½\" EMT","2\" EMT","2½\" EMT","3\" EMT",
  "½\" PVC","¾\" PVC","1\" PVC","1¼\" PVC","1½\" PVC","2\" PVC","Flex ½\"","Flex ¾\"","Flex 1\"","None/Open"];

// ── Modes ──
export const MODE = { SELECT: "select", PLACE: "place", LINE: "line", SITE: "site" };

// ═══ H/V Routing Geometry ═══

export function isHEdge(e) { return e === "l" || e === "r"; }

export function edgeSnap(mk, edge, off) {
  const GAP = 3;
  const hw = (mk.w || DEF_W) / 2 + GAP, hh = (mk.h || DEF_H) / 2 + GAP;
  if (edge === "r") return { x: mk.x + hw, y: mk.y + (off || 0) };
  if (edge === "l") return { x: mk.x - hw, y: mk.y + (off || 0) };
  if (edge === "b") return { x: mk.x + (off || 0), y: mk.y + hh };
  return { x: mk.x + (off || 0), y: mk.y - hh }; // "t"
}

export function nearestEdge(mk, pt) {
  const hw = (mk.w || DEF_W) / 2, hh = (mk.h || DEF_H) / 2;
  const edges = [
    { edge: "r", x: mk.x + hw, y: mk.y },
    { edge: "l", x: mk.x - hw, y: mk.y },
    { edge: "b", x: mk.x, y: mk.y + hh },
    { edge: "t", x: mk.x, y: mk.y - hh },
  ];
  return edges.reduce((a, b) => Math.hypot(pt.x - a.x, pt.y - a.y) <= Math.hypot(pt.x - b.x, pt.y - b.y) ? a : b).edge;
}

export function resolveEdges(a, b, ln) {
  let fe = ln.fe, te = ln.te;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dir = ln.dir || "h";
  const hasCo = ln.co != null;

  if (hasCo && (!fe || !te)) {
    const co = ln.co;
    if (!fe) fe = dir === "v" ? (co >= a.y ? "b" : "t") : (co >= a.x ? "r" : "l");
    if (!te) te = dir === "v" ? (b.y >= co ? "t" : "b") : (b.x >= co ? "l" : "r");
  } else {
    if (!fe) fe = dir === "v" ? (dy >= 0 ? "b" : "t") : (dx >= 0 ? "r" : "l");
    if (!te) {
      if (isHEdge(fe)) te = dy >= 0 ? "t" : "b";
      else te = dx >= 0 ? "l" : "r";
    }
  }
  return { fe, te };
}

function arcCorner(prev, corner, next, R) {
  const dx1 = corner.x - prev.x, dy1 = corner.y - prev.y;
  const dx2 = next.x - corner.x, dy2 = next.y - corner.y;
  const len1 = Math.hypot(dx1, dy1), len2 = Math.hypot(dx2, dy2);
  const r = Math.max(1, Math.min(R, len1 * 0.45, len2 * 0.45));
  if (len1 < 1 || len2 < 1) return { s: corner, e: corner, r: 0, sweep: 0, valid: false };
  const s = { x: corner.x - (dx1 / len1) * r, y: corner.y - (dy1 / len1) * r };
  const e = { x: corner.x + (dx2 / len2) * r, y: corner.y + (dy2 / len2) * r };
  const cross = dx1 * dy2 - dy1 * dx2;
  return { s, e, r, sweep: cross > 0 ? 1 : 0, valid: true };
}

export function buildPath(pts, bendR) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const arc = arcCorner(pts[i - 1], pts[i], pts[i + 1], bendR);
    if (arc.valid) {
      d += ` L${arc.s.x.toFixed(1)},${arc.s.y.toFixed(1)}`;
      d += ` A${arc.r.toFixed(1)},${arc.r.toFixed(1)} 0 0 ${arc.sweep} ${arc.e.x.toFixed(1)},${arc.e.y.toFixed(1)}`;
    } else {
      d += ` L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

export function hvRoute(a, b, ln, parOff) {
  const bendR = ln.bendR ?? DEF_BEND;
  const off = parOff || 0;
  const { fe, te } = resolveEdges(a, b, ln);
  const p1 = edgeSnap(a, fe, off);
  const p2 = edgeSnap(b, te, off);
  const exitH = isHEdge(fe), entryH = isHEdge(te);

  let pts, dragPt;

  if (exitH === entryH) {
    const co = ln.co;
    if (exitH) {
      const mx = co != null ? co : (p1.x + p2.x) / 2;
      pts = [p1, { x: mx, y: p1.y }, { x: mx, y: p2.y }, p2];
      dragPt = { x: mx, y: (p1.y + p2.y) / 2 };
    } else {
      const my = co != null ? co : (p1.y + p2.y) / 2;
      pts = [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2];
      dragPt = { x: (p1.x + p2.x) / 2, y: my };
    }
  } else {
    const corner = exitH ? { x: p2.x, y: p1.y } : { x: p1.x, y: p2.y };
    pts = [p1, corner, p2];
    dragPt = null;
  }

  const d = buildPath(pts, bendR);
  const mi = Math.floor(pts.length / 2);
  const mid = { x: (pts[mi - 1].x + pts[mi].x) / 2, y: (pts[mi - 1].y + pts[mi].y) / 2 };
  return { d, mid, dragPt, pts, p1, p2, fe, te, exitH };
}

export function hvSiteRoute(a, end, ln, parOff) {
  const bendR = ln.bendR ?? DEF_BEND;
  const off = parOff || 0;
  const dx = end.x - a.x, dy = end.y - a.y;
  const dir = ln.dir || "h";
  let fe = ln.fe;
  if (!fe) fe = dir === "v" ? (dy >= 0 ? "b" : "t") : (dx >= 0 ? "r" : "l");
  const p1 = edgeSnap(a, fe, off);
  const exitH = isHEdge(fe);

  let pts;
  if (exitH) {
    if (Math.abs(dy) < 4) pts = [p1, { x: end.x, y: p1.y }];
    else pts = [p1, { x: end.x, y: p1.y }, end];
  } else {
    if (Math.abs(dx) < 4) pts = [p1, { x: p1.x, y: end.y }];
    else pts = [p1, { x: p1.x, y: end.y }, end];
  }

  const d = buildPath(pts, bendR);
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const mi = Math.floor(pts.length / 2);
  const mid = { x: (pts[mi - 1].x + pts[mi].x) / 2, y: (pts[mi - 1].y + pts[mi].y) / 2 };
  return { d, mid, pts, angle, endPt: last, p1, fe };
}

export function parallelOffset(ln, allLines) {
  if (ln.co != null) return 0;
  const pairKey = (a, b) => a < b ? `${a}|${b}` : `${b}|${a}`;
  let siblings;
  if (ln.site) {
    siblings = allLines.filter(l => l.site && l.from === ln.from && l.co == null);
  } else if (ln.to) {
    const key = pairKey(ln.from, ln.to);
    siblings = allLines.filter(l => !l.site && l.to && pairKey(l.from, l.to) === key && l.co == null);
  } else return 0;
  if (siblings.length <= 1) return 0;
  const idx = siblings.indexOf(ln);
  return (idx - (siblings.length - 1) / 2) * PARALLEL_GAP;
}

export function specFromRun(run) {
  if (!run || !run.wires) return {};
  const mainW = run.wires.find(w => !w.t.includes("EGC") && !w.t.includes("Bare"));
  const qty = run.wires.reduce((s, w) => s + w.n, 0);
  const cSize = run.conduit === "—" ? "None/Open" : (run.conduit || "").replace("1/2", "½").replace("3/4", "¾");
  let conduit = "None/Open";
  if (cSize !== "—" && cSize !== "None/Open") {
    const sz = cSize.replace('"', '').trim();
    const match = CONDUIT_OPTS.find(o => o.startsWith(sz) || o.includes(sz));
    conduit = match || sz + "\" EMT";
  }
  return { wire: mainW?.g || "", wireType: mainW?.t || "THWN-2", qty: String(qty), conduit };
}
