// ── Module Database ──
// Keys: id, nm=name, w=watts, voc, isc, vmp, imp, tkV=temp coeff %/°C, c=cells, lm/wm=dimensions mm, $=cost
export const MODS = [
  // ── Qcells Q.TRON BLK M-G2+ (N-Type TOPCon, 108 half-cut cells) — 1722×1134mm ──
  { id:"qt420", nm:"Qcell Q.TRON BLK M-G2+ 420",  w:420, voc:38.75, isc:13.58, vmp:32.54, imp:12.91, tkV:-0.26, c:108, lm:1722, wm:1134, $:231, pdf:"https://cdn.enfsolar.com/z/pp/2024/8/r53k60kkgehh5/qcells-data-sheet-q-tron-blk-m-g2-series-405-430-2024-03-rev.pdf" },
  { id:"qt425", nm:"Qcell Q.TRON BLK M-G2+ 425",  w:425, voc:39.03, isc:13.66, vmp:32.74, imp:12.98, tkV:-0.26, c:108, lm:1722, wm:1134, $:234, pdf:"https://cdn.enfsolar.com/z/pp/2024/8/r53k60kkgehh5/qcells-data-sheet-q-tron-blk-m-g2-series-405-430-2024-03-rev.pdf" },
  { id:"qt430", nm:"Qcell Q.TRON BLK M-G2+ 430",  w:430, voc:39.32, isc:13.74, vmp:32.94, imp:13.05, tkV:-0.26, c:108, lm:1722, wm:1134, $:237, pdf:"https://cdn.enfsolar.com/z/pp/2024/8/r53k60kkgehh5/qcells-data-sheet-q-tron-blk-m-g2-series-405-430-2024-03-rev.pdf" },
  { id:"qt435", nm:"Qcell Q.TRON BLK M-G2+ 435",  w:435, voc:39.60, isc:13.82, vmp:33.14, imp:13.13, tkV:-0.26, c:108, lm:1722, wm:1134, $:240, pdf:"https://cdn.enfsolar.com/z/pp/2024/8/r53k60kkgehh5/qcells-data-sheet-q-tron-blk-m-g2-series-405-430-2024-03-rev.pdf" },
  { id:"qt440", nm:"Qcell Q.TRON BLK M-G2+ 440",  w:440, voc:39.88, isc:13.90, vmp:33.33, imp:13.20, tkV:-0.26, c:108, lm:1722, wm:1134, $:244, pdf:"https://cdn.enfsolar.com/z/pp/2024/8/r53k60kkgehh5/qcells-data-sheet-q-tron-blk-m-g2-series-405-430-2024-03-rev.pdf" },
  // ── Qcells Q.PEAK DUO BLK ML-G10+ (PERC, 132 half-cut cells) — 1879×1045mm ──
  { id:"qp400", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 400", w:400, voc:45.27, isc:11.10, vmp:36.88, imp:10.71, tkV:-0.27, c:132, lm:1879, wm:1045, $:220, pdf:"https://www.solar-electric.com/lib/wind-sun/Qcells_Data_sheet_Q.PEAK_DUO_BLK_ML-G10+_series.pdf" },
  { id:"qp405", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 405", w:405, voc:45.30, isc:11.14, vmp:37.13, imp:10.77, tkV:-0.27, c:132, lm:1879, wm:1045, $:224, pdf:"https://www.solar-electric.com/lib/wind-sun/Qcells_Data_sheet_Q.PEAK_DUO_BLK_ML-G10+_series.pdf" },
  { id:"qp410", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 410", w:410, voc:45.34, isc:11.17, vmp:37.39, imp:10.83, tkV:-0.27, c:132, lm:1879, wm:1045, $:228, pdf:"https://www.solar-electric.com/lib/wind-sun/Qcells_Data_sheet_Q.PEAK_DUO_BLK_ML-G10+_series.pdf" },
  { id:"qp415", nm:"Qcell Q.PEAK DUO BLK ML-G10+ 415", w:415, voc:45.41, isc:11.23, vmp:37.89, imp:10.95, tkV:-0.27, c:132, lm:1879, wm:1045, $:232, pdf:"https://www.solar-electric.com/lib/wind-sun/Qcells_Data_sheet_Q.PEAK_DUO_BLK_ML-G10+_series.pdf" },
  // ── Silfab Prime NTC (N-Type TOPCon, 108 half-cut cells) — 1722×1134mm ──
  { id:"sf420", nm:"Silfab Prime SIL-420 QD NTC",  w:420, voc:38.84, isc:13.50, vmp:33.08, imp:12.70, tkV:-0.24, c:108, lm:1722, wm:1134, $:235, pdf:"https://silfabsolar.com/wp-content/uploads/2026/01/Silfab-SIL-420-QD-Data-Final.pdf" },
  { id:"sf430", nm:"Silfab Prime SIL-430 QD NTC",  w:430, voc:38.90, isc:13.87, vmp:33.25, imp:12.93, tkV:-0.24, c:108, lm:1722, wm:1134, $:245, pdf:"https://silfabsolar.com/wp-content/uploads/2026/01/Silfab-SIL-420-QD-Data-Final.pdf" },
  { id:"sf440", nm:"Silfab Prime SIL-440 QD NTC",  w:440, voc:38.97, isc:14.22, vmp:33.41, imp:13.17, tkV:-0.24, c:108, lm:1722, wm:1134, $:255, pdf:"https://silfabsolar.com/wp-content/uploads/2026/01/Silfab-SIL-420-QD-Data-Final.pdf" },
  // ── Silfab Elite (IBC Back-Contact, 66 cells) — 1722×1048mm ──
  { id:"sf410bg", nm:"Silfab Elite SIL-410 BG",    w:410, voc:48.70, isc:10.80, vmp:40.50, imp:10.12, tkV:-0.26, c:66,  lm:1722, wm:1048, $:275, pdf:"https://silfabsolar.com/wp-content/uploads/2025/12/Silfab-SIL-420-BG-Data-Final.pdf" },
  { id:"sf420bg", nm:"Silfab Elite SIL-420 BG",    w:420, voc:48.90, isc:11.00, vmp:40.70, imp:10.32, tkV:-0.26, c:66,  lm:1722, wm:1048, $:285, pdf:"https://silfabsolar.com/wp-content/uploads/2025/12/Silfab-SIL-420-BG-Data-Final.pdf" },
  // ── REC Alpha Pure-RX (HJT, flagship residential, 144 half-cut cells) — 1821×1016mm ──
  { id:"rx450", nm:"REC Alpha Pure-RX 450",  w:450, voc:65.6, isc:8.81, vmp:54.3, imp:8.29, tkV:-0.24, c:144, lm:1821, wm:1016, $:295, pdf:"https://www.recgroup.com/sites/default/files/2024-12/DS_Alpha_Pure-RX_IEC_EN_12122024_1.pdf" },
  { id:"rx460", nm:"REC Alpha Pure-RX 460",  w:460, voc:65.8, isc:8.88, vmp:54.9, imp:8.38, tkV:-0.24, c:144, lm:1821, wm:1016, $:305, pdf:"https://www.recgroup.com/sites/default/files/2024-12/DS_Alpha_Pure-RX_IEC_EN_12122024_1.pdf" },
  { id:"rx470", nm:"REC Alpha Pure-RX 470",  w:470, voc:65.9, isc:8.95, vmp:55.4, imp:8.49, tkV:-0.24, c:144, lm:1821, wm:1016, $:315, pdf:"https://www.recgroup.com/sites/default/files/2024-12/DS_Alpha_Pure-RX_IEC_EN_12122024_1.pdf" },
  // ── REC Alpha Pure-R (HJT, lead-free RoHS, 132 half-cut cells) — 1765×1048mm ──
  { id:"rr400", nm:"REC Alpha Pure-R 400",   w:400, voc:58.9, isc:8.80, vmp:48.8, imp:8.20, tkV:-0.24, c:132, lm:1765, wm:1048, $:260, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS_REC_Alpha_Pure-R_EN%20US.pdf" },
  { id:"rr410", nm:"REC Alpha Pure-R 410",   w:410, voc:59.2, isc:8.84, vmp:49.4, imp:8.30, tkV:-0.24, c:132, lm:1765, wm:1048, $:268, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS_REC_Alpha_Pure-R_EN%20US.pdf" },
  { id:"rr420", nm:"REC Alpha Pure-R 420",   w:420, voc:59.4, isc:8.88, vmp:50.0, imp:8.40, tkV:-0.24, c:132, lm:1765, wm:1048, $:276, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS_REC_Alpha_Pure-R_EN%20US.pdf" },
  { id:"rr430", nm:"REC Alpha Pure-R 430",   w:430, voc:59.7, isc:8.91, vmp:50.5, imp:8.52, tkV:-0.24, c:132, lm:1765, wm:1048, $:284, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS_REC_Alpha_Pure-R_EN%20US.pdf" },
  // ── REC Alpha Pure 2 (HJT, bifacial, 120 half-cut cells) — 1690×1046mm ──
  { id:"r2400", nm:"REC Alpha Pure 2 400",   w:400, voc:48.5, isc:10.72, vmp:40.2, imp:9.96,  tkV:-0.24, c:120, lm:1690, wm:1046, $:244, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS%20REC%20Alpha%20Pure%202%20UL_EN%20US%2012122024.pdf" },
  { id:"r2410", nm:"REC Alpha Pure 2 410",   w:410, voc:48.8, isc:10.77, vmp:40.6, imp:10.10, tkV:-0.24, c:120, lm:1690, wm:1046, $:250, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS%20REC%20Alpha%20Pure%202%20UL_EN%20US%2012122024.pdf" },
  { id:"r2420", nm:"REC Alpha Pure 2 420",   w:420, voc:49.1, isc:10.83, vmp:41.2, imp:10.20, tkV:-0.24, c:120, lm:1690, wm:1046, $:256, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS%20REC%20Alpha%20Pure%202%20UL_EN%20US%2012122024.pdf" },
  { id:"r2430", nm:"REC Alpha Pure 2 430",   w:430, voc:49.3, isc:10.88, vmp:41.8, imp:10.29, tkV:-0.24, c:120, lm:1690, wm:1046, $:262, pdf:"https://www.recgroup.com/sites/default/files/2025-01/Web_DS%20REC%20Alpha%20Pure%202%20UL_EN%20US%2012122024.pdf" },
];
