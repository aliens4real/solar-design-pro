import { useState, useEffect, useMemo } from 'react';
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

  // Shopping list: group matched items by warehouse location
  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));

  const shopList = useMemo(() => {
    if (!invItems.length || !pk.length) return [];
    const groups = {};
    pk.forEach((it, i) => {
      const m = matches[i];
      if (!m) return;
      const loc = m.notes?.split("|")[1]?.trim() || "No Location";
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push({ it, m, key: `${i}_${it.d}` });
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [pk, matches, invItems]);

  const shopTotal = shopList.reduce((s, [, items]) => s + items.length, 0);
  const shopChecked = Object.values(checked).filter(Boolean).length;

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

        {/* ═══ CONDUIT SIZING REFERENCE ═══ */}
        {pk.some(it => it.c === "Conduit") && (
          <details style={{ ...cd, marginTop: 14 }}>
            <summary style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: ac, cursor: "pointer", userSelect: "none" }}>
              Conduit Accessories — How Quantities Are Calculated
            </summary>
            <div style={{ marginTop: 10, fontFamily: ff, fontSize: 11, color: tx, lineHeight: 1.8 }}>
              <p style={{ margin: "0 0 6px", color: td, fontSize: 10 }}>
                Per conduit run, the BOM emits 7 line items. Formulas use <b>run length</b> (ft) from the Site Electrical Layout wire runs and <b>endpoints</b> (number of enclosure entries on the run).
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ background: c2 }}>
                  {["Accessory", "Formula", "NEC Ref", "Notes"].map(h =>
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: ac, fontSize: 10, borderBottom: `1px solid ${bd}`, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    ["EMT 10ft Sticks", "ceil(length / 10)", "—", "Standard 10ft trade size sticks"],
                    ["Set Screw Couplings", "sticks − 1", "—", "One coupling joins each pair of sticks"],
                    ["Set Screw Connectors", "endpoints", "NEC 358.42", "One per enclosure entry; AC branch = 4 (inverter + disconnect in/out + panel), others = 2"],
                    ["Locknuts", "endpoints", "NEC 358.42", "One per connector, secures connector to enclosure knockout"],
                    ["Insulating Bushings", "endpoints", "NEC 300.4(G)", "One per connector, protects wire insulation at termination"],
                    ["One-Hole Straps", "ceil(length / 10) + 1", "NEC 358.30", "Within 3ft of each box + every 10ft of run"],
                    ["LB Fittings", "max(1, ceil(length / 25))", "NEC 358.26", "At least 1 per run for direction change; additional every 25ft"],
                  ].map(([acc, formula, nec, note], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${bd}08` }}>
                      <td style={{ padding: "5px 10px", fontWeight: 600 }}>{acc}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "monospace", fontSize: 10, color: ac }}>{formula}</td>
                      <td style={{ padding: "5px 10px", color: td, fontSize: 10 }}>{nec}</td>
                      <td style={{ padding: "5px 10px", color: td, fontSize: 10 }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: "8px 0 2px", color: td, fontSize: 10 }}>
                <b>Endpoints by run type:</b> DC Home Run = 2 (roof box → inverter) · AC Branch = 4 (inverter → disconnect in/out → panel) · Service Entrance = 2 (meter → panel)
              </p>
              <p style={{ margin: "2px 0 0", color: td, fontSize: 10 }}>
                Conduit size is auto-calculated per NEC 40% fill rule based on wire count and gauge. All quantities include the labeled run segment only — adjust manually for site-specific routing.
              </p>
            </div>
          </details>
        )}

        {/* ═══ VAN LOADING LIST ═══ */}
        {shopList.length > 0 && (
          <div style={{ ...cd, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: ac }}>VAN LOADING LIST — By Warehouse Location</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: ff, fontSize: 11, color: shopChecked === shopTotal ? gn : tx }}>
                {shopChecked} of {shopTotal} items packed
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: `${bd}40`, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: shopTotal > 0 ? `${(shopChecked / shopTotal) * 100}%` : "0%", background: shopChecked === shopTotal ? gn : ac, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            {shopList.map(([loc, items]) => {
              const locChecked = items.filter(it => checked[it.key]).length;
              return (
                <details key={loc} open style={{ marginBottom: 6 }}>
                  <summary style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: tx, cursor: "pointer", padding: "6px 0", borderBottom: `1px solid ${bd}20`, userSelect: "none" }}>
                    {loc} <span style={{ fontWeight: 400, color: td }}>({locChecked}/{items.length})</span>
                  </summary>
                  <div style={{ paddingLeft: 4 }}>
                    {items.map(({ it, key }) => {
                      const done = checked[key];
                      return (
                        <div key={key} onClick={() => toggle(key)}
                          style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 8px", cursor: "pointer", borderBottom: `1px solid ${bd}08`,
                            opacity: done ? 0.45 : 1, textDecoration: done ? "line-through" : "none" }}>
                          <span style={{ fontSize: 14, color: done ? gn : td, flexShrink: 0 }}>{done ? "\u2611" : "\u2610"}</span>
                          <span style={{ fontFamily: ff, fontSize: 11, flex: 1 }}>{it.d}</span>
                          <span style={{ fontFamily: ff, fontSize: 11, color: ac, fontWeight: 600, minWidth: 36, textAlign: "right" }}>{it.q}</span>
                          <span style={{ fontFamily: ff, fontSize: 10, color: td, minWidth: 30 }}>{it.u}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}

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
