import { ff } from '../theme.js';
import { DEF_W, DEF_H } from '../calc/annotation-geo.js';
import { pvGroupIcon } from '../diagrams/shared.jsx';

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

export function MarkerIcon({ mk, idx, mcat, onDown, onResize, selected, modGroups, layPos, md }) {
  const mw = mk.w || DEF_W, mh = mk.h || DEF_H;
  const hw = mw / 2, hh = mh / 2;
  const iconSz = Math.round(Math.min(mw, mh) * 0.55), iconHalf = iconSz / 2;

  // Special rendering for pv_array markers — show per-group module layout
  const isPvArray = mk.ct === "pv_array";
  const grp = isPvArray && mk.gid && modGroups ? modGroups.find(g => g.id === mk.gid) : null;
  const grpPos = isPvArray && mk.gid && layPos ? layPos[mk.gid] : null;
  const arrW = isPvArray ? Math.max(mw, 140) : mw;
  const arrH = isPvArray ? Math.max(mh, 50) : mh;
  const ahw = arrW / 2, ahh = arrH / 2;

  return (
    <g>
      <g style={{ cursor: "grab" }} onMouseDown={onDown} onTouchStart={onDown}>
        {isPvArray ? (
          <g transform={`translate(${mk.x - ahw},${mk.y - ahh})`}>
            {pvGroupIcon(grp, grpPos, md, { maxW: arrW, maxH: arrH })}
          </g>
        ) : (<>
          <rect x={mk.x - hw} y={mk.y - hh} width={mw} height={mh} rx={6}
            fill="#ffffffee" stroke={mcat.cl} strokeWidth={2} />
          <svg x={mk.x - iconHalf} y={mk.y - iconHalf} width={iconSz} height={iconSz} viewBox="0 0 24 24"
            fill="none" stroke={mcat.cl} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={mcat.svg} /></svg>
        </>)}
        <text x={mk.x} y={mk.y + (isPvArray ? ahh : hh) + 12} textAnchor="middle" fill="#fff" fontSize={10}
          fontFamily={ff} fontWeight="600" style={{ textShadow: "0 1px 3px #000" }}>{mk.lb}</text>
        <text x={mk.x} y={mk.y - (isPvArray ? ahh : hh) - 4} textAnchor="middle" fill={mcat.cl} fontSize={9}
          fontFamily={ff} fontWeight="700">#{idx + 1}</text>
      </g>
      {selected && onResize && <>
        <g style={{ cursor: "nwse-resize" }}
          onMouseDown={e => onResize(e, "corner")} onTouchStart={e => onResize(e, "corner")}>
          <rect x={mk.x + (isPvArray ? ahw : hw) - HANDLE_SZ / 2} y={mk.y + (isPvArray ? ahh : hh) - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} /></g>
        <g style={{ cursor: "ew-resize" }}
          onMouseDown={e => onResize(e, "width")} onTouchStart={e => onResize(e, "width")}>
          <rect x={mk.x + (isPvArray ? ahw : hw) - HANDLE_SZ / 2} y={mk.y - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} opacity={0.7} /></g>
        <g style={{ cursor: "ns-resize" }}
          onMouseDown={e => onResize(e, "height")} onTouchStart={e => onResize(e, "height")}>
          <rect x={mk.x - HANDLE_SZ / 2} y={mk.y + (isPvArray ? ahh : hh) - HANDLE_SZ / 2}
            width={HANDLE_SZ} height={HANDLE_SZ} rx={2} fill={mcat.cl} stroke="#fff" strokeWidth={1} opacity={0.7} /></g>
      </>}
    </g>
  );
}

const LBL_FS = 7, LBL_LH = 9, LBL_PAD = 3;

export function labelLines(ln) {
  const rows = [];
  if (ln.label) rows.push(ln.label);
  if (ln.wire) rows.push(`#${ln.wire} ${ln.wireType || ""}`);
  if (ln.conduit && ln.conduit !== "None/Open") rows.push(ln.conduit);
  if (ln.len > 0) rows.push(`${ln.len} ft`);
  if (rows.length === 0) rows.push("conduit run");
  return rows;
}

export function labelDims(ln) {
  const rows = labelLines(ln);
  const w = Math.max(...rows.map(l => l.length * 4)) + LBL_PAD * 2;
  const h = rows.length * LBL_LH + LBL_PAD * 2;
  return { w, h, rows };
}

export function resolveOverlaps(labels) {
  if (labels.length < 2) return new Map(labels.map(l => [l.id, { x: l.x, y: l.y }]));
  const res = labels.map(l => ({ ...l }));
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < res.length; i++) {
      for (let j = i + 1; j < res.length; j++) {
        const a = res[i], b = res[j];
        const ox = (a.w / 2 + b.w / 2 + 2) - Math.abs(a.x - b.x);
        const oy = (a.h / 2 + b.h / 2 + 2) - Math.abs(a.y - b.y);
        if (ox > 0 && oy > 0) {
          // Push apart along the axis with less overlap
          if (oy < ox) {
            const push = oy / 2 + 1;
            if (a.y <= b.y) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; }
          } else {
            const push = ox / 2 + 1;
            if (a.x <= b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return new Map(res.map(l => [l.id, { x: l.x, y: l.y }]));
}

export function LineLabel({ x, y, ln }) {
  const { w, h, rows } = labelDims(ln);
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill="#ffffffdd" stroke="#06b6d4" strokeWidth={0.7} />
      {rows.map((r, i) => (
        <text key={i} x={x} y={y - h / 2 + LBL_PAD + LBL_LH * (i + 0.75)}
          textAnchor="middle" fill="#06b6d4" fontSize={LBL_FS} fontFamily={ff}
          fontWeight={i === 0 ? "700" : "500"}>{r}</text>
      ))}
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
