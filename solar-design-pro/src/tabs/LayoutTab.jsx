import { useState, useRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn, rd, bl, bt, cd, inp } from '../theme.js';
import { SC } from '../data/markers.js';
import { RAIL_OPTIONS, detectRows } from '../calc/racking.js';

const PITCHES = [["0","Flat"],["5","1:12"],["10","2:12"],["14","3:12"],["18","4:12"],["22","5:12"],["27","6:12"],["30","7:12"],["34","8:12"],["37","9:12"],["40","10:12"],["45","12:12"]];

// Racking overlay colors
const RC = { rail: "#d48c00", foot: "#16a34a", splice: "#ef4444", mid: "#3b82f6", end: "#8b5cf6" };

const compass = a => {
  const n = +a;
  if (n === 180) return "S";
  if (n === 0 || n === 360) return "N";
  if (n === 90) return "E";
  if (n === 270) return "W";
  if (n < 90) return "N" + Math.round(n) + "\u00b0E";
  if (n < 180) return "S" + Math.round(180 - n) + "\u00b0E";
  if (n < 270) return "S" + Math.round(n - 180) + "\u00b0W";
  return "N" + Math.round(360 - n) + "\u00b0W";
};

// ── Fractional inch formatter ──
function fracIn(dec) {
  const whole = Math.floor(dec);
  const rem = dec - whole;
  if (rem < 1/32) return `${whole}`;
  // Snap to nearest 1/16
  const sixteenths = Math.round(rem * 16);
  if (sixteenths === 0) return `${whole}`;
  if (sixteenths === 16) return `${whole + 1}`;
  // Simplify fraction
  let n = sixteenths, d = 16;
  while (n % 2 === 0) { n /= 2; d /= 2; }
  return whole > 0 ? `${whole}-${n}/${d}` : `${n}/${d}`;
}

// ── Architectural dimension annotation helpers ──
const DIM_STYLE = { stroke: "#000", strokeWidth: 0.4, fill: "none" };
const DIM_FONT = { fontFamily: "system-ui, sans-serif", fontSize: 9, fill: "#000", textAnchor: "middle" };
const TICK = 3, EXT = 4;

function hDim(x1, x2, y, label, above = false, fontFam) {
  const my = above ? y - EXT : y + EXT;
  const ty = above ? my - 3 : my + 8;
  const e1 = above ? [y, my - 1] : [y, my + 1];
  const e2 = e1;
  return (
    <g>
      <line x1={x1} y1={e1[0]} x2={x1} y2={e1[1]} {...DIM_STYLE} />
      <line x1={x2} y1={e2[0]} x2={x2} y2={e2[1]} {...DIM_STYLE} />
      <line x1={x1} y1={my} x2={x2} y2={my} {...DIM_STYLE} />
      <line x1={x1} y1={my - TICK} x2={x1} y2={my + TICK} {...DIM_STYLE} strokeWidth={0.6} />
      <line x1={x2} y1={my - TICK} x2={x2} y2={my + TICK} {...DIM_STYLE} strokeWidth={0.6} />
      <text x={(x1 + x2) / 2} y={ty} {...DIM_FONT} fontFamily={fontFam}>{label}</text>
    </g>
  );
}

function vDim(y1, y2, x, label, left = true, fontFam) {
  const mx = left ? x - EXT : x + EXT;
  const tx = left ? mx - 3 : mx + 10;
  const e1 = left ? [x, mx - 1] : [x, mx + 1];
  return (
    <g>
      <line x1={e1[0]} y1={y1} x2={e1[1]} y2={y1} {...DIM_STYLE} />
      <line x1={e1[0]} y1={y2} x2={e1[1]} y2={y2} {...DIM_STYLE} />
      <line x1={mx} y1={y1} x2={mx} y2={y2} {...DIM_STYLE} />
      <line x1={mx - TICK} y1={y1} x2={mx + TICK} y2={y1} {...DIM_STYLE} strokeWidth={0.6} />
      <line x1={mx - TICK} y1={y2} x2={mx + TICK} y2={y2} {...DIM_STYLE} strokeWidth={0.6} />
      <text x={tx} y={(y1 + y2) / 2} {...DIM_FONT} fontFamily={fontFam}
        transform={`rotate(-90, ${tx}, ${(y1 + y2) / 2})`}>{label}</text>
    </g>
  );
}

export default function LayoutTab({
  md, iv, pj, totalMods, totalKw, modGroups, roofType, applyRoofPreset,
  addGroup, updGroup, delGroup, layPos, layDrag, setLayDrag, laySel, setLaySel,
  autoFillFace, resetGroupLayout, removeSelMod, addModToFace, snapPos,
  updateModPos, faceScale, faceSz, SETBACK_FT, LAY_W,
  gapIn, setGapIn, strMap,
  rack, rackCfg, setRackCfg
}) {
  // Module dimensions in mm
  const lm = md?.lm || 1722, wm = md?.wm || 1134;

  // Zoom state per group
  const [zoom, setZoom] = useState({});
  const zFor = gid => zoom[gid] || 1;
  const setZ = (gid, v) => setZoom(p => ({ ...p, [gid]: Math.max(0.25, Math.min(4, v)) }));

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }} className="fi">
      {/* ═══ HEADER ═══ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>{"\u25eb"} Roof Layout Designer</h2>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: ff, fontSize: 11, color: gn }}>{totalMods} modules / {totalKw} kW</div>
      </div>

      {/* ═══ ROOF PRESETS ═══ */}
      <div style={{ ...cd, marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: ff, fontSize: 10, color: td, textTransform: "uppercase", letterSpacing: "0.08em" }}>Roof Type:</span>
        {[["gable", "\u2302"], ["hip", "\u2b20"], ["flat", "\u25ac"], ["shed", "\u27cb"], ["ground", "\u25a6"]].map(([k, ic]) =>
          <button key={k} onClick={() => applyRoofPreset(k)} style={{
            ...bt(roofType === k), fontSize: 12, padding: "5px 12px", minWidth: 60,
            display: "flex", alignItems: "center", gap: 4
          }}>
            <span style={{ fontSize: 14 }}>{ic}</span> {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={addGroup} style={{ ...bt(true), fontSize: 11, padding: "5px 12px" }}>+ Add Face</button>
      </div>

      {/* ═══ RACKING CONFIG ═══ */}
      {md && rackCfg && (
        <div style={{ ...cd, marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: ff, fontSize: 10, color: td, textTransform: "uppercase", letterSpacing: "0.08em" }}>Racking:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>Rail</span>
            <select style={{ ...inp, width: 90, fontSize: 11 }} value={rackCfg.rail}
              onChange={e => setRackCfg(p => ({ ...p, rail: e.target.value }))}>
              {RAIL_OPTIONS.map(r => <option key={r} value={r}>{r === "auto" ? "Auto" : r}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>Max Span (in)</span>
            <input type="number" style={{ ...inp, width: 56, fontSize: 11, textAlign: "center" }}
              value={rackCfg.span || ""} placeholder="Auto" min={24} max={96}
              onChange={e => setRackCfg(p => ({ ...p, span: +e.target.value || 0 }))} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>Module Gap (in)</span>
            <input type="number" style={{ ...inp, width: 56, fontSize: 11, textAlign: "center" }}
              value={gapIn} min={0} max={2} step={0.25}
              onChange={e => setGapIn(Math.max(0, Math.min(2, +e.target.value || 0)))} />
          </div>
          {rack && (
            <>
              <span style={{ fontFamily: ff, fontSize: 10, color: ac, fontWeight: 600 }}>{rack.railFamily}</span>
              <span style={{ fontFamily: ff, fontSize: 10, color: td }}>{rack.foot} / {rack.maxSpan}" span</span>
              {rack.isGround && <span style={{ fontFamily: ff, fontSize: 9, color: rd }}>Ground mount: post/beam system required separately</span>}
            </>
          )}
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {!md ? (
        <div style={{ ...cd, textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.4 }}>{"\u25eb"}</div>
          <div style={{ fontFamily: ff, color: td, fontSize: 13 }}>Select a module on the Project tab to begin layout</div>
        </div>
      ) : (
        <>
          {/* ═══ MODULE GROUPS / FACES ═══ */}
          {modGroups.map((g, gi) => {
            const isL = g.ori === "L";
            const mW = isL ? lm : wm;
            const mH = isL ? wm : lm;
            const mWft = +(mW / 304.8).toFixed(1);
            const mHft = +(mH / 304.8).toFixed(1);
            const sc = faceScale(g.fw);
            const sz = faceSz(g.ori, g.fw);
            const sbPx = SETBACK_FT * 12 * 25.4 * sc;
            const rawCanH = (+g.fd || 18) * 12 * 25.4 * sc;
            const canH = Math.max(120, rawCanH);
            const mods = (layPos[g.id] || []);
            const gridStep = Math.max(10, Math.round(sc * 304.8));
            const z = zFor(g.id);

            // Bounding box for array dimensions
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            mods.forEach(m => {
              if (m.x < minX) minX = m.x;
              if (m.x + sz.w > maxX) maxX = m.x + sz.w;
              if (m.y < minY) minY = m.y;
              if (m.y + sz.h > maxY) maxY = m.y + sz.h;
            });
            const arrWft = mods.length > 0 ? +((maxX - minX) / (sc * 304.8)).toFixed(1) : 0;
            const arrHft = mods.length > 0 ? +((maxY - minY) / (sc * 304.8)).toFixed(1) : 0;

            // Snap guides during drag
            const guides = [];
            if (layDrag && layDrag.gi === g.id) {
              const dm = mods.find(m => m.id === layDrag.id);
              if (dm) {
                const dEdges = { l: dm.x, r: dm.x + sz.w, t: dm.y, b: dm.y + sz.h, cx: dm.x + sz.w / 2, cy: dm.y + sz.h / 2 };
                mods.forEach(m => {
                  if (m.id === layDrag.id) return;
                  const oEdges = { l: m.x, r: m.x + sz.w, t: m.y, b: m.y + sz.h, cx: m.x + sz.w / 2, cy: m.y + sz.h / 2 };
                  // Vertical guides (x-aligned edges)
                  [["l", "l"], ["r", "r"], ["l", "r"], ["r", "l"], ["cx", "cx"]].forEach(([dk, ok]) => {
                    if (Math.abs(dEdges[dk] - oEdges[ok]) < 2) guides.push({ type: "v", x: oEdges[ok] });
                  });
                  // Horizontal guides (y-aligned edges)
                  [["t", "t"], ["b", "b"], ["t", "b"], ["b", "t"], ["cy", "cy"]].forEach(([dk, ok]) => {
                    if (Math.abs(dEdges[dk] - oEdges[ok]) < 2) guides.push({ type: "h", y: oEdges[ok] });
                  });
                });
              }
            }

            // ── Racking overlay geometry ──
            const rackOv = (() => {
              if (!rack || mods.length === 0) return null;
              const rows = detectRows(mods, sz);
              if (rows.length === 0) return null;
              const maxSpanPx = rack.maxSpan * sc * 25.4;
              const ovPx = Math.min(sz.w * 0.15, 4 * sc * 25.4);
              const pgData = rack.perGroup.find(p => p.gid === g.id);
              const o = { rails: [], feet: [], splices: [], mid: [], end: [] };
              rows.forEach((row, ri) => {
                const xs = [...row.mods].sort((a, b) => a.x - b.x);
                const x0 = Math.min(...xs.map(m => m.x));
                const x1 = Math.max(...xs.map(m => m.x)) + sz.w;
                const y0 = Math.min(...xs.map(m => m.y));
                const rsx = x0 - ovPx, rex = x1 + ovPx, rlen = rex - rsx;
                const ry1 = y0 + sz.h * 0.22, ry2 = y0 + sz.h * 0.78;
                // Rails
                o.rails.push({ x1: rsx, y1: ry1, x2: rex, y2: ry1 }, { x1: rsx, y1: ry2, x2: rex, y2: ry2 });
                // Feet
                [ry1, ry2].forEach(ry => {
                  const nf = Math.max(2, Math.floor(rlen / maxSpanPx) + 1);
                  const sp = rlen / Math.max(1, nf - 1);
                  for (let i = 0; i < nf; i++) o.feet.push({ x: rsx + i * sp, y: ry });
                });
                // Splices
                const pgRow = pgData?.rows?.[ri];
                if (pgRow && pgRow.splices > 0) {
                  let acc = 0;
                  for (let si = 0; si < pgRow.segments.length - 1; si++) {
                    acc += pgRow.segments[si].cutLen;
                    const sx = rsx + (acc / pgRow.widthIn) * rlen;
                    [ry1, ry2].forEach(ry => o.splices.push({ x: sx, y: ry }));
                  }
                }
                // Mid clamps (between adjacent modules)
                for (let i = 0; i < xs.length - 1; i++) {
                  const cx = (xs[i].x + sz.w + xs[i + 1].x) / 2;
                  [ry1, ry2].forEach(ry => o.mid.push({ x: cx, y: ry }));
                }
                // End clamps (outer edges)
                [ry1, ry2].forEach(ry => {
                  o.end.push({ x: x0 - ovPx * 0.3, y: ry }, { x: x1 + ovPx * 0.3, y: ry });
                });
              });
              return o;
            })();

            // ── Foot map data computation ──
            const footMap = (() => {
              if (!rack || mods.length === 0) return null;
              const rows = detectRows(mods, sz);
              if (rows.length === 0) return null;
              const maxSpanPx = rack.maxSpan * sc * 25.4;
              const ovPx = Math.min(sz.w * 0.15, 4 * sc * 25.4);
              const pxIn = px => +(px / (sc * 25.4)).toFixed(1);
              const allFeet = [];
              const rowData = [];
              let svgMinX = Infinity, svgMaxX = -Infinity, svgMinY = Infinity, svgMaxY = -Infinity;

              rows.forEach(row => {
                const xs = [...row.mods].sort((a, b) => a.x - b.x);
                const x0 = Math.min(...xs.map(m => m.x));
                const x1 = Math.max(...xs.map(m => m.x)) + sz.w;
                const y0 = Math.min(...xs.map(m => m.y));
                const rsx = x0 - ovPx, rex = x1 + ovPx, rlen = rex - rsx;
                const ry1 = y0 + sz.h * 0.22, ry2 = y0 + sz.h * 0.78;

                // Foot positions along each rail
                const nf = Math.max(2, Math.floor(rlen / maxSpanPx) + 1);
                const sp = rlen / Math.max(1, nf - 1);
                const cols = [];
                for (let i = 0; i < nf; i++) cols.push({ x: rsx + i * sp, ry1, ry2 });

                allFeet.push(...cols.flatMap(c => [{ x: c.x, y: c.ry1 }, { x: c.x, y: c.ry2 }]));

                // Module positions for ghost outlines
                const modRects = xs.map(m => ({ x: m.x, y: m.y, w: sz.w, h: sz.h }));

                // Dimensions in inches
                const ovIn = pxIn(ovPx);
                const spIn = nf > 1 ? pxIn(sp) : 0;
                const railGapIn = pxIn(ry2 - ry1);
                const topIn = pxIn(ry1 - y0);
                const botIn = pxIn((y0 + sz.h) - ry2);

                rowData.push({ cols, ry1, ry2, rsx, rex, modRects, y0, ovIn, spIn, railGapIn, topIn, botIn });

                // Update bounding box
                modRects.forEach(r => {
                  if (r.x < svgMinX) svgMinX = r.x;
                  if (r.x + r.w > svgMaxX) svgMaxX = r.x + r.w;
                  if (r.y < svgMinY) svgMinY = r.y;
                  if (r.y + r.h > svgMaxY) svgMaxY = r.y + r.h;
                });
                if (rsx < svgMinX) svgMinX = rsx;
                if (rex > svgMaxX) svgMaxX = rex;
              });

              // Cumulative corner-referenced dimensions
              const arrayTopY = svgMinY;
              const arrayBotY = svgMaxY;
              const arrayLeftX = svgMinX;
              const arrayRightX = svgMaxX;
              const totalWidthIn = pxIn(arrayRightX - arrayLeftX);
              const totalHeightIn = pxIn(arrayBotY - arrayTopY);

              // Per-row cumulative Y from array top edge
              rowData.forEach(row => {
                row.cumRy1 = pxIn(row.ry1 - arrayTopY);
                row.cumRy2 = pxIn(row.ry2 - arrayTopY);
              });

              const pad = 30;
              const padL = 26; // extra left padding for left-side vertical dims
              const padR = 20 + Math.max(1, rowData.length) * 28 + 30; // right padding: staggered vertical dims per row + total height dim
              const padB = 50; // bottom padding for span chain + cumulative horiz dims
              return {
                rows: rowData,
                feet: allFeet,
                pxIn,
                totalWidthIn,
                totalHeightIn,
                arrayTopY,
                arrayBotY,
                arrayLeftX,
                arrayRightX,
                vb: {
                  x: svgMinX - pad - padL,
                  y: svgMinY - pad,
                  w: (svgMaxX - svgMinX) + pad + padL + padR,
                  h: (svgMaxY - svgMinY) + pad + padB
                }
              };
            })();

            return (
              <div key={g.id} style={{ ...cd, marginBottom: 14 }}>
                {/* ──── Face Config Header ──── */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <input style={{ ...inp, width: 140, fontSize: 12, fontWeight: 600 }} value={g.nm || ""} placeholder="Face name..."
                    onChange={e => updGroup(g.id, "nm", e.target.value)} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>AZ</span>
                    <input type="number" style={{ ...inp, width: 60, fontSize: 11, textAlign: "center" }} value={g.az ?? ""} min={0} max={360}
                      onChange={e => updGroup(g.id, "az", e.target.value)} />
                    <span style={{ fontFamily: ff, fontSize: 10, color: ac, fontWeight: 600, minWidth: 24 }}>{compass(g.az || 0)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>PITCH</span>
                    <select style={{ ...inp, width: 80, fontSize: 11 }} value={g.pt || "0"}
                      onChange={e => updGroup(g.id, "pt", e.target.value)}>
                      {PITCHES.map(([v, l]) => <option key={v} value={v}>{v}° ({l})</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>ORI</span>
                    <select style={{ ...inp, width: 80, fontSize: 11 }} value={g.ori || "P"}
                      onChange={e => updGroup(g.id, "ori", e.target.value)}>
                      <option value="P">Portrait</option>
                      <option value="L">Landscape</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>W(ft)</span>
                    <input type="number" style={{ ...inp, width: 56, fontSize: 11, textAlign: "center" }} value={g.fw ?? ""} min={4} max={100}
                      onChange={e => updGroup(g.id, "fw", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase" }}>D(ft)</span>
                    <input type="number" style={{ ...inp, width: 56, fontSize: 11, textAlign: "center" }} value={g.fd ?? ""} min={4} max={60}
                      onChange={e => updGroup(g.id, "fd", e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: ff, fontSize: 11, color: ac, fontWeight: 700 }}>
                    {mods.length} mod{mods.length !== 1 ? "s" : ""} / {(mods.length * (md?.w || 0) / 1000).toFixed(1)} kW
                  </span>
                  <button onClick={() => delGroup(g.id)} style={{ ...bt(false), color: rd, fontSize: 11, padding: "4px 8px" }} title="Delete face">{"\u2715"}</button>
                </div>

                {/* ──── Toolbar ──── */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button style={{ ...bt(false), fontSize: 10, padding: "4px 10px" }} onClick={() => autoFillFace(g.id)}>Auto-Fill</button>
                  <button style={{ ...bt(false), fontSize: 10, padding: "4px 10px" }} onClick={() => resetGroupLayout(g.id)}>Reset Positions</button>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button style={{ ...bt(false), fontSize: 12, padding: "3px 8px", fontWeight: 700 }} onClick={() => setZ(g.id, z - 0.25)}>−</button>
                    <span style={{ fontFamily: ff, fontSize: 10, color: td, minWidth: 40, textAlign: "center" }}>{Math.round(z * 100)}%</span>
                    <button style={{ ...bt(false), fontSize: 12, padding: "3px 8px", fontWeight: 700 }} onClick={() => setZ(g.id, z + 0.25)}>+</button>
                    <button style={{ ...bt(false), fontSize: 10, padding: "3px 8px" }} onClick={() => setZ(g.id, 1)}>Fit</button>
                  </div>
                </div>

                {/* ──── Scrollable Canvas Container ──── */}
                <div style={{
                  maxHeight: 520, overflow: "auto", borderRadius: 6, border: `1px solid ${bd}`
                }}>
                  {/* Spacer div sized to scaled canvas so scrollbars work */}
                  <div style={{ width: LAY_W * z, height: canH * z }}>
                    {/* ──── Interactive Canvas ──── */}
                    <div style={{
                      position: "relative", width: LAY_W, height: canH, background: "#ffffff",
                      transform: `scale(${z})`, transformOrigin: "0 0",
                      cursor: "default", userSelect: "none"
                    }}
                      onMouseMove={e => {
                        if (!layDrag || layDrag.gi !== g.id) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const rawX = (e.clientX - rect.left) / z - layDrag.ox;
                        const rawY = (e.clientY - rect.top) / z - layDrag.oy;
                        const snapped = snapPos(g.id, layDrag.id, rawX, rawY, g.ori, g.fw);
                        updateModPos(g.id, layDrag.id, snapped.x, snapped.y);
                      }}
                      onMouseUp={() => setLayDrag(null)}
                      onMouseLeave={() => setLayDrag(null)}
                      onClick={e => {
                        if (layDrag) return;
                        if (e.target.dataset?.mod) return;
                        setLaySel(null);
                      }}
                    >
                      {/* SVG Grid Overlay */}
                      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        <defs>
                          <pattern id={`grid-${g.id}`} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
                            <path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${g.id})`} />

                        {/* Setback lines */}
                        {sbPx > 0 && <>
                          <rect x={sbPx} y={sbPx} width={Math.max(0, LAY_W - 2 * sbPx)} height={Math.max(0, canH - 2 * sbPx)}
                            fill="none" stroke="rgba(220,38,38,0.4)" strokeWidth="1" strokeDasharray="6 3" />
                          <text x={sbPx + 4} y={sbPx - 4} fill="rgba(220,38,38,0.6)" fontSize="8" fontFamily={ff}>
                            {SETBACK_FT}ft setback
                          </text>
                        </>}

                        {/* Compass indicator */}
                        <g transform={`translate(${LAY_W - 30}, 28)`}>
                          <circle r="14" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                          <line x1="0" y1="6" x2="0" y2="-10" stroke="rgba(220,38,38,0.8)" strokeWidth="1.5" />
                          <text x="0" y="-12" textAnchor="middle" fill="rgba(220,38,38,0.8)" fontSize="7" fontFamily={ff} fontWeight="700">N</text>
                          <text x="0" y="14" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="6" fontFamily={ff}>
                            {compass(g.az || 0)}
                          </text>
                        </g>

                        {/* Dimension labels */}
                        <text x={LAY_W / 2} y={canH - 4} textAnchor="middle" fill="rgba(0,0,0,0.25)" fontSize="9" fontFamily={ff}>
                          {g.fw || "—"}ft
                        </text>
                        <text x={6} y={canH / 2} fill="rgba(0,0,0,0.25)" fontSize="9" fontFamily={ff}
                          transform={`rotate(-90, 6, ${canH / 2})`} textAnchor="middle">
                          {g.fd || "—"}ft
                        </text>

                        {/* Snap guide lines during drag */}
                        {guides.map((gl, i) =>
                          gl.type === "v"
                            ? <line key={`g${i}`} x1={gl.x} y1={0} x2={gl.x} y2={canH} stroke="rgba(212,140,0,0.5)" strokeWidth="0.5" strokeDasharray="3 2" />
                            : <line key={`g${i}`} x1={0} y1={gl.y} x2={LAY_W} y2={gl.y} stroke="rgba(212,140,0,0.5)" strokeWidth="0.5" strokeDasharray="3 2" />
                        )}

                        {/* ── Racking Overlay ── */}
                        {rackOv && <>
                          {/* Rails */}
                          {rackOv.rails.map((r, i) => (
                            <line key={`rl${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                              stroke={RC.rail} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                          ))}
                          {/* Feet (FlashFoot2 / L-Foot) */}
                          {rackOv.feet.map((f, i) => (
                            <g key={`ft${i}`}>
                              <circle cx={f.x} cy={f.y} r="4" fill={RC.foot} opacity="0.85" />
                              <circle cx={f.x} cy={f.y} r="4" fill="none" stroke="#fff" strokeWidth="0.5" />
                            </g>
                          ))}
                          {/* Splices */}
                          {rackOv.splices.map((s, i) => (
                            <g key={`sp${i}`}>
                              <rect x={s.x - 5} y={s.y - 4} width="10" height="8" rx="1.5"
                                fill={RC.splice} opacity="0.85" />
                              <line x1={s.x - 2} y1={s.y} x2={s.x + 2} y2={s.y}
                                stroke="#fff" strokeWidth="1" />
                            </g>
                          ))}
                          {/* Mid Clamps */}
                          {rackOv.mid.map((c, i) => (
                            <line key={`mc${i}`} x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y + 4}
                              stroke={RC.mid} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                          ))}
                          {/* End Clamps */}
                          {rackOv.end.map((c, i) => (
                            <line key={`ec${i}`} x1={c.x} y1={c.y - 5} x2={c.x} y2={c.y + 5}
                              stroke={RC.end} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                          ))}
                        </>}
                      </svg>

                      {/* Rendered Modules */}
                      {mods.map((m, mi) => {
                        const isSel = laySel && laySel.gi === g.id && laySel.id === m.id;
                        const bigEnough = sz.w > 18 && sz.h > 14;
                        const sn = strMap?.[g.id]?.[mi];
                        const hasStr = sn != null;
                        const sc2 = hasStr ? SC[sn % SC.length] : null;
                        return (
                          <div key={m.id}
                            data-mod="1"
                            style={{
                              position: "absolute",
                              left: m.x,
                              top: m.y,
                              width: sz.w,
                              height: sz.h,
                              background: isSel ? "rgba(212,140,0,0.85)" : hasStr ? sc2 + "30" : "rgba(30,58,95,0.18)",
                              border: isSel ? `2px solid ${ac}` : hasStr ? `1px solid ${sc2}70` : "1px solid rgba(30,58,95,0.35)",
                              borderRadius: 2,
                              cursor: "grab",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: bigEnough ? 8 : 6,
                              fontFamily: ff,
                              color: isSel ? "#000" : "rgba(0,0,0,0.6)",
                              fontWeight: 600,
                              boxSizing: "border-box",
                              zIndex: isSel ? 10 : 1
                            }}
                            onMouseDown={e => {
                              e.stopPropagation();
                              setLaySel({ gi: g.id, id: m.id });
                              const modRect = e.currentTarget.getBoundingClientRect();
                              setLayDrag({
                                gi: g.id,
                                id: m.id,
                                ox: (e.clientX - modRect.left) / z,
                                oy: (e.clientY - modRect.top) / z
                              });
                            }}
                          >
                            {bigEnough && (hasStr ? `S${sn + 1}` : mi + 1)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ──── Footer: Module/Array Dimensions ──── */}
                <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontFamily: ff, fontSize: 9, color: td }}>
                  <span>Module: {mWft}' x {mHft}' ({isL ? "Landscape" : "Portrait"})</span>
                  {mods.length > 0 && <span>Array: {arrWft}' x {arrHft}'</span>}
                  <span>Scale: 1ft = {gridStep}px</span>
                  <span>{mods.length} of {mods.length} placed</span>
                </div>

                {/* ──── Racking Legend ──── */}
                {rackOv && (
                  <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                    {[["Rail", RC.rail, "━"], ["Foot", RC.foot, "\u25cf"], ["Splice", RC.splice, "\u25a0"], ["Mid Clamp", RC.mid, "\u2502"], ["End Clamp", RC.end, "\u2503"]].map(([l, c, ic]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ color: c, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{ic}</span>
                        <span style={{ fontFamily: ff, fontSize: 8, color: td }}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ──── String Legend ──── */}
                {strMap?.[g.id]?.length > 0 && (() => {
                  const strs = [...new Set(strMap[g.id])];
                  return (
                    <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: ff, fontSize: 9, color: td, textTransform: "uppercase", letterSpacing: "0.06em" }}>Strings:</span>
                      {strs.map(s => (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: SC[s % SC.length] }} />
                          <span style={{ fontFamily: ff, fontSize: 9, color: tx, fontWeight: 600 }}>S{s + 1}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ──── Per-Group Racking Summary ──── */}
                {rack && (() => {
                  const pg = rack.perGroup.find(p => p.gid === g.id);
                  if (!pg || pg.rows.length === 0) return null;
                  return (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${bd}`, paddingTop: 8 }}>
                      <div style={{ fontFamily: ff, fontSize: 10, color: ac, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                        Racking — {pg.modCount} modules, {pg.rows.length} row{pg.rows.length !== 1 ? "s" : ""}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, fontSize: 10 }}>
                        <thead>
                          <tr style={{ color: td, textTransform: "uppercase", fontSize: 8, letterSpacing: "0.05em" }}>
                            <th style={{ textAlign: "left", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Row</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Mods</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Width</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Rails</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Splices</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Feet</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>Mid</th>
                            <th style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>End</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pg.rows.map((row, ri) => (
                            <tr key={ri} style={{ color: tx }}>
                              <td style={{ padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>R{ri + 1}</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.count}</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.widthIn}"</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>
                                {row.rails} ({row.segments.map(s => s.stock.len + '"').join("+")})
                              </td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.splices || "—"}</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.feet}</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.midClamps}</td>
                              <td style={{ textAlign: "center", padding: "2px 6px", borderBottom: `1px solid ${bd}` }}>{row.endClamps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {/* ──── Foot Center Locations Map ──── */}
                {footMap && (() => {
                  const fm = footMap;
                  const r0 = fm.rows[0];
                  const svgId = `foot-map-${g.id}`;
                  const printFootMap = () => {
                    const svgEl = document.getElementById(svgId);
                    if (!svgEl) return;
                    const w = window.open('', '_blank');
                    w.document.write(`<!DOCTYPE html><html><head><title>Foot Centers — ${g.nm || 'Face'}</title>
                      <style>body{margin:20px;text-align:center}svg{max-width:100%;height:auto}
                      h2{font-family:system-ui;font-size:16px;margin-bottom:12px}</style></head>
                      <body><h2>FOOT CENTER LOCATIONS — ${g.nm || 'Face'}</h2>${svgEl.outerHTML}</body></html>`);
                    w.document.close();
                    setTimeout(() => w.print(), 300);
                  };

                  return (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${bd}`, paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: ff, fontSize: 10, color: ac, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Foot Center Locations{g.nm ? ` — ${g.nm}` : ""}
                        </span>
                        <div style={{ flex: 1 }} />
                        <button onClick={printFootMap} style={{ ...bt(false), fontSize: 9, padding: "3px 8px" }}>Print</button>
                      </div>

                      <svg id={svgId} viewBox={`${fm.vb.x} ${fm.vb.y} ${fm.vb.w} ${fm.vb.h}`}
                        style={{ width: "100%", maxHeight: 400, background: "#fff", borderRadius: 4, border: `1px solid ${bd}` }}>
                        {/* Ghost module outlines */}
                        {fm.rows.map((row, ri) =>
                          row.modRects.map((r, mi) => (
                            <rect key={`gm${ri}-${mi}`} x={r.x} y={r.y} width={r.w} height={r.h}
                              fill="none" stroke="#ccc" strokeWidth={0.5} strokeDasharray="4 2" />
                          ))
                        )}

                        {/* Thin rail reference lines */}
                        {fm.rows.map((row, ri) => (
                          <g key={`rl${ri}`}>
                            <line x1={row.rsx} y1={row.ry1} x2={row.rex} y2={row.ry1}
                              stroke="#bbb" strokeWidth={0.3} />
                            <line x1={row.rsx} y1={row.ry2} x2={row.rex} y2={row.ry2}
                              stroke="#bbb" strokeWidth={0.3} />
                          </g>
                        ))}

                        {/* Foot centers with crosshairs */}
                        {fm.feet.map((f, i) => (
                          <g key={`f${i}`}>
                            <circle cx={f.x} cy={f.y} r={5} fill="#000" />
                            <line x1={f.x - 8} y1={f.y} x2={f.x + 8} y2={f.y} stroke="#000" strokeWidth={0.4} />
                            <line x1={f.x} y1={f.y - 8} x2={f.x} y2={f.y + 8} stroke="#000" strokeWidth={0.4} />
                          </g>
                        ))}

                        {/* Horizontal dimension chain below first row */}
                        {r0 && r0.cols.length >= 2 && (() => {
                          const dimY = r0.modRects[r0.modRects.length - 1].y + r0.modRects[0].h + 6;
                          const elems = [];
                          // Left overhang
                          elems.push(hDim(r0.modRects[0].x, r0.cols[0].x, dimY, `${fracIn(r0.ovIn)}"`, false, ff));
                          // Spans between feet
                          for (let i = 0; i < r0.cols.length - 1; i++) {
                            elems.push(hDim(r0.cols[i].x, r0.cols[i + 1].x, dimY, `${fracIn(r0.spIn)}"`, false, ff));
                          }
                          // Right overhang
                          const lastMod = r0.modRects[r0.modRects.length - 1];
                          elems.push(hDim(r0.cols[r0.cols.length - 1].x, lastMod.x + lastMod.w, dimY, `${fracIn(r0.ovIn)}"`, false, ff));
                          return elems;
                        })()}

                        {/* Vertical dimensions left of first row */}
                        {r0 && (() => {
                          const dimX = r0.modRects[0].x - 6;
                          return (
                            <g>
                              {vDim(r0.y0, r0.ry1, dimX, `${fracIn(r0.topIn)}"`, true, ff)}
                              {vDim(r0.ry1, r0.ry2, dimX - 14, `${fracIn(r0.railGapIn)}"`, true, ff)}
                              {vDim(r0.ry2, r0.y0 + r0.modRects[0].h, dimX, `${fracIn(r0.botIn)}"`, true, ff)}
                            </g>
                          );
                        })()}

                        {/* Right-side vertical dimensions — corner-referenced cumulative */}
                        {fm.rows.length > 0 && (() => {
                          // Find the rightmost module edge across ALL rows
                          let maxRight = 0;
                          fm.rows.forEach(row => {
                            row.modRects.forEach(r => {
                              if (r.x + r.w > maxRight) maxRight = r.x + r.w;
                            });
                          });
                          const dimX = maxRight + 6;
                          const topY = fm.arrayTopY;
                          const elems = [];

                          // Cumulative Y dims: from array top to each row's foot positions
                          // Stagger columns by row to avoid overlap
                          fm.rows.forEach((row, ri) => {
                            const xOff = dimX + ri * 28;
                            // Top rail
                            elems.push(vDim(topY, row.ry1, xOff, `Y: ${fracIn(row.cumRy1)}"`, false, ff));
                            // Bottom rail
                            elems.push(vDim(topY, row.ry2, xOff + 14, `Y: ${fracIn(row.cumRy2)}"`, false, ff));
                          });

                          // Overall array height (outermost right)
                          const outerX = dimX + fm.rows.length * 28;
                          elems.push(vDim(fm.arrayTopY, fm.arrayBotY, outerX, `${fracIn(fm.totalHeightIn)}"`, false, ff));
                          return elems;
                        })()}

                        {/* Cumulative horizontal dimensions below the span chain */}
                        {r0 && r0.cols.length >= 2 && (() => {
                          const lastRow = fm.rows[fm.rows.length - 1];
                          const lastModBot = (lastRow.modRects[0]?.y || 0) + (lastRow.modRects[0]?.h || 0);
                          const cumY = lastModBot + 20;
                          const elems = [];
                          // Overall width
                          elems.push(hDim(fm.arrayLeftX, fm.arrayRightX, cumY, `${fracIn(fm.totalWidthIn)}"`, false, ff));
                          // Cumulative from left corner to each intermediate foot
                          r0.cols.forEach((col, i) => {
                            if (i > 0 && i < r0.cols.length - 1) {
                              const dist = fm.pxIn(col.x - fm.arrayLeftX);
                              elems.push(hDim(fm.arrayLeftX, col.x, cumY + 14, `${fracIn(dist)}"`, false, ff));
                            }
                          });
                          return elems;
                        })()}
                      </svg>

                      <div style={{ fontFamily: ff, fontSize: 9, color: td, marginTop: 4 }}>
                        Origin: upper-left corner | Overhang: {fracIn(r0?.ovIn)}" | Spacing: {fracIn(r0?.spIn)}" | Rail gap: {fracIn(r0?.railGapIn)}" | Total: {fracIn(fm.totalWidthIn)}" x {fracIn(fm.totalHeightIn)}"
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* ═══ SUMMARY BAR ═══ */}
          {modGroups.length > 0 && (
            <div style={{
              ...cd, background: c2, display: "flex", gap: 16, flexWrap: "wrap",
              alignItems: "center", padding: "10px 16px"
            }}>
              <span style={{ fontFamily: ff, fontSize: 11, color: ac, fontWeight: 700 }}>LAYOUT SUMMARY</span>
              <span style={{ fontFamily: ff, fontSize: 11, color: tx }}>
                {modGroups.length} face{modGroups.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontFamily: ff, fontSize: 11, color: tx }}>
                {totalMods} modules
              </span>
              <span style={{ fontFamily: ff, fontSize: 11, color: gn, fontWeight: 600 }}>
                {totalKw} kW
              </span>
              {md && (
                <span style={{ fontFamily: ff, fontSize: 10, color: td }}>
                  {md.nm} ({md.w}W)
                </span>
              )}
            </div>
          )}

          {/* ═══ CUT LIST ═══ */}
          {rack && rack.cutList.length > 0 && (
            <div style={{ ...cd, marginTop: 14 }}>
              <div style={{ fontFamily: ff, fontSize: 12, color: ac, fontWeight: 700, marginBottom: 8 }}>
                Rail Cut List
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, fontSize: 10 }}>
                <thead>
                  <tr style={{ color: td, textTransform: "uppercase", fontSize: 8, letterSpacing: "0.05em" }}>
                    <th style={{ textAlign: "left", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>#</th>
                    <th style={{ textAlign: "left", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Stock Rail</th>
                    <th style={{ textAlign: "left", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Pieces Cut</th>
                    <th style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Used</th>
                    <th style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Waste</th>
                  </tr>
                </thead>
                <tbody>
                  {rack.cutList.map((bin, i) => (
                    <tr key={i} style={{ color: tx }}>
                      <td style={{ padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>{i + 1}</td>
                      <td style={{ padding: "3px 6px", borderBottom: `1px solid ${bd}`, fontWeight: 600 }}>
                        {bin.stock.len}" ({bin.stock.pn})
                      </td>
                      <td style={{ padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>
                        {bin.pieces.map((p, j) => (
                          <span key={j} style={{
                            display: "inline-block", background: c2, borderRadius: 3,
                            padding: "1px 5px", marginRight: 4, fontSize: 9
                          }}>
                            {p.len}" <span style={{ color: td }}>{p.label}</span>
                          </span>
                        ))}
                      </td>
                      <td style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>
                        {bin.used.toFixed(1)}"
                      </td>
                      <td style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}`, color: bin.waste > 24 ? rd : td }}>
                        {bin.waste.toFixed(1)}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontFamily: ff, fontSize: 10, color: td }}>
                <span>{rack.cutList.length} stock rail{rack.cutList.length !== 1 ? "s" : ""} to purchase</span>
                <span>Total waste: {rack.waste}%</span>
              </div>
            </div>
          )}

          {/* ═══ RACKING BOM ═══ */}
          {rack && rack.bom.length > 0 && (
            <div style={{ ...cd, marginTop: 14 }}>
              <div style={{ fontFamily: ff, fontSize: 12, color: ac, fontWeight: 700, marginBottom: 8 }}>
                Racking Hardware BOM
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, fontSize: 10 }}>
                <thead>
                  <tr style={{ color: td, textTransform: "uppercase", fontSize: 8, letterSpacing: "0.05em" }}>
                    <th style={{ textAlign: "left", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Item</th>
                    <th style={{ textAlign: "center", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Qty</th>
                    <th style={{ textAlign: "center", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Unit</th>
                    <th style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Unit $</th>
                    <th style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>Line $</th>
                  </tr>
                </thead>
                <tbody>
                  {rack.bom.map((item, i) => (
                    <tr key={i} style={{ color: tx }}>
                      <td style={{ padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>{item.d}</td>
                      <td style={{ textAlign: "center", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>{item.q}</td>
                      <td style={{ textAlign: "center", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>{item.u}</td>
                      <td style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}` }}>${item.$.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "3px 6px", borderBottom: `1px solid ${bd}`, fontWeight: 600 }}>${item.t.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ color: ac, fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: "4px 6px", textAlign: "right", borderTop: `2px solid ${bd}` }}>Total:</td>
                    <td style={{ textAlign: "right", padding: "4px 6px", borderTop: `2px solid ${bd}` }}>
                      ${rack.bom.reduce((s, it) => s + it.t, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
