import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

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

/**
 * Render React official report component(s) to PDF blob.
 * @param {React.ReactElement} element - Root element (may contain multiple [data-official-page] children)
 * @param {Object} options
 * @returns {Promise<Blob>}
 */
export async function renderOfficialPdf(element, options = {}) {
  const { filename = 'report.pdf', scale = 2 } = options;

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(element);

  await new Promise((r) => setTimeout(r, 500));
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(container);

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

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    const canvas = await html2canvas(pageEl, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
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
