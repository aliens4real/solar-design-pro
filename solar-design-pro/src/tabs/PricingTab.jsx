import { useState, useEffect, useMemo } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn, rd, bt, cd, inp, lb } from '../theme.js';

// ── Skill Levels ──
const SKILLS = [
  { id: "foreman",     lb: "Foreman",         rate: 55 },
  { id: "electrician", lb: "Electrician",      rate: 50 },
  { id: "lead",        lb: "Lead Installer",   rate: 45 },
  { id: "journeyman",  lb: "Journeyman",       rate: 35 },
  { id: "apprentice",  lb: "Apprentice",        rate: 25 },
];
const HRS = 8;
const PRC_KEY = "sdp_pricing";

function loadPricing() {
  try { const s = localStorage.getItem(PRC_KEY); return s ? JSON.parse(s) : null; }
  catch { return null; }
}

function estimateDays(totalMods, ni, mt, teamSz) {
  const base = Math.ceil((totalMods || 0) / 8);
  const mult = { roof: 1.0, ground: 1.2, carport: 1.3 }[mt] || 1.0;
  const invAdj = Math.max(0, (ni - 1)) * 0.5;
  const teamF = 3 / Math.max(1, teamSz);
  return Math.max(1, Math.ceil((base * mult + invAdj) * teamF));
}

const DEF_TEAM = [
  { id: 1, nm: "Lead Installer",  skill: "lead",       rate: 45 },
  { id: 2, nm: "Journeyman #1",   skill: "journeyman", rate: 35 },
  { id: 3, nm: "Apprentice #1",   skill: "apprentice",  rate: 25 },
];

export default function PricingTab({ pk, dsg, pj, totalMods, totalKw, md, iv, ivs, logo }) {
  const saved = loadPricing();
  const [matMkup, setMatMkup] = useState(saved?.matMkup ?? 30);
  const [labMkup, setLabMkup] = useState(saved?.labMkup ?? 15);
  const [team, setTeam] = useState(saved?.team ?? DEF_TEAM);
  const [dayOvr, setDayOvr] = useState(saved?.dayOverride ?? null);

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(PRC_KEY, JSON.stringify({ matMkup, labMkup, team, dayOverride: dayOvr })); } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [matMkup, labMkup, team, dayOvr]);

  // Team CRUD
  const addMember = () => {
    const sk = SKILLS[4];
    setTeam(t => [...t, { id: Date.now(), nm: `${sk.lb} #${t.filter(m => m.skill === sk.id).length + 1}`, skill: sk.id, rate: sk.rate }]);
  };
  const updMember = (id, k, v) => setTeam(t => t.map(m => m.id === id ? { ...m, [k]: v } : m));
  const delMember = (id) => setTeam(t => t.length > 1 ? t.filter(m => m.id !== id) : t);

  // Calculations
  const matCost = useMemo(() => pk.reduce((s, i) => s + i.t, 0), [pk]);
  const matMarked = matCost * (1 + matMkup / 100);
  const matProfit = matMarked - matCost;

  const ni = dsg?.ni || 1;
  const mt = pj?.mt || "roof";
  const estDays = estimateDays(totalMods, ni, mt, team.length);
  const days = dayOvr != null ? dayOvr : estDays;

  const dailyCosts = team.map(m => ({ ...m, daily: m.rate * HRS, total: m.rate * HRS * days }));
  const labCost = dailyCosts.reduce((s, m) => s + m.total, 0);
  const labMarked = labCost * (1 + labMkup / 100);
  const labProfit = labMarked - labCost;

  const totalCost = matMarked + labMarked;
  const totalProfit = matProfit + labProfit;
  const pricePerWatt = totalKw > 0 ? totalCost / (totalKw * 1000) : 0;

  // Inverter summary
  const invSummary = useMemo(() => {
    if (ivs && ivs.length > 0) return ivs.map(e => `${e.inv.nm} (${e.qty}x)`).join(", ");
    if (iv) return iv.nm;
    return "—";
  }, [iv, ivs]);
  const totalInvQty = ivs && ivs.length > 0 ? ivs.reduce((s, e) => s + e.qty, 0) : (dsg?.ni || 1);

  // Print quote
  const printQuote = () => {
    const addr = [pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ") || "—";
    const mtLabel = { roof: "Roof Mount", ground: "Ground Mount", carport: "Carport" }[mt] || "Roof Mount";
    const scope = [
      `Install ${totalMods} x ${md?.nm || "solar modules"} (${md?.w || 0}W each)`,
      `Install ${totalInvQty} x ${iv?.nm || "inverter"}${iv?.tp === "micro" ? " microinverter(s)" : ""}`,
      `${mtLabel} racking system with all required flashing and attachments`,
      `Complete DC and AC wiring per NEC 2023`,
      `${pj.es || 200}A service entrance interconnection`,
      `Grounding and bonding per NEC Article 250`,
      `All required labeling per NEC 690`,
      `System commissioning and performance verification`,
    ];
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Quote — ${pj.nm || "Solar Installation"}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 750px; margin: 40px auto; color: #1a1a2e; line-height: 1.6; }
  .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 2px solid #d48c00; }
  .letterhead img { height: 50px; width: auto; }
  .letterhead .co-info { text-align: right; flex: 1; font-size: 11px; color: #5c6370; line-height: 1.5; }
  .letterhead .co-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
  h1 { font-size: 22px; color: #d48c00; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #d48c00; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 8px; border-bottom: 1px solid #d0d5dd; padding-bottom: 4px; }
  .sub { color: #5c6370; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { text-align: left; padding: 6px 10px; background: #eef1f5; border-bottom: 1px solid #d0d5dd; font-weight: 600; font-size: 10px; color: #d48c00; }
  td { padding: 6px 10px; border-bottom: 1px solid #eef1f5; }
  .r { text-align: right; }
  .b { font-weight: 700; }
  .total-row td { border-top: 2px solid #d48c00; font-weight: 700; font-size: 14px; padding: 10px; }
  .scope li { margin-bottom: 4px; font-size: 12px; }
  .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #d0d5dd; font-size: 10px; color: #5c6370; }
  .metric { display: inline-block; margin-right: 24px; }
  .metric span { font-weight: 700; color: #d48c00; }
  @media print { body { margin: 20px; } }
</style></head><body>

<div class="letterhead">
  ${logo ? `<img src="${logo}" alt="Company Logo" />` : ""}
  <div class="co-info">
    <div class="co-name">Canopy Solar</div>
    1020 W State St Suite B<br>
    Salem, OH 44460<br>
    (330) 702-0147
  </div>
</div>

<h1>Solar Installation Quote</h1>
<div class="sub">${today}</div>

<h2>Project Details</h2>
<table>
  <tr><td class="b" style="width:140px">Project</td><td>${pj.nm || "Solar Installation"}</td></tr>
  <tr><td class="b">Address</td><td>${addr}</td></tr>
  <tr><td class="b">System Size</td><td>${totalKw.toFixed(2)} kW DC</td></tr>
  <tr><td class="b">Est. Annual Production</td><td>${dsg?.kwh ? dsg.kwh.toLocaleString() + " kWh" : "—"}</td></tr>
</table>

<h2>System Components</h2>
<table>
  <thead><tr><th>Component</th><th>Specification</th><th class="r">Qty</th></tr></thead>
  <tbody>
    <tr><td>Solar Modules</td><td>${md?.nm || "—"} (${md?.w || 0}W)</td><td class="r">${totalMods}</td></tr>
    <tr><td>Inverter${totalInvQty > 1 ? "s" : ""}</td><td>${invSummary}</td><td class="r">${totalInvQty}</td></tr>
    <tr><td>Mount Type</td><td>${mtLabel}</td><td class="r">—</td></tr>
    <tr><td>Service</td><td>${pj.es || 200}A</td><td class="r">—</td></tr>
  </tbody>
</table>

<h2>Pricing</h2>
<table>
  <thead><tr><th>Item</th><th class="r">Amount</th></tr></thead>
  <tbody>
    <tr><td>Materials & Equipment</td><td class="r">$${matMarked.toFixed(2)}</td></tr>
    <tr><td>Labor & Installation (${days} day${days !== 1 ? "s" : ""}, ${team.length}-person crew)</td><td class="r">$${labMarked.toFixed(2)}</td></tr>
  </tbody>
  <tfoot>
    <tr class="total-row"><td>TOTAL</td><td class="r">$${totalCost.toFixed(2)}</td></tr>
  </tfoot>
</table>

<div style="margin-bottom:16px">
  <span class="metric">$/Watt: <span>$${pricePerWatt.toFixed(2)}</span></span>
  ${dsg?.kwh > 0 ? `<span class="metric">$/kWh (yr 1): <span>$${(totalCost / dsg.kwh).toFixed(2)}</span></span>` : ""}
</div>

<h2>Scope of Work</h2>
<ul class="scope">
  ${scope.map(s => `<li>${s}</li>`).join("\n  ")}
</ul>

<div class="footer">
  This quote is valid for 30 days from the date above. Pricing does not include permits, utility interconnection fees, or structural engineering (if required). Final pricing may vary based on site conditions discovered during installation.
  <br><br>
  <strong>Canopy Solar</strong> | 1020 W State St Suite B, Salem, OH 44460 | (330) 702-0147
</div>

</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const hdr = { fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }} className="fi">
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: 0, fontWeight: 700 }}>$ Project Pricing</h2>
        <div style={{ flex: 1 }} />
        {dsg && <div style={{ fontFamily: ff, fontSize: 11, color: gn }}>{totalMods} modules / {totalKw.toFixed(1)} kW</div>}
      </div>

      {pk.length === 0 ? (
        <div style={{ ...cd, textAlign: "center", padding: 40, color: td }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>$</div>
          <div style={{ fontFamily: ff }}>Generate a design and pack list first</div>
        </div>
      ) : (<>

        {/* ═══ MATERIAL COST ═══ */}
        <div style={{ ...cd, marginBottom: 14 }}>
          <div style={hdr}>Material Cost</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, alignItems: "end" }}>
            <div>
              <label style={lb}>Base Material Cost</label>
              <div style={{ fontFamily: ff, fontSize: 18, fontWeight: 700, color: tx }}>${matCost.toFixed(2)}</div>
              <div style={{ fontFamily: ff, fontSize: 10, color: td }}>{pk.length} line items</div>
            </div>
            <div>
              <label style={lb}>Markup %</label>
              <input style={inp} type="number" min={0} max={200} step={1} value={matMkup}
                onChange={e => setMatMkup(Math.max(0, +e.target.value || 0))} />
            </div>
            <div>
              <label style={lb}>Customer Price</label>
              <div style={{ fontFamily: ff, fontSize: 18, fontWeight: 700, color: ac }}>${matMarked.toFixed(2)}</div>
              <div style={{ fontFamily: ff, fontSize: 10, color: gn }}>+${matProfit.toFixed(2)} profit</div>
            </div>
          </div>
        </div>

        {/* ═══ LABOR ESTIMATOR ═══ */}
        <div style={{ ...cd, marginBottom: 14 }}>
          <div style={hdr}>Labor Estimator</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lb}>Est. Install Days</label>
              <div style={{ fontFamily: ff, fontSize: 18, fontWeight: 700, color: dayOvr != null ? ac : tx }}>{days}</div>
              <div style={{ fontFamily: ff, fontSize: 9, color: td }}>
                {dayOvr != null ? "Manual override" : `Auto: ${totalMods} mods / ${mt}`}
              </div>
            </div>
            <div>
              <label style={lb}>Override Days</label>
              <input style={inp} type="number" min={1} max={99} step={1}
                value={dayOvr ?? ""} placeholder={String(estDays)}
                onChange={e => { const v = e.target.value; setDayOvr(v === "" ? null : Math.max(1, +v || 1)); }} />
            </div>
            <div>
              <label style={lb}>Team Size</label>
              <div style={{ fontFamily: ff, fontSize: 18, fontWeight: 700, color: tx }}>{team.length}</div>
            </div>
            <div>
              <label style={lb}>Labor Markup %</label>
              <input style={inp} type="number" min={0} max={200} step={1} value={labMkup}
                onChange={e => setLabMkup(Math.max(0, +e.target.value || 0))} />
            </div>
          </div>

          {/* Team table */}
          <div style={{ background: c2, borderRadius: 6, overflow: "hidden", border: `1px solid ${bd}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, fontSize: 11 }}>
              <thead><tr style={{ background: c2 }}>
                {["Name", "Skill Level", "$/hr", "Daily", "Total", ""].map(h =>
                  <th key={h} style={{ padding: "8px 10px", textAlign: h === "Name" || h === "Skill Level" ? "left" : "right", color: ac, fontSize: 10, borderBottom: `1px solid ${bd}`, fontWeight: 600 }}>{h}</th>
                )}
              </tr></thead>
              <tbody>{dailyCosts.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${bd}08`, background: c1 }}>
                  <td style={{ padding: "6px 10px" }}>
                    <input style={{ ...inp, padding: "4px 8px", fontSize: 11 }} value={m.nm}
                      onChange={e => updMember(m.id, "nm", e.target.value)} />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <select style={{ ...inp, padding: "4px 8px", fontSize: 11 }} value={m.skill}
                      onChange={e => updMember(m.id, "skill", e.target.value)}>
                      {SKILLS.map(s => <option key={s.id} value={s.id}>{s.lb}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", width: 80 }}>
                    <input style={{ ...inp, padding: "4px 8px", fontSize: 11, textAlign: "right" }}
                      type="number" min={10} max={200} step={1} value={m.rate}
                      onChange={e => updMember(m.id, "rate", +e.target.value || 25)} />
                  </td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: td }}>${m.daily.toFixed(0)}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: ac, fontWeight: 600 }}>${m.total.toFixed(0)}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center", width: 32 }}>
                    {team.length > 1 && <button onClick={() => delMember(m.id)}
                      style={{ background: "none", border: "none", color: rd, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>x</button>}
                  </td>
                </tr>
              ))}</tbody>
              <tfoot><tr style={{ background: c2 }}>
                <td colSpan={4} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: ac }}>LABOR COST</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: ac, fontSize: 13 }}>${labCost.toFixed(0)}</td>
                <td />
              </tr></tfoot>
            </table>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={addMember} style={{ ...bt(false), fontSize: 11, padding: "5px 12px" }}>+ Add Team Member</button>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: ff, fontSize: 11, color: td }}>
              Customer labor: <span style={{ color: ac, fontWeight: 700 }}>${labMarked.toFixed(0)}</span>
              <span style={{ color: gn, fontSize: 10, marginLeft: 6 }}>+${labProfit.toFixed(0)} profit</span>
            </div>
          </div>
        </div>

        {/* ═══ PROJECT SUMMARY ═══ */}
        <div style={{ ...cd, marginBottom: 14, background: `${ac}08`, border: `2px solid ${ac}` }}>
          <div style={hdr}>Project Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              ["Material", matMarked, `$${matCost.toFixed(0)} + ${matMkup}%`],
              ["Labor", labMarked, `$${labCost.toFixed(0)} + ${labMkup}%`],
              ["Total", totalCost, `$${totalProfit.toFixed(0)} profit`],
            ].map(([label, val, sub]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: ff, fontSize: 10, color: td, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: ff, fontSize: label === "Total" ? 24 : 20, fontWeight: 700, color: label === "Total" ? ac : tx }}>${val.toFixed(0)}</div>
                <div style={{ fontFamily: ff, fontSize: 9, color: label === "Total" ? gn : td }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${bd}`, paddingTop: 12, display: "flex", justifyContent: "space-around", fontFamily: ff, fontSize: 11 }}>
            <div><span style={{ color: td }}>$/Watt: </span><span style={{ color: ac, fontWeight: 700 }}>${pricePerWatt.toFixed(2)}</span></div>
            <div><span style={{ color: td }}>System: </span><span style={{ fontWeight: 600 }}>{totalKw.toFixed(1)} kW</span></div>
            <div><span style={{ color: td }}>Install: </span><span style={{ fontWeight: 600 }}>{days} day{days !== 1 ? "s" : ""}</span></div>
            <div><span style={{ color: td }}>Crew: </span><span style={{ fontWeight: 600 }}>{team.length}</span></div>
            {dsg?.kwh > 0 && <div><span style={{ color: td }}>$/kWh yr: </span><span style={{ color: ac, fontWeight: 700 }}>${(totalCost / dsg.kwh).toFixed(2)}</span></div>}
          </div>
        </div>

        {/* ═══ CUSTOMER QUOTE ═══ */}
        <div style={{ ...cd }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={hdr}>Customer Quote</span>
            <div style={{ flex: 1 }} />
            <button onClick={printQuote} style={{ ...bt(true), fontSize: 11, padding: "5px 14px" }}>Print Quote</button>
          </div>

          {/* Preview */}
          <div style={{ background: c2, borderRadius: 6, padding: 16, fontFamily: ff, fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: ac, marginBottom: 2 }}>Solar Installation Quote</div>
            <div style={{ color: td, fontSize: 10, marginBottom: 12 }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>

            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "4px 10px", marginBottom: 12, fontSize: 11 }}>
              <span style={{ color: td, fontWeight: 600 }}>Project</span><span>{pj.nm || "Solar Installation"}</span>
              <span style={{ color: td, fontWeight: 600 }}>Address</span><span>{[pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ") || "—"}</span>
              <span style={{ color: td, fontWeight: 600 }}>System Size</span><span>{totalKw.toFixed(2)} kW DC</span>
              <span style={{ color: td, fontWeight: 600 }}>Modules</span><span>{totalMods} x {md?.nm || "—"} ({md?.w || 0}W)</span>
              <span style={{ color: td, fontWeight: 600 }}>Inverter{totalInvQty > 1 ? "s" : ""}</span><span>{invSummary}</span>
              <span style={{ color: td, fontWeight: 600 }}>Mount</span><span>{{ roof: "Roof Mount", ground: "Ground Mount", carport: "Carport" }[mt] || "Roof Mount"}</span>
              {dsg?.kwh > 0 && <><span style={{ color: td, fontWeight: 600 }}>Est. Annual</span><span>{dsg.kwh.toLocaleString()} kWh</span></>}
            </div>

            <div style={{ borderTop: `1px solid ${bd}`, paddingTop: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Materials & Equipment</span><span style={{ fontWeight: 600 }}>${matMarked.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Labor & Installation ({days} day{days !== 1 ? "s" : ""})</span><span style={{ fontWeight: 600 }}>${labMarked.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${ac}`, paddingTop: 6, marginTop: 6 }}>
                <span style={{ fontWeight: 700, color: ac, fontSize: 13 }}>TOTAL</span>
                <span style={{ fontWeight: 700, color: ac, fontSize: 13 }}>${totalCost.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 10, color: td }}>
                <span>$/Watt: <b style={{ color: ac }}>${pricePerWatt.toFixed(2)}</b></span>
                {dsg?.kwh > 0 && <span>$/kWh (yr 1): <b style={{ color: ac }}>${(totalCost / dsg.kwh).toFixed(2)}</b></span>}
              </div>
            </div>
          </div>
        </div>

      </>)}
    </div>
  );
}
