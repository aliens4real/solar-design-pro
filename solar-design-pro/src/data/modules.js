// ── Module Database ──
// Keys: id, nm=name, w=watts, voc, isc, vmp, imp, tkV=temp coeff %/°C, c=cells, lm/wm=dimensions mm, $=cost
export const MODS = [
  // ── Qcells Q.TRON BLK M-G2+ (N-Type TOPCon, 108 half-cut cells) — 1722×1134mm ──
  { id:"qt420", nm:"Qcell Q.TRON BLK M-G2+ 420",  w:420, voc:38.75, isc:13.58, vmp:32.54, imp:12.91, tkV:-0.26, c:108, lm:1722, wm:1134, $:231 },
  { id:"qt425", nm:"Qcell Q.TRON BLK M-G2+ 425",  w:425, voc:39.03, isc:13.66, vmp:32.74, imp:12.98, tkV:-0.26, c:108, lm:1722, wm:1134, $:234 },
  { id:"qt430", nm:"Qcell Q.TRON BLK M-G2+ 430",  w:430, voc:39.32, isc:13.74, vmp:32.94, imp:13.05, tkV:-0.26, c:108, lm:1722, wm:1134, $:237 },
  { id:"qt435", nm:"Qcell Q.TRON BLK M-G2+ 435",  w:435, voc:39.60, isc:13.82, vmp:33.14, imp:13.13, tkV:-0.26, c:108, lm:1722, wm:1134, $:240 },
  { id:"qt440", nm:"Qcell Q.TRON BLK M-G2+ 440",  w:440, voc:39.88, isc:13.90, vmp:33.33, imp:13.20, tkV:-0.26, c:108, lm:1722, wm:1134, $:244 },
  // ── Qcells Q.PEAK DUO BLK ML-G10+ (PERC, 132 half-cut cells) — 1879×1045mm ──
  { id:"qp400", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 400", w:400, voc:45.27, isc:11.10, vmp:36.88, imp:10.71, tkV:-0.27, c:132, lm:1879, wm:1045, $:220 },
  { id:"qp405", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 405", w:405, voc:45.30, isc:11.14, vmp:37.13, imp:10.77, tkV:-0.27, c:132, lm:1879, wm:1045, $:224 },
  { id:"qp410", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 410", w:410, voc:45.34, isc:11.17, vmp:37.39, imp:10.83, tkV:-0.27, c:132, lm:1879, wm:1045, $:228 },
  { id:"qp415", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 415", w:415, voc:45.41, isc:11.23, vmp:37.89, imp:10.95, tkV:-0.27, c:132, lm:1879, wm:1045, $:232 },
  // ── Silfab Prime NTC (N-Type TOPCon, 108 half-cut cells) — 1722×1134mm ──
  { id:"sf420", nm:"Silfab Prime SIL-420 QD NTC",  w:420, voc:38.84, isc:13.50, vmp:33.08, imp:12.70, tkV:-0.24, c:108, lm:1722, wm:1134, $:235 },
  { id:"sf430", nm:"Silfab Prime SIL-430 QD NTC",  w:430, voc:38.90, isc:13.87, vmp:33.25, imp:12.93, tkV:-0.24, c:108, lm:1722, wm:1134, $:245 },
  { id:"sf440", nm:"Silfab Prime SIL-440 QD NTC",  w:440, voc:38.97, isc:14.22, vmp:33.41, imp:13.17, tkV:-0.24, c:108, lm:1722, wm:1134, $:255 },
  // ── Silfab Elite (IBC Back-Contact, 66 cells) — 1722×1048mm ──
  { id:"sf410bg", nm:"Silfab Elite SIL-410 BG",    w:410, voc:48.70, isc:10.80, vmp:40.50, imp:10.12, tkV:-0.26, c:66,  lm:1722, wm:1048, $:275 },
  { id:"sf420bg", nm:"Silfab Elite SIL-420 BG",    w:420, voc:48.90, isc:11.00, vmp:40.70, imp:10.32, tkV:-0.26, c:66,  lm:1722, wm:1048, $:285 },
  // ── REC Alpha Pure-RX (HJT, flagship residential, 144 half-cut cells) — 1821×1016mm ──
  { id:"rx450", nm:"REC Alpha Pure-RX 450",  w:450, voc:65.6, isc:8.81, vmp:54.3, imp:8.29, tkV:-0.24, c:144, lm:1821, wm:1016, $:295 },
  { id:"rx460", nm:"REC Alpha Pure-RX 460",  w:460, voc:65.8, isc:8.88, vmp:54.9, imp:8.38, tkV:-0.24, c:144, lm:1821, wm:1016, $:305 },
  { id:"rx470", nm:"REC Alpha Pure-RX 470",  w:470, voc:65.9, isc:8.95, vmp:55.4, imp:8.49, tkV:-0.24, c:144, lm:1821, wm:1016, $:315 },
  // ── REC Alpha Pure-R (HJT, lead-free RoHS, 132 half-cut cells) — 1765×1048mm ──
  { id:"rr400", nm:"REC Alpha Pure-R 400",   w:400, voc:58.9, isc:8.80, vmp:48.8, imp:8.20, tkV:-0.24, c:132, lm:1765, wm:1048, $:260 },
  { id:"rr410", nm:"REC Alpha Pure-R 410",   w:410, voc:59.2, isc:8.84, vmp:49.4, imp:8.30, tkV:-0.24, c:132, lm:1765, wm:1048, $:268 },
  { id:"rr420", nm:"REC Alpha Pure-R 420",   w:420, voc:59.4, isc:8.88, vmp:50.0, imp:8.40, tkV:-0.24, c:132, lm:1765, wm:1048, $:276 },
  { id:"rr430", nm:"REC Alpha Pure-R 430",   w:430, voc:59.7, isc:8.91, vmp:50.5, imp:8.52, tkV:-0.24, c:132, lm:1765, wm:1048, $:284 },
  // ── REC Alpha Pure 2 (HJT, bifacial, 120 half-cut cells) — 1690×1046mm ──
  { id:"r2400", nm:"REC Alpha Pure 2 400",   w:400, voc:48.5, isc:10.72, vmp:40.2, imp:9.96,  tkV:-0.24, c:120, lm:1690, wm:1046, $:244 },
  { id:"r2410", nm:"REC Alpha Pure 2 410",   w:410, voc:48.8, isc:10.77, vmp:40.6, imp:10.10, tkV:-0.24, c:120, lm:1690, wm:1046, $:250 },
  { id:"r2420", nm:"REC Alpha Pure 2 420",   w:420, voc:49.1, isc:10.83, vmp:41.2, imp:10.20, tkV:-0.24, c:120, lm:1690, wm:1046, $:256 },
  { id:"r2430", nm:"REC Alpha Pure 2 430",   w:430, voc:49.3, isc:10.88, vmp:41.8, imp:10.29, tkV:-0.24, c:120, lm:1690, wm:1046, $:262 },
];
