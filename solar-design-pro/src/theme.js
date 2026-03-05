// ── Theme Constants ──
// Fonts
export const ff = "'IBM Plex Mono',monospace";
export const fs = "'Outfit',system-ui,sans-serif";

// Colors
export const bg = "#f5f6f8";
export const c1 = "#ffffff";
export const c2 = "#eef1f5";
export const bd = "#d0d5dd";
export const ac = "#d48c00";
export const tx = "#1a1a2e";
export const td = "#5c6370";
export const tb = "#f1f5f9";
export const gn = "#059669";
export const rd = "#dc2626";
export const bl = "#2563eb";

// Reusable style objects
export const inp = { width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${bd}`, background: c1, color: tx, fontFamily: ff, fontSize: 13, outline: "none", boxSizing: "border-box" };
export const lb = { display: "block", fontSize: 10, color: td, marginBottom: 3, fontFamily: ff, textTransform: "uppercase", letterSpacing: "0.08em" };
export const cd = { background: c1, border: `1px solid ${bd}`, borderRadius: 8, padding: 16 };
export const bt = (on) => ({ padding: "7px 14px", borderRadius: 6, border: on ? "none" : `1px solid ${bd}`, background: on ? ac : "transparent", color: on ? "#fff" : tx, fontFamily: ff, fontSize: 13, fontWeight: 600, cursor: "pointer" });
