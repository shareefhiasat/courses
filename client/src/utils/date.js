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

/**
 * Get localized month names
 * @param {Function} t - Translation function
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {Array} Array of localized month names
 */
export const getMonthNames = (t, lang = 'en') => {
  const monthNames = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };
  
  return monthNames[lang] || monthNames.en;
};

/**
 * Get localized day names
 * @param {Function} t - Translation function
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {Array} Array of localized day names
 */
export const getDayNames = (t, lang = 'en') => {
  const dayNames = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };
  
  return dayNames[lang] || dayNames.en;
};

/**
 * Get current language from translation function
 * @param {Function} t - Translation function
 * @returns {string} Current language ('en' or 'ar')
 */
export const getCurrentLanguage = (t) => {
  if (!t || typeof t !== 'function') return 'en';
  
  // Check if any Arabic translation is present
  const arabicIndicators = ['الإثنين', 'يناير', 'فبراير', 'مارس', 'أبريل'];
  const sampleText = t('mon') || '';
  
  return arabicIndicators.some(indicator => sampleText.includes(indicator)) ? 'ar' : 'en';
};

/**
 * Format localized date string
 * @param {Date|string} date - Date object or date string
 * @param {Function} t - Translation function
 * @param {string} lang - Current language (optional, will be detected if not provided)
 * @returns {string} Formatted date string with localized month and day names
 */
export const formatLocalizedDate = (date, t, lang) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const currentLang = lang || getCurrentLanguage(t);
  
  // Only use Arabic month/day names if the entire language is Arabic
  // Not just based on individual words like 'الإثنين'
  const isArabicLanguage = currentLang === 'ar';
  
  const monthNames = getMonthNames(t, currentLang);
  const dayNames = getDayNames(t, currentLang);
  
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  
  return `${month} ${day}, ${dayName}`;
};

/**
 * Format localized date with time
 * @param {Date|string} date - Date object or date string
 * @param {Function} t - Translation function
 * @param {string} lang - Current language (optional)
 * @returns {Object} Object with formatted date string and time
 */
export const formatLocalizedDateTime = (date, t, lang) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const currentLang = lang || getCurrentLanguage(t);
  
  const monthNames = getMonthNames(t, currentLang);
  const dayNames = getDayNames(t, currentLang);
  
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  
  // Format time
  const time = dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return {
    date: `${month} ${day}, ${dayName}`,
    time: time,
    fullDateTime: `${month} ${day}, ${dayName} ${time}`
  };
};
