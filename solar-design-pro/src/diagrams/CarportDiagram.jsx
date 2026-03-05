import { forwardRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td } from '../theme.js';
import { badge, wireSchedule } from './shared.jsx';

const CarportDiagram = forwardRef(({ svW, svH, es, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr, children }, ref) => {
  const rows = [
    { seg: "Array → Combiner", spec: dcPV, circ: `DC PV ×${nStr} strings`, clr: "#dc2626", len: wr?.pv },
    ...(dcRun ? [{ seg: "Combiner → Inverter", spec: dcRun, circ: "DC Home Run", clr: "#b45309", len: wr?.dc }] : []),
    { seg: "Inverter → AC Disc.", spec: acRun, circ: "AC Branch", clr: "#7c3aed", len: wr?.ac },
    { seg: "AC Disc. → Meter", spec: acRun, circ: "AC Feeder", clr: "#0284c7" },
    { seg: "Meter → Main Panel", spec: seRun, circ: "Service Ent.", clr: "#059669", len: wr?.se },
    { seg: "Panel → GEC", spec: gecRun, circ: "Grounding", clr: "#78716c", len: wr?.gec },
  ];

  return (
    <svg ref={ref} viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
      <defs><linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#f8fafc" /></linearGradient></defs>
      <rect width={svW} height={svH} fill="url(#sky4)" />
      <rect x={0} y={360} width={svW} height={svH - 360} fill="#d6d3d1" opacity={0.25} />
      <line x1={0} y1={360} x2={svW} y2={360} stroke="#a8a29e" strokeWidth={1} />

      {/* Carport structure */}
      {[100, 250, 400].map(x => <rect key={x} x={x} y={210} width={6} height={150} fill="#57534e" rx={1} />)}
      <polygon points="80,170 420,170 430,210 90,210" fill="#1e40af" opacity={0.6} stroke="#1e3a8a" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={90 + i * 58} y1={171} x2={98 + i * 58} y2={210} stroke="#3b82f6" strokeWidth={0.5} />)}
      <line x1={85} y1={190} x2={425} y2={190} stroke="#3b82f6" strokeWidth={0.5} />
      {badge(255, 163, "CARPORT PV CANOPY", "#1e40af")}
      <text x={255} y={340} textAnchor="middle" fill={td} fontSize={10} fontFamily={ff} opacity={0.5}>PARKING AREA</text>
      {[140, 220, 300].map(x => <rect key={x} x={x} y={368} width={50} height={2} fill="#94a3b8" opacity={0.5} />)}

      {/* Building */}
      <rect x={730} y={220} width={190} height={140} fill="#fafaf9" stroke="#78716c" strokeWidth={1.5} rx={3} />
      <polygon points="730,220 825,175 920,220" fill="#78716c" stroke="#57534e" strokeWidth={1} />
      <text x={825} y={300} textAnchor="middle" fill={td} fontSize={10} fontFamily={ff}>BUILDING</text>

      {/* Wire Schedule */}
      {wireSchedule(rows, 490, svW, "WIRE SCHEDULE — CARPORT")}
      {children}
    </svg>
  );
});
export default CarportDiagram;
