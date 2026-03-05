// ── Climate Data — All open-source, no API keys ──

// ── Geocode via Nominatim (OpenStreetMap) ──
export async function geocodeAddr(pj) {
  const addr = [pj.ad, pj.ct, pj.st, pj.zp].filter(Boolean).join(", ");
  if (addr.length < 5) return null;
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({ q: addr, format: "json", limit: "1", countrycodes: "us" }),
    { headers: { "Accept": "application/json" } }
  );
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.length) return null;
  return { lat: +data[0].lat, lng: +data[0].lon };
}

// ── Climate Data Lookup (NASA POWER — free, no key) ──
export async function lookupClimateData(pj, coords) {
  const { lat, lng } = coords;

  // NASA POWER Climatology API — monthly averages from 30-year satellite record
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M_MIN,T2M_MAX,T2M_RANGE,ALLSKY_SFC_SW_DWN&community=RE&longitude=${lng.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON`;
  const nr = await fetch(url);
  if (!nr.ok) throw new Error("NASA POWER HTTP " + nr.status);
  const nd = await nr.json();
  const p = nd.properties?.parameter;
  if (!p) throw new Error("No NASA POWER data returned");

  const mos = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const tMins = mos.map(m => p.T2M_MIN?.[m]).filter(v => v != null && v > -900);
  const tMaxs = mos.map(m => p.T2M_MAX?.[m]).filter(v => v != null && v > -900);
  const ghi = mos.map(m => p.ALLSKY_SFC_SW_DWN?.[m]).filter(v => v != null && v > -900);

  if (tMins.length < 12 || tMaxs.length < 12 || ghi.length < 6)
    throw new Error("Incomplete NASA POWER data");

  // ASHRAE-equivalent design temperatures from NASA POWER monthly extremes:
  // - Cold design temp: coldest monthly T2M_MIN minus offset for extreme events
  //   ASHRAE Extreme Annual Mean Min ≈ coldest-month avg min − (avg daily range × 0.5)
  //   This approximates the 99.6% heating design dry-bulb
  const coldestMinMonth = Math.min(...tMins);
  const ranges = mos.map(m => p.T2M_RANGE?.[m]).filter(v => v != null && v > -900);
  const coldOffset = ranges.length > 0 ? Math.max(...ranges) * 0.5 : 5;
  const eMin = Math.round(coldestMinMonth - coldOffset);

  // - Hot design temp: warmest monthly T2M_MAX plus small offset
  //   ASHRAE 2% cooling design DB ≈ warmest-month avg max + ~2°C
  const eMax = Math.round(Math.max(...tMaxs) + 2);

  const avgGhi = +(ghi.reduce((a, b) => a + b, 0) / ghi.length).toFixed(2);

  return {
    tl: String(eMin),
    th: String(eMax),
    ir: String(avgGhi),
    ps: String(avgGhi),
    source: "nasa",
    msg: `✓ NASA POWER: ${eMin}°C min / ${eMax}°C max / ${avgGhi} kWh/m²/day`
  };
}
