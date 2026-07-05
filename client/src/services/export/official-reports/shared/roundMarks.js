/** Round numeric marks to 2 decimal places for official reports. */
export function roundMarks(value, decimals = 2) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return parseFloat(n.toFixed(decimals));
}

export function formatMark(value, decimals = 2) {
  const n = roundMarks(value, decimals);
  if (typeof n !== 'number' || Number.isNaN(n)) return value ?? '—';
  return n.toFixed(decimals);
}
