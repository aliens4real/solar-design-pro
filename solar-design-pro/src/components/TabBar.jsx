import { ff, c1, bd, ac, td } from '../theme.js';

const TBS = [
  { id: "project", ic: "⬡", lb: "PROJECT" },
  { id: "ai", ic: "◈", lb: "AI DESIGN" },
  { id: "electrical", ic: "⚡", lb: "ELECTRICAL" },
  { id: "layout", ic: "◫", lb: "LAYOUT" },
  { id: "plans", ic: "📋", lb: "PLANS" },
  { id: "photos", ic: "◻", lb: "PHOTOS" },
  { id: "packlist", ic: "▤", lb: "PACK LIST" },
];

export default function TabBar({ tab, setTab }) {
  return (
    <div style={{ display: "flex", background: c1, borderBottom: `1px solid ${bd}` }}>
      {TBS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          flex: 1, padding: "10px 6px 8px", background: "transparent", border: "none",
          borderBottom: tab === t.id ? `2px solid ${ac}` : "2px solid transparent",
          color: tab === t.id ? ac : td, fontFamily: ff, fontSize: 11, cursor: "pointer",
          fontWeight: 600, letterSpacing: "0.06em"
        }}>
          <span style={{ fontSize: 16, display: "block", marginBottom: 2, opacity: tab === t.id ? 1 : 0.5 }}>{t.ic}</span>{t.lb}
        </button>
      ))}
    </div>
  );
}
