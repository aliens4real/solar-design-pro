import { specFromRun } from './annotation-geo.js';
import { DEF_W, DEF_H, DEF_BEND } from './annotation-geo.js';

// ── Helpers ──

function mk(id, x, y, ct, lb, dt, zone) {
  const m = { id, x, y, ct, lb: lb || "", dt: dt || "", w: DEF_W, h: DEF_H };
  if (zone) m.zone = zone;
  return m;
}

function ln(id, from, to, label, spec, dir) {
  const s = spec ? specFromRun(spec) : {};
  return { id, from, to, label: label || "", dir: dir || "h", bendR: DEF_BEND, co: null, ...s };
}

function invLabel(ivs, idx) {
  if (!ivs || ivs.length === 0) return "Inverter";
  // Simple label — SiteElectricalTab sync effect handles qty icons
  if (ivs.length > 1) return `Inverter ${idx + 1}`;
  return "Inverter";
}

function invDetail(ivs, idx) {
  if (!ivs || ivs.length === 0) return "DC→AC";
  const e = ivs[idx] || ivs[0];
  return e.inv?.nm || "DC→AC";
}

// ═══ Residential Roof Mount ═══

export function seedResidential(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("res_rsd", 400, 100, "rapid_sd", "Rapid Shutdown", "NEC 690.12"),
    mk("res_rb", 400, 210, "roofbox", "Roof Box", "SolaDeck 0799"),
    mk("res_mtr", 635, 400, "meter", "Utility Meter", "Revenue", "exterior"),
    mk("res_pm", 635, 450, "prod_meter", "Prod. Meter", "", "exterior"),
    mk("res_gec", 655, 530, "grounding", "GEC", "Ground Rod", "exterior"),
    mk("res_inv", 250, 630, "inverter", invLabel(ivs, 0), invDetail(ivs, 0), "basement"),
    mk("res_acd", 350, 630, "disconnect", "AC Disconnect", "Lockable", "basement"),
    mk("res_pnl", 460, 630, "panel", "Main Panel", `${es}A Service`, "basement"),
    mk("res_sub", 570, 630, "panel", "Sub-Panel", "Basement", "basement"),
  ];

  const lines = [];
  lines.push(ln("res_ln_rb", "res_rsd", "res_rb", "DC Roof Run", dcRun, "v"));
  if (dcRun) {
    lines.push(ln("res_ln_dc", "res_rb", "res_inv", "DC Home Run", dcRun, "v"));
  }
  lines.push(ln("res_ln_ac", "res_inv", "res_acd", "AC Branch", acRun, "h"));
  lines.push(ln("res_ln_af", "res_acd", "res_pnl", "AC Feeder", acRun, "h"));
  lines.push(ln("res_ln_se", "res_pnl", "res_mtr", "Service Ent.", seRun, "v"));
  lines.push(ln("res_ln_ge", "res_mtr", "res_gec", "Grounding", gecRun, "v"));
  lines.push(ln("res_ln_bs", "res_pnl", "res_sub", "Sub-Panel Feed", acRun, "h"));
  return { mk: markers, ln: lines };
}

// ═══ Commercial Roof Mount ═══

export function seedCommercial(es, specs, isComm, ivs) {
  const { dcPV, dcRun, acRun, seRun, gecRun } = specs;
  const markers = [
    mk("com_rb", 530, 220, "roofbox", "Roof Box", "SolaDeck 0799"),
    mk("com_rsd", 458, 179, "rapid_sd", "Rapid SD", "NEC 690.12"),
    mk("com_cmb", 115, 244, "combiner", "Combiner", "Rooftop"),
    mk("com_inv", 188, 244, "inverter", invLabel(ivs, 0), invDetail(ivs, 0)),
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
      markers.push(mk(`com_inv_${i}`, 188 + i * 50, 244 + i * 30, "inverter", invLabel(ivs, i), invDetail(ivs, i)));
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
    mk("gnd_inv", 626, 291, "inverter", invLabel(ivs, 0), invDetail(ivs, 0)),
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
    mk("cp_inv", 533, 289, "inverter", invLabel(ivs, 0), invDetail(ivs, 0)),
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
