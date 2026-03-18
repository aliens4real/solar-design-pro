import { COND, OCPDS } from '../data/nec-tables.js';
import { egcSize, gecSize } from './nec-sizing.js';

export function strCalc(m, iv, tl, th, mt, svc) {
  if (!m || !iv || !tl) return null;
  const tL = +tl, tH = +(th || 35), tA = mt === "roof" ? 30 : 25;
  const tf1 = 1 + (m.tkV / 100) * (tL - 25), vc = +(m.voc * tf1).toFixed(2), mx = Math.floor(iv.dv / vc);
  const tCH = tH + tA, tf2 = 1 + (m.tkV * 1.25 / 100) * (tCH - 25), vh = +(m.vmp * tf2).toFixed(2), vd = +(vh * 0.9).toFixed(2);
  const mn = Math.ceil(iv.ml / vd), mxM = Math.floor(iv.mh / vh), opt = Math.min(mx, mxM);
  const im = +(m.isc * 1.25).toFixed(2), ma = +(im * 1.25).toFixed(2);
  const oc = OCPDS.find(s => s >= Math.ceil(im * 1.25)) || 20;
  const dc = COND.find(c => c.a75 >= ma) || COND[COND.length - 1];
  const acI = +(iv.ai * 1.25).toFixed(1), ac = COND.find(c => c.a75 >= acI) || COND[COND.length - 1];
  const egc = egcSize(oc);
  const gec = gecSize(+(svc || 200));
  return {
    tL, tH, tCH, tf1, vc, mx, tf2, vh, vd, mn, mxM, opt, im, ma, oc,
    dc: dc.awg, dcA: dc.a75, ac: ac.awg, acA: ac.a75,
    sv: +(vc * opt).toFixed(1),
    egc, gec
  };
}
