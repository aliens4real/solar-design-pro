import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { ff, c1, c2, bd, ac, tx, td, cd } from '../theme.js';
import { egcSize, gecSize, seSize } from '../calc/nec-sizing.js';
import { calcConduit } from '../diagrams/shared.jsx';
import ResidentialRoofDiagram, { BASEMENT_Y, EXTERIOR_ZONE } from '../diagrams/ResidentialRoofDiagram.jsx';
import CommercialRoofDiagram from '../diagrams/CommercialRoofDiagram.jsx';
import GroundMountDiagram from '../diagrams/GroundMountDiagram.jsx';
import CarportDiagram from '../diagrams/CarportDiagram.jsx';
import AnnotationOverlay from '../components/AnnotationOverlay.jsx';
import { seedResidential, seedCommercial, seedGround, seedCarport } from '../calc/diagram-seeds.js';

export default function SiteElectricalTab({ pj, sz, iv, dsg, dAn, sDan, modGroups, layPos, md, ivs }) {
  const mt = pj.mt || "roof";
  const es = +(pj.es || 200);
  const isComm = es >= 320;
  const svW = 1060;
  const svH = mt === "ground" ? 580 : mt === "carport" ? 620 : isComm ? 590 : 1000;
  const isMicro = iv?.tp === "micro";
  const svgRef = useRef(null);

  // Wire spec computation
  const dcG = sz?.dc || "10", acG = sz?.ac || "10", ocpd = sz?.oc || 20;
  const dcEgc = egcSize(ocpd), acEgc = egcSize(ocpd);
  const gecG = gecSize(es), se = seSize(es);
  const nStr = dsg?.ns || 1;

  // Segment specs
  const dcPV = { wires: [{ n: 2, g: "10", t: "PV Wire USE-2", clr: "Blk/Red" }], conduit: "—" };
  const dcRun = isMicro ? null : calcConduit([{ n: 2, g: dcG, t: "THWN-2", clr: "Blk/Red" }, { n: 1, g: dcEgc, t: "Cu EGC", clr: "Grn" }]);
  const acRun = calcConduit(isComm
    ? [{ n: 3, g: acG, t: "THWN-2", clr: "Blk/Red/Blu" }, { n: 1, g: acG, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: acEgc, t: "Cu EGC", clr: "Grn" }]
    : [{ n: 2, g: acG, t: "THWN-2", clr: "Blk/Red" }, { n: 1, g: acG, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: acEgc, t: "Cu EGC", clr: "Grn" }]);
  const seRun = calcConduit([{ n: isComm ? 3 : 2, g: se.cu, t: "THWN-2", clr: isComm ? "Blk/Red/Blu" : "Blk/Red" }, { n: 1, g: se.cu, t: "THWN-2 N", clr: "Wht" }, { n: 1, g: gecG, t: "Cu EGC", clr: "Grn" }]);
  const gecRun = { wires: [{ n: 1, g: gecG, t: "Bare Cu" }], conduit: "—" };

  const siteSpecs = { dcPV, dcRun, acRun, seRun, gecRun };

  // ── Seed dAn with diagram equipment when mount type changes ──
  const seedRef = useRef(null);
  useEffect(() => {
    const key = mt + "_" + isComm;
    if (seedRef.current === key && dAn.mk.length > 0) return;
    const seedFn = mt === "roof" ? (isComm ? seedCommercial : seedResidential)
      : mt === "ground" ? seedGround : mt === "carport" ? seedCarport : null;
    if (!seedFn) return;
    sDan(seedFn(es, { dcPV, dcRun, acRun, seRun, gecRun }, isComm, ivs));
    seedRef.current = key;
    ivSyncRef.current = null; // force inverter sync to re-run after seed
  }, [mt, isComm]);

  // ── Sync pv_array markers with modGroups (one marker per group) ──
  const arrSyncRef = useRef(null);
  useEffect(() => {
    if (!modGroups || modGroups.length === 0) return;
    const activeGroups = modGroups.filter(g => (+g.cnt || 0) > 0);
    if (activeGroups.length === 0) return;
    // Determine default positions based on mount type
    const basePos = mt === "ground" ? { x: 200, y: 250 }
      : mt === "carport" ? { x: 200, y: 185 }
      : isComm ? { x: 200, y: 180 }
      : { x: 350, y: 120 }; // residential (bigger centered house)
    const spacing = 120;

    const key = activeGroups.map(g => g.id).join(",");
    if (arrSyncRef.current === key) return;
    arrSyncRef.current = key;

    sDan(prev => {
      const existing = (prev.mk || []).filter(m => m.ct === "pv_array");
      const existingGids = new Set(existing.map(m => m.gid));
      const activeGids = new Set(activeGroups.map(g => g.id));
      // Remove markers for deleted groups
      let newMk = (prev.mk || []).filter(m => m.ct !== "pv_array" || activeGids.has(m.gid));
      // Remove lines referencing deleted pv_array markers
      const removedIds = new Set(existing.filter(m => !activeGids.has(m.gid)).map(m => m.id));
      let newLn = (prev.ln || []).filter(l => !removedIds.has(l.from) && !removedIds.has(l.to));
      // Add markers for new groups
      activeGroups.forEach((g, i) => {
        if (!existingGids.has(g.id)) {
          newMk.push({
            id: "arr_" + g.id, x: basePos.x + i * spacing, y: basePos.y,
            ct: "pv_array", lb: g.nm || "Array " + (i + 1), dt: "",
            gid: g.id, w: 36, h: 36,
          });
        }
      });
      return { ...prev, mk: newMk, ln: newLn };
    });
  }, [modGroups, mt, sDan]);

  // ── Sync inverter markers: one icon per inverter unit ──
  const ivSyncRef = useRef(null);
  useEffect(() => {
    if (!ivs || ivs.length === 0) return;
    const totalQty = ivs.reduce((s, e) => s + (e.qty || 1), 0);
    const key = ivs.map(e => `${e.model}:${e.qty}`).join(",");
    if (ivSyncRef.current === key) return;
    ivSyncRef.current = key;

    sDan(prev => {
      let newMk = [...(prev.mk || [])];
      let newLn = [...(prev.ln || [])];

      // Primary inverter = first non-synced inverter marker
      const primInv = newMk.find(m => m.ct === "inverter" && !m._ivSync);
      if (!primInv) return prev;

      // Primary AC disconnect = first disconnect linked from primary inverter
      const acLn = newLn.find(l => l.from === primInv.id && !l._ivSync &&
        newMk.some(m => m.id === l.to && m.ct === "disconnect"));
      const primAcd = acLn ? newMk.find(m => m.id === acLn.to) : null;

      // Collect extra inverter IDs (seed extras + old synced)
      const extraInvIds = new Set(
        newMk.filter(m => m.ct === "inverter" && m.id !== primInv.id).map(m => m.id)
      );
      // Find disconnect markers paired with extra inverters via lines
      const extraAcdIds = new Set();
      newLn.forEach(l => {
        if (extraInvIds.has(l.from)) {
          const tgt = newMk.find(m => m.id === l.to && m.ct === "disconnect");
          if (tgt) extraAcdIds.add(tgt.id);
        }
      });
      newMk.forEach(m => { if (m._ivSync && m.ct === "disconnect") extraAcdIds.add(m.id); });

      const removeIds = new Set([...extraInvIds, ...extraAcdIds]);
      newMk = newMk.filter(m => !removeIds.has(m.id));
      newLn = newLn.filter(l =>
        !removeIds.has(l.from) && !(l.to && removeIds.has(l.to)) && !l._ivSync);

      // Flat list of inverters (one entry per unit)
      const flat = [];
      ivs.forEach(e => { for (let q = 0; q < (e.qty || 1); q++) flat.push(e); });

      // Update primary inverter label
      const pi = newMk.findIndex(m => m.id === primInv.id);
      if (pi >= 0) {
        newMk[pi] = { ...newMk[pi],
          lb: totalQty > 1 ? "Inverter 1" : "Inverter",
          dt: flat[0]?.inv?.nm || newMk[pi].dt,
        };
      }
      // Update primary disconnect label
      if (primAcd) {
        const ai = newMk.findIndex(m => m.id === primAcd.id);
        if (ai >= 0) newMk[ai] = { ...newMk[ai], lb: totalQty > 1 ? "AC Disc. 1" : "AC Disconnect" };
      }

      // Copy wire spec from existing AC line
      const sp = acLn ? { wire: acLn.wire, wireType: acLn.wireType, qty: acLn.qty, conduit: acLn.conduit } : {};

      // Add synced inverter + disconnect + line for units 2..n
      const gap = 40;
      for (let i = 1; i < totalQty; i++) {
        const f = flat[i] || flat[0];
        const invId = `iv_s_${i}`, acdId = `ad_s_${i}`;

        newMk.push({
          id: invId, x: primInv.x, y: primInv.y + i * gap,
          ct: "inverter", lb: `Inverter ${i + 1}`, dt: f.inv?.nm || "",
          w: primInv.w || 36, h: primInv.h || 36, _ivSync: true,
        });

        if (primAcd) {
          newMk.push({
            id: acdId, x: primAcd.x, y: primAcd.y + i * gap,
            ct: "disconnect", lb: `AC Disc. ${i + 1}`, dt: "Lockable",
            w: primAcd.w || 36, h: primAcd.h || 36, _ivSync: true,
          });
          newLn.push({
            id: `ln_s_ac_${i}`, from: invId, to: acdId,
            label: "AC Branch", dir: "h", bendR: 12, co: null,
            _ivSync: true, ...sp,
          });
        }
      }

      return { mk: newMk, ln: newLn };
    });
  }, [ivs, sDan]);

  const SITE_RUNS = useMemo(() => [
    { key: "dcPV", label: "PV Source Circuit", spec: dcPV },
    ...(dcRun ? [{ key: "dcRun", label: "DC Homerun", spec: dcRun }] : []),
    { key: "acRun", label: "AC Branch Circuit", spec: acRun },
    { key: "seRun", label: "Service Entrance", spec: seRun },
    { key: "gecRun", label: "GEC", spec: gecRun },
  ], [dcPV, dcRun, acRun, seRun, gecRun]);

  // Derive wire run lengths from annotation lines for wire schedule
  const anWr = useMemo(() => {
    const lns = dAn?.ln || [];
    const find = suffix => { const l = lns.find(l => typeof l.id === "string" && l.id.endsWith(suffix)); return l?.len || 0; };
    return { pv: 0, dc: find("_ln_dc"), ac: find("_ln_ac"), se: find("_ln_se"), gec: find("_ln_ge") };
  }, [dAn?.ln]);

  const props = { svW, svH, es, isComm, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr: anWr };

  // SVG coordinate adapter
  const getSvgPt = useCallback(e => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.touches ? e.touches[0].clientX : e.clientX;
    pt.y = e.touches ? e.touches[0].clientY : e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }, []);

  const isRes = mt === "roof" && !isComm;
  const updAn = useCallback(fn => sDan(prev => {
    const next = fn(prev);
    if (!isRes) return next;
    const ez = EXTERIOR_ZONE;
    return { ...next, mk: (next.mk || []).map(m => {
      if (m.y >= BASEMENT_Y) return { ...m, zone: "basement" };
      if (m.x >= ez.x && m.x <= ez.x + ez.w && m.y >= ez.y && m.y <= ez.y + ez.h) return { ...m, zone: "exterior" };
      if (m.zone === "basement" || m.zone === "exterior") return { ...m, zone: undefined };
      return m;
    }) };
  }), [sDan, isRes]);

  const containerSize = { w: svW, h: svH };

  // Get annotation overlay
  const overlay = dAn ? AnnotationOverlay({
    mk: dAn.mk || [], ln: dAn.ln || [], updAn, getSvgPt,
    containerRef: svgRef, containerSize,
    siteSpecs, SITE_RUNS, renderMode: "inline",
    modGroups, layPos, md,
  }) : null;

  // Select diagram component
  const DiagramComp = mt === "roof" ? (isComm ? CommercialRoofDiagram : ResidentialRoofDiagram)
    : mt === "ground" ? GroundMountDiagram
    : mt === "carport" ? CarportDiagram
    : null;

  return (
    <div style={{ ...cd, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: ff, fontSize: 13, color: ac, margin: 0, fontWeight: 700 }}>⚡ Site Electrical Layout</h3>
        <span style={{ fontFamily: ff, fontSize: 9, color: td }}>
          {mt === "roof" ? "Residential Roof Mount" : mt === "ground" ? "Ground Mount System" : mt === "carport" ? "Carport Mount" : "System"} — {es}A Service
        </span>
      </div>

      {overlay && overlay.toolbar}

      {DiagramComp ? (
        <div style={{ position: "relative", userSelect: "none" }}>
          <DiagramComp ref={svgRef} {...props}>
            {overlay && overlay.svgLayer}
          </DiagramComp>
        </div>
      ) : (
        <div style={{ fontFamily: ff, color: td, fontSize: 11, padding: 20, textAlign: "center" }}>Select a mount type on the PROJECT tab</div>
      )}

      {overlay && overlay.editPanels}

      <div style={{ fontFamily: ff, fontSize: 9, color: td, marginTop: 8, lineHeight: 1.6 }}>
        Generic site elevation showing typical equipment placement. Equipment locations are approximate — actual placement depends on site conditions, AHJ requirements, and installer preference.
        {mt === "roof" ? " Residential layout shows inverter on garage/exterior wall with AC disconnect near service entrance." : ""}
        {mt === "ground" ? " Ground mount shows underground trench from array combiner to inverter pad, then overhead/underground to building." : ""}
        {mt === "carport" ? " Carport layout shows combiner on support column with conduit run to building electrical room." : ""}
      </div>
    </div>
  );
}
