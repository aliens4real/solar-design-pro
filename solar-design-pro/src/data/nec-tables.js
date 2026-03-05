// ── NEC Electrical Lookup Tables ──

export const COND = [
  {awg:"14",a75:20,ohm:3.14},{awg:"12",a75:25,ohm:1.98},{awg:"10",a75:35,ohm:1.24},
  {awg:"8",a75:50,ohm:0.778},{awg:"6",a75:65,ohm:0.491},{awg:"4",a75:85,ohm:0.308},
  {awg:"3",a75:100,ohm:0.245},{awg:"2",a75:115,ohm:0.194},{awg:"1/0",a75:150,ohm:0.122},
];

export const OCPDS = [15,20,25,30,35,40,45,50,60,70,80,90,100,125,150,175,200];

// NEC wire cross-section areas (sq in) for THWN-2 / XHHW-2
export const WIRE_AREA={"14":.0097,"12":.0133,"10":.0211,"8":.0366,"6":.0507,"4":.0824,"3":.0973,"2":.1158,"1":.1562,"1/0":.1855,"2/0":.2223,"3/0":.2679,"4/0":.3237};

// EMT conduit per NEC Chapter 9 Table 4: sz = trade size, ai = total internal area (sq in)
// Fill limits per NEC Chapter 9 Table 1: 1 wire=53%, 2 wires=31%, 3+ wires=40%
export const CONDUIT_FILL=[{sz:"½\"",ai:.122},{sz:"¾\"",ai:.213},{sz:"1\"",ai:.346},{sz:"1¼\"",ai:.598},{sz:"1½\"",ai:.814},{sz:"2\"",ai:1.342},{sz:"2½\"",ai:2.213},{sz:"3\"",ai:3.408}];

// EGC sizing per NEC 250.122 — ocpd rating → min EGC AWG (Cu)
export const EGC_TABLE=[{a:15,g:"14"},{a:20,g:"12"},{a:30,g:"10"},{a:40,g:"10"},{a:60,g:"10"},{a:100,g:"8"},{a:200,g:"6"},{a:300,g:"4"},{a:400,g:"3"},{a:500,g:"2"},{a:600,g:"1"},{a:800,g:"1/0"}];

// GEC sizing per NEC 250.66 — service entrance conductor → min GEC AWG (Cu)
export const GEC_TABLE=[{s:100,g:"8"},{s:125,g:"8"},{s:150,g:"6"},{s:200,g:"4"},{s:225,g:"4"},{s:320,g:"2"},{s:400,g:"1/0"}];

// Service entrance conductor sizing — ampacity → AWG Cu / AWG Al
export const SE_TABLE=[{a:100,cu:"4",al:"2"},{a:125,cu:"2",al:"1/0"},{a:150,cu:"1",al:"2/0"},{a:200,cu:"2/0",al:"4/0"},{a:225,cu:"3/0",al:"250kcm"},{a:320,cu:"350kcm",al:"500kcm"},{a:400,cu:"500kcm",al:"750kcm"}];
