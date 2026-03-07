// ── IronRidge Racking Auto-Layout with Cut List ──
// Pure calculation from module layout positions → racking BOM + cut list

// ═══ CATALOG ═══

const RAILS = {
  XR100: {
    stocks: [
      { len: 132, pn: "XR-100-132B",  $: 39.55 },
      { len: 168, pn: "XR-100-168-B", $: 50.39 },
      { len: 204, pn: "XR-100-204B",  $: 61.23 },
    ],
    splice: { pn: "XR100-BOSS-01-M1", $: 6.80 },
    cap:    { pn: "XR-100-CAP01-B1",  $: 0.53 },  // pair
    maxSpan: 48,  // default residential (inches)
    label: "XR100",
  },
  XR1000: {
    stocks: [
      { len: 170, pn: "XR-1000-170M", $: 73.56 },
      { len: 204, pn: "XR-1000-204A", $: 89.16 },
      { len: 210, pn: "XR-1000-210M", $: 89.60 },
    ],
    splice: { pn: "XR1000-BOSS-01-M1", $: 6.99 },
    cap:    { pn: "XR-1000-CAP01-B1",  $: 0.57 },
    maxSpan: 60,
    label: "XR1000",
  },
  XR10: {
    stocks: [
      { len: 132, pn: "XR-10-132B", $: 34.00 },
      { len: 168, pn: "XR-10-168B", $: 41.00 },
      { len: 204, pn: "XR-10-204B", $: 47.91 },
    ],
    splice: { pn: "XR10-BOSS-01-M1", $: 6.16 },
    cap:    { pn: "XR-10-CAP01-B1",  $: 0.53 },
    maxSpan: 36,
    label: "XR10",
  },
};

const CLAMPS = {
  mid:     { pn: "UFO-CL-01-B1",      $: 3.15, d: "UFO Mid Clamp" },
  end:     { pn: "UFO-END-01-B1",      $: 4.23, d: "UFO End Clamp" },
  stopper: { pn: "UFO-STP-35MM-B1",    $: 0.48, d: "UFO End Stopper 35mm" },
};

const FEET = {
  ff2:  { pn: "FF2-02-B2",   $: 12.41, d: "FlashFoot2" },
  lft:  { pn: "LFT-03-B1",   $: 2.75,  d: "Slotted L-Foot" },
  bhw:  { pn: "BHW-TB-02-A1", $: 1.73, d: "Bonded Hardware (L-Foot)" },
};

const GROUND = {
  weeb: { pn: "WEEB-Clip",      $: 3.25, d: "WEEB Ground Clip" },
  lug:  { pn: "XR-LUG-03-A1",  $: 4.95, d: "Rail Grounding Lug" },
};

const WIRE = {
  clip: { pn: "DCS-1307-5000", $: 0.18, d: "Double Wire Clip" },
};

// ═══ ROW DETECTION ═══

/** Groups modules into rows by Y position, then sub-runs within rows by X gaps */
export function detectRows(mods, sz) {
  if (!mods || mods.length === 0) return [];
  const sorted = [...mods].sort((a, b) => a.y - b.y || a.x - b.x);
  const tol = sz.h * 0.5;

  // Cluster by Y
  const yGroups = [];
  let cur = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - cur[0].y) < tol) {
      cur.push(sorted[i]);
    } else {
      yGroups.push(cur);
      cur = [sorted[i]];
    }
  }
  yGroups.push(cur);

  // Within each Y group, split into sub-runs by X gap
  const rows = [];
  for (const grp of yGroups) {
    const xSorted = [...grp].sort((a, b) => a.x - b.x);
    let run = [xSorted[0]];
    for (let i = 1; i < xSorted.length; i++) {
      const gap = xSorted[i].x - (run[run.length - 1].x + sz.w);
      if (gap > 2 * sz.w) {
        rows.push(run);
        run = [xSorted[i]];
      } else {
        run.push(xSorted[i]);
      }
    }
    rows.push(run);
  }

  return rows.map(run => {
    const minX = Math.min(...run.map(m => m.x));
    const maxX = Math.max(...run.map(m => m.x)) + sz.w;
    return { mods: run, count: run.length, widthPx: maxX - minX };
  });
}

// ═══ RAIL SELECTION (stock-aligned splits) ═══

/**
 * Select rails for a single run — when splicing, one segment uses a full
 * stock length (zero waste) while the remainder fits the smallest stock.
 * This creates cuts that nest optimally in the bin packer.
 */
function selectRailsForRun(widthIn, railFamily) {
  const fam = RAILS[railFamily] || RAILS.XR100;
  const stocks = fam.stocks;
  const w = Math.round(widthIn * 2) / 2;
  if (w <= 0) return { segments: [], splices: 0 };

  // Single rail: pick smallest stock that fits
  for (const s of stocks) {
    if (s.len >= w) {
      return { segments: [{ stock: s, cutLen: w }], splices: 0 };
    }
  }

  const maxStock = stocks[stocks.length - 1];

  // 2-segment splice: try each stock as a full-length segment,
  // remainder goes in the smallest fitting stock.
  // Minimizes waste because one segment has 0 waste.
  if (w <= 2 * maxStock.len) {
    let best = null;
    for (const sA of stocks) {
      const cutB = Math.round((w - sA.len) * 2) / 2;
      if (cutB <= 0) continue;
      let sB = null;
      for (const s of stocks) { if (s.len >= cutB) { sB = s; break; } }
      if (!sB) continue;
      const waste = sB.len - cutB; // sA has 0 waste (full stock)
      const cost = sA.$ + sB.$;
      if (!best || waste < best.waste || (waste === best.waste && cost < best.cost)) {
        best = { sA, sB, cutA: sA.len, cutB, waste, cost };
      }
    }
    if (best) {
      return {
        segments: [
          { stock: best.sA, cutLen: best.cutA },
          { stock: best.sB, cutLen: best.cutB },
        ],
        splices: 1,
      };
    }
  }

  // 3+ segments: fill with full max-stock lengths, last one partial
  const n = Math.ceil(w / maxStock.len);
  const segments = [];
  let rem = w;
  for (let i = 0; i < n; i++) {
    if (rem >= maxStock.len) {
      segments.push({ stock: maxStock, cutLen: maxStock.len });
      rem = Math.round((rem - maxStock.len) * 2) / 2;
    } else {
      let s = maxStock;
      for (const st of stocks) { if (st.len >= rem) { s = st; break; } }
      segments.push({ stock: s, cutLen: rem });
    }
  }
  return { segments, splices: n - 1 };
}

// ═══ CUT LIST OPTIMIZER (Pair-Aware Bin Packing) ═══

/**
 * 1D cutting stock optimizer. When opening a new stock rail, tries every
 * available stock size and looks ahead for partner cuts that could share
 * the same rail — picks the combination with minimum waste.
 *
 * Example: two 100" cuts → one 204" stock (4" waste)
 * instead of two 132" stocks (64" waste).
 */
function optimizeCuts(allCuts, railFamily) {
  const fam = RAILS[railFamily] || RAILS.XR100;
  const stocks = fam.stocks;
  if (allCuts.length === 0) return [];

  const sorted = [...allCuts].sort((a, b) => b.len - a.len);
  const placed = new Array(sorted.length).fill(false);
  const bins = [];

  for (let i = 0; i < sorted.length; i++) {
    if (placed[i]) continue;
    const cut = sorted[i];

    // Phase 1: Try to fit into an existing open bin (best-fit)
    let bestBin = -1, bestRemain = Infinity;
    for (let b = 0; b < bins.length; b++) {
      const remain = bins[b].stock.len - bins[b].used;
      if (remain >= cut.len && remain - cut.len < bestRemain) {
        bestRemain = remain - cut.len;
        bestBin = b;
      }
    }
    if (bestBin >= 0) {
      bins[bestBin].pieces.push({ len: cut.len, label: cut.label });
      bins[bestBin].used += cut.len;
      bins[bestBin].waste = bins[bestBin].stock.len - bins[bestBin].used;
      placed[i] = true;
      continue;
    }

    // Phase 2: Open new bin — try each stock size, greedily pack up to 2
    // additional partner cuts to maximize utilization.
    let bestStock = null, bestPartners = [], bestWaste = Infinity, bestCost = Infinity;
    for (const stock of stocks) {
      if (stock.len < cut.len) continue;
      let rem = stock.len - cut.len;
      const partners = [];
      const tempUsed = new Set();
      // Greedily fit up to 2 partners (best-fit each pass)
      for (let pass = 0; pass < 2 && rem > 0; pass++) {
        let bj = -1, bfit = rem + 1;
        for (let j = i + 1; j < sorted.length; j++) {
          if (placed[j] || tempUsed.has(j)) continue;
          if (sorted[j].len <= rem && rem - sorted[j].len < bfit) {
            bfit = rem - sorted[j].len;
            bj = j;
          }
        }
        if (bj >= 0) { partners.push(bj); rem -= sorted[bj].len; tempUsed.add(bj); }
        else break;
      }
      if (rem < bestWaste || (rem === bestWaste && stock.$ < bestCost)) {
        bestWaste = rem; bestCost = stock.$;
        bestStock = stock; bestPartners = [...partners];
      }
    }

    const stock = bestStock || stocks[stocks.length - 1];
    const pieces = [{ len: cut.len, label: cut.label }];
    let used = cut.len;
    placed[i] = true;
    for (const j of bestPartners) {
      pieces.push({ len: sorted[j].len, label: sorted[j].label });
      used += sorted[j].len;
      placed[j] = true;
    }
    bins.push({ stock, pieces, used, waste: stock.len - used });
  }

  return bins;
}

// ═══ MAIN EXPORT ═══

/**
 * calcRacking — compute full racking layout from module positions
 *
 * @param {Array} modGroups — [{id, nm, ori, fw, fd, cnt, ...}]
 * @param {Object} layPos — { [gid]: [{id, x, y}, ...] }
 * @param {Object} md — module spec {lm, wm, w, ...}
 * @param {Object} pj — project {mt, rf, ...}
 * @param {Object} rackCfg — {rail: "auto"|"XR100"|..., span: 0 = auto}
 * @param {Object} gCfg — {[gid]: {sc, sz}} pre-computed per group
 * @returns {Object|null} {perGroup, cutList, bom, waste, railFamily}
 */
export function calcRacking(modGroups, layPos, md, pj, rackCfg, gCfg) {
  if (!md || !modGroups || modGroups.length === 0) return null;

  // Has any modules at all?
  const hasAny = modGroups.some(g => (layPos[g.id] || []).length > 0);
  if (!hasAny) return null;

  // Auto-select rail family
  let railFamily = rackCfg?.rail || "auto";
  if (railFamily === "auto") {
    railFamily = pj.mt === "ground" ? "XR1000" : "XR100";
  }
  const fam = RAILS[railFamily] || RAILS.XR100;

  // Max span
  const maxSpan = (rackCfg?.span > 0) ? rackCfg.span : fam.maxSpan;

  // Foot type
  const isAsphalt = (pj.rf || "").toLowerCase().includes("asphalt") ||
                    (pj.rf || "").toLowerCase().includes("comp");
  const foot = isAsphalt ? FEET.ff2 : FEET.lft;
  const needBhw = !isAsphalt; // L-foot needs bonded hardware

  // Totals
  let totalMods = 0;
  const allCuts = [];    // for global cut optimizer
  const perGroup = [];

  // Accumulators for hardware
  let hw = { rails: 0, splices: 0, feet: 0, midClamps: 0, endClamps: 0,
             stoppers: 0, weebs: 0, lugs: 0, capPairs: 0, wireClips: 0 };

  for (const g of modGroups) {
    const mods = layPos[g.id] || [];
    if (mods.length === 0) continue;

    const cfg = gCfg?.[g.id];
    if (!cfg) continue;
    const { sc, sz } = cfg;

    // Detect rows
    const rows = detectRows(mods, sz);
    const groupRows = [];

    for (const row of rows) {
      // Convert pixel width to inches
      const widthIn = row.widthPx / (sc * 25.4);
      const roundedWidth = Math.round(widthIn * 2) / 2;

      // Select rails for this run (2 rail positions per row: top + bottom)
      const sel = selectRailsForRun(roundedWidth, railFamily);

      // Collect cuts for optimizer
      for (const seg of sel.segments) {
        allCuts.push({ len: seg.cutLen, label: `${g.nm} R${groupRows.length + 1}` });
        allCuts.push({ len: seg.cutLen, label: `${g.nm} R${groupRows.length + 1}` }); // x2 rail positions
      }

      const railsThisRow = sel.segments.length * 2;
      const splicesThisRow = sel.splices * 2;

      // Feet per rail: max(2, floor(cutLen / maxSpan) + 1)
      let feetThisRow = 0;
      for (const seg of sel.segments) {
        const fPerRail = Math.max(2, Math.floor(seg.cutLen / maxSpan) + 1);
        feetThisRow += fPerRail * 2; // × 2 rail positions
      }

      // Clamps
      const midClamps = 2 * (row.count - 1);
      const endClamps = 4;
      const stoppers = 4;

      hw.rails += railsThisRow;
      hw.splices += splicesThisRow;
      hw.feet += feetThisRow;
      hw.midClamps += midClamps;
      hw.endClamps += endClamps;
      hw.stoppers += stoppers;

      groupRows.push({
        count: row.count,
        widthIn: roundedWidth,
        rails: railsThisRow,
        segments: sel.segments,
        splices: splicesThisRow,
        feet: feetThisRow,
        midClamps,
        endClamps,
        stoppers,
      });
    }

    totalMods += mods.length;
    perGroup.push({ gid: g.id, nm: g.nm, rows: groupRows, modCount: mods.length });
  }

  if (totalMods === 0) return null;

  // WEEBs, lugs, caps, wire clips
  hw.weebs = totalMods;
  hw.lugs = Math.max(2, Math.ceil(hw.rails / 2));
  hw.capPairs = hw.rails;
  hw.wireClips = hw.rails * 3; // ~3 per rail avg

  // 5% overage on small hardware
  const ov = v => Math.ceil(v * 1.05);
  hw.midClamps = ov(hw.midClamps);
  hw.endClamps = ov(hw.endClamps);
  hw.stoppers = ov(hw.stoppers);
  hw.weebs = ov(hw.weebs);
  hw.wireClips = ov(hw.wireClips);

  // Run global cut optimizer
  const cutList = optimizeCuts(allCuts, railFamily);
  const totalStockLen = cutList.reduce((s, b) => s + b.stock.len, 0);
  const totalWaste = cutList.reduce((s, b) => s + b.waste, 0);
  const wastePct = totalStockLen > 0 ? +(totalWaste / totalStockLen * 100).toFixed(1) : 0;

  // Build BOM (matching pack-list format: {c, d, q, u, $, t})
  const bom = [];
  const b = (c, d, q, u, $) => { if (q > 0) bom.push({ c, d, q, u, $: +$, t: +(q * $).toFixed(2) }); };

  // Rails from cut list (group by stock)
  const railCounts = {};
  for (const bin of cutList) {
    const key = bin.stock.pn;
    railCounts[key] = (railCounts[key] || { stock: bin.stock, qty: 0 });
    railCounts[key].qty++;
  }
  for (const [pn, v] of Object.entries(railCounts)) {
    b("Racking", `${fam.label} Rail ${v.stock.len}" (${pn})`, v.qty, "ea", v.stock.$);
  }

  // Splices
  if (hw.splices > 0) {
    b("Racking", `${fam.label} Boss Splice`, hw.splices, "ea", fam.splice.$);
  }

  // Feet
  b("Racking", foot.d, hw.feet, "ea", foot.$);
  if (needBhw) {
    b("Racking", FEET.bhw.d, hw.feet, "ea", FEET.bhw.$);
  }

  // Clamps
  b("Racking", CLAMPS.mid.d, hw.midClamps, "ea", CLAMPS.mid.$);
  b("Racking", CLAMPS.end.d, hw.endClamps, "ea", CLAMPS.end.$);
  b("Racking", CLAMPS.stopper.d, hw.stoppers, "ea", CLAMPS.stopper.$);

  // Grounding
  b("Racking", GROUND.weeb.d, hw.weebs, "ea", GROUND.weeb.$);
  b("Racking", GROUND.lug.d, hw.lugs, "ea", GROUND.lug.$);

  // Accessories
  b("Racking", `${fam.label} End Cap Pair`, hw.capPairs, "pr", fam.cap.$);
  b("Racking", WIRE.clip.d, hw.wireClips, "ea", WIRE.clip.$);

  return {
    perGroup,
    cutList,
    bom,
    waste: wastePct,
    railFamily,
    maxSpan,
    foot: foot.d,
    hw,
    totalMods,
    isGround: pj.mt === "ground",
  };
}

export const RAIL_OPTIONS = ["auto", "XR100", "XR1000", "XR10"];
