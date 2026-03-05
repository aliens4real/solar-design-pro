import React from 'react';
import { MODS } from '../data/modules.js';
import { INVS } from '../data/inverters.js';
import { ff, fs, c1, c2, bd, ac, tx, td, gn, rd, bl, inp, lb, cd, bt } from '../theme.js';

const compass = (a) => +a === 180 ? "S" : +a === 0 || +a === 360 ? "N" : +a === 90 ? "E" : +a === 270 ? "W" : +a < 180 ? "SE" : "SW";

const pitchOpts = [["0","Flat (0°)"],["5","Low 1/12 (5°)"],["10","Low 2/12 (10°)"],["14","3/12 (14°)"],["18","4/12 (18°)"],["22","5/12 (22°)"],["27","6/12 (27°)"],["30","7/12 (30°)"],["34","8/12 (34°)"],["37","9/12 (37°)"],["40","10/12 (40°)"],["45","12/12 (45°)"]];

const svcOpts = ["100","125","150","200","225","320","400"];

export default function ProjectTab({
  pj, u, md, iv, sz, totalMods, totalKw, modGroups, addGroup, updGroup, delGroup,
  climBusy, climMsg, lookupClimate, climRan, invRec, setInvRec, recommendInverter,
  setTab, chat, addrQ, addrSug, addrOpen, addrLoading, addrRect, addrHi, addrRef, addrInpRef,
  searchAddr, pickAddr, setAddrOpen, updateRect, addrKey
}) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }} className="fi">

      {/* ═══ PROPERTY ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Property</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lb}>Project Name</label>
            <input style={inp} value={pj.nm} onChange={e => u("nm", e.target.value)} placeholder="Customer name or project ID" />
          </div>
          <div ref={addrRef} style={{ position: "relative" }}>
            <label style={lb}>Address</label>
            <input ref={addrInpRef} style={inp} value={addrQ !== undefined ? addrQ : (pj.ad ? `${pj.ad}, ${pj.ct || ""}, ${pj.st || ""} ${pj.zp || ""}`.replace(/,\s*,/g, ",").trim() : "")}
              onChange={e => { searchAddr(e.target.value); updateRect(); }}
              onFocus={() => { if (addrSug.length > 0) { setAddrOpen(true); updateRect(); } }}
              onKeyDown={addrKey}
              placeholder="123 Main St, City, State…"
              autoComplete="off" />
            {addrLoading && <div style={{ position: "absolute", right: 10, top: 26, fontSize: 10, color: td, fontFamily: ff }}>…</div>}
            {addrOpen && addrSug.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999, background: c1, border: `1px solid ${bd}`, borderTop: `2px solid ${ac}`, borderRadius: "0 0 8px 8px", maxHeight: 220, overflow: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {addrSug.map((s, i) => (
                  <div key={i} style={{ padding: "8px 12px", fontSize: 11, fontFamily: ff, cursor: "pointer", borderBottom: `1px solid ${bd}`, background: i === addrHi ? c2 : "transparent", transition: "background 0.1s" }}
                    onMouseEnter={() => {}}
                    onMouseDown={e => { e.preventDefault(); pickAddr(s); }}>
                    <div style={{ color: ac, fontWeight: 600 }}>{s.road}</div>
                    <div style={{ color: td, fontSize: 10 }}>{s.city}, {s.state} {s.zip}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ SYSTEM ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>System</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={lb}>Target kW</label>
            <input style={inp} type="number" step="0.1" value={pj.kw || ""} onChange={e => u("kw", e.target.value)} />
            {md && pj.kw && <div style={{ fontSize: 10, color: td, fontFamily: ff, marginTop: 3 }}>≈ {Math.ceil((pj.kw * 1000) / md.w)} modules @ {md.w}W</div>}
          </div>
          <div>
            <label style={lb}>Mount Type</label>
            <select style={inp} value={pj.mt || "roof"} onChange={e => u("mt", e.target.value)}>
              <option value="roof">Roof Mount</option>
              <option value="ground">Ground Mount</option>
              <option value="carport">Carport</option>
            </select>
          </div>
          <div>
            <label style={lb}>Roof Type</label>
            <select style={inp} value={pj.rf || "comp"} onChange={e => u("rf", e.target.value)}>
              <option value="comp">Comp Shingle</option>
              <option value="tile">Tile</option>
              <option value="metal">Standing Seam Metal</option>
              <option value="flat">Flat / TPO / EPDM</option>
              <option value="wood">Wood Shake</option>
            </select>
          </div>
          <div>
            <label style={lb}>Roof Pitch</label>
            <select style={inp} value={pj.rp || "22"} onChange={e => u("rp", e.target.value)}>
              {pitchOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={lb}>Electrical Service</label>
            <select style={inp} value={pj.es || "200"} onChange={e => u("es", e.target.value)}>
              {svcOpts.map(v => <option key={v} value={v}>{v}A{+v >= 320 ? " (commercial)" : ""}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ MODULE GROUPS ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ac, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Module Groups</div>
          <button style={{ ...bt(true), fontSize: 10, padding: "4px 10px" }} onClick={addGroup}>+ Add Group</button>
        </div>
        {modGroups.map((g, gi) => (
          <div key={g.id} style={{ ...cd, marginBottom: 10, background: c2, border: `1px solid ${bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <input style={{ ...inp, width: 160, fontWeight: 700, fontSize: 12 }} value={g.nm} onChange={e => updGroup(g.id, "nm", e.target.value)} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontFamily: ff, color: td }}>{compass(g.az)}</span>
                {modGroups.length > 1 && <button style={{ background: "none", border: "none", color: rd, cursor: "pointer", fontSize: 14, fontWeight: 700 }} onClick={() => delGroup(g.id)}>×</button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={lb}>Modules</label>
                <input style={inp} type="number" min="1" value={g.cnt} onChange={e => updGroup(g.id, "cnt", +e.target.value)} />
              </div>
              <div>
                <label style={lb}>Azimuth °</label>
                <input style={inp} type="number" min="0" max="360" value={g.az} onChange={e => updGroup(g.id, "az", +e.target.value)} />
              </div>
              <div>
                <label style={lb}>Orientation</label>
                <select style={inp} value={g.ori || "portrait"} onChange={e => updGroup(g.id, "ori", e.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label style={lb}>Pitch °</label>
                <select style={inp} value={g.pitch || pj.rp || "22"} onChange={e => updGroup(g.id, "pitch", e.target.value)}>
                  {pitchOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <div>
                  <label style={lb}>Width</label>
                  <input style={inp} type="number" min="1" value={g.cols || 1} onChange={e => updGroup(g.id, "cols", +e.target.value)} />
                </div>
                <div>
                  <label style={lb}>Depth</label>
                  <input style={inp} type="number" min="1" value={g.rows || 1} onChange={e => updGroup(g.id, "rows", +e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: ff, color: td, marginTop: 6 }}>
          <span>Target: {pj.kw || "—"} kW</span>
          <span style={{ color: totalKw >= (pj.kw || 0) ? gn : rd, fontWeight: 700 }}>Actual: {totalMods} modules = {totalKw.toFixed(2)} kW</span>
        </div>
      </div>

      {/* ═══ CLIMATE DATA ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Climate Data — ASHRAE</div>
        {climBusy ? <div style={{ fontSize: 12, fontFamily: ff, color: td }}>{climMsg || "Loading climate data…"}</div>
        : pj.tl ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={lb}>ASHRAE Min °C</label>
              <input style={inp} type="number" value={pj.tl} onChange={e => u("tl", +e.target.value)} />
            </div>
            <div>
              <label style={lb}>ASHRAE Max °C</label>
              <input style={inp} type="number" value={pj.th} onChange={e => u("th", +e.target.value)} />
            </div>
            <div>
              <label style={lb}>Irradiance kWh/m²/day</label>
              <input style={inp} type="number" step="0.1" value={pj.ir || ""} onChange={e => u("ir", +e.target.value)} />
            </div>
            <div>
              <label style={lb}>PSH hrs</label>
              <input style={inp} type="number" step="0.1" value={pj.psh || ""} onChange={e => u("psh", +e.target.value)} />
            </div>
          </div>
        ) : <div style={{ fontSize: 12, fontFamily: ff, color: td }}>No climate data yet — enter address and city above</div>}
        {pj.ct && <button style={{ ...bt(false), fontSize: 10, marginTop: 8 }} onClick={() => { climRan.current = false; lookupClimate(); }} disabled={climBusy}>🔍 Re-Lookup Climate</button>}
      </div>

      {/* ═══ MODULE SELECTOR ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Module</div>
        <select style={{ ...inp, marginBottom: 8 }} value={md?.id || ""} onChange={e => u("mi", e.target.value)}>
          <option value="">— Select Module —</option>
          <optgroup label="Qcells Q.TRON (N-Type TOPCon)">
            {MODS.filter(m => m.id.startsWith("qt")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="Qcells Q.PEAK DUO (PERC)">
            {MODS.filter(m => m.id.startsWith("qp")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="Silfab Prime NTC">
            {MODS.filter(m => m.id.startsWith("sf") && m.id.includes("4") && !m.id.includes("bg")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="Silfab Elite (IBC)">
            {MODS.filter(m => m.id.includes("bg")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="REC Alpha Pure-RX">
            {MODS.filter(m => m.id.startsWith("rx")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="REC Alpha Pure-R">
            {MODS.filter(m => m.id.startsWith("rr")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
          <optgroup label="REC Alpha Pure 2">
            {MODS.filter(m => m.id.startsWith("r2")).map(m => <option key={m.id} value={m.id}>{m.nm} — {m.w}W</option>)}
          </optgroup>
        </select>
        {md && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, fontSize: 10, fontFamily: ff }}>
            {[["Voc", md.voc + "V"], ["Isc", md.isc + "A"], ["Vmp", md.vmp + "V"], ["Imp", md.imp + "A"], ["TkVoc", md.tkV + "%/°C"], ["Cells", md.c], ["Tech", md.c === 66 ? "IBC" : md.c === 108 ? "TOPCon" : md.c === 132 ? "PERC" : md.c === 144 ? "HJT" : md.c === 120 ? "HJT" : "—"]].map(([l, v]) => (
              <div key={l} style={{ background: c2, borderRadius: 4, padding: "6px 4px", textAlign: "center" }}>
                <div style={{ color: td, fontSize: 9 }}>{l}</div>
                <div style={{ fontWeight: 700, color: tx }}>{v}</div>
              </div>
            ))}
          </div>
          {pj.kw > 0 && (() => {
            const target = +pj.kw;
            const needed = Math.ceil((target * 1000) / md.w);
            const actualKw = (totalMods * md.w) / 1000;
            const diff = actualKw - target;
            const pct = target > 0 ? ((actualKw / target) * 100).toFixed(0) : 0;
            const met = actualKw >= target;
            return (
              <div style={{ marginTop: 8, padding: "8px 12px", background: c2, borderRadius: 6, borderLeft: `3px solid ${met ? gn : rd}`, fontSize: 11, fontFamily: ff, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: td }}>Need <b style={{ color: tx }}>{needed}</b> modules for {target} kW</span>
                <span style={{ color: met ? gn : rd, fontWeight: 700 }}>
                  {totalMods} placed = {actualKw.toFixed(2)} kW ({pct}%) {met ? "✓" : `— ${Math.abs(diff).toFixed(2)} kW ${diff < 0 ? "short" : "over"}`}
                </span>
              </div>
            );
          })()}
        </>)}
      </div>

      {/* ═══ INVERTER SELECTOR ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ac, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Inverter</div>
          {md && totalKw > 0 && <button style={{ ...bt(false), fontSize: 10, padding: "4px 10px" }} onClick={recommendInverter}>⚡ Auto-Recommend</button>}
        </div>
        <select style={{ ...inp, marginBottom: 8 }} value={iv?.id || ""} onChange={e => u("ii", e.target.value)}>
          <option value="">— Select Inverter —</option>
          <optgroup label="SMA Sunny Boy Smart Energy">
            {INVS.filter(i => i.id.startsWith("sma")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
          <optgroup label="SolarEdge Home Hub">
            {INVS.filter(i => i.id.startsWith("se")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
          <optgroup label="Fronius Primo GEN24">
            {INVS.filter(i => i.id.startsWith("fr")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
          <optgroup label="Sol-Ark">
            {INVS.filter(i => i.id.startsWith("sa")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
          <optgroup label="Tigo">
            {INVS.filter(i => i.id.startsWith("tg")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
          <optgroup label="Enphase IQ8">
            {INVS.filter(i => i.id.startsWith("iq")).map(i => <option key={i.id} value={i.id}>{i.nm} — {i.kw}kW</option>)}
          </optgroup>
        </select>
        {invRec && <div style={{ fontSize: 11, fontFamily: ff, color: gn, marginBottom: 6 }}>{invRec}</div>}
        {iv && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, fontSize: 10, fontFamily: ff }}>
            {[["MaxDC", iv.dv + "V"], ["MPPT", iv.ml + "–" + iv.mh + "V"], ["MaxAC", iv.kw + "kW"], ["OCPD", iv.oc + "A"], ["Type", iv.tp], ["DC:AC", md ? ((totalKw / iv.kw).toFixed(2)) : "—"]].map(([l, v]) => (
              <div key={l} style={{ background: c2, borderRadius: 4, padding: "6px 4px", textAlign: "center" }}>
                <div style={{ color: td, fontSize: 9 }}>{l}</div>
                <div style={{ fontWeight: 700, color: tx }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ SITE DESCRIPTION ═══ */}
      <div style={{ ...cd, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Site Description</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lb}>Site Notes</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={pj.ds || ""} onChange={e => u("ds", e.target.value)} placeholder="Roof condition, shading, obstructions, access…" />
          </div>
          <div>
            <label style={lb}>Additional Notes</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={pj.ds2 || ""} onChange={e => u("ds2", e.target.value)} placeholder="HOA, utility, permitting, battery interest…" />
          </div>
        </div>
      </div>

      {/* ═══ QUICK STRING SIZING ═══ */}
      {sz && md && iv && (
        <div style={{ ...cd, marginBottom: 14, background: c2, borderColor: "#d48c00" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick String Sizing</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <div style={{ ...cd, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>MAX / STRING</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: ac, fontFamily: ff }}>{sz.mx}</div>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>Voc_corr = {sz.vc}V</div>
            </div>
            <div style={{ ...cd, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>MIN / STRING</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: bl, fontFamily: ff }}>{sz.mn}</div>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>Vmp_20yr = {sz.vd}V</div>
            </div>
            <div style={{ ...cd, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>MAX SYS V</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: sz.sv <= iv.dv ? gn : rd, fontFamily: ff }}>{sz.sv}V</div>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>{sz.sv <= iv.dv ? "OK" : "OVER"} (max {iv.dv}V)</div>
            </div>
            <div style={{ ...cd, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>DC COND</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: gn, fontFamily: ff }}>{sz.dc}</div>
              <div style={{ fontSize: 9, color: td, fontFamily: ff }}>AWG @75°C</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ACTION BUTTONS ═══ */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, marginBottom: 20 }}>
        <button style={{ ...bt(true), flex: 1, fontSize: 13, padding: "12px 14px" }} onClick={() => {
          if (!pj.tl && !climBusy && pj.ct) { climRan.current = false; lookupClimate(); }
          setTab("ai");
          chat(`Project: ${pj.nm} | ${pj.ad}, ${pj.ct}, ${pj.st} ${pj.zp}\nTarget: ${pj.kw}kW | ${pj.mt} mount (${pj.rf}) | Service: ${pj.es}A\nGroups: ${modGroups.map(g => g.nm + ": " + g.cnt + " @ " + g.az + "° " + g.ori).join(", ")}\nTotal: ${totalMods} modules = ${totalKw.toFixed(2)} kW\nModule: ${md?.nm || "?"} | Inverter: ${iv?.nm || "?"}\n${pj.tl ? `Climate: ${pj.tl}°C min / ${pj.th}°C max | Irr: ${pj.ir} kWh/m²/day` : "Climate data is auto-loading."}\n${pj.ds ? `Site: ${pj.ds}` : ""}\n\nPlease design the optimal system.`);
        }}>▶ SEND TO AI DESIGNER</button>
        <button style={{ ...bt(false), fontSize: 13, padding: "12px 14px" }} onClick={() => setTab("electrical")}>⚡ Electrical</button>
        <button style={{ ...bt(false), fontSize: 13, padding: "12px 14px" }} onClick={() => setTab("layout")}>◫ Layout</button>
      </div>

    </div>
  );
}
