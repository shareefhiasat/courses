/**
 * Generate a simple, non-cryptographic device fingerprint hash.
 * Used by attendance scanning to provide a basic device identifier
 * so the backend can detect duplicate scans from the same device.
 *
 * This is NOT a security primitive - it's a convenience identifier
 * combining a few browser-available signals. Collisions are possible
 * and the value can be spoofed client-side; the backend should treat
 * it as advisory only.
 */
export function simpleDeviceHash() {
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
  ];

  const raw = signals.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

export default simpleDeviceHash;
