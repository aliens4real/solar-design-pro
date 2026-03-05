import { ff, c1, bd, ac, tx, td } from '../theme.js';
import { WIRE_AREA } from '../data/nec-tables.js';
import { minConduit } from '../calc/nec-sizing.js';

// Equipment icon box
export const eqBox = (x, y, w, h, label, sub, color, icon) => (
  <g key={label + x + y}>
    <rect x={x} y={y} width={w} height={h} rx={4} fill={color + "18"} stroke={color} strokeWidth={1.5} />
    <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fill={color} fontSize={icon ? 16 : 10} fontFamily={ff}>{icon || ""}</text>
    <text x={x + w / 2} y={y + h + 12} textAnchor="middle" fill={tx} fontSize={9} fontWeight={700} fontFamily={ff}>{label}</text>
    {sub && <text x={x + w / 2} y={y + h + 22} textAnchor="middle" fill={td} fontSize={7.5} fontFamily={ff}>{sub}</text>}
  </g>
);

// Dashed connection line
export const dashLine = (x1, y1, x2, y2, clr) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={clr || "#94a3b8"} strokeWidth={1.2} strokeDasharray="4,3" />
);

// Label badge
export const badge = (x, y, text, clr) => (
  <g>
    <rect x={x - text.length * 3.2} y={y - 7} width={text.length * 6.4} height={14} rx={3} fill={clr || ac} opacity={0.12} />
    <text x={x} y={y + 3} textAnchor="middle" fill={clr || ac} fontSize={8} fontWeight={600} fontFamily={ff}>{text}</text>
  </g>
);

// Wire spec tag — compact multi-line label
export const specTag = (x, y, spec, rot) => {
  if (!spec) return null;
  const lines = [];
  spec.wires.forEach(w => { lines.push(`${w.n > 1 ? w.n + "× " : ""}#${w.g} ${w.t}`); });
  if (spec.conduit && spec.conduit !== "—") lines.push(`${spec.conduit} EMT (${spec.fill}% fill, ${spec.limit}% max)`);
  else if (spec.conduit === "—") lines.push("No conduit req.");
  const lh = 10, pad = 4, w = Math.max(...lines.map(l => l.length * 4.6)) + pad * 2, h = lines.length * lh + pad * 2;
  const overFill = spec.fill > spec.limit;
  return <g key={"spec" + x + y} transform={rot ? `translate(${x},${y}) rotate(${rot})` : `translate(${x},${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={overFill ? "#fef2f2" : "#fffbeb"} stroke={overFill ? "#dc2626" : "#f59e0b"} strokeWidth={0.7} opacity={0.95} />
    {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + pad + lh * (i + 0.7)} textAnchor="middle" fill={overFill ? "#991b1b" : "#78350f"} fontSize={7} fontFamily={ff}>{l}</text>)}
  </g>;
};

// Conduit sizing for wire sets — NEC Chapter 9 Tables 1 & 4 compliant
export const calcConduit = (wires) => {
  const area = wires.reduce((s, w) => { const a = WIRE_AREA[w.g] || 0.02; return s + a * w.n; }, 0);
  const nCond = wires.reduce((s, w) => s + w.n, 0);
  const c = minConduit(area, nCond);
  return { wires, area: +area.toFixed(4), conduit: c.sz, fill: c.fill, limit: c.limit };
};

// Wire schedule table renderer
export const wireSchedule = (rows, ty, svW, title) => {
  return (
    <g>
      <rect x={16} y={ty} width={svW - 32} height={rows.length * 16 + 22} rx={6} fill={c1} stroke={bd} strokeWidth={1} opacity={0.95} />
      <text x={26} y={ty + 14} fill={ac} fontSize={9} fontWeight={700} fontFamily={ff}>{title}</text>
      {rows.map((r, i) => {
        const ry = ty + 24 + i * 16;
        const wTxt = r.spec.wires.map(w => `${w.n > 1 ? w.n + "×" : ""}#${w.g} ${w.t}`).join(" + ");
        const hasCond = r.spec.conduit && r.spec.conduit !== "—";
        const overFill = hasCond && r.spec.fill > r.spec.limit;
        const cTxt = hasCond ? ` → ${r.spec.conduit} EMT (${r.spec.fill}%/${r.spec.limit}% max)` : "";
        return <g key={i}>
          <rect x={26} y={ry - 8} width={8} height={8} rx={2} fill={r.clr} opacity={0.5} />
          <text x={40} y={ry - 1} fill={tx} fontSize={7.5} fontWeight={600} fontFamily={ff}>{r.seg}{r.len > 0 ? ` — ${r.len} ft` : ""}</text>
          <text x={200} y={ry - 1} fill={td} fontSize={7.5} fontFamily={ff}>[{r.circ}]</text>
          <text x={290} y={ry - 1} fill={overFill ? "#dc2626" : "#78350f"} fontSize={7.5} fontWeight={600} fontFamily={ff}>{wTxt}{cTxt}</text>
        </g>;
      })}
    </g>
  );
};

// Legend
export const legend = (svW, svH) => (
  <g>
    <rect x={svW - 230} y={svH - 50} width={218} height={40} rx={6} fill={c1} stroke={bd} strokeWidth={1} opacity={0.9} />
    <text x={svW - 218} y={svH - 32} fill={ac} fontSize={9} fontWeight={700} fontFamily={ff}>LEGEND</text>
    <line x1={svW - 218} y1={svH - 22} x2={svW - 192} y2={svH - 22} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4,3" />
    <text x={svW - 188} y={svH - 18} fill={td} fontSize={8} fontFamily={ff}>Conduit Run</text>
    <rect x={svW - 120} y={svH - 26} width={10} height={10} rx={2} fill="#fffbeb" stroke="#f59e0b" strokeWidth={0.7} />
    <text x={svW - 106} y={svH - 18} fill={td} fontSize={8} fontFamily={ff}>Wire Spec</text>
  </g>
);
