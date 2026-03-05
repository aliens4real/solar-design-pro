import { ff, fs, c1, c2, bd, ac, tx, td, bl, bt, cd, inp } from '../theme.js';

export default function AiDesignTab({ ms, ci, sCi, cb, chat, cr }) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 150px)" }} className="fi">
      <div style={{ ...cd, flex: 1, overflow: "auto", marginBottom: 10, padding: 12 }}>
        {ms.length === 0 && <div style={{ textAlign: "center", padding: 50, color: td }}>
          <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.5 }}>◈</div>
          <div style={{ fontFamily: ff, fontSize: 13 }}>AI Design Assistant Ready</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Fill in project details then click "Send to AI Designer"</div></div>}
        {ms.map((m, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, flexDirection: m.r === "user" ? "row-reverse" : "row" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: m.r === "user" ? bl : "#d48c00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#000", fontWeight: 700 }}>{m.r === "user" ? "Y" : "◈"}</div>
          <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 10, background: m.r === "user" ? "#e8f0fe" : c2, border: `1px solid ${m.r === "user" ? "#93b4f4" : bd}`, fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: fs }}>
            {m.t.replace(/```json[\s\S]*?```/g, "\n📊 [Design captured → see Electrical & Pack List tabs]\n")}</div></div>)}
        {cb && <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#d48c00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 }}>◈</div>
          <div style={{ padding: "10px 14px", borderRadius: 10, background: c2, border: `1px solid ${bd}`, color: td }}><span style={{ animation: "pu 1.5s infinite" }}>Analyzing project...</span></div></div>}
        <div ref={cr} /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ ...inp, flex: 1, fontFamily: fs, fontSize: 13 }} value={ci} onChange={e => sCi(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chat(ci); } }} placeholder="Describe, ask questions, or request changes..." />
        <button style={bt(true)} onClick={() => chat(ci)} disabled={cb}>SEND</button></div>
      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
        {["Generate optimal design now", "What info do you still need?", "Minimize cost", "Show string sizing math", "Add battery storage", "Switch to microinverters"].map(q =>
          <button key={q} style={{ ...bt(false), fontSize: 9.5, padding: "3px 8px" }} onClick={() => chat(q)}>{q}</button>)}
      </div>
    </div>
  );
}
