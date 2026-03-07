// ── Inverter Database ──
// Keys: id, nm=name, kw, dv=max DC V, ml/mh=MPPT range, ai=max input A, oc=OCPD, tp=type, mppt=count, $=cost
export const INVS = [
  // ── SMA Sunny Boy Smart Energy (Hybrid, 600V, 240VAC split-phase) ──
  { id:"sma38", nm:"SMA SB SE 3.8kW",  kw:3.84, dv:600, ml:91,  mh:480, ai:15, oc:20, tp:"string", mppt:3, $:1600, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  { id:"sma48", nm:"SMA SB SE 4.8kW",  kw:4.8,  dv:600, ml:91,  mh:480, ai:15, oc:25, tp:"string", mppt:3, $:1800, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  { id:"sma58", nm:"SMA SB SE 5.8kW",  kw:5.76, dv:600, ml:112, mh:480, ai:15, oc:30, tp:"string", mppt:3, $:2000, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  { id:"sma77", nm:"SMA SB SE 7.7kW",  kw:7.68, dv:600, ml:136, mh:480, ai:15, oc:40, tp:"string", mppt:3, $:2300, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  { id:"sma96", nm:"SMA SB SE 9.6kW",  kw:9.6,  dv:600, ml:180, mh:480, ai:15, oc:50, tp:"string", mppt:4, $:2800, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  { id:"sma115",nm:"SMA SB SE 11.5kW", kw:11.52,dv:600, ml:180, mh:480, ai:15, oc:60, tp:"string", mppt:4, $:3200, pdf:"https://files.sma.de/downloads/SBSE-US-DS-en-24.pdf" },
  // ── SolarEdge Home Hub (Optimizer-based, 480V fixed, requires P505 optimizers) ──
  { id:"se38",  nm:"SolarEdge SE3800H",  kw:3.8,  dv:480, ml:380, mh:480, ai:16,  oc:20, tp:"optimizer", mppt:1, $:1400, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  { id:"se57",  nm:"SolarEdge SE5700H",  kw:5.76, dv:480, ml:380, mh:480, ai:24,  oc:30, tp:"optimizer", mppt:1, $:1650, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  { id:"se60",  nm:"SolarEdge SE6000H",  kw:6.0,  dv:480, ml:380, mh:480, ai:25,  oc:30, tp:"optimizer", mppt:1, $:1700, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  { id:"se76",  nm:"SolarEdge SE7600H",  kw:7.6,  dv:480, ml:380, mh:480, ai:32,  oc:40, tp:"optimizer", mppt:1, $:1800, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  { id:"se100", nm:"SolarEdge SE10000H", kw:10.0, dv:480, ml:380, mh:480, ai:42,  oc:50, tp:"optimizer", mppt:1, $:2200, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  { id:"se114", nm:"SolarEdge SE11400H", kw:11.4, dv:480, ml:380, mh:480, ai:47.5,oc:60, tp:"optimizer", mppt:1, $:2500, pdf:"https://knowledge-center.solaredge.com/sites/kc/files/se-solaredge-home-hub-inverter-datasheet-nam.pdf" },
  // ── Fronius Primo GEN24 (Hybrid, 600V, 2 MPPT, Active Cooling) ──
  { id:"fr38",  nm:"Fronius Primo GEN24 3.8", kw:3.8,  dv:600, ml:200, mh:480, ai:22, oc:20, tp:"string", mppt:2, $:1500, pdf:"https://www.fronius.com/en/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_GEN24_GEN24Plus_3_to_6_kW_EN.pdf" },
  { id:"fr50",  nm:"Fronius Primo GEN24 5.0", kw:5.0,  dv:600, ml:200, mh:480, ai:22, oc:25, tp:"string", mppt:2, $:1700, pdf:"https://www.fronius.com/en/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_GEN24_GEN24Plus_3_to_6_kW_EN.pdf" },
  { id:"fr60",  nm:"Fronius Primo GEN24 6.0", kw:6.0,  dv:600, ml:200, mh:480, ai:22, oc:30, tp:"string", mppt:2, $:1900, pdf:"https://www.fronius.com/en/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_GEN24_GEN24Plus_3_to_6_kW_EN.pdf" },
  { id:"fr77",  nm:"Fronius Primo GEN24 7.7", kw:7.68, dv:600, ml:200, mh:480, ai:22, oc:40, tp:"string", mppt:2, $:2200, pdf:"https://www.fronius.com/en/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_GEN24_GEN24Plus_3_to_6_kW_EN.pdf" },
  { id:"fr100", nm:"Fronius Primo GEN24 10",  kw:10.0, dv:600, ml:200, mh:480, ai:22, oc:50, tp:"string", mppt:2, $:2800, pdf:"https://www.fronius.com/en/~/downloads/Solar%20Energy/Datasheets/SE_DS_Fronius_Primo_GEN24_GEN24Plus_3_to_6_kW_EN.pdf" },
  // ── Sol-Ark (Hybrid, 500V, All-in-One) ──
  { id:"sa8",   nm:"Sol-Ark 8kW Hybrid",  kw:8,   dv:500, ml:100, mh:450, ai:33, oc:40, tp:"hybrid", mppt:2, $:4390, pdf:"https://www.sol-ark.com/wp-content/uploads/2024/06/SK150-0001-002-15K-2P-N-EN-Datasheet.pdf" },
  { id:"sa12",  nm:"Sol-Ark 12kW Hybrid", kw:12,  dv:500, ml:100, mh:450, ai:50, oc:60, tp:"hybrid", mppt:2, $:4634, pdf:"https://www.sol-ark.com/wp-content/uploads/2024/06/SK150-0001-002-15K-2P-N-EN-Datasheet.pdf" },
  { id:"sa15",  nm:"Sol-Ark 15K Hybrid",  kw:15,  dv:500, ml:100, mh:450, ai:62, oc:80, tp:"hybrid", mppt:2, $:6037, pdf:"https://www.sol-ark.com/wp-content/uploads/2024/06/SK150-0001-002-15K-2P-N-EN-Datasheet.pdf" },
  // ── Tigo EI Hybrid (600V, 240VAC split-phase, 2:1 DC/AC, 152-mo warranty) ──
  // Datasheet: 002-00081-00 Rev 4.3 (2024-07-03) — CEC eff @240V
  { id:"tg38",  nm:"Tigo TSI-3.8K-US",  kw:3.8,  dv:600, ml:80,  mh:550, ai:16.9, oc:16, tp:"hybrid", mppt:2, $:1300, pdf:"https://www.tigoenergy.com/downloads/datasheet-tigo-ei-inverter-us" },
  { id:"tg50",  nm:"Tigo TSI-5.0K-US",  kw:5.0,  dv:600, ml:80,  mh:550, ai:16.9, oc:20, tp:"hybrid", mppt:2, $:1500, pdf:"https://www.tigoenergy.com/downloads/datasheet-tigo-ei-inverter-us" },
  { id:"tg76",  nm:"Tigo TSI-7.6K-US",  kw:7.6,  dv:600, ml:80,  mh:550, ai:16.9, oc:32, tp:"hybrid", mppt:3, $:1700, pdf:"https://www.tigoenergy.com/downloads/datasheet-tigo-ei-inverter-us" },
  { id:"tg100", nm:"Tigo TSI-10K-US",   kw:10.0, dv:600, ml:80,  mh:550, ai:16.9, oc:40, tp:"hybrid", mppt:3, $:1900, pdf:"https://www.tigoenergy.com/downloads/datasheet-tigo-ei-inverter-us" },
  { id:"tg114", nm:"Tigo TSI-11.4K-US", kw:11.4, dv:600, ml:80,  mh:550, ai:16.9, oc:48, tp:"hybrid", mppt:4, $:2100, pdf:"https://www.tigoenergy.com/downloads/datasheet-tigo-ei-inverter-us" },
  // ── Enphase IQ8 Series Microinverters (per-module, 240VAC split-phase) ──
  { id:"iq8",   nm:"Enphase IQ8 (245W)",    kw:0.245, dv:50,   ml:27, mh:37, ai:15, oc:20, tp:"micro", mppt:1, $:120, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8p",  nm:"Enphase IQ8+ (300W)",   kw:0.300, dv:60,   ml:29, mh:45, ai:15, oc:20, tp:"micro", mppt:1, $:140, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8m",  nm:"Enphase IQ8M (330W)",   kw:0.330, dv:60,   ml:33, mh:45, ai:15, oc:20, tp:"micro", mppt:1, $:155, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8a",  nm:"Enphase IQ8A (366W)",   kw:0.366, dv:60,   ml:36, mh:45, ai:15, oc:20, tp:"micro", mppt:1, $:170, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8h",  nm:"Enphase IQ8H (384W)",   kw:0.384, dv:60,   ml:38, mh:45, ai:15, oc:20, tp:"micro", mppt:1, $:185, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8hc", nm:"Enphase IQ8HC (384W)",  kw:0.384, dv:60,   ml:38, mh:45, ai:15, oc:20, tp:"micro", mppt:1, $:190, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
  { id:"iq8x",  nm:"Enphase IQ8X (384W HiV)",kw:0.384,dv:79.5, ml:43, mh:60, ai:13, oc:20, tp:"micro", mppt:1, $:195, pdf:"https://enphase.com/download/iq8m-iq8a-microinverter-data-sheet" },
];
