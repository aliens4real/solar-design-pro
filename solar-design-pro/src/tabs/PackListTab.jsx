import { useState, useEffect } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn, rd, bt, cd } from '../theme.js';
import { MCATS } from '../data/markers.js';

// ── Inventory matching ──
function normalize(s) { return s.replace(/\s*\([^)]*\)\s*$/g, "").trim().toLowerCase(); }

function matchInv(bomCat, bomDesc, invItems) {
  if (!invItems || !invItems.length) return null;
  const bc = bomCat.toLowerCase(), bd_ = bomDesc.toLowerCase(), bn = normalize(bomDesc);
  // Exact category + exact desc
  let m = invItems.find(it => it.cat.toLowerCase() === bc && it.desc.toLowerCase() === bd_);
  if (m) return m;
  // Exact category + normalized desc
  m = invItems.find(it => it.cat.toLowerCase() === bc && normalize(it.desc) === bn);
  if (m) return m;
  // Any category, exact desc
  m = invItems.find(it => it.desc.toLowerCase() === bd_);
  if (m) return m;
  // Any category, normalized desc
  m = invItems.find(it => normalize(it.desc) === bn);
  if (m) return m;
  // Substring containment (desc contains BOM desc or vice versa)
  m = invItems.find(it => it.desc.toLowerCase().includes(bd_) || bd_.includes(it.desc.toLowerCase()));
  return m || null;
}

export default function PackListTab({ pk, dsg, md, iv, sz, pj, sDsg, mkr }) {
  const [invItems, setInvItems] = useState([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("solar-inventory");
        if (raw) {
          const data = JSON.parse(raw);
          if (data && (data.v === 1 || data.v === 2) && Array.isArray(data.items)) {
            setInvItems(data.items);
            return;
          }
        }
      } catch {}
      setInvItems([]);
    };
    load();
    const onStorage = (e) => { if (e.key === "solar-inventory") load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Compute matches for BOM items
  const matches = pk.map(it => matchInv(it.c, it.d, invItems));
  const stockedCount = pk.filter((it, i) => {
    const m = matches[i];
    return m && m.qty >= it.q;
  }).length;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }} className="fi">
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>▤ Pack List & Install Guide</h2>
        <div style={{ flex: 1 }} />{dsg && <div style={{ fontFamily: ff, fontSize: 11, color: gn }}>● {dsg.tm} modules / {dsg.ni} inverter(s)</div>}</div>
      {pk.length === 0 ? <div style={{ ...cd, textAlign: "center", padding: 40, color: td }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>▤</div><div style={{ fontFamily: ff }}>Generate a design first</div>
        {md && iv && !dsg && <button style={{ ...bt(true), marginTop: 12 }} onClick={() => {
          const nM = Math.ceil((+pj.kw || 8) * 1000 / md.w), nS = sz ? Math.ceil(nM / sz.opt) : 2, mS = sz ? sz.opt : Math.ceil(nM / nS);
          const nI = iv.tp === "micro" ? 1 : Math.ceil((nS * mS * md.w) / (iv.kw * 1300));
          sDsg({ type: "design", tm: nS * mS, ms: mS, ns: nS, ni: nI, ratio: +((nS * mS * md.w) / (iv.kw * 1000 * nI)).toFixed(2),
            kwh: Math.round(nS * mS * md.w * (+pj.ps || 4.5) * 365 * 0.8 / 1000), cost: 0, markers: [], steps: [], notes: ["Auto-generated"] });
        }}>
          ▶ Auto-Generate</button>}</div>
      : <>
        {invItems.length > 0 && <div style={{ ...cd, marginBottom: 14, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>📦</span>
          <span style={{ fontFamily: ff, fontSize: 12, color: tx }}>
            <strong style={{ color: stockedCount === pk.length ? gn : ac }}>{stockedCount}</strong> of {pk.length} items fully stocked
          </span>
        </div>}
        <div style={{ ...cd, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, fontSize: 11 }}>
            <thead><tr style={{ background: c2 }}>{["Cat", "Description", "Qty", "Unit", "$/Unit", "Total", ...(invItems.length > 0 ? ["On Hand", "Need"] : [])].map(h =>
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: ac, fontSize: 10, borderBottom: `1px solid ${bd}`, fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>{pk.map((it, i) => {
              const m = matches[i];
              const onHand = m ? m.qty : null;
              const need = m ? Math.max(0, it.q - m.qty) : null;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${bd}08` }}>
                  <td style={{ padding: "6px 12px", color: td, fontSize: 10 }}>{it.c}</td>
                  <td style={{ padding: "6px 12px" }}>{it.d}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right", color: ac }}>{it.q}</td>
                  <td style={{ padding: "6px 12px", color: td }}>{it.u}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>${it.$.toFixed(2)}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right", color: ac, fontWeight: 600 }}>${it.t.toFixed(2)}</td>
                  {invItems.length > 0 && <>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: onHand != null ? tx : td }}>{onHand != null ? onHand : "—"}</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: need === 0 ? gn : need != null ? rd : td }}>{need != null ? need : "—"}</td>
                  </>}
                </tr>
              );
            })}</tbody>
            <tfoot><tr style={{ background: c2, fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", color: ac }}>TOTAL MATERIAL COST</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: ac, fontSize: 14 }}>${pk.reduce((s, i) => s + i.t, 0).toFixed(2)}</td>
              {invItems.length > 0 && <td colSpan={2} />}
            </tr></tfoot>
          </table></div>

        {dsg?.steps?.length > 0 && <div style={{ ...cd, marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>INSTALLATION STEPS</div>
          {dsg.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#d48c00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#000", flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, paddingTop: 4 }}>{s}</div></div>)}</div>}

        {mkr.length > 0 && <div style={{ ...cd, marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>MARKER REFERENCE</div>
          {mkr.map((mk, i) => { const ct = MCATS.find(c => c.id === mk.category) || MCATS[8]; return (
            <div key={mk.id} style={{ display: "flex", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${bd}08` }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: ct.cl + "22", border: `1px solid ${ct.cl}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: ct.cl, flexShrink: 0 }}>{i + 1}</div>
              <div><div style={{ fontWeight: 600, color: ct.cl, fontSize: 12 }}>{ct.ic} {mk.label} <span style={{ color: td, fontWeight: 400 }}>({ct.lb})</span></div>
                <div style={{ fontSize: 12, color: tx, marginTop: 2, lineHeight: 1.5 }}>{mk.details || "No details yet."}</div></div></div>); })}</div>}
      </>}
    </div>
  );
}
