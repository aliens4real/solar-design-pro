import { forwardRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td } from '../theme.js';
import { badge, wireSchedule } from './shared.jsx';

const GroundMountDiagram = forwardRef(({ svW, svH, es, isComm, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr, children }, ref) => {
  const rows = [
    { seg: "Array → Combiner", spec: dcPV, circ: `DC PV Strings ×${nStr}`, clr: "#dc2626", len: wr?.pv },
    ...(dcRun ? [{ seg: "Combiner → Inverter (trench)", spec: dcRun, circ: "DC Home Run — PVC", clr: "#b45309", len: wr?.dc }] : []),
    { seg: "Inverter → AC Disc.", spec: acRun, circ: "AC Branch", clr: "#7c3aed", len: wr?.ac },
    { seg: "AC Disc. → Meter", spec: acRun, circ: "AC Feeder", clr: "#0284c7" },
    { seg: "Meter → Main Panel", spec: seRun, circ: "Service Ent.", clr: "#059669", len: wr?.se },
    { seg: "Main Panel → GEC", spec: gecRun, circ: "Grounding", clr: "#78716c", len: wr?.gec },
  ];

  return (
    <svg ref={ref} viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
      <defs><linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ecfdf5" /><stop offset="100%" stopColor="#f0fdf4" /></linearGradient></defs>
      <rect width={svW} height={svH} fill="url(#sky3)" />
      <rect x={0} y={340} width={svW} height={svH - 340} fill="#a7f3d0" opacity={0.18} />
      <line x1={0} y1={340} x2={svW} y2={340} stroke="#86efac" strokeWidth={1} opacity={0.5} />

      {/* Ground mount array */}
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={80 + i * 80} y={300} width={4} height={50} fill="#78716c" rx={1} />)}
      <polygon points="70,220 420,220 440,300 90,300" fill="#1e40af" opacity={0.6} stroke="#1e3a8a" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={76 + i * 60} y1={220 + (i * 0.5)} x2={96 + i * 60} y2={300} stroke="#3b82f6" strokeWidth={0.5} />)}
      <line x1={80} y1={260} x2={430} y2={260} stroke="#3b82f6" strokeWidth={0.5} />
      {badge(255, 212, "GROUND MOUNT PV ARRAY", "#1e40af")}

      {/* Underground trench */}
      <rect x={495} y={340} width={100} height={10} fill="#78716c" opacity={0.3} rx={2} />
      <text x={545} y={336} textAnchor="middle" fill={td} fontSize={7} fontFamily={ff}>UNDERGROUND TRENCH — PVC CONDUIT</text>

      {/* Inverter pad */}
      <rect x={590} y={318} width={70} height={8} fill="#d6d3d1" stroke="#a8a29e" strokeWidth={0.5} rx={1} />

      {/* Building */}
      <rect x={790} y={210} width={210} height={140} fill="#fafaf9" stroke="#78716c" strokeWidth={1.5} rx={3} />
      <rect x={790} y={190} width={210} height={24} fill="#78716c" stroke="#57534e" strokeWidth={1} rx={2} />
      <text x={895} y={206} textAnchor="middle" fill="#fafaf9" fontSize={10} fontWeight={600} fontFamily={ff}>
        {isComm ? "EQUIPMENT BUILDING" : "RESIDENCE"}
      </text>

      {/* Wire Schedule */}
      {wireSchedule(rows, 395, 760, "WIRE SCHEDULE — GROUND MOUNT")}
      {children}
    </svg>
  );
});
export default GroundMountDiagram;
