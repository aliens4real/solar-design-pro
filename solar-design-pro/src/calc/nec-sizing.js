import { CONDUIT_FILL, EGC_TABLE, GEC_TABLE, SE_TABLE } from '../data/nec-tables.js';

// Compute minimum EMT conduit size per NEC Chapter 9 Tables 1 & 4
// nCond = total conductor count for fill limit selection
export function minConduit(totalArea, nCond = 3) {
  const fillPct = nCond <= 1 ? 0.53 : nCond === 2 ? 0.31 : 0.40;
  const c = CONDUIT_FILL.find(c => c.ai * fillPct >= totalArea) || CONDUIT_FILL[CONDUIT_FILL.length - 1];
  const actualFill = +((totalArea / c.ai) * 100).toFixed(0);
  const limit = +(fillPct * 100).toFixed(0);
  return { ...c, fill: actualFill, limit, fillPct };
}

// Lookup EGC for a given OCPD
export function egcSize(ocpd) {
  return (EGC_TABLE.find(e => e.a >= ocpd) || EGC_TABLE[EGC_TABLE.length - 1]).g;
}

// Lookup GEC for service size
export function gecSize(svc) {
  return (GEC_TABLE.find(e => e.s >= svc) || GEC_TABLE[GEC_TABLE.length - 1]).g;
}

// Lookup service entrance conductor
export function seSize(svc) {
  return SE_TABLE.find(e => e.a >= svc) || SE_TABLE[SE_TABLE.length - 1];
}
