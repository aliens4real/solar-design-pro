import { specFromRun } from './annotation-geo.js';
import { DEF_W, DEF_H, DEF_BEND } from './annotation-geo.js';

// ── Helpers ──

function mk(id, x, y, ct, lb, dt) {
  return { id, x, y, ct, lb: lb || "", dt: dt || "", w: DEF_W, h: DEF_H };
}

function ln(id, from, to, label, spec, dir) {
  const s = spec ? specFromRun(spec) : {};
  return { id, from, to, label: label || "", dir: dir || "h", bendR: DEF_BEND, co: null, ...s };
}

// ═══ Residential Roof Mount ═══

export function seedResidential(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("res_rb", 340, 260, "roofbox", "Roof Box", "SolaDeck 0799"),
    mk("res_rsd", 383, 129, "rapid_sd", "Rapid Shutdown", "NEC 690.12"),
    mk("res_inv", 468, 416, "inverter", "Inverter", "DC→AC"),
    mk("res_acd", 565, 416, "disconnect", "AC Disconnect", "Lockable"),
    mk("res_mtr", 695, 415, "meter", "Utility Meter", "Revenue"),
    mk("res_pnl", 820, 410, "panel", "Main Panel", `${es}A Service`),
    mk("res_gec", 913, 417, "grounding", "GEC", "Ground Rod"),
    mk("res_pm", 651, 467, "prod_meter", "Prod. Meter", ""),
  ];

  // Multi-inverter: add extra inverter markers
  if (ivs && ivs.length > 1) {
    for (let i = 1; i < ivs.length; i++) {
      const e = ivs[i];
      markers.push(mk(`res_inv_${i}`, 468 + i * 50, 416 + i * 35, "inverter", `Inverter ${i + 1}`, e.inv?.nm || ""));
      markers.push(mk(`res_acd_${i}`, 565 + i * 50, 416 + i * 35, "disconnect", `AC Disc. ${i + 1}`, "Lockable"));
    }
  }

  const lines = [];
  lines.push(ln("res_ln_rb", "res_rb", "res_rsd", "DC Roof Box", dcRun));
  if (dcRun) {
    lines.push(ln("res_ln_dc", "res_rsd", "res_inv", "DC Home Run", dcRun));
  }
  lines.push(ln("res_ln_ac", "res_inv", "res_acd", "AC Branch", acRun));
  lines.push(ln("res_ln_af", "res_acd", "res_mtr", "AC Feeder", acRun));
  lines.push(ln("res_ln_se", "res_mtr", "res_pnl", "Service Ent.", seRun));
  lines.push(ln("res_ln_ge", "res_pnl", "res_gec", "Grounding", gecRun));
  return { mk: markers, ln: lines };
}

// ═══ Commercial Roof Mount ═══

export function seedCommercial(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("com_rb", 530, 220, "roofbox", "Roof Box", "SolaDeck 0799"),
    mk("com_rsd", 458, 179, "rapid_sd", "Rapid SD", "NEC 690.12"),
    mk("com_cmb", 115, 244, "combiner", "Combiner", "Rooftop"),
    mk("com_inv", 188, 244, "inverter", "Inverter(s)", "3-Phase"),
    mk("com_acd", 265, 244, "disconnect", "AC Disc.", "Rooftop"),
    mk("com_xfr", 648, 345, "transformer", "Transformer", "Utility"),
    mk("com_mtr", 735, 351, "meter", "Utility Meter", "Revenue"),
    mk("com_mdp", 833, 348, "panel", "Main Dist. Panel", `${es}A`),
    mk("com_dsc", 928, 351, "disconnect", "Disconnect", "Service Ent."),
    mk("com_gec", 923, 405, "grounding", "GEC", "Ground"),
  ];

  if (ivs && ivs.length > 1) {
    for (let i = 1; i < ivs.length; i++) {
      const e = ivs[i];
      markers.push(mk(`com_inv_${i}`, 188 + i * 50, 244 + i * 30, "inverter", `Inverter ${i + 1}`, e.inv?.nm || ""));
    }
  }

  const lines = [];
  lines.push(ln("com_ln_d1", "com_cmb", "com_inv", "DC Combined", dcRun || dcPV));
  lines.push(ln("com_ln_ac", "com_inv", "com_acd", "AC 3-Phase", acRun));
  lines.push(ln("com_ln_a2", "com_acd", "com_xfr", "AC Feeder", acRun));
  lines.push(ln("com_ln_tf", "com_xfr", "com_mtr", "Utility Feed", seRun));
  lines.push(ln("com_ln_se", "com_mtr", "com_mdp", "Service Ent.", seRun));
  lines.push(ln("com_ln_ds", "com_mdp", "com_dsc", "Service Disc.", acRun));
  lines.push(ln("com_ln_ge", "com_dsc", "com_gec", "Grounding", gecRun, "v"));
  return { mk: markers, ln: lines };
}

// ═══ Ground Mount ═══

export function seedGround(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("gnd_cmb", 470, 293, "combiner", "Combiner Box", "At Array"),
    mk("gnd_inv", 626, 291, "inverter", "Inverter", "Pad Mount"),
    mk("gnd_acd", 715, 294, "disconnect", "AC Disconnect", "Lockable"),
    mk("gnd_mtr", 827, 250, "meter", "Utility Meter", ""),
    mk("gnd_pnl", 906, 250, "panel", "Main Panel", `${es}A`),
    mk("gnd_gec", 975, 259, "grounding", "GEC", ""),
    mk("gnd_pm", 827, 308, "prod_meter", "Production Meter", ""),
  ];
  const lines = [];
  if (dcRun) {
    lines.push(ln("gnd_ln_dc", "gnd_cmb", "gnd_inv", "DC Home Run", dcRun));
  }
  lines.push(ln("gnd_ln_ac", "gnd_inv", "gnd_acd", "AC Branch", acRun));
  lines.push(ln("gnd_ln_af", "gnd_acd", "gnd_mtr", "AC Feeder", acRun));
  lines.push(ln("gnd_ln_se", "gnd_mtr", "gnd_pnl", "Service Ent.", seRun));
  lines.push(ln("gnd_ln_ge", "gnd_pnl", "gnd_gec", "Grounding", gecRun));
  return { mk: markers, ln: lines };
}

// ═══ Carport Mount ═══

export function seedCarport(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("cp_cmb", 434, 286, "combiner", "Combiner", "On Column"),
    mk("cp_inv", 533, 289, "inverter", "Inverter", "Pad/Wall"),
    mk("cp_acd", 630, 292, "disconnect", "AC Disconnect", "Lockable"),
    mk("cp_mtr", 758, 390, "meter", "Utility Meter", ""),
    mk("cp_pnl", 843, 390, "panel", "Main Panel", `${es}A`),
    mk("cp_gec", 915, 394, "grounding", "GEC", ""),
  ];
  const lines = [];
  if (dcRun) {
    lines.push(ln("cp_ln_dc", "cp_cmb", "cp_inv", "DC Home Run", dcRun));
  }
  lines.push(ln("cp_ln_ac", "cp_inv", "cp_acd", "AC Branch", acRun));
  lines.push(ln("cp_ln_af", "cp_acd", "cp_mtr", "AC Feeder", acRun));
  lines.push(ln("cp_ln_se", "cp_mtr", "cp_pnl", "Service Ent.", seRun));
  lines.push(ln("cp_ln_ge", "cp_pnl", "cp_gec", "Grounding", gecRun));
  return { mk: markers, ln: lines };
}
