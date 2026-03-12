// ── PDF Fill Utilities ──
// Shared fetch/download + interactive overlay rendering & saving
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ═══════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════

// ── Fetch PDF via CORS proxy ──
export async function fetchPdf(url) {
  const r = await fetch(`/api/pdf-proxy?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`PDF fetch failed (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

// ── Download filled PDF ──
export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ═══════════════════════════════════════════
// INTERACTIVE OVERLAY — Render & Save
// ═══════════════════════════════════════════

// ── Render each page to a canvas image for the interactive viewer ──
export async function renderPdfPages(pdfBytes, scale = 1.5) {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    pages.push({
      pageNum: i - 1,
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      pdfWidth: vp.width / scale,
      pdfHeight: vp.height / scale,
      canvasWidth: vp.width,
      canvasHeight: vp.height,
    });
  }
  doc.destroy();
  return pages;
}

// ── Save PDF with text overlaid at placed item positions ──
// items: [{ page, x, y, text, fontSize }]  — x/y in canvas-pixel coords
// renderScale: the scale used when rendering pages (must match renderPdfPages)
export async function savePdfWithOverlays(pdfBytes, items, renderScale = 1.5) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const item of items) {
    const pageIdx = item.page || 0;
    if (pageIdx >= doc.getPageCount()) continue;
    const page = doc.getPage(pageIdx);
    const { height } = page.getSize();
    const sz = item.fontSize || 10;
    const xPdf = item.x / renderScale;
    const yPdf = height - (item.y / renderScale) - sz;
    const textWidth = font.widthOfTextAtSize(String(item.text), sz);
    // White background to cover existing form text
    page.drawRectangle({
      x: xPdf - 1,
      y: yPdf - 1,
      width: textWidth + 2,
      height: sz + 2,
      color: rgb(1, 1, 1),
    });
    page.drawText(String(item.text), {
      x: xPdf,
      y: yPdf,
      size: sz,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return new Uint8Array(await doc.save());
}
