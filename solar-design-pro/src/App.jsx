import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── Data ──
import { MODS } from './data/modules.js';
import { INVS } from './data/inverters.js';
import { MCATS } from './data/markers.js';
import { COND } from './data/nec-tables.js';
import { DEFAULT_LOGO } from './data/logo.js';

// ── Calc ──
import { strCalc } from './calc/string-calc.js';
import { mkPack } from './calc/pack-list.js';
import { calcRacking } from './calc/racking.js';

// ── API ──
import { callClaude, cleanJson } from './api/anthropic.js';
import { geocodeAddr, lookupClimateData } from './api/climate.js';

// ── Hooks ──
import { useAddress } from './hooks/useAddress.js';

// ── Theme ──
import { ff, fs, bg, c1, c2, bd, ac, tx, td, gn, rd, bl, inp, lb, cd, bt } from './theme.js';

// ── Components ──
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';

// ── Tabs ──
import ProjectTab from './tabs/ProjectTab.jsx';
import AiDesignTab from './tabs/AiDesignTab.jsx';
import ElectricalTab from './tabs/ElectricalTab.jsx';
import LayoutTab from './tabs/LayoutTab.jsx';
import SiteElectricalTab from './tabs/SiteElectricalTab.jsx';
import PlansTab from './tabs/PlansTab.jsx';
import PhotosTab from './tabs/PhotosTab.jsx';
import PackListTab from './tabs/PackListTab.jsx';
import PricingTab from './tabs/PricingTab.jsx';

// ── LocalStorage helpers ──
const SAVE_KEY = "sdp_project";
const JOBS_KEY = "sdp_jobs";
const ACTIVE_KEY = "sdp_active_job";
const jobKey = (id) => `sdp_job_${id}`;

const DEF_PJ = { nm: "", ad: "", ct: "", st: "", zp: "", kw: "", mt: "roof", rf: "asphalt", rp: "", es: "200", ds: "", eq: "", nt: "", tl: "", th: "", ir: "", ps: "", mi: "", ii: "" };
const DEF_GROUPS = [{ id: 1, nm: "South Face", az: "180", ori: "L", cnt: "", rp: "", fw: "30", fd: "18" }];
const DEF_WR = { pv: 0, dc: 0, ac: 0, se: 0, gec: 0 };
const DEF_PHT = [
  { id: 1, src: null, nm: "Exterior Wall", ds: "", mk: [], ln: [], zn: "exterior" },
  { id: 2, src: null, nm: "Basement", ds: "", mk: [], ln: [], zn: "basement" },
];

function getJobIndex() {
  try { const s = localStorage.getItem(JOBS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}

// Migrate legacy single-project to multi-job system
(function migrateIfNeeded() {
  try {
    if (localStorage.getItem(JOBS_KEY)) return;
    const legacy = localStorage.getItem(SAVE_KEY);
    if (!legacy) return;
    const data = JSON.parse(legacy);
    const id = Date.now().toString();
    const entry = { id, name: data.pj?.nm || "Migrated Job", address: [data.pj?.ad, data.pj?.ct, data.pj?.st].filter(Boolean).join(", "), kw: data.pj?.kw || "", mt: data.pj?.mt || "roof", updatedAt: new Date().toISOString() };
    localStorage.setItem(JOBS_KEY, JSON.stringify([entry]));
    localStorage.setItem(jobKey(id), legacy);
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {}
})();

function loadSaved() {
  try {
    const idx = getJobIndex();
    if (idx.length > 0) {
      const activeId = localStorage.getItem(ACTIVE_KEY);
      const id = activeId && idx.find(j => j.id === activeId) ? activeId : idx[0].id;
      const data = localStorage.getItem(jobKey(id));
      if (data) return JSON.parse(data);
    }
    const s = localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function loadActiveId() {
  try {
    const idx = getJobIndex();
    if (idx.length > 0) {
      const activeId = localStorage.getItem(ACTIVE_KEY);
      return (activeId && idx.find(j => j.id === activeId)) ? activeId : idx[0].id;
    }
    return null;
  } catch { return null; }
}

export default function App() {
  const saved = useRef(loadSaved());
  const [jobs, setJobs] = useState(() => getJobIndex());
  const [activeJobId, setActiveJobId] = useState(() => loadActiveId());

  // ── Core State ──
  const [tab, setTab] = useState("project");
  const [pj, sPj] = useState(saved.current?.pj || { nm: "", ad: "", ct: "", st: "", zp: "", kw: "", mt: "roof", rf: "asphalt", rp: "", es: "200", ds: "", eq: "", nt: "", tl: "", th: "", ir: "", ps: "", mi: "", ii: "" });
  const [geo, setGeo] = useState(saved.current?.geo || null);
  const climRan = useRef(false);
  const u = (k, v) => sPj(p => ({ ...p, [k]: v }));

  // ── Address Autocomplete ──
  const lookupClimateRef = useRef(null);
  const onAddrPick = useCallback((addr) => {
    setTimeout(() => lookupClimateRef.current({ ...pj, ...addr }), 0);
  }, [pj]);
  const { addrQ, addrSug, addrOpen, addrLoading, addrRect, addrHi, addrRef, addrInpRef, searchAddr, pickAddr, setAddrOpen, updateRect, addrKey } = useAddress(sPj, setGeo, climRan, onAddrPick);

  // ── Derived ──
  const md = MODS.find(x => x.id === pj.mi), iv = INVS.find(x => x.id === pj.ii);

  // ── Wire Run Lengths ──
  const [wr, sWr] = useState(saved.current?.wr || { pv: 0, dc: 0, ac: 0, se: 0, gec: 0 });
  const uWr = (k, v) => sWr(p => ({ ...p, [k]: +v || 0 }));

  // ── Design State ──
  const [dsg, sDsg] = useState(saved.current?.dsg || null), [pk, sPk] = useState([]);
  const [ms, sMs] = useState([]), [ci, sCi] = useState(""), [cb, sCb] = useState(false);
  const [pnl, sPnl] = useState([]), [mkr, sMkr] = useState([]), [tl2, sTl] = useState("select"), [as2, sAs] = useState(0), [em, sEm] = useState(null);
  const [pht, sPht] = useState([
    { id: 1, src: null, nm: "Exterior Wall", ds: "", mk: [], ln: [], zn: "exterior" },
    { id: 2, src: null, nm: "Basement", ds: "", mk: [], ln: [], zn: "basement" },
  ]), [ap, sAp] = useState(1);
  const [dAn, sDan] = useState({ mk: [], ln: [] });
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const logoRef = useRef(null);
  const printRef = useRef(null);
  const [climBusy, setClimBusy] = useState(false), [climMsg, setClimMsg] = useState("");
  const [invRec, setInvRec] = useState("");

  // ── Multi-Inverter List ──
  const [ivList, sIvList] = useState(saved.current?.ivList || []);
  const addIv = () => sIvList(l => [...l, { id: Date.now(), model: iv?.id || "", qty: 1 }]);
  const updIv = (id, k, v) => sIvList(l => l.map(e => e.id === id ? { ...e, [k]: v } : e));
  const delIv = (id) => sIvList(l => l.filter(e => e.id !== id));
  const ivs = ivList.map(e => ({ ...e, inv: INVS.find(x => x.id === e.model) })).filter(e => e.inv);
  const totalIvKw = ivs.reduce((s, e) => s + (e.inv.kw * e.qty), 0);

  // Sync pj.ii with ivList[0] when ivList changes
  useEffect(() => {
    if (ivList.length > 0 && ivList[0].model && ivList[0].model !== pj.ii) {
      u("ii", ivList[0].model);
    }
  }, [ivList]);

  // ── Module Groups ──
  const [roofType, setRoofType] = useState(saved.current?.roofType || "gable");
  const [modGroups, setModGroups] = useState(saved.current?.modGroups || [{ id: 1, nm: "South Face", az: "180", ori: "L", cnt: "", rp: "", fw: "30", fd: "18" }]);
  const addGroup = () => setModGroups(g => [...g, { id: Date.now(), nm: `Face ${g.length + 1}`, az: "180", ori: "L", cnt: "", rp: "", fw: "30", fd: "18" }]);
  const updGroup = (id, k, v) => setModGroups(g => g.map(x => x.id === id ? { ...x, [k]: v } : x));
  const delGroup = (id) => setModGroups(g => g.length > 1 ? g.filter(x => x.id !== id) : g);
  const totalMods = modGroups.reduce((s, g) => s + (+g.cnt || 0), 0);
  const totalKw = md ? (totalMods * md.w / 1000) : 0;

  // ── Auto-calculate optimal inverter qty for DC:AC ≈ 1.20 ──
  const calcOptQty = useCallback((invId) => {
    const inv = INVS.find(x => x.id === invId);
    if (!inv) return 1;
    if (inv.tp === "micro") return totalMods || 1;
    if (totalKw <= 0) return 1;
    return Math.max(1, Math.round(totalKw / (inv.kw * 1.20)));
  }, [totalKw, totalMods]);

  // Pick inverter: create/replace ivList entry with auto qty
  const pickIv = useCallback((invId) => {
    u("ii", invId);
    if (!invId) { sIvList([]); return; }
    const q = calcOptQty(invId);
    sIvList([{ id: Date.now(), model: invId, qty: q }]);
  }, [calcOptQty]);

  // ── Layout State ──
  const [layPos, setLayPos] = useState({});
  const [layDrag, setLayDrag] = useState(null);
  const [laySel, setLaySel] = useState(null);
  const LAY_W = 840, SNAP = 8;
  const SETBACK_FT = 3;

  // ── Racking Config ──
  const [rackCfg, setRackCfg] = useState({ rail: "auto", span: 0 });

  // ── Module Gap (inches, converted to px per group scale) ──
  const [gapIn, setGapIn] = useState(0.75);
  const gapPx = (fw) => Math.max(1, Math.round(gapIn * 25.4 * faceScale(fw)));

  const faceScale = (fw) => LAY_W / ((+fw || 30) * 12 * 25.4);
  const faceSz = (ori, fw) => {
    if (!md) return { w: 46, h: 30 };
    const lm = md.lm || 1722, wm = md.wm || 1134;
    const sc = faceScale(fw);
    return ori === "L" ? { w: Math.max(8, Math.round(lm * sc)), h: Math.max(6, Math.round(wm * sc)) } : { w: Math.max(6, Math.round(wm * sc)), h: Math.max(8, Math.round(lm * sc)) };
  };
  const modSz = (ori) => {
    if (!md) return { w: 46, h: 30 };
    const lm = md.lm || 1722, wm = md.wm || 1134;
    const sc = 30 / 1000;
    return ori === "L" ? { w: Math.round(lm * sc), h: Math.round(wm * sc) } : { w: Math.round(wm * sc), h: Math.round(lm * sc) };
  };

  // ── Layout position sync (resets on orientation/width/module/gap change) ──
  const prevOri = useRef({});
  const prevMdId = useRef(null);
  const prevGap = useRef(gapIn);
  useEffect(() => {
    if (!md) return;
    // Detect module change (dimensions changed)
    const mdChanged = prevMdId.current != null && prevMdId.current !== md.id;
    prevMdId.current = md.id;
    // Detect gap change
    const gapChanged = prevGap.current !== gapIn;
    prevGap.current = gapIn;
    // Detect orientation or face-width changes
    const oriChanges = new Set();
    modGroups.forEach(g => {
      const key = `${g.ori}-${g.fw}`;
      if (prevOri.current[g.id] && prevOri.current[g.id] !== key) oriChanges.add(g.id);
      prevOri.current[g.id] = key;
    });
    setLayPos(prev => {
      const next = { ...prev };
      modGroups.forEach(g => {
        const cnt = +g.cnt || 0;
        if (cnt === 0) { delete next[g.id]; return; }
        const old = prev[g.id] || [];
        const reset = oriChanges.has(g.id) || mdChanged || gapChanged;
        if (old.length === cnt && !reset) return;
        const sz = faceSz(g.ori, g.fw);
        const sc = faceScale(g.fw);
        const sb = SETBACK_FT * 12 * 25.4 * sc;
        const usableW = LAY_W - 2 * sb;
        const gp = gapPx(g.fw);
        const cols = Math.max(1, Math.floor((usableW + gp) / (sz.w + gp)));
        const arr = [];
        for (let i = 0; i < cnt; i++) {
          if (i < old.length && !reset) { arr.push(old[i]); }
          else {
            const r = Math.floor(i / cols), c = i % cols;
            arr.push({ id: i, x: sb + c * (sz.w + gp), y: sb + r * (sz.h + gp) });
          }
        }
        next[g.id] = arr.slice(0, cnt);
      });
      Object.keys(next).forEach(k => { if (!modGroups.find(g => g.id === +k || g.id === k)) delete next[k]; });
      return next;
    });
  }, [modGroups, md, gapIn]);

  const snapPos = (gid, idx, rawX, rawY, ori, fw) => {
    const sz = fw ? faceSz(ori, fw) : modSz(ori);
    const gp = fw ? gapPx(fw) : 2;
    const sc = faceScale(fw || 30);
    const sb = SETBACK_FT * 12 * 25.4 * sc;
    // Grid step = module size + gap
    const stepX = sz.w + gp, stepY = sz.h + gp;
    // Snap to nearest grid position anchored at setback
    const bx = sb + Math.round((rawX - sb) / stepX) * stepX;
    const by = sb + Math.round((rawY - sb) / stepY) * stepY;
    return { x: Math.max(0, bx), y: Math.max(0, by) };
  };

  const updateModPos = (gid, modId, x, y) => {
    setLayPos(prev => ({ ...prev, [gid]: (prev[gid] || []).map(m => m.id === modId ? { ...m, x, y } : m) }));
  };

  const resetGroupLayout = (gid) => {
    const g = modGroups.find(x => x.id === gid);
    if (!g || !md) return;
    const cnt = +g.cnt || 0;
    const sz = faceSz(g.ori, g.fw);
    const sc = faceScale(g.fw);
    const sb = SETBACK_FT * 12 * 25.4 * sc;
    const usableW = LAY_W - 2 * sb;
    const gp = gapPx(g.fw);
    const cols = Math.max(1, Math.floor((usableW + gp) / (sz.w + gp)));
    const arr = [];
    for (let i = 0; i < cnt; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      arr.push({ id: i, x: sb + c * (sz.w + gp), y: sb + r * (sz.h + gp) });
    }
    setLayPos(prev => ({ ...prev, [gid]: arr }));
  };

  const addModToFace = (gid, clickX, clickY) => {
    const g = modGroups.find(x => x.id === gid);
    if (!g || !md) return;
    const nc = (+g.cnt || 0) + 1;
    const sz = faceSz(g.ori, g.fw);
    const sc = faceScale(g.fw);
    const sb = SETBACK_FT * 12 * 25.4 * sc;
    let mx = clickX - sz.w / 2, my = clickY - sz.h / 2;
    mx = Math.max(sb, Math.min(mx, LAY_W - sb - sz.w));
    const canH = (+g.fd || 18) * 12 * 25.4 * sc;
    my = Math.max(sb, Math.min(my, canH - sb - sz.h));
    const snapped = snapPos(gid, nc - 1, mx, my, g.ori);
    updGroup(gid, "cnt", String(nc));
    setLayPos(prev => {
      const arr = [...(prev[gid] || []), { id: nc - 1, x: snapped.x, y: snapped.y }];
      return { ...prev, [gid]: arr };
    });
  };

  const removeSelMod = () => {
    if (!laySel) return;
    const { gid, idx } = laySel;
    const g = modGroups.find(x => x.id === gid);
    if (!g) return;
    const nc = Math.max(0, (+g.cnt || 0) - 1);
    updGroup(gid, "cnt", String(nc));
    setLayPos(prev => {
      const arr = [...(prev[gid] || [])];
      arr.splice(idx, 1);
      return { ...prev, [gid]: arr };
    });
    setLaySel(null);
  };

  const autoFillFace = (gid) => {
    const g = modGroups.find(x => x.id === gid);
    if (!g || !md) return;
    const sc = faceScale(g.fw);
    const sb = SETBACK_FT * 12 * 25.4 * sc;
    const canW = LAY_W, canH = (+g.fd || 18) * 12 * 25.4 * sc;
    const sz = faceSz(g.ori, g.fw);
    const usableW = canW - 2 * sb, usableH = canH - 2 * sb;
    const gp = gapPx(g.fw);
    const cols = Math.max(1, Math.floor((usableW + gp) / (sz.w + gp)));
    const rows = Math.max(1, Math.floor((usableH + gp) / (sz.h + gp)));
    const cnt = cols * rows;
    if (cnt <= 0) return;
    updGroup(gid, "cnt", String(cnt));
    const arr = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      arr.push({ id: r * cols + c, x: sb + c * (sz.w + gp), y: sb + r * (sz.h + gp) });
    }
    setLayPos(prev => ({ ...prev, [gid]: arr }));
  };

  const applyRoofPreset = (type) => {
    setRoofType(type);
    const base = { ori: "L", cnt: "", rp: "", fw: "30", fd: "18" };
    const presets = {
      gable: [{ ...base, nm: "South Face", az: "180" }, { ...base, nm: "North Face", az: "0" }],
      hip: [{ ...base, nm: "South Face", az: "180", fw: "30", fd: "14" }, { ...base, nm: "North Face", az: "0", fw: "30", fd: "14" },
        { ...base, nm: "East Face", az: "90", fw: "16", fd: "14" }, { ...base, nm: "West Face", az: "270", fw: "16", fd: "14" }],
      flat: [{ ...base, nm: "Flat Roof", az: "180", fw: "60", fd: "40", rp: "0" }],
      shed: [{ ...base, nm: "Shed Roof", az: "180", fw: "30", fd: "20" }],
      ground: [{ ...base, nm: "Ground Array", az: "180", fw: "40", fd: "30", rp: "20" }],
    };
    const faces = (presets[type] || presets.gable).map((f, i) => ({ ...f, id: Date.now() + i }));
    setModGroups(faces);
    setLayPos({});
    setLaySel(null);
  };

  // ── Job Manager ──
  useEffect(() => {
    if (activeJobId) return;
    const id = Date.now().toString();
    const entry = { id, name: "New Job", address: "", kw: "", mt: "roof", updatedAt: new Date().toISOString() };
    localStorage.setItem(JOBS_KEY, JSON.stringify([entry]));
    localStorage.setItem(jobKey(id), JSON.stringify({ pj, ivList, modGroups, roofType, geo, wr, dsg }));
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveJobId(id);
    setJobs([entry]);
  }, []);

  const loadJob = useCallback((id) => {
    try {
      const raw = localStorage.getItem(jobKey(id));
      if (!raw) return;
      const data = JSON.parse(raw);
      sPj(data.pj || { ...DEF_PJ });
      setGeo(data.geo || null);
      sIvList(data.ivList || []);
      setModGroups(data.modGroups || [{ ...DEF_GROUPS[0], id: Date.now() }]);
      setRoofType(data.roofType || "gable");
      sWr(data.wr || { ...DEF_WR });
      sDsg(data.dsg || null);
      sPk([]); sDan({ mk: [], ln: [] }); sMs([]); sMkr([]);
      sPht(DEF_PHT.map(p => ({ ...p, mk: [], ln: [] })));
      setLayPos({}); setLaySel(null); setInvRec("");
      setActiveJobId(id);
      localStorage.setItem(ACTIVE_KEY, id);
      climRan.current = false;
    } catch {}
  }, []);

  const newJob = useCallback(() => {
    const id = Date.now().toString();
    const entry = { id, name: "New Job", address: "", kw: "", mt: "roof", updatedAt: new Date().toISOString() };
    const idx = getJobIndex();
    idx.unshift(entry);
    localStorage.setItem(JOBS_KEY, JSON.stringify(idx));
    localStorage.setItem(jobKey(id), JSON.stringify({ pj: DEF_PJ, ivList: [], modGroups: DEF_GROUPS, roofType: "gable", geo: null, wr: DEF_WR, dsg: null }));
    localStorage.setItem(ACTIVE_KEY, id);
    sPj({ ...DEF_PJ }); setGeo(null); sIvList([]);
    setModGroups([{ ...DEF_GROUPS[0], id: Date.now() }]);
    setRoofType("gable"); sWr({ ...DEF_WR }); sDsg(null);
    sPk([]); sDan({ mk: [], ln: [] }); sMs([]); sMkr([]);
    sPht(DEF_PHT.map(p => ({ ...p, mk: [], ln: [] })));
    setLayPos({}); setLaySel(null); setInvRec("");
    setActiveJobId(id); setJobs(idx);
    climRan.current = false;
  }, []);

  const deleteJob = useCallback((id) => {
    const idx = getJobIndex().filter(j => j.id !== id);
    localStorage.removeItem(jobKey(id));
    localStorage.setItem(JOBS_KEY, JSON.stringify(idx));
    setJobs(idx);
    if (activeJobId === id) {
      if (idx.length > 0) loadJob(idx[0].id);
      else newJob();
    }
  }, [activeJobId, loadJob, newJob]);

  // ── String sizing ──
  const cr = useRef(null);
  const sz = strCalc(md, iv, pj.tl, pj.th, pj.mt);

  // ── String map (which string each module belongs to) ──
  const strMap = useMemo(() => {
    const ms = dsg?.ms || sz?.opt || 0;
    if (!ms || ms < 1) return {};
    let sn = 0, mi = 0;
    const m = {};
    modGroups.forEach(g => {
      const cnt = +g.cnt || 0;
      m[g.id] = [];
      for (let i = 0; i < cnt; i++) {
        m[g.id].push(sn);
        mi++;
        if (mi >= ms) { sn++; mi = 0; }
      }
    });
    return m;
  }, [modGroups, dsg, sz]);

  // ── Racking Calculation ──
  const rack = useMemo(() => {
    if (!md) return null;
    const gCfg = {};
    modGroups.forEach(g => {
      gCfg[g.id] = { sc: faceScale(g.fw), sz: faceSz(g.ori, g.fw) };
    });
    return calcRacking(modGroups, layPos, md, pj, rackCfg, gCfg);
  }, [modGroups, layPos, md, pj, rackCfg]);

  // ── Auto-save project to localStorage ──
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const data = JSON.stringify({ pj, ivList, modGroups, roofType, geo, wr, dsg });
        localStorage.setItem(SAVE_KEY, data);
        if (activeJobId) {
          localStorage.setItem(jobKey(activeJobId), data);
          const idx = getJobIndex();
          const i = idx.findIndex(j => j.id === activeJobId);
          if (i >= 0) {
            idx[i] = { ...idx[i], name: pj.nm || "Untitled Job", address: [pj.ad, pj.ct, pj.st].filter(Boolean).join(", "), kw: pj.kw || "", mt: pj.mt || "roof", updatedAt: new Date().toISOString() };
            localStorage.setItem(JOBS_KEY, JSON.stringify(idx));
            setJobs(idx);
          }
        }
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [pj, ivList, modGroups, roofType, geo, wr, dsg, activeJobId]);

  // ── Effects ──
  useEffect(() => { if (dsg && md && iv) { sPk(mkPack(md, iv, dsg, sz, wr, pj.es, pht, ivs, rack)); } }, [dsg, md, iv, sz, wr, pj.es, pht, ivs, rack]);
  useEffect(() => { cr.current?.scrollIntoView({ behavior: "smooth" }); }, [ms]);
  useEffect(() => {
    const h = e => { if ((e.key === "Delete" || e.key === "Backspace") && laySel && tab === "layout") { e.preventDefault(); removeSelMod(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [laySel, tab]);

  // ── Auto-recommend inverter when module + kW are set ──
  useEffect(() => {
    if (md && pj.kw > 0 && totalKw > 0 && !iv) recommendInverter();
  }, [pj.mi, pj.kw, totalMods]);

  // ── Climate Lookup ──
  lookupClimateRef.current = async (pjSnap) => {
    const snap = pjSnap || pj;
    const addr = [snap.ad, snap.ct, snap.st, snap.zp].filter(Boolean).join(", ");
    if (!addr || addr.length < 5) { setClimMsg("Enter an address first"); return; }
    setClimBusy(true); setClimMsg("⏳ Geocoding...");
    try {
      let coords = geo;
      if (!coords) {
        coords = await geocodeAddr(snap);
        if (!coords) throw new Error("Could not geocode address");
        setGeo(coords);
      }
      setClimMsg("⏳ Fetching climate data...");
      const result = await lookupClimateData(snap, coords);
      if (result.tl != null) u("tl", result.tl);
      if (result.th != null) u("th", result.th);
      if (result.ir != null) u("ir", result.ir);
      if (result.ps != null) u("ps", result.ps);
      setClimMsg(result.msg);
    } catch (e) { setClimMsg("✕ " + e.message); }
    setClimBusy(false);
  };
  const lookupClimate = () => lookupClimateRef.current();

  // ── Auto-lookup climate ──
  useEffect(() => {
    if (climRan.current) return;
    const hasAddr = (pj.ct || "").trim().length >= 2 && (pj.st || "").trim().length >= 2;
    const hasClim = pj.tl && pj.th && pj.ir;
    if (hasAddr && !hasClim && !climBusy) {
      climRan.current = true;
      lookupClimateRef.current(pj);
    }
  }, [pj.ad, pj.ct, pj.st, pj.zp, pj.tl, pj.th, pj.ir, climBusy]);

  // ── Inverter Recommendation ──
  const recommendInverter = () => {
    const kwTarget = parseFloat(pj.kw);
    if (!kwTarget) { setInvRec("⚠ Enter target kW first"); return; }
    if (!md) { setInvRec("⚠ Select a module first"); return; }
    const arrayW = kwTarget * 1000;
    const nMods = Math.ceil(arrayW / md.w);
    const options = [];
    for (const inv of INVS) {
      if (inv.tp === "micro") {
        if (md.w <= inv.kw * 1000 * 1.3 && md.voc <= inv.dv && md.vmp >= inv.ml) {
          const ratio = md.w / (inv.kw * 1000);
          const cost = nMods * inv.$;
          options.push({ inv, count: nMods, ratio, cost, note: `1 per module, ${nMods}× ${inv.nm}` });
        }
        continue;
      }
      if (inv.tp === "optimizer") {
        for (let count = 1; count <= 2; count++) {
          const totalInvW = inv.kw * 1000 * count;
          const ratio = arrayW / totalInvW;
          if (ratio < 0.75 || ratio > 1.40) continue;
          const cost = count * inv.$ + nMods * 70;
          options.push({ inv, count, ratio, cost, note: `${count}× ${inv.nm} + ${nMods} P505 optimizers` });
        }
        continue;
      }
      for (let count = 1; count <= 4; count++) {
        const totalInvW = inv.kw * 1000 * count;
        const ratio = arrayW / totalInvW;
        if (ratio < 0.75 || ratio > 1.40) continue;
        if (pj.tl) {
          const s = strCalc(md, inv, pj.tl, pj.th, pj.mt);
          if (!s || s.opt < s.mn) continue;
          const maxMods = s.opt * count * 2;
          if (maxMods < nMods * 0.8) continue;
        }
        const cost = count * inv.$;
        options.push({ inv, count, ratio, cost, note: `${count}× ${inv.nm}` });
      }
    }
    if (options.length === 0) { setInvRec("⚠ No compatible inverter found — try different module or kW"); return; }
    options.sort((a, b) => {
      const idealA = Math.abs(a.ratio - 1.15), idealB = Math.abs(b.ratio - 1.15);
      const scoreA = idealA * 1000 + a.cost * 0.1 + a.count * 50;
      const scoreB = idealB * 1000 + b.cost * 0.1 + b.count * 50;
      return scoreA - scoreB;
    });
    const best = options[0];
    u("ii", best.inv.id);
    const ratioStr = best.ratio.toFixed(2);
    setInvRec(`✓ ${best.note} — DC:AC ${ratioStr}, $${best.cost.toLocaleString()}`);
  };

  // ── AI Chat ──
  const chat = async (t) => {
    if (!t.trim()) return;
    const nm = [...ms, { r: "user", t }]; sMs(nm); sCi(""); sCb(true);
    const sp = `You are a NABCEP-certified solar PV designer. Follow NEC Article 690.

PROJECT: ${pj.nm} | ${pj.ad} ${pj.ct}, ${pj.st} ${pj.zp} | ${pj.kw}kW ${pj.mt} mount (${pj.rf})
ROOF: Pitch ${pj.rp ? pj.rp + "°" : "not set"} | Service: ${pj.es}A
MODULE GROUPS: ${modGroups.map((g, i) => `${g.nm}: ${g.cnt || 0} modules @ ${g.az}° ${g.ori === "L" ? "landscape" : "portrait"}${g.rp ? ` ${g.rp}° pitch` : ""}`).join(" | ")}
TOTAL: ${totalMods} modules = ${totalKw.toFixed(2)} kW
CLIMATE: ASHRAE min ${pj.tl || "(loading)"}°C / ASHRAE 2% max ${pj.th || "(loading)"}°C | Irr: ${pj.ir || "(loading)"} kWh/m²/day | PSH: ${pj.ps || "(loading)"}
Module: ${md ? md.nm + " " + md.w + "W" : "Not selected"} | Inverter: ${iv ? iv.nm + " " + iv.kw + "kW" : "Not selected"}
Site notes: ${pj.ds || "—"} | Prefs: ${pj.eq || "—"}
${sz ? `STRING SIZING: Optimal=${sz.opt} mod/str (range ${sz.mn}-${Math.min(sz.mx, sz.mxM)}). Max Vsys=${sz.sv}V (limit ${iv?.dv}V). DC: ${sz.dc}AWG, OCPD ${sz.oc}A.` : "Need module+inverter+temps for sizing."}
${dsg ? `DESIGN: ${JSON.stringify(dsg)}` : "No design yet."}

INVENTORY MODULES: ${MODS.map(m => m.nm + " " + m.w + "W $" + m.$).join(" | ")}
INVENTORY INVERTERS: ${INVS.map(i => i.nm + " " + i.kw + "kW $" + i.$ + " (" + i.tp + ")").join(" | ")}

RULES:
1. NEVER ask for ASHRAE temps, irradiance, PSH, roof pitch, azimuth, or electrical service — these are all provided above. If climate shows "(loading)", tell user to wait or click Re-Lookup on Project tab.
2. Use the electrical service amperage for NEC 705.12 120% rule busbar calculations.
3. Use roof pitch and azimuth for production estimates and tilt factor derating.
4. When ready, generate design with JSON in \`\`\`json\`\`\` block:
{"type":"design","tm":totalModules,"ms":modulesPerString,"ns":stringsCount,"ni":inverterCount,"ratio":dcToAcRatio,"kwh":annualKwh,"cost":totalMaterialCost,"markers":[{"label":"","details":"","category":"array|inverter|disconnect|panel|conduit|junction|grounding|meter|note"}],"steps":["installation step"],"notes":["design note"]}
5. Explain NEC reasoning (690.7, 690.8, 705.12 etc). Consider least cost.
6. For markers: include array, inverter, DC disconnect, AC disconnect, conduit runs, J-boxes, grounding, meter, main panel.`;
    try {
      const txt = await callClaude({ system: sp, messages: nm.slice(-10).map(m => ({ role: m.r, content: m.t })), max_tokens: 4000 });
      const jm = txt.match(/```json\s*([\s\S]*?)\s*```/);
      if (jm) {
        try {
          const dd = JSON.parse(jm[1]);
          if (dd.type === "design") {
            sDsg(dd);
            if (dd.markers?.length) sMkr(p => [...p, ...dd.markers.map((mk, i) => ({ id: `a${Date.now()}${i}`, x: 50 + (i % 5) * 155, y: 70 + Math.floor(i / 5) * 95, ...mk }))]);
          }
        } catch (e) { }
      }
      sMs(p => [...p, { r: "assistant", t: txt }]);
    } catch (e) { sMs(p => [...p, { r: "assistant", t: "Error: " + e.message }]); }
    sCb(false);
  };

  // ── Render ──
  return (
    <div style={{ fontFamily: fs, background: bg, color: tx, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header logo={logo} pj={pj} dsg={dsg} />
      <TabBar tab={tab} setTab={setTab} />

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {tab === "project" && <ProjectTab
          pj={pj} u={u} md={md} iv={iv} sz={sz} totalMods={totalMods} totalKw={totalKw}
          modGroups={modGroups} addGroup={addGroup} updGroup={updGroup} delGroup={delGroup}
          climBusy={climBusy} climMsg={climMsg} lookupClimate={lookupClimate} climRan={climRan}
          invRec={invRec} setInvRec={setInvRec} recommendInverter={recommendInverter}
          ivList={ivList} addIv={addIv} updIv={updIv} delIv={delIv} ivs={ivs} totalIvKw={totalIvKw} pickIv={pickIv} calcOptQty={calcOptQty}
          setTab={setTab} chat={chat}
          addrQ={addrQ} addrSug={addrSug} addrOpen={addrOpen} addrLoading={addrLoading} addrRect={addrRect} addrHi={addrHi}
          addrRef={addrRef} addrInpRef={addrInpRef} searchAddr={searchAddr} pickAddr={pickAddr}
          setAddrOpen={setAddrOpen} updateRect={updateRect} addrKey={addrKey}
          jobs={jobs} activeJobId={activeJobId} onNewJob={newJob} onLoadJob={loadJob} onDeleteJob={deleteJob}
        />}

        {tab === "ai" && <AiDesignTab ms={ms} ci={ci} sCi={sCi} cb={cb} chat={chat} cr={cr} />}

        {tab === "electrical" && <ElectricalTab md={md} iv={iv} sz={sz} dsg={dsg} climBusy={climBusy} lookupClimate={lookupClimate} climRan={climRan} pj={pj} ivs={ivs} totalIvKw={totalIvKw} />}

        {tab === "layout" && <>
          <LayoutTab
            md={md} iv={iv} pj={pj} totalMods={totalMods} totalKw={totalKw}
            modGroups={modGroups} roofType={roofType} applyRoofPreset={applyRoofPreset}
            addGroup={addGroup} updGroup={updGroup} delGroup={delGroup}
            layPos={layPos} layDrag={layDrag} setLayDrag={setLayDrag}
            laySel={laySel} setLaySel={setLaySel}
            autoFillFace={autoFillFace} resetGroupLayout={resetGroupLayout}
            removeSelMod={removeSelMod} addModToFace={addModToFace}
            snapPos={snapPos} updateModPos={updateModPos}
            faceScale={faceScale} faceSz={faceSz}
            SETBACK_FT={SETBACK_FT} LAY_W={LAY_W}
            gapIn={gapIn} setGapIn={setGapIn}
            strMap={strMap}
            rack={rack} rackCfg={rackCfg} setRackCfg={setRackCfg}
          />
          <SiteElectricalTab pj={pj} sz={sz} iv={iv} dsg={dsg} dAn={dAn} sDan={sDan}
            modGroups={modGroups} layPos={layPos} md={md} ivs={ivs} />
        </>}

        {tab === "plans" && <PlansTab
          md={md} iv={iv} sz={sz} pj={pj} dsg={dsg} pk={pk}
          totalMods={totalMods} totalKw={totalKw} modGroups={modGroups}
          logo={logo} setLogo={setLogo} logoRef={logoRef} printRef={printRef}
          modSz={modSz} faceSz={faceSz} layPos={layPos}
          ivs={ivs} totalIvKw={totalIvKw} rack={rack}
        />}

        {tab === "photos" && <PhotosTab pht={pht} sPht={sPht} ap={ap} sAp={sAp} sz={sz} pj={pj} iv={iv} dsg={dsg} dAn={dAn} />}

        {tab === "packlist" && <PackListTab pk={pk} dsg={dsg} md={md} iv={iv} sz={sz} pj={pj} sDsg={sDsg} mkr={mkr} />}

        {tab === "pricing" && <PricingTab pk={pk} dsg={dsg} pj={pj} totalMods={totalMods} totalKw={totalKw} md={md} iv={iv} ivs={ivs} logo={logo} />}
      </div>
    </div>
  );
}
