import { ff, td, ac } from '../theme.js';

export default function Header({ logo, pj, dsg }) {
  return (
    <div style={{ background: "#fff", borderBottom: "2px solid #d0d5dd", padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {logo ? <img src={logo} style={{ height: 36, objectFit: "contain" }} alt="Logo" /> :
        <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${ac},#ffcc40)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 700 }}>☀</div>}
      <div>
        <div style={{ fontFamily: ff, fontSize: 15, fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.06em" }}>SOLAR DESIGN PRO</div>
        <div style={{ fontSize: 9.5, color: td, fontFamily: ff, letterSpacing: "0.08em" }}>NABCEP-COMPLIANT PV SYSTEM DESIGNER</div>
      </div>
      <div style={{ flex: 1 }} />
      {pj.nm && <div style={{ fontFamily: ff, fontSize: 11, color: td }}>PROJECT: <span style={{ color: ac, fontWeight: 700 }}>{pj.nm}</span></div>}
      {dsg && <div style={{ fontFamily: ff, fontSize: 11, color: "#059669", marginLeft: 12 }}>● DESIGN ACTIVE</div>}
    </div>
  );
}
