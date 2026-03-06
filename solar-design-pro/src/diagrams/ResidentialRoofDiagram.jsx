import { forwardRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn } from '../theme.js';
import { badge, wireSchedule } from './shared.jsx';

const ResidentialRoofDiagram = forwardRef(({ svW, svH, es, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr, children }, ref) => {
  const rows = [
    { seg: "Array → Rapid SD", spec: dcPV, circ: "DC PV", clr: "#dc2626", len: wr?.pv },
    ...(dcRun ? [{ seg: "Rapid SD → Inverter", spec: dcRun, circ: "DC Home Run", clr: "#b45309", len: wr?.dc }] : []),
    { seg: "Inverter → AC Disc.", spec: acRun, circ: "AC Branch", clr: "#7c3aed", len: wr?.ac },
    { seg: "Meter → Main Panel", spec: seRun, circ: "Service Ent.", clr: "#059669", len: wr?.se },
    { seg: "Main Panel → GEC", spec: gecRun, circ: "Grounding", clr: "#78716c", len: wr?.gec },
  ];

  return (
    <svg ref={ref} viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#f0f9ff" /></linearGradient>
        <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#78716c" /><stop offset="100%" stopColor="#57534e" /></linearGradient>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fafaf9" /><stop offset="100%" stopColor="#e7e5e4" /></linearGradient>
      </defs>
      <rect width={svW} height={svH} fill="url(#sky)" />
      <rect x={0} y={370} width={svW} height={svH - 370} fill="#d6d3d1" opacity={0.3} />
      <line x1={0} y1={370} x2={svW} y2={370} stroke="#a8a29e" strokeWidth={1} />

      {/* House */}
      <polygon points="120,140 380,140 420,220 80,220" fill="url(#roofG)" stroke="#44403c" strokeWidth={1.5} />

      <rect x={90} y={220} width={320} height={150} fill="url(#wallG)" stroke="#78716c" strokeWidth={1.5} />
      <rect x={140} y={250} width={40} height={50} rx={2} fill="#bfdbfe" stroke="#78716c" strokeWidth={1} />
      <rect x={320} y={250} width={40} height={50} rx={2} fill="#bfdbfe" stroke="#78716c" strokeWidth={1} />
      <rect x={230} y={300} width={40} height={70} rx={2} fill="#a16207" stroke="#78716c" strokeWidth={1} />

      {/* Garage */}
      <rect x={440} y={240} width={160} height={130} fill="url(#wallG)" stroke="#78716c" strokeWidth={1.5} />
      <polygon points="440,240 520,195 600,240" fill="url(#roofG)" stroke="#44403c" strokeWidth={1.5} />
      <rect x={465} y={305} width={110} height={65} rx={2} fill="#d6d3d1" stroke="#78716c" strokeWidth={1} />
      <text x={520} y={345} textAnchor="middle" fill={td} fontSize={9} fontFamily={ff}>GARAGE</text>

      {/* Wire Schedule */}
      {wireSchedule(rows, 510, svW, "WIRE SCHEDULE")}
      {children}
    </svg>
  );
});
export default ResidentialRoofDiagram;
