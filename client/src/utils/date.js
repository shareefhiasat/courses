export const getTimeFormatPreference = () => {
  try {
    return localStorage.getItem('timeFormat') || '24h';
  } catch {
    return '24h';
  }
};

export const formatDate = (value) => {
  if (!value) return '';
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  try {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    const pad = (n) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
};

export const setTimeFormatPreference = (fmt) => {
  try { localStorage.setItem('timeFormat', fmt); } catch {}
};

export const formatDateTime = (value, fmt) => {
  if (!value) return '';
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  const hour12 = (fmt || getTimeFormatPreference()) === '12h';
  try {
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12
    });
  } catch {
    // Fallback
    const pad = (n) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const mins = pad(d.getMinutes());
    if (hour12) {
      const suffix = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      return `${dd}/${mm}/${yyyy} ${pad(hh)}:${mins} ${suffix}`;
    }
    return `${dd}/${mm}/${yyyy} ${pad(hh)}:${mins}`;
  }
};
