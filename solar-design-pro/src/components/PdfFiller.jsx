import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchPdf, renderPdfPages, savePdfWithOverlays, downloadPdf } from '../api/pdf-fill.js';
import { ff, ac, tx, td, bd, c1, c2, bg, gn, rd, bl } from '../theme.js';

const RENDER_SCALE = 1.5;
let _nextId = 1;

// ── Data chip categories ──
function buildChips(d) {
  const g = (cat, label, val) => val && val !== "--" && val !== "" ? { cat, label, val } : null;
  return [
    g("Property", "Site Address", d.siteAddress),
    g("Property", "Parcel / PIN", d.parcelId),
    g("Property", "Owner Name", d.propertyOwner),
    g("Property", "Owner Address", d.ownerAddress),
    g("Property", "Owner Phone", d.ownerPhone),
    g("Property", "Owner Email", d.ownerEmail),
    g("Property", "City", d.city),
    g("Property", "State", d.state),
    g("Property", "Zip", d.zip),
    g("System", "System DC", d.systemSizeDC),
    g("System", "System AC", d.systemSizeAC),
    g("System", "Module", d.module),
    g("System", "Module Qty", d.moduleQty),
    g("System", "Inverter", d.inverter),
    g("System", "Mount Type", d.mountType),
    g("System", "Roof Type", d.roofType),
    g("System", "Roof Pitch", d.roofPitch),
    g("System", "Annual kWh", d.annualProduction),
    g("System", "Service", d.existingService),
    g("System", "Rapid Shutdown", d.rapidShutdown),
    g("System", "Battery", d.batteryStorage),
    { cat: "Contractor", label: "Company", val: "Canopy Solar" },
    g("Contractor", "License #", d.contractorLicense),
    g("Contractor", "Phone", d.contractorPhone),
    g("Contractor", "Email", d.contractorEmail),
    g("Contractor", "Address", d.contractorAddress),
    g("Utility", "Utility", d.utility),
    g("Utility", "Account #", d.utilityAccount),
    g("Utility", "Meter #", d.meterNumber),
    g("Other", "Jurisdiction", d.jurisdiction),
    g("Other", "Monitoring", d.monitoringSystem),
  ].filter(Boolean);
}

const CAT_COLORS = { Property: "#2563eb", System: "#d97706", Contractor: "#059669", Utility: "#0891b2", Other: "#6b7280" };

export default function PdfFiller({ form, projectData, onClose }) {
  const [pages, setPages] = useState([]);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [items, setItems] = useState([]);
  const [selId, setSelId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [customText, setCustomText] = useState("");

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const chips = useMemo(() => buildChips(projectData), [projectData]);
  const pageItems = useMemo(() => items.filter(it => it.page === pageIdx), [items, pageIdx]);
  const selItem = selId != null ? items.find(it => it.id === selId) : null;

  // ── Load PDF ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const bytes = await fetchPdf(form.url);
        if (cancelled) return;
        setPdfBytes(bytes);
        const rendered = await renderPdfPages(bytes, RENDER_SCALE);
        if (cancelled) return;
        setPages(rendered);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.url]);

  // ── Body scroll lock + escape key ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // ── Zoom with Ctrl+scroll ──
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => Math.min(4, Math.max(0.3, z - e.deltaY * 0.002)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Sidebar drag start ──
  const onChipDragStart = useCallback((e, label, val) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ label, val }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // ── Canvas drop ──
  const onCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setItems(prev => [...prev, {
      id: _nextId++,
      page: pageIdx,
      x, y,
      text: data.val,
      fontSize: 10,
      label: data.label,
    }]);
  }, [pageIdx, zoom]);

  // ── Within-canvas mouse drag ──
  const onItemMouseDown = useCallback((e, id) => {
    e.stopPropagation();
    const it = items.find(i => i.id === id);
    if (!it) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;
    setDrag({ id, offsetX: cx - it.x, offsetY: cy - it.y });
    setSelId(id);
  }, [items, zoom]);

  const onCanvasMouseMove = useCallback((e) => {
    if (!drag) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;
    setItems(prev => prev.map(it =>
      it.id === drag.id ? { ...it, x: cx - drag.offsetX, y: cy - drag.offsetY } : it
    ));
  }, [drag, zoom]);

  const onCanvasMouseUp = useCallback(() => { setDrag(null); }, []);

  // ── Click canvas background → deselect ──
  const onCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'IMG') {
      setSelId(null);
    }
  }, []);

  // ── Delete item ──
  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    if (selId === id) setSelId(null);
  }, [selId]);

  // ── Update item fontSize ──
  const setItemFontSize = useCallback((id, sz) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, fontSize: Math.max(6, Math.min(24, sz)) } : it));
  }, []);

  // ── Save PDF ──
  const doSave = async () => {
    if (!pdfBytes) return;
    setSaving(true);
    try {
      const filled = await savePdfWithOverlays(pdfBytes, items, RENDER_SCALE);
      const name = `${form.nm.replace(/[^a-zA-Z0-9 ]/g, "").trim()} — Filled.pdf`;
      downloadPdf(filled, name);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  // ── Add custom text chip ──
  const addCustom = () => {
    if (!customText.trim()) return;
    // Drop it centered on the current page view
    const pg = pages[pageIdx];
    if (!pg) return;
    setItems(prev => [...prev, {
      id: _nextId++,
      page: pageIdx,
      x: pg.canvasWidth / 4,
      y: pg.canvasHeight / 4,
      text: customText.trim(),
      fontSize: 10,
      label: "Custom",
    }]);
    setCustomText("");
  };

  const curPage = pages[pageIdx];

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
      fontFamily: ff, color: tx,
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        height: 44, background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12, flexShrink: 0, fontSize: 13,
      }}>
        <button onClick={onClose} style={closeBtnStyle} title="Close (Esc)">✕</button>
        <span style={{ fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {form.nm}
        </span>
        {pages.length > 1 && <>
          <button onClick={() => setPageIdx(p => Math.max(0, p - 1))} disabled={pageIdx === 0} style={navBtn}>◀</button>
          <span style={{ fontSize: 11 }}>Page {pageIdx + 1} / {pages.length}</span>
          <button onClick={() => setPageIdx(p => Math.min(pages.length - 1, p + 1))} disabled={pageIdx === pages.length - 1} style={navBtn}>▶</button>
        </>}
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} style={navBtn}>−</button>
        <span style={{ fontSize: 11, minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(4, z + 0.15))} style={navBtn}>+</button>
        <button onClick={doSave} disabled={saving || items.length === 0} style={{
          ...navBtn, background: gn, color: '#fff', fontWeight: 700, padding: '4px 14px',
          opacity: saving || items.length === 0 ? 0.5 : 1,
        }}>
          {saving ? "Saving..." : "Save PDF"}
        </button>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── PDF Canvas ── */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 20, background: '#2a2a3e' }}>
          {loading && <div style={{ color: '#fff', fontSize: 14, alignSelf: 'center' }}>Loading PDF...</div>}
          {err && <div style={{ color: rd, fontSize: 14, alignSelf: 'center' }}>Error: {err}</div>}
          {!loading && !err && curPage && (
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                width: curPage.canvasWidth,
                height: curPage.canvasHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                flexShrink: 0,
                cursor: drag ? 'grabbing' : 'default',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onCanvasDrop}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
              onClick={onCanvasClick}
            >
              <img
                src={curPage.dataUrl}
                width={curPage.canvasWidth}
                height={curPage.canvasHeight}
                style={{ display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                draggable={false}
                alt={`Page ${pageIdx + 1}`}
              />
              {/* ── Placed items ── */}
              {pageItems.map(it => (
                <div
                  key={it.id}
                  onMouseDown={(e) => onItemMouseDown(e, it.id)}
                  onClick={(e) => { e.stopPropagation(); setSelId(it.id); }}
                  style={{
                    position: 'absolute',
                    left: it.x,
                    top: it.y,
                    fontSize: it.fontSize,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    color: '#000',
                    cursor: drag?.id === it.id ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    padding: '0 2px',
                    background: '#fff',
                    outline: selId === it.id ? '2px solid #2563eb' : 'none',
                    borderRadius: 2,
                    lineHeight: 1.2,
                  }}
                >
                  {it.text}
                  {/* ── Selected item toolbar ── */}
                  {selId === it.id && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: '#fff', border: `1px solid ${bd}`, borderRadius: 4,
                        padding: '2px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: td, fontSize: 9 }}>Size</span>
                      <input
                        type="number"
                        min={6} max={24}
                        value={it.fontSize}
                        onChange={(e) => setItemFontSize(it.id, +e.target.value)}
                        style={{ width: 36, padding: '1px 3px', border: `1px solid ${bd}`, borderRadius: 3, fontSize: 11, textAlign: 'center' }}
                      />
                      <button
                        onClick={() => deleteItem(it.id)}
                        style={{ background: rd, color: '#fff', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                      >✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar — Data Chips ── */}
        <div style={{
          width: 260, flexShrink: 0, background: c1, borderLeft: `1px solid ${bd}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 12px 8px', fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${bd}` }}>
            Data Chips
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {/* ── Special chips ── */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: td, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Quick</div>
              {[
                { label: "Date", val: new Date().toLocaleDateString('en-US') },
                { label: "X (checkbox)", val: "X" },
              ].map(c => (
                <div
                  key={c.label}
                  draggable
                  onDragStart={(e) => onChipDragStart(e, c.label, c.val)}
                  style={chipStyle("#6b7280")}
                >
                  <span style={chipLabel}>{c.label}</span>
                  <span style={chipVal}>{c.val}</span>
                </div>
              ))}
            </div>

            {/* ── Grouped data chips ── */}
            {Object.entries(
              chips.reduce((acc, c) => { (acc[c.cat] = acc[c.cat] || []).push(c); return acc; }, {})
            ).map(([cat, list]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: CAT_COLORS[cat] || td, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {cat}
                </div>
                {list.map(c => (
                  <div
                    key={c.label}
                    draggable
                    onDragStart={(e) => onChipDragStart(e, c.label, c.val)}
                    style={chipStyle(CAT_COLORS[c.cat] || "#6b7280")}
                  >
                    <span style={chipLabel}>{c.label}</span>
                    <span style={chipVal}>{c.val}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* ── Custom text ── */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: td, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Custom</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
                  placeholder="Type text..."
                  style={{ flex: 1, padding: '4px 8px', border: `1px solid ${bd}`, borderRadius: 4, fontSize: 11, fontFamily: ff }}
                />
                <button
                  onClick={addCustom}
                  style={{ padding: '4px 10px', background: ac, color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >Add</button>
              </div>
            </div>
          </div>

          {/* ── Placed items summary ── */}
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${bd}`, fontSize: 10, color: td }}>
            {items.length} item{items.length !== 1 ? 's' : ''} placed
            {items.length > 0 && (
              <span> ({items.filter(it => it.page === pageIdx).length} on this page)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const closeBtnStyle = {
  background: 'transparent', border: 'none', color: '#fff', fontSize: 18,
  cursor: 'pointer', padding: '2px 6px', lineHeight: 1,
};

const navBtn = {
  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
  borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 13,
};

const chipStyle = (color) => ({
  display: 'flex', flexDirection: 'column', gap: 1,
  padding: '5px 8px', marginBottom: 4,
  background: `${color}10`, border: `1px solid ${color}30`,
  borderRadius: 6, cursor: 'grab', userSelect: 'none',
});

const chipLabel = { fontSize: 9, fontWeight: 700, color: td, textTransform: 'uppercase', letterSpacing: '0.04em' };
const chipVal = { fontSize: 12, color: tx, wordBreak: 'break-word' };
