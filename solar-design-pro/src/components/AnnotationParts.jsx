import { ff } from '../theme.js';
import { DEF_W, DEF_H } from '../calc/annotation-geo.js';

const HANDLE_SZ = 8;

export function McatBtn({ m, sel, onClick }) {
  const active = sel === m.id;
  return (
    <button onClick={onClick} title={m.lb} style={{
      width: 40, height: 40, borderRadius: 6, border: active ? `2px solid #d48c00` : `1px solid #e5e7eb`,
      background: active ? m.cl + "22" : "#ffffff", cursor: "pointer", padding: 0, display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={m.cl} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"><path d={m.svg} /></svg>
    </button>
  );
}

export function MarkerIcon({ mk, idx, mcat, onDown, onResize, selected }) {
  const mw = mk.w || DEF_W, mh = mk.h || DEF_H;
  const hw = mw / 2, hh = mh / 2;
  const iconSz = Math.round(Math.min(mw, mh) * 0.55), iconHalf = iconSz / 2;
  return (
    <g>
      <g style={{ cursor: "grab" }} onMouseDown={onDown} onTouchStart={onDown}>
        <rect x={mk.x - hw} y={mk.y - hh} width={mw} height={mh} rx={6}
          fill="#ffffffee" stroke={mcat.cl} strokeWidth={2} />
        <svg x={mk.x - iconHalf} y={mk.y - iconHalf} width={iconSz} height={iconSz} viewBox="0 0 24 24"
          fill="none" stroke={mcat.cl} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={mcat.svg} /></svg>
        <text x={mk.x} y={mk.y + hh + 12} textAnchor="middle" fill="#fff" fontSize={10}
          fontFamily={ff} fontWeight="600" style={{ textShadow: "0 1px 3px #000" }}>{mk.lb}</text>
        <text x={mk.x} y={mk.y - hh - 4} textAnchor="middle" fill={mcat.cl} fontSize={9}
          fontFamily={ff} fontWeight="700">#{idx + 1}</text>
      </g>
      {selected && onResize && <>
        <g style={{ cursor: "nwse-resize" }}
          onMouseDown={e => onResize(e, "corner")} onTouchStart={e => onResize(e, "corner")}>
          <rect x={mk.x + hw - HANDLE_SZ / 2} y={mk.y + hh - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} /></g>
        <g style={{ cursor: "ew-resize" }}
          onMouseDown={e => onResize(e, "width")} onTouchStart={e => onResize(e, "width")}>
          <rect x={mk.x + hw - HANDLE_SZ / 2} y={mk.y - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} opacity={0.7} /></g>
        <g style={{ cursor: "ns-resize" }}
          onMouseDown={e => onResize(e, "height")} onTouchStart={e => onResize(e, "height")}>
          <rect x={mk.x - HANDLE_SZ / 2} y={mk.y + hh - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} opacity={0.7} /></g>
      </>}
    </g>
  );
}

export function LineLabel({ mid, ln }) {
  const parts = [];
  if (ln.wire) parts.push(`#${ln.wire} ${ln.wireType || ""}`);
  if (ln.conduit && ln.conduit !== "None/Open") parts.push(ln.conduit);
  if (ln.len > 0) parts.push(`${ln.len} ft`);
  if (ln.label) parts.push(ln.label);
  const txt = parts.join(" · ") || "conduit run";
  const tw = txt.length * 5.5 + 12;
  return (
    <g>
      <rect x={mid.x - tw / 2} y={mid.y - 8} width={tw} height={16} rx={3} fill="#ffffffdd" stroke="#06b6d4" strokeWidth={1} />
      <text x={mid.x} y={mid.y + 3.5} textAnchor="middle" fill="#06b6d4" fontSize={9} fontFamily={ff} fontWeight="600">{txt}</text>
    </g>
  );
}

export function BreakSymbol({ x, y, angle }) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const px = -sin, py = cos;
  const pts = [];
  for (let i = -2; i <= 2; i++) {
    const along = i * 4, perp = i % 2 === 0 ? 0 : (i > 0 ? 6 : -6);
    pts.push(`${x + cos * along + px * perp},${y + sin * along + py * perp}`);
  }
  return <polyline points={pts.join(" ")} fill="none" stroke="#06b6d4" strokeWidth={2.5} strokeLinecap="round" />;
}
