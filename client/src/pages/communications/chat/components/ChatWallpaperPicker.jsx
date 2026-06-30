import React, { useState, useEffect, useRef } from 'react';
import { Image, Check, X } from 'lucide-react';

const STORAGE_KEY = 'chatWallpaper';
const STORAGE_KEY_BG = 'chatWallpaperBgColor';
const STORAGE_KEY_PATTERN = 'chatWallpaperPatternColor';

// ─── Pattern Templates ──────────────────────────────────────────────────────
// Each pattern is a function (bgColor, patternColor) => CSS style object
// This lets users dynamically color any pattern's background and foreground

const WALLPAPER_THEMES = [
  {
    id: 'solid',
    name: 'Solid',
    hasPatternColor: false,
    defaultLight: { bg: '#f5f5f5', pattern: '#e0e0e0' },
    defaultDark: { bg: '#1a1a2e', pattern: '#2a2a4a' },
    generate: (bg) => ({ background: bg }),
    generatePreview: (bg) => ({ background: bg }),
  },
  {
    id: 'dots',
    name: 'Dots',
    hasPatternColor: true,
    defaultLight: { bg: '#f0f2f5', pattern: '#c5c9d0' },
    defaultDark: { bg: '#1a1a2e', pattern: '#2a2a4a' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(circle, ${p} 1.5px, transparent 1.5px)`,
      backgroundSize: '24px 24px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(circle, ${p} 1.5px, transparent 1.5px)`,
      backgroundSize: '12px 12px',
    }),
  },
  {
    id: 'grid',
    name: 'Grid',
    hasPatternColor: true,
    defaultLight: { bg: '#f0f2f5', pattern: '#d8dde5' },
    defaultDark: { bg: '#1a1a2e', pattern: '#2a2a4a' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(${p} 1px, transparent 1px), linear-gradient(90deg, ${p} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(${p} 1px, transparent 1px), linear-gradient(90deg, ${p} 1px, transparent 1px)`,
      backgroundSize: '14px 14px',
    }),
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    hasPatternColor: true,
    defaultLight: { bg: '#f0f2f5', pattern: 'rgba(180,190,210,0.35)' },
    defaultDark: { bg: '#1a1a2e', pattern: 'rgba(80,90,130,0.25)' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${p} 10px, ${p} 20px)`,
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${p} 5px, ${p} 10px)`,
    }),
  },
  {
    id: 'crossword',
    name: 'Crossword',
    hasPatternColor: true,
    defaultLight: { bg: '#f0f2f5', pattern: '#dfe3ea' },
    defaultDark: { bg: '#1a1a2e', pattern: '#252545' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(45deg, ${p} 25%, transparent 25%, transparent 75%, ${p} 75%, ${p}), linear-gradient(45deg, ${p} 25%, transparent 25%, transparent 75%, ${p} 75%, ${p})`,
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 20px 20px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(45deg, ${p} 25%, transparent 25%, transparent 75%, ${p} 75%, ${p}), linear-gradient(45deg, ${p} 25%, transparent 25%, transparent 75%, ${p} 75%, ${p})`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
    }),
  },
  {
    id: 'circuit',
    name: 'Circuit',
    hasPatternColor: true,
    defaultLight: { bg: '#eef1f6', pattern: '#c8cedb' },
    defaultDark: { bg: '#161628', pattern: '#2a3050' },
    generate: (bg, p) => {
      const p2 = p;
      return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(circle at 20% 20%, ${p2} 2px, transparent 2px), radial-gradient(circle at 80% 80%, ${p2} 2px, transparent 2px), radial-gradient(circle at 50% 50%, ${p2} 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      };
    },
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(circle at 20% 20%, ${p} 2px, transparent 2px), radial-gradient(circle at 80% 80%, ${p} 2px, transparent 2px), radial-gradient(circle at 50% 50%, ${p} 1px, transparent 1px)`,
      backgroundSize: '25px 25px',
    }),
  },
  {
    id: 'wave',
    name: 'Wave',
    hasPatternColor: true,
    defaultLight: { bg: '#eef2f7', pattern: 'rgba(120,160,220,0.15)' },
    defaultDark: { bg: '#161628', pattern: 'rgba(80,120,200,0.18)' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `repeating-radial-gradient(circle at 0 100%, transparent 0, ${p} 10px, transparent 20px), repeating-radial-gradient(circle at 100% 0, transparent 0, ${p} 10px, transparent 20px)`,
      backgroundSize: '60px 60px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `repeating-radial-gradient(circle at 0 100%, transparent 0, ${p} 5px, transparent 10px), repeating-radial-gradient(circle at 100% 0, transparent 0, ${p} 5px, transparent 10px)`,
      backgroundSize: '30px 30px',
    }),
  },
  {
    id: 'triangles',
    name: 'Triangles',
    hasPatternColor: true,
    defaultLight: { bg: '#eef1f6', pattern: '#d8dde8' },
    defaultDark: { bg: '#161628', pattern: '#232340' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p})`,
      backgroundSize: '40px 70px',
      backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p})`,
      backgroundSize: '20px 35px',
      backgroundPosition: '0 0, 0 0, 10px 17px, 10px 17px',
    }),
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    hasPatternColor: true,
    defaultLight: { bg: '#eef1f6', pattern: '#d4d9e6' },
    defaultDark: { bg: '#161628', pattern: '#1f1f3a' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(270deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p})`,
      backgroundSize: '40px 70px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(150deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p}), linear-gradient(270deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%, ${p})`,
      backgroundSize: '20px 35px',
    }),
  },
  {
    id: 'topography',
    name: 'Topography',
    hasPatternColor: true,
    defaultLight: { bg: '#eef1f6', pattern: 'rgba(120,150,200,0.18)' },
    defaultDark: { bg: '#161628', pattern: 'rgba(80,120,200,0.22)' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(ellipse at center, ${p} 0%, transparent 50%), repeating-radial-gradient(ellipse at center, ${p} 0%, ${p} 8%, transparent 8%, transparent 16%)`,
      backgroundSize: '80px 80px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(ellipse at center, ${p} 0%, transparent 50%), repeating-radial-gradient(ellipse at center, ${p} 0%, ${p} 4%, transparent 4%, transparent 8%)`,
      backgroundSize: '40px 40px',
    }),
  },
  {
    id: 'stars',
    name: 'Stars',
    hasPatternColor: true,
    defaultLight: { bg: '#eef1f6', pattern: '#c0c8d8' },
    defaultDark: { bg: '#0d0d1a', pattern: '#4a4a7a' },
    generate: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(2px 2px at 20px 30px, ${p}, transparent), radial-gradient(2px 2px at 60px 70px, ${p}, transparent), radial-gradient(1px 1px at 90px 40px, ${p}, transparent), radial-gradient(2px 2px at 130px 80px, ${p}, transparent), radial-gradient(1px 1px at 160px 30px, ${p}, transparent)`,
      backgroundSize: '200px 100px',
    }),
    generatePreview: (bg, p) => ({
      backgroundColor: bg,
      backgroundImage: `radial-gradient(2px 2px at 10px 15px, ${p}, transparent), radial-gradient(2px 2px at 30px 35px, ${p}, transparent), radial-gradient(1px 1px at 45px 20px, ${p}, transparent), radial-gradient(2px 2px at 65px 40px, ${p}, transparent), radial-gradient(1px 1px at 80px 15px, ${p}, transparent)`,
      backgroundSize: '100px 50px',
    }),
  },
];

// ─── Storage Helpers ────────────────────────────────────────────────────────

export function getStoredWallpaper() {
  try { return localStorage.getItem(STORAGE_KEY) || 'solid'; } catch { return 'solid'; }
}

export function storeWallpaper(id) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}

export function getStoredBgColor() {
  try { return localStorage.getItem(STORAGE_KEY_BG) || null; } catch { return null; }
}

export function storeBgColor(color) {
  try { localStorage.setItem(STORAGE_KEY_BG, color); } catch {}
}

export function getStoredPatternColor() {
  try { return localStorage.getItem(STORAGE_KEY_PATTERN) || null; } catch { return null; }
}

export function storePatternColor(color) {
  try { localStorage.setItem(STORAGE_KEY_PATTERN, color); } catch {}
}

// ─── Style Generator ─────────────────────────────────────────────────────────

export function getWallpaperStyle(patternId, isDark) {
  const wp = WALLPAPER_THEMES.find(w => w.id === patternId) || WALLPAPER_THEMES[0];
  const defaults = isDark ? wp.defaultDark : wp.defaultLight;
  const bg = getStoredBgColor() || defaults.bg;
  const pattern = getStoredPatternColor() || defaults.pattern;
  return wp.generate(bg, pattern);
}

export { STORAGE_KEY, WALLPAPER_THEMES };

// ─── Color Presets ───────────────────────────────────────────────────────────

const BG_PRESETS = [
  '#f5f5f5', '#f0f2f5', '#eef1f6', '#eef2f7',
  '#fff8e1', '#e8f5e9', '#fce4ec', '#e3f2fd',
  '#f3e5f5', '#fff3e0', '#e0f7fa', '#f1f8e9',
  '#1a1a2e', '#16213e', '#0f3460', '#0d0d1a',
  '#1e1e2e', '#1a2332', '#0d1117', '#171728',
];

const PATTERN_PRESETS = [
  '#c5c9d0', '#d8dde5', '#dfe3ea', '#c8cedb',
  '#d4d9e6', '#d8dde8', '#c0c8d8', '#b0b8c8',
  '#8e44ad', '#3498db', '#e74c3c', '#2ecc71',
  '#f39c12', '#1abc9c', '#9b59b6', '#34495e',
  '#2a2a4a', '#252545', '#232340', '#1f1f3a',
  '#4a4a7a', '#3a3a6a', '#2a3050', '#222845',
];

// ─── Component ───────────────────────────────────────────────────────────────

const ChatWallpaperPicker = ({ theme, t }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => getStoredWallpaper());
  const [bgColor, setBgColor] = useState(() => getStoredBgColor() || '');
  const [patternColor, setPatternColor] = useState(() => getStoredPatternColor() || '');
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const isDark = theme === 'dark';

  const currentWp = WALLPAPER_THEMES.find(w => w.id === selected) || WALLPAPER_THEMES[0];
  const defaults = isDark ? currentWp.defaultDark : currentWp.defaultLight;
  const effectiveBg = bgColor || defaults.bg;
  const effectivePattern = patternColor || defaults.pattern;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const fireChangeEvent = () => {
    window.dispatchEvent(new CustomEvent('chatWallpaperChange', { detail: Date.now() }));
  };

  const handleSelectPattern = (id) => {
    setSelected(id);
    storeWallpaper(id);
    fireChangeEvent();
  };

  const handleBgColorChange = (color) => {
    setBgColor(color);
    storeBgColor(color);
    fireChangeEvent();
  };

  const handlePatternColorChange = (color) => {
    setPatternColor(color);
    storePatternColor(color);
    fireChangeEvent();
  };

  const handleResetColors = () => {
    setBgColor('');
    setPatternColor('');
    storeBgColor('');
    storePatternColor('');
    fireChangeEvent();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        title={t('chat_wallpaper') || 'Chat Wallpaper'}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'var(--muted)',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <Image size={16} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="chat-wallpaper-popover"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '1rem',
            zIndex: 1000,
            width: 480,
            maxHeight: 460,
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              {t('chat_wallpaper') || 'Chat Wallpaper'}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: 2,
                display: 'flex',
                borderRadius: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Pattern Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.4rem',
            marginBottom: '0.5rem',
          }}>
            {WALLPAPER_THEMES.map((wp) => {
              const wpDefaults = isDark ? wp.defaultDark : wp.defaultLight;
              const wpBg = bgColor || wpDefaults.bg;
              const wpPattern = patternColor || wpDefaults.pattern;
              return (
                <button
                  key={wp.id}
                  onClick={() => handleSelectPattern(wp.id)}
                  style={{
                    border: selected === wp.id ? '2px solid var(--brand)' : '2px solid transparent',
                    borderRadius: 10,
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                    background: 'transparent',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  title={wp.name}
                >
                  <div style={{
                    width: '100%',
                    height: 44,
                    ...wp.generatePreview(wpBg, wpPattern),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {selected === wp.id && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'var(--brand)',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={13} color="white" />
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '0.2rem 0.15rem',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    textAlign: 'center',
                    background: 'var(--panel)',
                  }}>
                    {wp.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Customization */}
          <div style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}>
            {/* Background Color */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)' }}>
                  {t('chat_bg_color') || 'Background Color'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="color"
                    value={effectiveBg}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: 'transparent',
                      padding: 0,
                    }}
                  />
                  {bgColor && (
                    <button
                      onClick={() => { setBgColor(''); storeBgColor(''); fireChangeEvent(); }}
                      title="Reset"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        padding: 0,
                        fontSize: '0.7rem',
                      }}
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {BG_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleBgColorChange(color)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      border: effectiveBg === color ? '2px solid var(--brand)' : '2px solid transparent',
                      background: color,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Pattern Color */}
            {currentWp.hasPatternColor && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)' }}>
                    {t('chat_pattern_color') || 'Pattern Color'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="color"
                      value={effectivePattern.startsWith('#') ? effectivePattern : '#c5c9d0'}
                      onChange={(e) => handlePatternColorChange(e.target.value)}
                      style={{
                        width: 32,
                        height: 32,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: 'transparent',
                        padding: 0,
                      }}
                    />
                    {patternColor && (
                      <button
                        onClick={() => { setPatternColor(''); storePatternColor(''); fireChangeEvent(); }}
                        title="Reset"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--muted)',
                          padding: 0,
                          fontSize: '0.7rem',
                        }}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {PATTERN_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => handlePatternColorChange(color)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        border: effectivePattern === color ? '2px solid var(--brand)' : '2px solid transparent',
                        background: color,
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.15s',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reset All */}
            {(bgColor || patternColor) && (
              <button
                onClick={handleResetColors}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                {t('chat_reset_colors') || 'Reset to Default Colors'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWallpaperPicker;
