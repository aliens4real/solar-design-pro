import { useState, useCallback } from 'react';
import { ff, fs, c1, c2, bd, ac, tx, td, rd, gn, bt, cd, inp, lb } from '../theme.js';
import { MCATS } from '../data/markers.js';
import {
  MODE, DEF_W, DEF_H, DEF_BEND, WIRE_OPTS, WIRE_TYPES, CONDUIT_OPTS,
  nearestEdge, hvRoute, hvSiteRoute, parallelOffset, specFromRun,
} from '../calc/annotation-geo.js';
import { McatBtn, MarkerIcon, LineLabel, BreakSymbol, labelDims, resolveOverlaps } from './AnnotationParts.jsx';

// AnnotationOverlay — shared annotation system for photos and SVG diagrams
//
// Props:
//   mk, ln         — marker + line arrays
//   updAn          — (fn) => apply fn({mk, ln}) to update data
//   getSvgPt       — (event) => {x, y} in annotation coords
//   containerRef   — ref to bounding element (img or svg)
//   containerSize  — {w, h} in annotation coordinate units
//   siteSpecs      — for site run import (optional)
//   SITE_RUNS      — [{key, label, spec}] (optional)
//   renderMode     — "absolute" (photo) | "inline" (diagram SVG)

export default function AnnotationOverlay({
  mk, ln, updAn, getSvgPt, containerRef, containerSize,
  siteSpecs, SITE_RUNS, renderMode,
  modGroups, layPos, md,
}) {
  const [mode, setMode] = useState(MODE.SELECT);
  const [selCat, setSelCat] = useState("inverter");
  const [selSiteRun, setSelSiteRun] = useState("dcRun");
  const [drag, setDrag] = useState(null);
  const [lineStart, setLineStart] = useState(null);
  const [selMk, setSelMk] = useState(null);
  const [selLn, setSelLn] = useState(null);

  const markers = mk || [];
  const lines = ln || [];
  const normalLines = lines.filter(l => !l.site);
  const siteLines = lines.filter(l => l.site);

  // ── Place marker ──
  const handlePlaceClick = useCallback(e => {
    if (mode !== MODE.PLACE) return;
    const pt = getSvgPt(e);
    updAn(d => ({ ...d, mk: [...d.mk, { id: Date.now(), x: pt.x, y: pt.y, lb: MCATS.find(c => c.id === selCat)?.lb || "Component", dt: "", ct: selCat, w: DEF_W, h: DEF_H }] }));
  }, [mode, selCat, getSvgPt, updAn]);

  // ── Marker click (line/site mode) ──
  const handleMarkerClick = useCallback(mkId => {
    if (mode === MODE.SITE) {
      const m = markers.find(m => m.id === mkId);
      if (!m || !containerSize) return;
      const w = containerSize.w, h = containerSize.h;
      const dists = [{ ex: 0, ey: m.y }, { ex: w, ey: m.y }, { ex: m.x, ey: 0 }, { ex: m.x, ey: h }];
      const nearest = dists.reduce((best, d) => { const dist = Math.hypot(d.ex - m.x, d.ey - m.y); return dist < best.dist ? { ...d, dist } : best; }, { ...dists[0], dist: Infinity });
      const sr = SITE_RUNS?.find(r => r.key === selSiteRun);
      const spec = sr ? specFromRun(sr.spec) : {};
      const autoDir = (nearest.ex === 0 || nearest.ex === w) ? "h" : "v";
      updAn(d => ({ ...d, ln: [...(d.ln || []), { id: Date.now(), from: mkId, to: null, site: selSiteRun, label: sr?.label || "", ex: nearest.ex, ey: nearest.ey, dir: autoDir, bendR: DEF_BEND, ...spec }] }));
      return;
    }
    if (mode !== MODE.LINE) return;
    if (!lineStart) { setLineStart(mkId); }
    else if (lineStart !== mkId) {
      updAn(d => ({ ...d, ln: [...(d.ln || []), { id: Date.now(), from: lineStart, to: mkId, label: "", wire: "", wireType: "THWN-2", conduit: "¾\" EMT", qty: "3", dir: "h", bendR: DEF_BEND, co: null }] }));
      setLineStart(null);
    }
  }, [mode, lineStart, updAn, markers, selSiteRun, SITE_RUNS, containerSize]);

  // ── Drag: move marker, resize marker, or drag conduit corner ──
  const handleDragStart = useCallback((e, mkId) => {
    if (mode === MODE.LINE || mode === MODE.SITE) { handleMarkerClick(mkId); return; }
    if (mode !== MODE.SELECT) return;
    e.preventDefault(); e.stopPropagation();
    setSelMk(mkId);
    const pt = getSvgPt(e), m = markers.find(m => m.id === mkId);
    if (!m) return;
    setDrag({ id: mkId, ox: pt.x - m.x, oy: pt.y - m.y, type: "move" });
  }, [mode, getSvgPt, markers, handleMarkerClick]);

  const handleResizeStart = useCallback((e, mkId, axis) => {
    e.preventDefault(); e.stopPropagation();
    const pt = getSvgPt(e), m = markers.find(m => m.id === mkId);
    if (!m) return;
    setDrag({ id: mkId, startW: m.w || DEF_W, startH: m.h || DEF_H, startX: pt.x, startY: pt.y, type: "resize", axis });
  }, [getSvgPt, markers]);

  const handleCornerDragStart = useCallback((e, lnId, axis) => {
    if (mode !== MODE.SELECT) return;
    e.preventDefault(); e.stopPropagation();
    setDrag({ id: lnId, type: "corner", axis });
  }, [mode]);

  const handleAnchorDragStart = useCallback((e, lnId, end, mkId) => {
    if (mode !== MODE.SELECT) return;
    e.preventDefault(); e.stopPropagation();
    setSelLn(lnId);
    setDrag({ id: lnId, type: "anchor", end, mkId });
  }, [mode]);

  const handleSiteEndDragStart = useCallback((e, lnId) => {
    if (mode !== MODE.SELECT) return;
    e.preventDefault(); e.stopPropagation();
    setSelLn(lnId);
    setDrag({ id: lnId, type: "siteEnd" });
  }, [mode]);

  const handleDragMove = useCallback(e => {
    if (!drag) return;
    e.preventDefault();
    const pt = getSvgPt(e);
    if (drag.type === "resize") {
      const dx = pt.x - drag.startX, dy = pt.y - drag.startY;
      const clamp = v => Math.round(Math.max(20, Math.min(160, v)));
      if (drag.axis === "corner") {
        const ratio = drag.startH / drag.startW, newW = clamp(drag.startW + dx * 2);
        updAn(d => ({ ...d, mk: d.mk.map(m => m.id === drag.id ? { ...m, w: newW, h: clamp(newW * ratio) } : m) }));
      } else if (drag.axis === "width") {
        updAn(d => ({ ...d, mk: d.mk.map(m => m.id === drag.id ? { ...m, w: clamp(drag.startW + dx * 2) } : m) }));
      } else {
        updAn(d => ({ ...d, mk: d.mk.map(m => m.id === drag.id ? { ...m, h: clamp(drag.startH + dy * 2) } : m) }));
      }
    } else if (drag.type === "corner") {
      const val = drag.axis === "h" ? pt.x : pt.y;
      updAn(d => ({ ...d, ln: (d.ln || []).map(l => l.id === drag.id ? { ...l, co: Math.round(val) } : l) }));
    } else if (drag.type === "anchor") {
      const m = markers.find(m => m.id === drag.mkId);
      if (m) {
        const edge = nearestEdge(m, pt);
        const field = drag.end === "from" ? "fe" : "te";
        updAn(d => ({ ...d, ln: (d.ln || []).map(l => l.id === drag.id ? { ...l, [field]: edge, co: null } : l) }));
      }
    } else if (drag.type === "siteEnd") {
      if (containerSize) {
        const w = containerSize.w, h = containerSize.h;
        const edges = [
          { ex: 0, ey: Math.max(0, Math.min(h, pt.y)) },
          { ex: w, ey: Math.max(0, Math.min(h, pt.y)) },
          { ex: Math.max(0, Math.min(w, pt.x)), ey: 0 },
          { ex: Math.max(0, Math.min(w, pt.x)), ey: h },
        ];
        const nearest = edges.reduce((best, e) => {
          const dist = Math.hypot(e.ex - pt.x, e.ey - pt.y);
          return dist < best.dist ? { ...e, dist } : best;
        }, { ...edges[0], dist: Infinity });
        updAn(d => ({ ...d, ln: (d.ln || []).map(l => l.id === drag.id ? { ...l, ex: nearest.ex, ey: nearest.ey, fe: null } : l) }));
      }
    } else {
      updAn(d => ({ ...d, mk: d.mk.map(m => m.id === drag.id ? { ...m, x: pt.x - drag.ox, y: pt.y - drag.oy } : m) }));
    }
  }, [drag, getSvgPt, updAn, markers, containerSize]);

  const handleDragEnd = useCallback(() => setDrag(null), []);

  const deleteMk = useCallback(mkId => updAn(d => ({ ...d, mk: d.mk.filter(m => m.id !== mkId), ln: (d.ln || []).filter(l => l.from !== mkId && l.to !== mkId) })), [updAn]);
  const deleteLn = useCallback(lnId => updAn(d => ({ ...d, ln: (d.ln || []).filter(l => l.id !== lnId) })), [updAn]);
  const updLn = useCallback((lnId, field, val) => updAn(d => ({ ...d, ln: (d.ln || []).map(l => l.id === lnId ? { ...l, [field]: val } : l) })), [updAn]);

  const mbtn = m => ({
    padding: "5px 10px", borderRadius: 5, fontSize: 11, fontFamily: ff, fontWeight: 600, cursor: "pointer",
    border: mode === m ? `2px solid ${ac}` : `1px solid ${bd}`, background: mode === m ? ac : "transparent", color: mode === m ? "#fff" : tx,
  });
  const sSel = { ...inp, fontSize: 10, padding: "4px 6px" };

  // ── Pre-compute routes ──
  const routeMap = new Map();
  normalLines.forEach(ln => {
    const a = markers.find(m => m.id === ln.from), b = markers.find(m => m.id === ln.to);
    if (!a || !b) return;
    routeMap.set(ln.id, hvRoute(a, b, ln, parallelOffset(ln, lines)));
  });
  siteLines.forEach(ln => {
    const a = markers.find(m => m.id === ln.from);
    if (!a) return;
    routeMap.set(ln.id, hvSiteRoute(a, { x: ln.ex, y: ln.ey }, ln, parallelOffset(ln, lines)));
  });

  // ── Resolve label overlaps ──
  const lblArr = [];
  routeMap.forEach((route, lnId) => {
    const ln = lines.find(l => l.id === lnId);
    if (!ln) return;
    const { w, h } = labelDims(ln);
    lblArr.push({ id: lnId, x: route.mid.x, y: route.mid.y, w, h });
  });
  const labelPos = resolveOverlaps(lblArr);

  // ═══ SVG Layers ═══
  const svgContent = (
    <>
      {/* ── Layer 1: Conduit run paths + labels ── */}
      {[...normalLines].sort((a, b) => (a.id === selLn ? 1 : 0) - (b.id === selLn ? 1 : 0)).map(ln => {
        const route = routeMap.get(ln.id);
        if (!route) return null;
        const pos = labelPos.get(ln.id) || route.mid;
        const isSel = selLn === ln.id;
        return (
          <g key={ln.id}>
            {mode === MODE.SELECT && (
              <path d={route.d} fill="none" stroke="transparent" strokeWidth={14}
                style={{ pointerEvents: "all", cursor: "move" }}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSelLn(ln.id);
                  setDrag({ id: ln.id, type: "corner", axis: route.exitH ? "h" : "v" }); }}
                onTouchStart={e => { e.preventDefault(); e.stopPropagation(); setSelLn(ln.id);
                  setDrag({ id: ln.id, type: "corner", axis: route.exitH ? "h" : "v" }); }} />
            )}
            <path d={route.d} fill="none" stroke={isSel ? "#0891b2" : "#06b6d4"} strokeWidth={isSel ? 4 : 3} strokeDasharray="10 5" strokeLinecap="round" opacity={isSel ? 1 : 0.9} />
            <LineLabel x={pos.x} y={pos.y} ln={ln} />
          </g>);
      })}
      {siteLines.map(ln => {
        const route = routeMap.get(ln.id);
        if (!route) return null;
        const pos = labelPos.get(ln.id) || route.mid;
        const isSel = selLn === ln.id;
        return (
          <g key={ln.id}>
            {mode === MODE.SELECT && (
              <path d={route.d} fill="none" stroke="transparent" strokeWidth={14}
                style={{ pointerEvents: "all", cursor: "pointer" }}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSelLn(ln.id); }} />
            )}
            <path d={route.d} fill="none" stroke={isSel ? "#0891b2" : "#06b6d4"} strokeWidth={isSel ? 4 : 3} strokeDasharray="10 5" strokeLinecap="round" opacity={isSel ? 1 : 0.9} />
            <BreakSymbol x={route.endPt.x} y={route.endPt.y} angle={route.angle} />
            <LineLabel x={pos.x} y={pos.y} ln={ln} />
          </g>);
      })}
      {/* ── Layer 2: Markers ── */}
      {markers.map((mk, i) => {
        const mcat = MCATS.find(c => c.id === mk.ct) || MCATS[MCATS.length - 1];
        const isLineHL = (mode === MODE.LINE || mode === MODE.SITE) && lineStart === mk.id;
        const isSel = mode === MODE.SELECT && selMk === mk.id;
        const hlR = Math.max(mk.w || DEF_W, mk.h || DEF_H) / 2 + 6;
        return (
          <g key={mk.id} style={{ pointerEvents: "all" }}>
            {isLineHL && <circle cx={mk.x} cy={mk.y} r={hlR} fill="none" stroke={ac} strokeWidth={2.5} strokeDasharray="4 3" />}
            <MarkerIcon mk={mk} idx={i} mcat={mcat} selected={isSel}
              onDown={e => handleDragStart(e, mk.id)}
              onResize={(e, axis) => handleResizeStart(e, mk.id, axis)}
              modGroups={modGroups} layPos={layPos} md={md} />
          </g>);
      })}
      {/* ── Layer 3: Conduit run handles ── */}
      {mode === MODE.SELECT && [...normalLines].sort((a, b) => (a.id === selLn ? 1 : 0) - (b.id === selLn ? 1 : 0)).map(ln => {
        const route = routeMap.get(ln.id);
        if (!route) return null;
        const isSel = selLn === ln.id;
        const cornerAxis = route.exitH ? "h" : "v";
        return (
          <g key={"h_" + ln.id}>
            {route.dragPt && (
              <circle cx={route.dragPt.x} cy={route.dragPt.y} r={isSel ? 7 : 5}
                fill={isSel ? "#0891b2" : "#06b6d4"} stroke="#fff" strokeWidth={isSel ? 2 : 1.5}
                style={{ pointerEvents: "all", cursor: cornerAxis === "h" ? "ew-resize" : "ns-resize" }}
                onMouseDown={e => { setSelLn(ln.id); handleCornerDragStart(e, ln.id, cornerAxis); }}
                onTouchStart={e => { setSelLn(ln.id); handleCornerDragStart(e, ln.id, cornerAxis); }} />
            )}
            <rect x={route.p1.x - 5} y={route.p1.y - 5} width={10} height={10} rx={2}
              fill={isSel ? "#fff" : "#06b6d4"} stroke={isSel ? "#0891b2" : "#fff"} strokeWidth={2}
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onMouseDown={e => handleAnchorDragStart(e, ln.id, "from", ln.from)}
              onTouchStart={e => handleAnchorDragStart(e, ln.id, "from", ln.from)} />
            <rect x={route.p2.x - 5} y={route.p2.y - 5} width={10} height={10} rx={2}
              fill={isSel ? "#fff" : "#06b6d4"} stroke={isSel ? "#0891b2" : "#fff"} strokeWidth={2}
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onMouseDown={e => handleAnchorDragStart(e, ln.id, "to", ln.to)}
              onTouchStart={e => handleAnchorDragStart(e, ln.id, "to", ln.to)} />
          </g>);
      })}
      {mode === MODE.SELECT && siteLines.map(ln => {
        const route = routeMap.get(ln.id);
        if (!route) return null;
        const isSel = selLn === ln.id;
        return (
          <g key={"h_" + ln.id}>
            <rect x={route.p1.x - 5} y={route.p1.y - 5} width={10} height={10} rx={2}
              fill={isSel ? "#fff" : "#06b6d4"} stroke={isSel ? "#0891b2" : "#fff"} strokeWidth={2}
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onMouseDown={e => handleAnchorDragStart(e, ln.id, "from", ln.from)}
              onTouchStart={e => handleAnchorDragStart(e, ln.id, "from", ln.from)} />
            <rect x={route.endPt.x - 5} y={route.endPt.y - 5} width={10} height={10} rx={2}
              fill={isSel ? "#fff" : "#06b6d4"} stroke={isSel ? "#0891b2" : "#fff"} strokeWidth={2}
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onMouseDown={e => handleSiteEndDragStart(e, ln.id)}
              onTouchStart={e => handleSiteEndDragStart(e, ln.id)} />
          </g>);
      })}
    </>
  );

  // ═══ Toolbar (HTML) ═══
  const toolbar = (
    <div style={{ ...cd, padding: 8, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button style={mbtn(MODE.SELECT)} onClick={() => { setMode(MODE.SELECT); setLineStart(null); setSelLn(null); }}>↕ Select</button>
        <button style={mbtn(MODE.PLACE)} onClick={() => { setMode(MODE.PLACE); setLineStart(null); setSelLn(null); }}>⊕ Place</button>
        <button style={mbtn(MODE.LINE)} onClick={() => { setMode(MODE.LINE); setLineStart(null); setSelLn(null); }}>╌ Conduit Run</button>
        {SITE_RUNS && SITE_RUNS.length > 0 && (
          <button style={mbtn(MODE.SITE)} onClick={() => { setMode(MODE.SITE); setLineStart(null); setSelLn(null); }}>⚡ Site Run</button>
        )}
        {mode === MODE.LINE && lineStart && <span style={{ fontSize: 10, fontFamily: ff, color: ac, marginLeft: 4 }}>Click second marker...</span>}
        {mode === MODE.PLACE && <span style={{ fontSize: 10, fontFamily: ff, color: td, marginLeft: 4 }}>Placing: {MCATS.find(c => c.id === selCat)?.lb}</span>}
        {mode === MODE.SITE && SITE_RUNS && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
            <select style={{ ...inp, fontSize: 10, padding: "4px 8px", width: "auto" }} value={selSiteRun} onChange={e => setSelSiteRun(e.target.value)}>
              {SITE_RUNS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
            <span style={{ fontSize: 10, fontFamily: ff, color: ac }}>→ click a marker</span>
          </div>)}
      </div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
        {MCATS.map(m => <McatBtn key={m.id} m={m} sel={mode === MODE.PLACE ? selCat : null} onClick={() => { setSelCat(m.id); setMode(MODE.PLACE); setLineStart(null); }} />)}
      </div>
    </div>
  );

  // ═══ Equipment List + Edit Panels (HTML) ═══
  const editPanels = (
    <>
      <div style={{ fontSize: 10, color: td, marginTop: 4, fontFamily: ff }}>
        {mode === MODE.SELECT && "Drag markers to move. Drag ◻ handles to change which edge a run connects to."}
        {mode === MODE.PLACE && "Click photo to place component."}
        {mode === MODE.LINE && "Click two markers to draw a conduit run."}
        {mode === MODE.SITE && "Click a marker to attach a site electrical run."}
        {" "}{markers.length} marker(s), {lines.length} run(s)
      </div>

      {markers.length > 0 && (
        <div style={{ ...cd, marginTop: 8, background: c2 }}>
          <div style={{ ...lb, marginBottom: 6 }}>Equipment</div>
          {markers.map((mk, i) => {
            const mcat = MCATS.find(c => c.id === mk.ct) || MCATS[MCATS.length - 1];
            return (
              <div key={mk.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, width: 52, flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={mcat.cl} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={mcat.svg} /></svg>
                  <span style={{ fontFamily: ff, fontSize: 10, color: ac }}>#{i + 1}</span>
                </div>
                <input style={{ ...inp, flex: 1, fontSize: 11 }} value={mk.lb} onChange={e => updAn(d => ({ ...d, mk: d.mk.map(m => m.id === mk.id ? { ...m, lb: e.target.value } : m) }))} />
                <select style={{ ...inp, width: 130, fontSize: 11 }} value={mk.ct} onChange={e => updAn(d => ({ ...d, mk: d.mk.map(m => m.id === mk.id ? { ...m, ct: e.target.value } : m) }))}>
                  {MCATS.map(c => <option key={c.id} value={c.id}>{c.ic} {c.lb}</option>)}</select>
                <input style={{ ...inp, flex: 2, fontSize: 11 }} value={mk.dt} onChange={e => updAn(d => ({ ...d, mk: d.mk.map(m => m.id === mk.id ? { ...m, dt: e.target.value } : m) }))} placeholder="Details..." />
                <button style={{ ...bt(false), color: rd, fontSize: 12, padding: "2px 6px" }} onClick={() => deleteMk(mk.id)}>✕</button>
              </div>);
          })}
        </div>)}

      {lines.length > 0 && (
        <div style={{ ...cd, marginTop: 8, background: c2 }}>
          <div style={{ ...lb, marginBottom: 6 }}>Conduit Runs</div>
          {lines.map((ln, li) => {
            const a = markers.find(m => m.id === ln.from), b = ln.to ? markers.find(m => m.id === ln.to) : null;
            const ai = markers.indexOf(a), bi = b ? markers.indexOf(b) : -1;
            const isSelRun = selLn === ln.id;
            const isSite = !!ln.site;
            const header = isSite
              ? <><span style={{ fontFamily: ff, fontSize: 11, color: isSelRun ? "#0891b2" : ac, fontWeight: 700 }}>⚡ {ln.label || ln.site}</span>
                  <span style={{ fontFamily: ff, fontSize: 11, color: tx }}>from #{ai + 1} {a?.lb || "?"} → off-frame</span></>
              : <><span style={{ fontFamily: ff, fontSize: 11, color: isSelRun ? "#0891b2" : "#06b6d4", fontWeight: 700 }}>Run {li + 1}</span>
                  <span style={{ fontFamily: ff, fontSize: 11, color: tx }}>#{ai + 1} {a?.lb || "?"} → #{bi + 1} {b?.lb || "?"}</span></>;
            return (
              <div key={ln.id} onClick={() => setSelLn(ln.id)} style={{ marginBottom: 10, padding: 8, background: c1, borderRadius: 6, border: `2px solid ${isSelRun ? "#0891b2" : bd}`, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {header}
                  <button style={{ ...bt(false), color: rd, fontSize: 11, padding: "1px 6px", marginLeft: "auto" }} onClick={() => deleteLn(ln.id)}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>LABEL</div>
                    <input style={{ ...sSel, width: 100 }} value={ln.label || ""} placeholder="e.g. DC Homerun" onChange={e => updLn(ln.id, "label", e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>LENGTH (ft)</div>
                    <input style={{ ...sSel, width: 60 }} type="number" min="0" value={ln.len || ""} placeholder="0"
                      onChange={e => updLn(ln.id, "len", +e.target.value || 0)} />
                  </div>
                  {!isSite && <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>ROUTE</div>
                    <button style={{ ...sSel, width: 36, cursor: "pointer", textAlign: "center", background: c2 }}
                      onClick={() => updLn(ln.id, "dir", (ln.dir || "h") === "h" ? "v" : "h")}>
                      {(ln.dir || "h") === "h" ? "H↱" : "V↳"}
                    </button>
                  </div>}
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>BEND R</div>
                    <input style={{ ...sSel, width: 40 }} type="number" min="0" max="50" value={ln.bendR ?? DEF_BEND}
                      onChange={e => updLn(ln.id, "bendR", +e.target.value || 0)} />
                  </div>
                  {!isSite && ln.co != null && <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>POS</div>
                    <button style={{ ...sSel, width: 42, cursor: "pointer", textAlign: "center", background: c2, color: "#06b6d4" }}
                      title="Reset to auto-position" onClick={() => updLn(ln.id, "co", null)}>Reset</button>
                  </div>}
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>WIRE AWG</div>
                    <select style={{ ...sSel, width: 72 }} value={ln.wire || ""} onChange={e => updLn(ln.id, "wire", e.target.value)}>
                      <option value="">—</option>{WIRE_OPTS.map(w => <option key={w} value={w}>{w}</option>)}</select>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>WIRE TYPE</div>
                    <select style={{ ...sSel, width: 90 }} value={ln.wireType || "THWN-2"} onChange={e => updLn(ln.id, "wireType", e.target.value)}>
                      {WIRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}># COND.</div>
                    <input style={{ ...sSel, width: 48 }} type="number" min="1" max="20" value={ln.qty || "3"} onChange={e => updLn(ln.id, "qty", e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: td, fontFamily: ff, marginBottom: 1 }}>CONDUIT</div>
                    <select style={{ ...sSel, width: 100 }} value={ln.conduit || "¾\" EMT"} onChange={e => updLn(ln.id, "conduit", e.target.value)}>
                      {CONDUIT_OPTS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
              </div>);
          })}
        </div>)}
    </>
  );

  // ═══ Render ═══
  const handleContainerClick = useCallback(e => {
    setSelMk(null); setSelLn(null); handlePlaceClick(e);
  }, [handlePlaceClick]);

  if (renderMode === "inline") {
    // Diagram SVG mode: return <g> for inside SVG + HTML toolbar/panels via portal-like pattern
    return {
      svgLayer: (
        <g onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
          onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
          {/* Invisible rect to capture clicks for placement */}
          <rect width={containerSize?.w || 0} height={containerSize?.h || 0} fill="transparent"
            style={{ cursor: mode === MODE.PLACE ? "crosshair" : "default" }}
            onClick={handleContainerClick} />
          {svgContent}
        </g>
      ),
      toolbar,
      editPanels,
      mode,
    };
  }

  // Absolute mode (photo): render SVG overlay + HTML toolbar/panels
  return {
    svgOverlay: (
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {svgContent}
      </svg>
    ),
    toolbar,
    editPanels,
    mode,
    handlers: { handleDragMove, handleDragEnd, handleContainerClick },
  };
}
