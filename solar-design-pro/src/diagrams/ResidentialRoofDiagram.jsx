import { forwardRef } from 'react';
import { ff, c1, c2, bd, ac, tx, td, gn } from '../theme.js';
import { badge, wireSchedule } from './shared.jsx';

export const BASEMENT_Y = 545;

const ResidentialRoofDiagram = forwardRef(({ svW, svH, es, dcPV, dcRun, acRun, seRun, gecRun, nStr, wr, children }, ref) => {
  const hasBsmt = svH > 700;
  const wsY = hasBsmt ? 870 : 560;

  const rows = [
    { seg: "Array → Roof Box", spec: dcPV, circ: "DC PV", clr: "#dc2626", len: wr?.pv },
    ...(dcRun ? [{ seg: "Roof Box → Inverter", spec: dcRun, circ: "DC Home Run", clr: "#b45309", len: wr?.dc }] : []),
    { seg: "Inverter → AC Disc.", spec: acRun, circ: "AC Branch", clr: "#7c3aed", len: wr?.ac },
    { seg: "AC Disc. → Main Panel", spec: acRun, circ: "AC Feeder", clr: "#6d28d9", len: wr?.af },
    { seg: "Main Panel → Meter", spec: seRun, circ: "Service Ent.", clr: "#059669", len: wr?.se },
    { seg: "Meter → GEC", spec: gecRun, circ: "Grounding", clr: "#78716c", len: wr?.gec },
  ];

  return (
    <svg ref={ref} viewBox={`0 0 ${svW} ${svH}`} style={{ width: "100%", background: c2, borderRadius: 8, border: `1px solid ${bd}` }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#f0f9ff" /></linearGradient>
        <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#78716c" /><stop offset="100%" stopColor="#57534e" /></linearGradient>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fafaf9" /><stop offset="100%" stopColor="#e7e5e4" /></linearGradient>
      </defs>
      <rect width={svW} height={svH} fill="url(#sky)" />
      <rect x={0} y={520} width={svW} height={svH - 520} fill="#d6d3d1" opacity={0.3} />
      <line x1={0} y1={520} x2={svW} y2={520} stroke="#a8a29e" strokeWidth={1} />

      {/* House — centered */}
      <polygon points="220,30 600,30 660,230 160,230" fill="url(#roofG)" stroke="#44403c" strokeWidth={2} />

      <rect x={170} y={230} width={480} height={290} fill="url(#wallG)" stroke="#78716c" strokeWidth={2} />
      <rect x={240} y={275} width={60} height={75} rx={3} fill="#bfdbfe" stroke="#78716c" strokeWidth={1} />
      <rect x={510} y={275} width={60} height={75} rx={3} fill="#bfdbfe" stroke="#78716c" strokeWidth={1} />
      <rect x={380} y={415} width={55} height={105} rx={3} fill="#a16207" stroke="#78716c" strokeWidth={1} />

      {/* Garage — centered */}
      <rect x={680} y={300} width={220} height={220} fill="url(#wallG)" stroke="#78716c" strokeWidth={2} />
      <polygon points="680,300 790,230 900,300" fill="url(#roofG)" stroke="#44403c" strokeWidth={2} />
      <rect x={705} y={380} width={150} height={110} rx={3} fill="#d6d3d1" stroke="#78716c" strokeWidth={1} />
      <text x={780} y={445} textAnchor="middle" fill={td} fontSize={12} fontFamily={ff}>GARAGE</text>

      {/* Bushes — front of house */}
      <ellipse cx={210} cy={515} rx={22} ry={14} fill="#4ade80" opacity={0.6} />
      <ellipse cx={250} cy={513} rx={18} ry={12} fill="#22c55e" opacity={0.55} />
      <ellipse cx={310} cy={516} rx={20} ry={13} fill="#4ade80" opacity={0.5} />
      <ellipse cx={480} cy={514} rx={19} ry={13} fill="#22c55e" opacity={0.55} />
      <ellipse cx={530} cy={516} rx={22} ry={14} fill="#4ade80" opacity={0.5} />
      {/* Bush on side of house */}
      <ellipse cx={160} cy={510} rx={16} ry={18} fill="#22c55e" opacity={0.5} />
      <ellipse cx={158} cy={495} rx={13} ry={14} fill="#4ade80" opacity={0.45} />

      {/* Basement / Below Grade — centered below house */}
      {hasBsmt && <>
        {/* Divider label */}
        <text x={410} y={537} textAnchor="middle" fill="#78716c" fontSize={11} fontFamily={ff} fontWeight={600}>BASEMENT / BELOW GRADE</text>

        {/* Foundation outline */}
        <rect x={170} y={545} width={480} height={300} rx={4} fill="none" stroke="#78716c" strokeWidth={1.5} strokeDasharray="8 4" />

        {/* Concrete wall fills */}
        <rect x={170} y={545} width={14} height={300} fill="#d6d3d1" opacity={0.5} />
        <rect x={636} y={545} width={14} height={300} fill="#d6d3d1" opacity={0.5} />

        {/* Floor slab */}
        <line x1={170} y1={840} x2={650} y2={840} stroke="#a8a29e" strokeWidth={2} />
        <text x={410} y={835} textAnchor="middle" fill="#a8a29e" fontSize={8} fontFamily={ff}>SLAB</text>

        {/* Hint text */}
        <text x={410} y={690} textAnchor="middle" fill="#d6d3d1" fontSize={13} fontFamily={ff} fontStyle="italic">Place equipment here</text>
      </>}

      {/* Wire Schedule */}
      {wireSchedule(rows, wsY, svW, "WIRE SCHEDULE")}

      {children}
    </svg>
  );
});
export default ResidentialRoofDiagram;
