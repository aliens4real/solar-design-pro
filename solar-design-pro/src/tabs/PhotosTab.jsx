import { useState, useRef, useCallback, useMemo } from 'react';
import { ff, fs, c1, c2, bd, ac, tx, td, rd, gn, bt, cd, inp, lb } from '../theme.js';
import { egcSize, gecSize, seSize } from '../calc/nec-sizing.js';
import { calcConduit } from '../diagrams/shared.jsx';
import AnnotationOverlay from '../components/AnnotationOverlay.jsx';

export default function PhotosTab({ pht, sPht, ap, sAp, sz, pj, iv, dsg }) {
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

  const overlay = ph ? AnnotationOverlay({
    mk: ph.mk || [], ln: ph.ln || [], updAn, getSvgPt,
    containerRef: imgRef, containerSize,
    siteSpecs, SITE_RUNS, renderMode: "absolute",
  }) : null;

  const updPh = useCallback(fn => sPht(p => p.map(x => x.id === ap ? fn(x) : x)), [sPht, ap]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }} className="fi">
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>◻ Photo Studio</h2>
        <label style={{ ...bt(true), cursor: "pointer" }}>+ Upload<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = ev => { const nph = { id: Date.now(), src: ev.target.result, nm: f.name, ds: "", mk: [], ln: [] }; sPht(p => [...p, nph]); sAp(nph.id); };
          r.readAsDataURL(f);
        }} /></label>
      </div>

      {pht.length === 0
        ? <div style={{ ...cd, textAlign: "center", padding: 60 }}><div style={{ fontSize: 44, marginBottom: 10, opacity: .4 }}>◻</div><div style={{ fontFamily: ff, color: td }}>Upload site photos to annotate</div></div>
        : <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {pht.map(p => (
                <div key={p.id} onClick={() => sAp(p.id)} style={{ borderRadius: 6, overflow: "hidden", cursor: "pointer", border: `2px solid ${ap === p.id ? ac : bd}` }}>
                  <img src={p.src} alt="" style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "3px 6px", fontSize: 9, fontFamily: ff, color: td, background: c1 }}>{p.nm.slice(0, 16)}</div>
                </div>))}
            </div>

            {!ph ? <div style={{ ...cd, flex: 1, textAlign: "center", padding: 40, color: td }}>Select photo</div>
              : <div style={{ flex: 1 }}>
                  <div style={lb}>Description</div>
                  <input style={{ ...inp, marginBottom: 8, fontFamily: fs }} value={ph.ds} onChange={e => updPh(x => ({ ...x, ds: e.target.value }))} placeholder="South roof from ground..." />

                  {overlay.toolbar}

                  <div style={{ ...cd, padding: 0, overflow: "hidden", position: "relative", userSelect: "none" }}
                    onMouseMove={overlay.handlers.handleDragMove} onMouseUp={overlay.handlers.handleDragEnd} onMouseLeave={overlay.handlers.handleDragEnd}
                    onTouchMove={overlay.handlers.handleDragMove} onTouchEnd={overlay.handlers.handleDragEnd}>
                    <img ref={imgRef} src={ph.src} alt="" style={{
                      width: "100%", display: "block", maxHeight: 520, objectFit: "contain",
                      cursor: overlay.mode === "place" ? "crosshair" : "default",
                    }} onClick={overlay.handlers.handleContainerClick} />
                    {overlay.svgOverlay}
                  </div>

                  {overlay.editPanels}
                </div>}
          </div>}
    </div>
  );
}
