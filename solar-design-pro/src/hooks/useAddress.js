import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchAddressSuggestions } from '../api/address.js';

export function useAddress(sPj, setGeo, climRan, onPick) {
  const [addrQ, setAddrQ] = useState("");
  const [addrSug, setAddrSug] = useState([]);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrHi, setAddrHi] = useState(-1);
  const addrTimer = useRef(null);
  const addrRef = useRef(null);
  const addrInpRef = useRef(null);
  const [addrRect, setAddrRect] = useState(null);

  const updateRect = useCallback(() => {
    if (addrInpRef.current) {
      const r = addrInpRef.current.getBoundingClientRect();
      setAddrRect({ top: r.bottom, left: r.left, width: r.width });
    }
  }, []);

  const searchAddr = useCallback((q) => {
    setAddrQ(q); setAddrOpen(true); setAddrHi(-1); updateRect();
    clearTimeout(addrTimer.current);
    if (q.length < 3) { setAddrSug([]); setAddrLoading(false); return; }
    setAddrLoading(true);
    addrTimer.current = setTimeout(async () => {
      try {
        const results = await fetchAddressSuggestions(q);
        setAddrSug(results);
        setAddrOpen(results.length > 0);
        updateRect();
      } catch (e) { console.error("Addr autocomplete error:", e); setAddrSug([]); }
      setAddrLoading(false);
    }, 250);
  }, [updateRect]);

  const pickAddr = useCallback((s) => {
    const full = s.display || (s.road + (s.city ? ", " + s.city : "") + (s.state ? ", " + s.state : "") + (s.zip ? " " + s.zip : ""));
    setAddrQ(full);
    setAddrOpen(false); setAddrSug([]); setAddrHi(-1);
    const newPj = { ad: s.road, ct: s.city, st: s.state, zp: s.zip, tl: "", th: "", ir: "", ps: "" };
    sPj(p => ({ ...p, ...newPj }));
    setGeo(null);
    climRan.current = true;
    if (onPick) onPick(newPj);
  }, [sPj, setGeo, climRan, onPick]);

  const addrKey = useCallback((e) => {
    if (!addrOpen || addrSug.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setAddrHi(h => (h + 1) % addrSug.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAddrHi(h => (h - 1 + addrSug.length) % addrSug.length); }
    else if (e.key === "Enter" && addrHi >= 0) { e.preventDefault(); pickAddr(addrSug[addrHi]); }
    else if (e.key === "Escape") { setAddrOpen(false); setAddrHi(-1); }
  }, [addrOpen, addrSug, addrHi, pickAddr]);

  // Click-outside and scroll handlers
  useEffect(() => {
    const h = (e) => { if (addrRef.current && !addrRef.current.contains(e.target)) setAddrOpen(false); };
    const s = () => setAddrOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("scroll", s, true);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("scroll", s, true); };
  }, []);

  return {
    addrQ, addrSug, addrOpen, addrLoading, addrRect, addrHi,
    addrRef, addrInpRef,
    searchAddr, pickAddr, setAddrOpen, updateRect, addrKey,
  };
}
