import { useState } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn, rd, bt, cd, inp } from '../theme.js';

const PITCHES = [["0","Flat"],["5","1:12"],["10","2:12"],["14","3:12"],["18","4:12"],["22","5:12"],["27","6:12"],["30","7:12"],["34","8:12"],["37","9:12"],["40","10:12"],["45","12:12"]];

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

export default function LayoutTab({
  md, iv, pj, totalMods, totalKw, modGroups, roofType, applyRoofPreset,
  addGroup, updGroup, delGroup, layPos, layDrag, setLayDrag, laySel, setLaySel,
  autoFillFace, resetGroupLayout, removeSelMod, addModToFace, snapPos,
  updateModPos, faceScale, faceSz, SETBACK_FT, LAY_W, GAP
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
                  <button style={{ ...bt(false), fontSize: 10, padding: "4px 10px", color: rd }} onClick={() => resetGroupLayout(g.id, true)}>Clear All</button>
                  {laySel && laySel.gi === g.id && (
                    <button style={{ ...bt(false), fontSize: 10, padding: "4px 10px", color: rd }} onClick={removeSelMod}>Delete Selected</button>
                  )}
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
                      position: "relative", width: LAY_W, height: canH, background: "#0c1929",
                      transform: `scale(${z})`, transformOrigin: "0 0",
                      cursor: "crosshair", userSelect: "none"
                    }}
                      onMouseMove={e => {
                        if (!layDrag || layDrag.gi !== g.id) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const rawX = (e.clientX - rect.left) / z - layDrag.ox;
                        const rawY = (e.clientY - rect.top) / z - layDrag.oy;
                        const snapped = snapPos(rawX, rawY, layDrag.id, g.id, sz);
                        updateModPos(g.id, layDrag.id, snapped.x, snapped.y);
                      }}
                      onMouseUp={() => setLayDrag(null)}
                      onMouseLeave={() => setLayDrag(null)}
                      onClick={e => {
                        if (layDrag) return;
                        if (e.target.dataset?.mod) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / z - sz.w / 2;
                        const y = (e.clientY - rect.top) / z - sz.h / 2;
                        addModToFace(g.id, x, y);
                      }}
                    >
                      {/* SVG Grid Overlay */}
                      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        <defs>
                          <pattern id={`grid-${g.id}`} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
                            <path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${g.id})`} />

                        {/* Setback lines */}
                        {sbPx > 0 && <>
                          <rect x={sbPx} y={sbPx} width={Math.max(0, LAY_W - 2 * sbPx)} height={Math.max(0, canH - 2 * sbPx)}
                            fill="none" stroke="rgba(220,38,38,0.25)" strokeWidth="1" strokeDasharray="6 3" />
                          <text x={sbPx + 4} y={sbPx - 4} fill="rgba(220,38,38,0.4)" fontSize="8" fontFamily={ff}>
                            {SETBACK_FT}ft setback
                          </text>
                        </>}

                        {/* Compass indicator */}
                        <g transform={`translate(${LAY_W - 30}, 28)`}>
                          <circle r="14" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                          <line x1="0" y1="6" x2="0" y2="-10" stroke="rgba(220,38,38,0.7)" strokeWidth="1.5" />
                          <text x="0" y="-12" textAnchor="middle" fill="rgba(220,38,38,0.7)" fontSize="7" fontFamily={ff} fontWeight="700">N</text>
                          <text x="0" y="14" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily={ff}>
                            {compass(g.az || 0)}
                          </text>
                        </g>

                        {/* Dimension labels */}
                        <text x={LAY_W / 2} y={canH - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily={ff}>
                          {g.fw || "—"}ft
                        </text>
                        <text x={6} y={canH / 2} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily={ff}
                          transform={`rotate(-90, 6, ${canH / 2})`} textAnchor="middle">
                          {g.fd || "—"}ft
                        </text>

                        {/* Snap guide lines during drag */}
                        {guides.map((gl, i) =>
                          gl.type === "v"
                            ? <line key={`g${i}`} x1={gl.x} y1={0} x2={gl.x} y2={canH} stroke="rgba(212,140,0,0.5)" strokeWidth="0.5" strokeDasharray="3 2" />
                            : <line key={`g${i}`} x1={0} y1={gl.y} x2={LAY_W} y2={gl.y} stroke="rgba(212,140,0,0.5)" strokeWidth="0.5" strokeDasharray="3 2" />
                        )}
                      </svg>

                      {/* Rendered Modules */}
                      {mods.map((m, mi) => {
                        const isSel = laySel && laySel.gi === g.id && laySel.id === m.id;
                        const bigEnough = sz.w > 18 && sz.h > 14;
                        return (
                          <div key={m.id}
                            data-mod="1"
                            style={{
                              position: "absolute",
                              left: m.x,
                              top: m.y,
                              width: sz.w,
                              height: sz.h,
                              background: isSel ? "rgba(212,140,0,0.85)" : "#1e3a5f",
                              border: isSel ? `2px solid ${ac}` : "1px solid rgba(30,58,95,0.6)",
                              borderRadius: 2,
                              cursor: "grab",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: bigEnough ? 8 : 6,
                              fontFamily: ff,
                              color: isSel ? "#000" : "rgba(255,255,255,0.5)",
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
                            {bigEnough && (mi + 1)}
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
        </>
      )}
    </div>
  );
}
