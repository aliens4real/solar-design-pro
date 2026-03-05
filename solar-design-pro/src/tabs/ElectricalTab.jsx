import { ff, c1, c2, bd, ac, tx, td, gn, rd, bl, bt, cd } from '../theme.js';

// String layout SVG colors
const SC = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#be185d", "#4f46e5"];

function StringLayout({ md, iv, sz, dsg }) {
  const ms = dsg.ms || sz.opt || 1;
  const ns = dsg.ns || 1;
  const ni = dsg.ni || 1;
  const mppt = iv.mppt || 1;
  const isMicro = iv.tp === "micro";

  if (isMicro) return null;

  // Assign strings to MPPT channels
  const channels = [];
  for (let i = 0; i < mppt; i++) channels.push([]);
  for (let s = 0; s < ns; s++) channels[s % mppt].push(s);

  // Per-string calcs
  const vmpStr = +(md.vmp * ms).toFixed(1);
  const vocStr = +(sz.vc * ms).toFixed(1);
  const vmpHot = +(sz.vh * ms).toFixed(1);
  const pStr = +(md.w * ms).toFixed(0);

  // Layout dimensions
  const modW = 24, modH = 16, modGap = 2;
  const maxModsShow = Math.min(ms, 16);
  const strW = maxModsShow * (modW + modGap) + 60;
  const strH = 62;
  const chPad = 12;
  const chHdrH = 22;
  const colW = strW + chPad * 2;
  const cols = Math.min(mppt, 4);
  const svW = cols * colW + 40;
  const maxRows = Math.max(...channels.map(c => c.length));
  const chH = chHdrH + maxRows * strH + chPad;

  // Inverter section
  const invY = chH + 20;
  const invH = 50;
  const summY = invY + invH + 16;
  const svH = summY + 80;

  return (
    <div style={{ ...cd, gridColumn: "span 2" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>STRING LAYOUT</div>
      <svg viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
        {/* MPPT Channels */}
        {channels.map((ch, ci) => {
          const cx = 20 + ci * colW;
          const clr = SC[ci % SC.length];
          return (
            <g key={ci}>
              {/* Channel header */}
              <rect x={cx} y={4} width={colW - 8} height={chH - 4} rx={6} fill={clr + "08"} stroke={clr} strokeWidth={1} strokeDasharray="4 2" />
              <text x={cx + chPad} y={18} fill={clr} fontSize={10} fontWeight={700} fontFamily={ff}>
                MPPT {ci + 1}{ni > 1 ? ` (Inv ${Math.floor(ci / (mppt / ni)) + 1})` : ""}
              </text>

              {/* Strings in this channel */}
              {ch.map((si, ri) => {
                const sy = chHdrH + ri * strH + 4;
                const sClr = SC[si % SC.length];
                return (
                  <g key={si}>
                    {/* String label */}
                    <text x={cx + chPad} y={sy + 12} fill={tx} fontSize={9} fontWeight={700} fontFamily={ff}>
                      String {si + 1} — {ms} modules
                    </text>

                    {/* Module boxes */}
                    {Array.from({ length: maxModsShow }).map((_, mi) => (
                      <rect key={mi}
                        x={cx + chPad + mi * (modW + modGap)} y={sy + 18}
                        width={modW} height={modH} rx={2}
                        fill={sClr + "30"} stroke={sClr} strokeWidth={0.8}
                      />
                    ))}
                    {ms > maxModsShow && (
                      <text x={cx + chPad + maxModsShow * (modW + modGap) + 4} y={sy + 30}
                        fill={td} fontSize={8} fontFamily={ff}>+{ms - maxModsShow}</text>
                    )}

                    {/* Series connection arrows */}
                    {Array.from({ length: Math.min(maxModsShow - 1, 15) }).map((_, mi) => (
                      <line key={`a${mi}`}
                        x1={cx + chPad + mi * (modW + modGap) + modW} y1={sy + 26}
                        x2={cx + chPad + (mi + 1) * (modW + modGap)} y2={sy + 26}
                        stroke={sClr} strokeWidth={0.5} opacity={0.4} />
                    ))}

                    {/* Voltage / Current / Power labels */}
                    <text x={cx + chPad} y={sy + 48} fill={ac} fontSize={8} fontWeight={600} fontFamily={ff}>
                      Vmp: {vmpStr}V
                    </text>
                    <text x={cx + chPad + 90} y={sy + 48} fill={bl} fontSize={8} fontWeight={600} fontFamily={ff}>
                      Imp: {md.imp}A
                    </text>
                    <text x={cx + chPad + 170} y={sy + 48} fill={gn} fontSize={8} fontWeight={600} fontFamily={ff}>
                      {pStr}W
                    </text>
                    <text x={cx + chPad + 220} y={sy + 48} fill={td} fontSize={7} fontFamily={ff}>
                      Voc(cold): {vocStr}V
                    </text>
                  </g>
                );
              })}

              {/* Wire down to inverter */}
              {ch.length > 0 && (
                <line x1={cx + colW / 2} y1={chH} x2={cx + colW / 2} y2={invY}
                  stroke={clr} strokeWidth={1.5} strokeDasharray="4 3" />
              )}
            </g>
          );
        })}

        {/* Inverter box(es) */}
        {Array.from({ length: ni }).map((_, ii) => {
          const invW = Math.min(160, (svW - 40) / ni - 10);
          const ix = 20 + ii * (invW + 10) + (svW - 40 - ni * (invW + 10) + 10) / 2;
          return (
            <g key={`inv${ii}`}>
              <rect x={ix} y={invY} width={invW} height={invH} rx={6}
                fill={ac + "15"} stroke={ac} strokeWidth={1.5} />
              <text x={ix + invW / 2} y={invY + 18} textAnchor="middle" fill={ac} fontSize={11} fontWeight={700} fontFamily={ff}>
                {iv.nm}
              </text>
              <text x={ix + invW / 2} y={invY + 32} textAnchor="middle" fill={td} fontSize={9} fontFamily={ff}>
                {iv.kw}kW {iv.tp === "optimizer" ? "w/ Optimizers" : iv.tp}
              </text>
              <text x={ix + invW / 2} y={invY + 44} textAnchor="middle" fill={td} fontSize={8} fontFamily={ff}>
                MPPT: {iv.ml}–{iv.mh}V | Max: {iv.dv}V
              </text>
            </g>
          );
        })}

        {/* Summary row */}
        <line x1={20} y1={summY - 4} x2={svW - 20} y2={summY - 4} stroke={bd} strokeWidth={0.5} />
        <text x={20} y={summY + 12} fill={ac} fontSize={10} fontWeight={700} fontFamily={ff}>SYSTEM TOTALS</text>
        {[
          [`Array: ${(dsg.tm * md.w / 1000).toFixed(1)} kWp`, 20],
          [`${ns} string${ns > 1 ? "s" : ""} × ${ms} modules = ${dsg.tm} total`, 130],
          [`DC:AC Ratio: ${(dsg.ratio || (dsg.tm * md.w / 1000 / (iv.kw * ni))).toFixed(2)}`, 370],
        ].map(([txt, x]) => (
          <text key={txt} x={x} y={summY + 28} fill={tx} fontSize={9} fontFamily={ff}>{txt}</text>
        ))}
        {[
          [`Vmp/string: ${vmpStr}V`, 20],
          [`Voc(cold)/string: ${vocStr}V ${vocStr <= iv.dv ? "OK" : "OVER!"}`, 130],
          [`Vmp(hot)/string: ${vmpHot}V ${vmpHot >= iv.ml ? "OK" : "BELOW MPPT!"}`, 320],
          [`Isc × 1.25: ${sz.im}A`, 540],
        ].map(([txt, x]) => (
          <text key={txt} x={x} y={summY + 44} fill={tx} fontSize={9} fontFamily={ff}>{txt}</text>
        ))}
        {[
          [`Per MPPT: ${Math.ceil(ns / mppt)} string${Math.ceil(ns / mppt) > 1 ? "s" : ""} parallel → ${(md.imp * Math.ceil(ns / mppt)).toFixed(1)}A`, 20],
          [`System Power: ${(dsg.tm * md.w / 1000).toFixed(1)}kW DC → ${(iv.kw * ni).toFixed(1)}kW AC`, 320],
        ].map(([txt, x]) => (
          <text key={txt} x={x} y={summY + 60} fill={tx} fontSize={9} fontFamily={ff}>{txt}</text>
        ))}
      </svg>
    </div>
  );
}

export default function ElectricalTab({ md, iv, sz, dsg, climBusy, lookupClimate, climRan, pj, ivs, totalIvKw }) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }} className="fi">
      <h2 style={{ fontFamily: ff, fontSize: 16, color: ac, margin: "0 0 14px", fontWeight: 700 }}>⚡ Electrical Design — NEC 690</h2>
      {!md || !iv ? <div style={{ ...cd, textAlign: "center", padding: 40, color: td }}><div style={{ fontFamily: ff }}>Select module & inverter on Project tab</div></div>
      : !sz ? <div style={{ ...cd, textAlign: "center", padding: 40, color: td }}><div style={{ fontFamily: ff }}>
        {climBusy ? "⏳ Loading ASHRAE climate data…" : "ASHRAE temperatures needed"}
      </div>{!climBusy && pj.ct && <button style={{ ...bt(true), marginTop: 12, fontSize: 11 }} onClick={() => { climRan.current = false; lookupClimate(); }}>🔍 Auto-Lookup Climate Data</button>}</div>
      : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...cd, gridColumn: "span 2", background: c2, borderColor: "#d48c00" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>STRING SIZING — NEC 690.7 METHOD 1</div>
          <div style={{ fontSize: 13, fontFamily: ff, lineHeight: 2 }}>
            <div style={{ color: td }}>Cold Temperature Correction (Max Voltage):</div>
            <div>TCF = 1 + ({md.tkV}% × ({sz.tL}°C − 25°C)) = <b style={{ color: ac }}>{sz.tf1.toFixed(4)}</b></div>
            <div>Voc_corr = {md.voc}V × {sz.tf1.toFixed(4)} = <b style={{ color: ac }}>{sz.vc}V</b></div>
            <div>Max mods = {iv.dv}V ÷ {sz.vc}V = {(iv.dv / sz.vc).toFixed(2)} → <b style={{ color: gn }}>{sz.mx} modules</b></div>
            <div style={{ color: td, marginTop: 8 }}>Hot Temperature (MPPT Window):</div>
            <div>T_cell = {sz.tH}°C + {sz.tCH - sz.tH}°C = {sz.tCH}°C</div>
            <div>Vmp_hot = {md.vmp}V × {sz.tf2.toFixed(4)} = <b style={{ color: bl }}>{sz.vh}V</b></div>
            <div>Vmp_20yr = {sz.vh}V × 0.9 = <b style={{ color: bl }}>{sz.vd}V</b></div>
            <div>Min mods = {iv.ml}V ÷ {sz.vd}V → <b style={{ color: bl }}>{sz.mn} modules</b></div>
            <div style={{ color: td, marginTop: 8 }}>Result:</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>✓ Optimal string = <span style={{ color: ac }}>{sz.opt} modules</span> (range: {sz.mn} – {Math.min(sz.mx, sz.mxM)})</div>
            <div>Max Vsys = {sz.vc}V × {sz.opt} = <span style={{ color: sz.sv <= iv.dv ? gn : rd, fontWeight: 700 }}>{sz.sv}V {sz.sv <= iv.dv ? "✓ OK" : "⚠ OVER"}</span></div>
          </div></div>

        <div style={cd}><div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>DC CIRCUIT — NEC 690.8</div>
          <div style={{ fontSize: 13, fontFamily: ff, lineHeight: 2 }}>
            <div>Imax = {md.isc}A × 1.25 = <b style={{ color: ac }}>{sz.im}A</b></div>
            <div>Min ampacity = {sz.im}A × 1.25 = <b style={{ color: ac }}>{sz.ma}A</b></div>
            <div>OCPD: <b style={{ color: gn }}>{sz.oc}A</b></div>
            <div>Conductor: <b style={{ color: gn }}>{sz.dc} AWG</b> ({sz.dcA}A @75°C)</div></div></div>

        <div style={cd}><div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>AC CIRCUIT — NEC 705.12</div>
          <div style={{ fontSize: 13, fontFamily: ff, lineHeight: 2 }}>
            <div>AC current: {iv.ai}A × 1.25 = <b style={{ color: ac }}>{(iv.ai * 1.25).toFixed(1)}A</b></div>
            <div>AC OCPD: <b style={{ color: gn }}>{iv.oc}A</b></div>
            <div>Conductor: <b style={{ color: gn }}>{sz.ac} AWG</b> ({sz.acA}A @75°C)</div>
            <div style={{ color: td, fontSize: 10, marginTop: 6 }}>120% rule: Main + (inv×1.25) ≤ 120% × busbar</div></div></div>

        {dsg && <div style={{ ...cd, gridColumn: "span 2" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>DESIGN SUMMARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, fontSize: 11, fontFamily: ff }}>
            {[["Modules", dsg.tm], ["Strings", dsg.ns + "×" + dsg.ms], ["Inverters", dsg.ni], ["DC:AC", (dsg.ratio || 0).toFixed(2)],
              ["Annual kWh", (dsg.kwh || 0).toLocaleString()], ["Array kW", ((dsg.tm * md.w) / 1000).toFixed(1)], ["Cost", "$" + (dsg.cost || 0).toLocaleString()]
            ].map(([l, v]) => <div key={l} style={{ ...cd, padding: 8, background: c1 }}><div style={{ color: td, fontSize: 9 }}>{l}</div><div style={{ fontSize: 16, fontWeight: 700, color: ac }}>{v}</div></div>)}
          </div>
          {dsg.notes?.length > 0 && <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ color: ac, fontWeight: 700, fontSize: 11, fontFamily: ff, marginBottom: 4 }}>DESIGN NOTES:</div>
            {dsg.notes.map((n, i) => <div key={i} style={{ paddingLeft: 12, borderLeft: `2px solid ${bd}`, marginBottom: 4 }}>• {n}</div>)}</div>}
        </div>}

        {/* Multi-inverter summary */}
        {ivs && ivs.length > 1 && (
          <div style={{ ...cd, gridColumn: "span 2", background: c2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ac, marginBottom: 10, fontFamily: ff }}>INVERTER SUMMARY</div>
            <div style={{ fontSize: 11, fontFamily: ff, marginBottom: 6, color: td }}>Primary inverter ({iv?.nm}) used for string sizing. All inverters listed below.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 10, fontFamily: ff }}>
              {ivs.map((e, i) => (
                <div key={e.id} style={{ ...cd, padding: 8, background: c1, borderLeft: i === 0 ? `3px solid ${ac}` : "none" }}>
                  <div style={{ color: td, fontSize: 9 }}>{i === 0 ? "PRIMARY" : `Inverter ${i + 1}`}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ac }}>{e.inv.nm}</div>
                  <div style={{ color: tx }}>{e.inv.kw}kW x {e.qty} = {(e.inv.kw * e.qty).toFixed(1)}kW</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, fontFamily: ff, color: tx }}>
              Total AC capacity: <b style={{ color: ac }}>{totalIvKw.toFixed(1)} kW</b>
            </div>
          </div>
        )}

        {/* String Layout Diagram */}
        {dsg && <StringLayout md={md} iv={iv} sz={sz} dsg={dsg} />}
      </div>}
    </div>
  );
}
