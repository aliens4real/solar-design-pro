// ── Jurisdiction Lookup (FCC + Census Bureau) ──

export async function lookupJurisdiction(lat, lng) {
  const jur = { st: null, co: null, tw: null, pl: null };

  // 1) FCC Census Block API → state + county
  try {
    const fcc = await fetch(
      `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`
    );
    if (fcc.ok) {
      const d = await fcc.json();
      if (d.State) jur.st = { fips: d.State.FIPS, nm: d.State.name, cd: d.State.code };
      if (d.County) jur.co = { fips: d.County.FIPS, nm: d.County.name };
    }
  } catch {}

  // 2) Census Bureau Geocoder → place (city/village) + county subdivision (township)
  try {
    const cen = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
    );
    if (cen.ok) {
      const d = await cen.json();
      const geo = d?.result?.geographies;
      // Incorporated place
      const places = geo?.["Incorporated Places"] || geo?.["Census Designated Places"] || [];
      if (places.length > 0) {
        const p = places[0];
        jur.pl = { fips: p.GEOID || p.PLACEFP, nm: p.NAME || p.BASENAME };
      }
      // County subdivision (township)
      const subs = geo?.["County Subdivisions"] || [];
      if (subs.length > 0) {
        const s = subs[0];
        jur.tw = { fips: s.GEOID || s.COUSUBFP, nm: s.NAME || s.BASENAME };
      }
      // Backfill state/county from Census if FCC missed
      const counties = geo?.["Counties"] || [];
      if (!jur.co && counties.length > 0) {
        jur.co = { fips: counties[0].GEOID, nm: counties[0].NAME };
      }
      const states = geo?.["States"] || [];
      if (!jur.st && states.length > 0) {
        jur.st = { fips: states[0].GEOID, nm: states[0].NAME, cd: states[0].STUSAB };
      }
    }
  } catch {}

  return jur;
}
