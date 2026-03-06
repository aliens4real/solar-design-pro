import { forwardRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td } from '../theme.js';
import { badge, wireSchedule } from './shared.jsx';

const CommercialRoofDiagram = forwardRef(({ svW, svH, es, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr, children }, ref) => {
  const rows = [
    { seg: "Array → Combiner", spec: dcPV, circ: "DC PV Strings ×" + nStr, clr: "#dc2626", len: wr?.pv },
    ...(dcRun ? [{ seg: "Combiner → Inverter", spec: dcRun, circ: "DC Combined", clr: "#b45309", len: wr?.dc }] : []),
    { seg: "Inverter → AC Disc.", spec: acRun, circ: "AC 3-Phase", clr: "#7c3aed", len: wr?.ac },
    { seg: "AC Disc. → MDP", spec: acRun, circ: "AC Feeder", clr: "#7c3aed" },
    { seg: "Meter → MDP", spec: seRun, circ: "Service Ent.", clr: "#059669", len: wr?.se },
    { seg: "MDP → GEC", spec: gecRun, circ: "Grounding", clr: "#78716c", len: wr?.gec },
  ];

  return (
    <svg ref={ref} viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
      <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#f0f9ff" /></linearGradient></defs>
      <rect width={svW} height={svH} fill="url(#sky2)" />
      <rect x={0} y={320} width={svW} height={svH - 320} fill="#d6d3d1" opacity={0.3} />
      <line x1={0} y1={320} x2={svW} y2={320} stroke="#a8a29e" strokeWidth={1} />

      {/* Commercial building */}
      <rect x={60} y={160} width={500} height={160} fill="#e7e5e4" stroke="#78716c" strokeWidth={2} rx={2} />
      <rect x={60} y={150} width={500} height={16} fill="#78716c" stroke="#57534e" strokeWidth={1} rx={1} />
      <rect x={56} y={146} width={8} height={26} fill="#57534e" rx={1} />
      <rect x={556} y={146} width={8} height={26} fill="#57534e" rx={1} />
      <text x={310} y={280} textAnchor="middle" fill={td} fontSize={11} fontFamily={ff}>COMMERCIAL BUILDING</text>

      {/* Rooftop conduit rack */}
      <rect x={90} y={220} width={180} height={4} fill="#a8a29e" rx={1} />

      {/* Wire Schedule */}
      {wireSchedule(rows, 460, svW, "WIRE SCHEDULE — COMMERCIAL")}
      {children}
    </svg>
  );
});
export default CommercialRoofDiagram;
