/**
 * Chart Export Utility
 *
 * Exports a container element (wrapping one or more SVGs) as SVG, PNG, or JPG.
 * Optionally prepends a title text element to the exported image.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const PADDING = 16;
const TITLE_HEIGHT = 28;

/**
 * Collect all <svg> elements inside a container and merge them into one SVG.
 * @param {HTMLElement} container - DOM element containing SVG(s)
 * @param {Object} opts
 * @param {string} [opts.title] - Optional title to prepend
 * @returns {SVGSVGElement} Combined SVG element
 */
function buildCombinedSvg(container, { title } = {}) {
  const svgs = Array.from(container.querySelectorAll('svg'));
  if (svgs.length === 0) return null;

  // Compute bounding box of all SVGs
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  svgs.forEach(svg => {
    const w = parseFloat(svg.getAttribute('width')) || svg.clientWidth || 0;
    const h = parseFloat(svg.getAttribute('height')) || svg.clientHeight || 0;
    minX = Math.min(minX, 0);
    minY = Math.min(minY, 0);
    maxX = Math.max(maxX, w);
    maxY = Math.max(maxY, h);
  });

  const hasTitle = Boolean(title);
  const totalW = maxX - minX + PADDING * 2;
  const totalH = maxY - minY + PADDING * 2 + (hasTitle ? TITLE_HEIGHT : 0);

  const combined = document.createElementNS(SVG_NS, 'svg');
  combined.setAttribute('xmlns', SVG_NS);
  combined.setAttribute('width', totalW);
  combined.setAttribute('height', totalH);
  combined.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

  // White background rect (so PNG/JPG aren't transparent)
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', 0);
  bg.setAttribute('y', 0);
  bg.setAttribute('width', totalW);
  bg.setAttribute('height', totalH);
  bg.setAttribute('fill', '#ffffff');
  combined.appendChild(bg);

  // Title text
  if (hasTitle) {
    const titleEl = document.createElementNS(SVG_NS, 'text');
    titleEl.setAttribute('x', totalW / 2);
    titleEl.setAttribute('y', PADDING + TITLE_HEIGHT - 8);
    titleEl.setAttribute('text-anchor', 'middle');
    titleEl.setAttribute('font-size', '16');
    titleEl.setAttribute('font-weight', '700');
    titleEl.setAttribute('font-family', 'sans-serif');
    titleEl.setAttribute('fill', '#1f2937');
    titleEl.textContent = title;
    combined.appendChild(titleEl);
  }

  // Append clones of each SVG
  const yOffset = PADDING + (hasTitle ? TITLE_HEIGHT : 0);
  svgs.forEach(svg => {
    const clone = svg.cloneNode(true);
    const w = parseFloat(svg.getAttribute('width')) || svg.clientWidth || 0;
    const h = parseFloat(svg.getAttribute('height')) || svg.clientHeight || 0;
    clone.setAttribute('x', PADDING);
    clone.setAttribute('y', yOffset);
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    combined.appendChild(clone);
  });

  return combined;
}

/**
 * Serialize an SVG element to string.
 */
function serializeSvg(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', SVG_NS);
  return new XMLSerializer().serializeToString(clone);
}

/**
 * Export container as SVG file.
 */
function exportSvg(container, filename, opts) {
  const combined = buildCombinedSvg(container, opts);
  if (!combined) return;
  const blob = new Blob([serializeSvg(combined)], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/**
 * Export container as PNG file.
 */
function exportPng(container, filename, opts, scale = 2) {
  const combined = buildCombinedSvg(container, opts);
  if (!combined) return;

  const svgStr = serializeSvg(combined);
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const w = parseFloat(combined.getAttribute('width'));
    const h = parseFloat(combined.getAttribute('height'));
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      triggerDownload(blob, filename);
    }, 'image/png');
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('[chartExport] Failed to render PNG');
  };

  img.src = url;
}

/**
 * Export container as JPG file.
 */
function exportJpg(container, filename, opts, scale = 2) {
  const combined = buildCombinedSvg(container, opts);
  if (!combined) return;

  const svgStr = serializeSvg(combined);
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const w = parseFloat(combined.getAttribute('width'));
    const h = parseFloat(combined.getAttribute('height'));
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      triggerDownload(blob, filename);
    }, 'image/jpeg', 0.92);
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('[chartExport] Failed to render JPG');
  };

  img.src = url;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Main export function.
 * @param {HTMLElement} container - DOM element containing the chart SVG(s)
 * @param {Object} opts
 * @param {'svg'|'png'|'jpg'} opts.format - Export format
 * @param {string} opts.filename - Base filename (without extension)
 * @param {string} [opts.title] - Optional chart title
 */
export function exportChart(container, { format = 'svg', filename = 'chart', title } = {}) {
  if (!container) {
    console.error('[chartExport] No container element provided');
    return;
  }

  const ext = format === 'jpg' ? 'jpg' : format;
  const fullFilename = `${filename}.${ext}`;

  switch (format) {
    case 'svg':
      exportSvg(container, fullFilename, { title });
      break;
    case 'png':
      exportPng(container, fullFilename, { title });
      break;
    case 'jpg':
    case 'jpeg':
      exportJpg(container, fullFilename, { title });
      break;
    default:
      console.error(`[chartExport] Unsupported format: ${format}`);
  }
}
