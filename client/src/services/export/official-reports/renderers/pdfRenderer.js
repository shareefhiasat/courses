import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const ARABIC_FONT_STACK = "'Cairo', 'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif";

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

function applyPdfFontHints(root) {
  root.querySelectorAll('[data-official-page], [data-official-page] *').forEach((el) => {
    el.style.fontFamily = ARABIC_FONT_STACK;
    el.style.letterSpacing = 'normal';
    el.style.wordSpacing = 'normal';
    el.style.fontFeatureSettings = "'liga' 1, 'calt' 1";
    el.style.webkitFontSmoothing = 'antialiased';
  });
}

/**
 * Render React official report component(s) to PDF blob.
 * @param {React.ReactElement} element - Root element (may contain multiple [data-official-page] children)
 * @param {Object} options
 * @returns {Promise<Blob>}
 */
export async function renderOfficialPdf(element, options = {}) {
  const { filename = 'report.pdf', scale = 2, serial = '', lang = 'en' } = options;

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-10000px;top:0;z-index:-1;background:#fff;font-family:${ARABIC_FONT_STACK};`;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(element);

  await new Promise((r) => setTimeout(r, 900));
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  if (document.fonts) {
    try {
      await document.fonts.load(`700 72px Cairo`);
      await document.fonts.load(`400 11px Cairo`);
      await document.fonts.load(`700 11px Cairo`);
      await document.fonts.load(`400 11px "IBM Plex Sans Arabic"`);
      await document.fonts.load(`700 11px "IBM Plex Sans Arabic"`);
    } catch {
      // font loading is best-effort
    }
  }
  await waitForImages(container);
  applyPdfFontHints(container);

  const pageElements = Array.from(container.querySelectorAll('[data-official-page]'));
  if (!pageElements.length) {
    root.unmount();
    document.body.removeChild(container);
    throw new Error('No official report pages rendered for PDF export');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = pageElements.length;
  const isAr = lang === 'ar';
  const genDateTime = new Date().toLocaleString(isAr ? 'ar-QA' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const serialLabel = isAr ? 'الرقم التسلسلي' : 'Serial';
  const genLabel = isAr ? 'تاريخ الإصدار' : 'Generated';
  const pageLabel = isAr ? 'صفحة' : 'Page';

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    const canvas = await html2canvas(pageEl, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.body.lastElementChild;
        if (clonedRoot) {
          applyPdfFontHints(clonedRoot);
          clonedRoot.querySelectorAll('[data-official-page]').forEach((page) => {
            page.style.background = '#ffffff';
          });
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (!imgData || imgData.length < 1000) {
      throw new Error('PDF render produced an empty page — please retry or use Excel export');
    }
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);

    const footerY = A4_HEIGHT_MM - 6;
    pdf.setFontSize(8);
    pdf.setTextColor(85, 85, 85);
    pdf.text(`${serialLabel}: ${serial}`, 10, footerY);
    pdf.text(`${genLabel}: ${genDateTime}`, A4_WIDTH_MM / 2, footerY, { align: 'center' });

    // Page numbers: larger with spaced slash (e.g. "1 / 3")
    pdf.setFontSize(10);
    pdf.text(`${pageLabel} ${i + 1} / ${totalPages}`, A4_WIDTH_MM - 10, footerY, { align: 'right' });
  }

  root.unmount();
  document.body.removeChild(container);

  const blob = pdf.output('blob');
  if (options.download !== false && typeof document !== 'undefined') {
    downloadBlob(blob, filename);
  }

  return blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
