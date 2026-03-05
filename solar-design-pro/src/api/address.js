// ── Address autocomplete via Nominatim (OpenStreetMap) ──

export async function fetchAddressSuggestions(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({ q: query, format: "json", addressdetails: "1", limit: "5", countrycodes: "us" }),
    { headers: { "Accept": "application/json" } }
  );
  if (!r.ok) return [];
  const data = await r.json();
  return data
    .filter(d => d.address && (d.address.road || d.address.house_number))
    .map(d => {
      const a = d.address;
      const road = [a.house_number, a.road].filter(Boolean).join(" ");
      const city = a.city || a.town || a.village || a.hamlet || "";
      const state = a.state || "";
      const zip = a.postcode || "";
      return { road, city, state, zip, display: `${road}, ${city}, ${state} ${zip}`.trim() };
    });
}
