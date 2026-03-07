import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ff, fs, c1, c2, bd, ac, tx, td, rd, gn, bt, cd, inp, lb } from '../theme.js';
import { egcSize, gecSize, seSize } from '../calc/nec-sizing.js';
import { calcConduit } from '../diagrams/shared.jsx';
import AnnotationOverlay from '../components/AnnotationOverlay.jsx';

const ZONE_CFG = {
  basement: { label: "Basement", color: "#d48c00", prefix: "bsmt_", posY: "bottom" },
  exterior: { label: "Exterior Wall", color: "#a855f7", prefix: "ext_", posY: "top" },
};

export default function PhotosTab({ pht, sPht, ap, sAp, sz, pj, iv, dsg, dAn }) {
  const imgRef = useRef(null);

  // ── Site electrical specs ──
  const siteSpecs = useMemo(() => {
    const es = +(pj?.es || 200), isComm = es >= 320, isMicro = iv?.tp === "micro";
    const dcG = sz?.dc || "10", acG = sz?.ac || "10", ocpd = sz?.oc || 20;
    const dcEgc = egcSize(ocpd), acEgc = egcSize(ocpd);
    const gecG = gecSize(es), se = seSize(es);
    const dcPV = { wires: [{ n: 2, g: "10", t: "PV Wire", clr: "Blk/Red" }], conduit: "—" };
    const dcRun = isMicro ? null : calcConduit([{ n: 2, g: dcG, t: "THWN-2", clr: "Blk/Red" }, { n: 1, g: dcEgc, t: "Cu EGC", clr: "Grn" }]);
    const acRun = calcConduit(isComm
      ? [{ n: 3, g: acG, t: "THWN-2", clr: "Blk/Red/Blu" }, { n: 1, g: acG, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: acEgc, t: "Cu EGC", clr: "Grn" }]
      : [{ n: 2, g: acG, t: "THWN-2", clr: "Blk/Red" }, { n: 1, g: acG, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: acEgc, t: "Cu EGC", clr: "Grn" }]);
    const seRun = calcConduit([{ n: isComm ? 3 : 2, g: se.cu, t: "THWN-2", clr: isComm ? "Blk/Red/Blu" : "Blk/Red" }, { n: 1, g: se.cu, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: gecG, t: "Cu EGC", clr: "Grn" }]);
    const gecRun = { wires: [{ n: 1, g: gecG, t: "Bare Cu" }], conduit: "—" };
    return { dcPV, dcRun, acRun, seRun, gecRun };
  }, [sz, pj, iv]);

  const SITE_RUNS = useMemo(() => [
    { key: "dcPV", label: "PV Source Circuit", spec: siteSpecs.dcPV },
    ...(siteSpecs.dcRun ? [{ key: "dcRun", label: "DC Homerun", spec: siteSpecs.dcRun }] : []),
    { key: "acRun", label: "AC Branch Circuit", spec: siteSpecs.acRun },
    { key: "seRun", label: "Service Entrance", spec: siteSpecs.seRun },
    { key: "gecRun", label: "GEC", spec: siteSpecs.gecRun },
  ], [siteSpecs]);

  const ph = pht.find(x => x.id === ap);
  const updAn = useCallback(fn => sPht(p => p.map(x => x.id === ap ? { ...x, ...fn({ mk: x.mk || [], ln: x.ln || [] }) } : x)), [sPht, ap]);

  const getSvgPt = useCallback(e => {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  }, []);

  const containerSize = imgRef.current ? { w: imgRef.current.clientWidth, h: imgRef.current.clientHeight } : { w: 800, h: 520 };

  // Always call AnnotationOverlay to keep hook count stable (it uses useState internally)
  const overlay = AnnotationOverlay({
    mk: ph?.mk || [], ln: ph?.ln || [], updAn, getSvgPt,
    containerRef: imgRef, containerSize,
    siteSpecs, SITE_RUNS, renderMode: "absolute",
  });

  const updPh = useCallback(fn => sPht(p => p.map(x => x.id === ap ? fn(x) : x)), [sPht, ap]);

  // ── Zone markers from diagram ──
  const zoneMks = useMemo(() => {
    const all = dAn?.mk || [];
    return {
      basement: all.filter(m => m.zone === "basement"),
      exterior: all.filter(m => m.zone === "exterior"),
    };
  }, [dAn]);
  const hasBsmt = zoneMks.basement.length > 0;
  const hasExt = zoneMks.exterior.length > 0;

  // ── Generalized zone import ──
  const handleZoneImport = useCallback((zoneName) => {
    const cfg = ZONE_CFG[zoneName];
    if (!ph || !cfg) return;
    const zMk = zoneMks[zoneName] || [];
    if (zMk.length === 0) return;
    const zIds = new Set(zMk.map(m => m.id));
    const allMk = dAn?.mk || [];
    const allLn = dAn?.ln || [];

    // Lines touching at least one zone marker
    const zLn = allLn.filter(l => zIds.has(l.from) || (l.to && zIds.has(l.to)));

    // Bounding box of zone markers in diagram coords
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    zMk.forEach(m => {
      const hw = (m.w || 36) / 2, hh = (m.h || 36) / 2;
      minX = Math.min(minX, m.x - hw); maxX = Math.max(maxX, m.x + hw);
      minY = Math.min(minY, m.y - hh); maxY = Math.max(maxY, m.y + hh);
    });
    const srcW = maxX - minX || 1, srcH = maxY - minY || 1;

    // Target box position depends on zone
    const cw = containerSize.w || 800, ch = containerSize.h || 520;
    const pad = 30;
    const tgtW = Math.min(350, cw * 0.4), tgtH = Math.min(250, ch * 0.45);
    const tgtX = cw - tgtW - pad;
    const tgtY = cfg.posY === "top" ? pad : ch - tgtH - pad;
    const scale = Math.min((tgtW - 40) / srcW, (tgtH - 40) / srcH, 1.5);
    const offX = tgtX + (tgtW - srcW * scale) / 2;
    const offY = tgtY + (tgtH - srcH * scale) / 2 + 10;

    const transform = (x, y) => ({
      x: offX + (x - minX) * scale,
      y: offY + (y - minY) * scale,
    });

    // Create marker copies
    const idMap = {};
    const ts = Date.now();
    const newMk = zMk.map(m => {
      const nid = cfg.prefix + m.id + "_" + ts;
      idMap[m.id] = nid;
      const pos = transform(m.x, m.y);
      return { ...m, id: nid, x: pos.x, y: pos.y, imported: true, srcZone: zoneName, srcId: m.id };
    });

    // Create line copies
    const newLn = zLn.map(l => {
      const fromZ = zIds.has(l.from);
      const toZ = l.to && zIds.has(l.to);
      const nid = cfg.prefix + l.id + "_" + ts;

      if (fromZ && toZ) {
        return { ...l, id: nid, from: idMap[l.from], to: idMap[l.to], imported: true, srcZone: zoneName, srcId: l.id };
      }
      if (fromZ && !toZ) {
        const fromMk = zMk.find(m => m.id === l.from);
        const toMk = allMk.find(m => m.id === l.to);
        const fp = fromMk ? transform(fromMk.x, fromMk.y) : { x: tgtX, y: tgtY };
        const edgeX = toMk && toMk.x < minX ? tgtX : tgtX + tgtW;
        const edgeY = fp.y;
        return { ...l, id: nid, from: idMap[l.from], to: null, site: l.site || "acRun",
          ex: edgeX, ey: edgeY, dir: "h", imported: true, srcZone: zoneName, srcId: l.id, label: l.label || "" };
      }
      if (!fromZ && toZ) {
        const toMk = zMk.find(m => m.id === l.to);
        const fromMk = allMk.find(m => m.id === l.from);
        const tp = toMk ? transform(toMk.x, toMk.y) : { x: tgtX, y: tgtY };
        const edgeX = fromMk && fromMk.x > maxX ? tgtX + tgtW : tgtX;
        const edgeY = tp.y;
        return { ...l, id: nid, from: idMap[l.to], to: null, site: l.site || "acRun",
          ex: edgeX, ey: edgeY, dir: "h", imported: true, srcZone: zoneName, srcId: l.id, label: l.label || "" };
      }
      return { ...l, id: nid, from: idMap[l.from] || l.from, imported: true, srcZone: zoneName, srcId: l.id };
    });

    // Clear only this zone's imports, keep other zone + manual markers
    updAn(d => {
      const keepMk = (d.mk || []).filter(m => !(m.imported && m.srcZone === zoneName));
      const keepLn = (d.ln || []).filter(l => !(l.imported && l.srcZone === zoneName));
      return { mk: [...keepMk, ...newMk], ln: [...keepLn, ...newLn] };
    });
  }, [ph, zoneMks, dAn, containerSize, updAn]);

  // ── Auto-import on zone selection (only when user changes dropdown, not on remount) ──
  const prevZnRef = useRef(ph?.zn || null);
  useEffect(() => {
    const zn = ph?.zn;
    if (!zn || zn === prevZnRef.current) { prevZnRef.current = zn || null; return; }
    prevZnRef.current = zn;
    // Skip if markers already imported for this zone (preserves user adjustments on remount)
    const alreadyImported = (ph?.mk || []).some(m => m.imported && m.srcZone === zn);
    if (!alreadyImported) handleZoneImport(zn);
  }, [ph?.zn, handleZoneImport]);

  // ── Deferred zone import (auto-import when dAn populates after seed) ──
  useEffect(() => {
    if (!ph || !ph.zn) return;
    const hasZoneMarkers = (zoneMks[ph.zn] || []).length > 0;
    const alreadyImported = (ph.mk || []).some(m => m.imported && m.srcZone === ph.zn);
    if (hasZoneMarkers && !alreadyImported) {
      handleZoneImport(ph.zn);
    }
  }, [ph?.zn, zoneMks, handleZoneImport]);

  // ── Per-zone imported bounding boxes ──
  const importedBoxes = useMemo(() => {
    if (!ph) return [];
    const imported = (ph.mk || []).filter(m => m.imported);
    if (imported.length === 0) return [];
    const zones = [...new Set(imported.map(m => m.srcZone).filter(Boolean))];
    return zones.map(z => {
      const zMk = imported.filter(m => m.srcZone === z);
      const pad = 20;
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      zMk.forEach(m => {
        const hw = (m.w || 36) / 2, hh = (m.h || 36) / 2;
        x1 = Math.min(x1, m.x - hw); x2 = Math.max(x2, m.x + hw);
        y1 = Math.min(y1, m.y - hh); y2 = Math.max(y2, m.y + hh);
      });
      const cfg = ZONE_CFG[z] || { color: ac, label: z.toUpperCase() };
      return {
        zone: z,
        color: cfg.color,
        label: cfg.label.toUpperCase() + " EQUIPMENT",
        rect: { x: x1 - pad, y: y1 - pad - 14, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 + 14 },
      };
    });
  }, [ph]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }} className="fi">
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>◻ Photo Studio</h2>
        <label style={{ ...bt(true), cursor: "pointer" }}>+ Upload<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = ev => { const nph = { id: Date.now(), src: ev.target.result, nm: f.name, ds: "", mk: [], ln: [] }; sPht(p => [...p, nph]); sAp(nph.id); };
          r.readAsDataURL(f);
        }} /></label>
        {ph && hasExt && (
          <button style={{ ...bt(true), borderColor: "#a855f7", color: "#a855f7" }} onClick={() => handleZoneImport("exterior")}>⬇ Exterior Import</button>
        )}
        {ph && hasBsmt && (
          <button style={bt(true)} onClick={() => handleZoneImport("basement")}>⬇ Basement Import</button>
        )}
      </div>

      {pht.length === 0
        ? <div style={{ ...cd, textAlign: "center", padding: 60 }}><div style={{ fontSize: 44, marginBottom: 10, opacity: .4 }}>◻</div><div style={{ fontFamily: ff, color: td }}>Upload site photos to annotate</div></div>
        : <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {pht.map(p => {
                const zCfg = p.zn ? ZONE_CFG[p.zn] : null;
                return (
                <div key={p.id} onClick={() => sAp(p.id)} style={{ borderRadius: 6, overflow: "hidden", cursor: "pointer", border: `2px solid ${ap === p.id ? (zCfg?.color || ac) : bd}` }}>
                  {p.src
                    ? <img src={p.src} alt="" style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: (zCfg?.color || ac) + "12", borderBottom: `2px solid ${zCfg?.color || bd}` }}>
                        <span style={{ fontSize: 20, opacity: 0.5 }}>⬆</span>
                        <span style={{ fontSize: 8, fontFamily: ff, color: zCfg?.color || td, fontWeight: 600 }}>{zCfg?.label || "Upload"}</span>
                      </div>
                  }
                  <div style={{ padding: "3px 6px", fontSize: 9, fontFamily: ff, color: td, background: c1 }}>{p.nm.slice(0, 16)}</div>
                </div>);
              })}
            </div>

            {!ph ? <div style={{ ...cd, flex: 1, textAlign: "center", padding: 40, color: td }}>Select photo</div>
              : <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={lb}>Description</div>
                      <input style={{ ...inp, fontFamily: fs }} value={ph.ds} onChange={e => updPh(x => ({ ...x, ds: e.target.value }))} placeholder="South roof from ground..." />
                    </div>
                    <div style={{ minWidth: 140 }}>
                      <div style={lb}>Zone Link</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <select style={{ ...inp, fontFamily: fs, width: 130 }} value={ph.zn || ""} onChange={e => updPh(x => ({ ...x, zn: e.target.value || undefined }))}>
                          <option value="">None</option>
                          <option value="exterior">Exterior Wall</option>
                          <option value="basement">Basement</option>
                        </select>
                        {ph.zn && ZONE_CFG[ph.zn] && (
                          <svg width={50} height={16} style={{ flexShrink: 0 }}>
                            <line x1={2} y1={8} x2={32} y2={8} stroke={ZONE_CFG[ph.zn].color} strokeWidth={2} strokeDasharray="4 2" />
                            <text x={36} y={12} fill={ZONE_CFG[ph.zn].color} fontSize={7} fontFamily={ff}>Linked</text>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {overlay.toolbar}

                  <div style={{ ...cd, padding: 0, overflow: "hidden", position: "relative", userSelect: "none" }}
                    onMouseMove={overlay.handlers.handleDragMove} onMouseUp={overlay.handlers.handleDragEnd} onMouseLeave={overlay.handlers.handleDragEnd}
                    onTouchMove={overlay.handlers.handleDragMove} onTouchEnd={overlay.handlers.handleDragEnd}>
                    {ph.src
                      ? <img ref={imgRef} src={ph.src} alt="" style={{
                          width: "100%", display: "block", maxHeight: 520, objectFit: "contain",
                          cursor: overlay.mode === "place" ? "crosshair" : "default",
                        }} onClick={overlay.handlers.handleContainerClick} />
                      : <div ref={imgRef} style={{
                          width: "100%", height: 520, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          border: `3px dashed ${(ph.zn && ZONE_CFG[ph.zn]?.color) || bd}`, borderRadius: 8, background: ((ph.zn && ZONE_CFG[ph.zn]?.color) || ac) + "08",
                          cursor: "pointer", position: "relative",
                        }} onClick={() => document.getElementById("ph-upload-" + ph.id)?.click()}>
                          <span style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }}>📷</span>
                          <span style={{ fontFamily: ff, fontSize: 14, color: (ph.zn && ZONE_CFG[ph.zn]?.color) || td, fontWeight: 600 }}>
                            Upload {ph.nm} Photo
                          </span>
                          <span style={{ fontFamily: ff, fontSize: 11, color: td, marginTop: 4, opacity: 0.6 }}>
                            Click or drag image here
                          </span>
                          <input id={"ph-upload-" + ph.id} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const r = new FileReader();
                            r.onload = ev => updPh(x => ({ ...x, src: ev.target.result }));
                            r.readAsDataURL(f);
                          }} />
                        </div>
                    }
                    {ph.src && overlay.svgOverlay}

                    {/* Zone equipment box overlays */}
                    {ph.src && importedBoxes.length > 0 && (
                      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        {importedBoxes.map(b => (
                          <g key={b.zone}>
                            <rect x={b.rect.x} y={b.rect.y} width={b.rect.w} height={b.rect.h}
                              rx={4} fill="none" stroke={b.color} strokeWidth={2} strokeDasharray="6 3" opacity={0.8} />
                            <text x={b.rect.x + 6} y={b.rect.y + 11} fill={b.color} fontSize={9} fontFamily={ff} fontWeight={600} opacity={0.9}>
                              {b.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    )}
                  </div>

                  {overlay.editPanels}
                </div>}
          </div>}
    </div>
  );
}
