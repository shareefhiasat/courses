import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import { useTheme } from '../contexts/ThemeContext';

// Compact inline Timer & Stopwatch widget
// - Stopwatch: start/pause/reset
// - Timer: quick presets (1, 5, 10 min), start/pause/reset with progress bar
// - State persisted in localStorage by mode

const pad = (n) => String(n).padStart(2, '0');

const formatMs = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const usePersistedState = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
};

const TimerStopwatch = ({ compact = false, showTest = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const palette = useMemo(() => {
    if (isDark) {
      return {
        containerBg: 'rgba(15, 23, 42, 0.78)',
        containerBorder: '1px solid rgba(148, 163, 184, 0.25)',
        text: '#f8fafc',
        subtleText: 'rgba(226, 232, 240, 0.85)',
        modeActiveBg: '#6366f1',
        modeActiveText: '#ffffff',
        modeBorder: '1px solid rgba(148, 163, 184, 0.3)',
        modeInactiveBg: 'rgba(255, 255, 255, 0.05)',
        modeInactiveText: '#e2e8f0',
        neutralBg: 'rgba(255, 255, 255, 0.08)',
        neutralBgHover: 'rgba(255, 255, 255, 0.16)',
        neutralText: '#f8fafc',
        neutralBorder: '1px solid rgba(148, 163, 184, 0.25)',
        track: 'rgba(255, 255, 255, 0.18)',
        surfaceShadow: '0 12px 32px rgba(15, 23, 42, 0.45)',
        iconInactiveBg: 'rgba(255, 255, 255, 0.05)',
        iconInactiveText: '#e2e8f0',
      };
    }
    return {
      containerBg: 'rgba(255, 255, 255, 0.9)',
      containerBorder: '1px solid rgba(15, 23, 42, 0.08)',
      text: '#1f2937',
      subtleText: 'rgba(71, 85, 105, 0.85)',
      modeActiveBg: '#4f46e5',
      modeActiveText: '#ffffff',
      modeBorder: '1px solid rgba(148, 163, 184, 0.35)',
      modeInactiveBg: 'rgba(15, 23, 42, 0.05)',
      modeInactiveText: '#1f2937',
      neutralBg: 'rgba(15, 23, 42, 0.06)',
      neutralBgHover: 'rgba(15, 23, 42, 0.12)',
      neutralText: '#1f2937',
      neutralBorder: '1px solid rgba(15, 23, 42, 0.12)',
      track: 'rgba(15, 23, 42, 0.12)',
      surfaceShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
      iconInactiveBg: 'rgba(15, 23, 42, 0.05)',
      iconInactiveText: '#1f2937',
    };
  }, [isDark]);

  const containerStyle = useMemo(() => ({
    background: palette.containerBg,
    border: palette.containerBorder,
    borderRadius: 12,
    padding: compact ? '0.65rem' : '0.9rem',
    color: palette.text,
    boxShadow: palette.surfaceShadow,
    backdropFilter: 'blur(10px)',
    minWidth: compact ? 0 : 240,
  }), [palette, compact]);

  const modeButtonStyle = (active) => ({
    padding: '0.25rem 0.6rem',
    borderRadius: 6,
    border: active ? '1px solid rgba(99, 102, 241, 0.6)' : palette.modeBorder,
    background: active ? palette.modeActiveBg : palette.modeInactiveBg,
    color: active ? palette.modeActiveText : palette.modeInactiveText,
    fontWeight: 600,
    fontSize: '0.8rem',
    minWidth: 40,
    transition: 'background 0.2s ease, color 0.2s ease',
  });

  const iconButtonStyle = (active) => ({
    padding: '0.15rem 0.35rem',
    borderRadius: 999,
    border: '1px solid transparent',
    background: active ? 'rgba(34,197,94,0.15)' : 'transparent',
    color: active ? '#16a34a' : palette.iconInactiveText,
    fontSize: '0.8rem',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    transition: 'background 0.15s ease, color 0.15s ease',
  });

  const neutralButtonStyle = {
    padding: '0.35rem 0.7rem',
    borderRadius: 6,
    border: palette.neutralBorder,
    background: palette.neutralBg,
    color: palette.neutralText,
    transition: 'background 0.2s ease, color 0.2s ease',
  };

  const neutralHoverStyle = {
    background: palette.neutralBgHover,
    color: palette.neutralText,
  };

  const ProgressBar = ({ value }) => (
    <div style={{ height: 6, background: palette.track, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: '#22c55e', transition: 'width 0.2s ease' }} />
    </div>
  );

  const [mode, setMode] = usePersistedState('ts_mode', 'timer'); // 'stopwatch' | 'timer'

  // Stopwatch
  const [swRunning, setSwRunning] = usePersistedState('sw_running', false);
  const [swElapsed, setSwElapsed] = usePersistedState('sw_elapsed', 0); // ms
  const swRef = useRef(null);

  useEffect(() => {
    if (!swRunning) { if (swRef.current) { clearInterval(swRef.current); swRef.current = null; } return; }
    const startAt = Date.now() - swElapsed;
    swRef.current = setInterval(() => setSwElapsed(Date.now() - startAt), 250);
    return () => { if (swRef.current) clearInterval(swRef.current); };
  }, [swRunning]);

  const resetStopwatch = () => { setSwRunning(false); setSwElapsed(0); };

  // Timer
  const [tmRunning, setTmRunning] = usePersistedState('tm_running', false);
  const [tmTotal, setTmTotal] = usePersistedState('tm_total', 0); // ms
  const [tmRemain, setTmRemain] = usePersistedState('tm_remain', 0); // ms
  const tmRef = useRef(null);
  const [showDone, setShowDone] = useState(false);
  const [soundOn, setSoundOn] = usePersistedState('ts_sound_on', true);
  const audioCtxRef = useRef(null);

  const ensureCtx = async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      try { await audioCtxRef.current.resume(); } catch {}
    }
    return audioCtxRef.current;
  };

  const playBeep = async (durationMs = 350, freq = 880) => {
    const ctx = await ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.01);
  };

  useEffect(() => {
    if (!tmRunning) { if (tmRef.current) { clearInterval(tmRef.current); tmRef.current = null; } return; }
    const endAt = Date.now() + tmRemain;
    tmRef.current = setInterval(() => {
      const left = endAt - Date.now();
      if (left <= 0) {
        setTmRemain(0);
        setTmRunning(false);
        setShowDone(true);
        if (soundOn) { playBeep().catch(()=>{}); }
      } else {
        setTmRemain(left);
      }
    }, 250);
    return () => { if (tmRef.current) clearInterval(tmRef.current); };
  }, [tmRunning, soundOn]);

  const startTimer = (ms) => {
    if (tmRef.current) { clearInterval(tmRef.current); tmRef.current = null; }
    setTmTotal(ms);
    setTmRemain(ms);
    setTmRunning(true);
  };
  const resetTimer = () => {
    if (tmRef.current) { clearInterval(tmRef.current); tmRef.current = null; }
    setTmRunning(false);
    setTmRemain(tmTotal);
  };

  const timerPct = useMemo(() => tmTotal ? (100 * (tmTotal - tmRemain)) / tmTotal : 0, [tmTotal, tmRemain]);

  const actionButtonBase = {
    padding: '0.4rem 0.75rem',
    borderRadius: 8,
    fontWeight: 600,
    minWidth: 72,
    transition: 'opacity 0.2s ease',
  };

  const startBtnStyle = {
    ...actionButtonBase,
    background: '#22c55e',
    border: 'none',
    color: '#ffffff',
  };

  const pauseBtnStyle = {
    ...actionButtonBase,
    background: '#f59e0b',
    border: 'none',
    color: '#ffffff',
  };

  const resetBtnStyle = {
    ...actionButtonBase,
    background: palette.neutralBg,
    border: palette.neutralBorder,
    color: palette.neutralText,
  };

  const timerPresetStyle = {
    ...neutralButtonStyle,
    padding: '0.2rem 0.45rem',
    borderRadius: 999,
    border: palette.modeBorder,
    fontSize: '0.75rem',
    minWidth: 0,
    color: palette.modeInactiveText,
  };

  const titleStyle = {
    fontSize: compact ? '1.25rem' : '1.5rem',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 6,
    color: palette.text,
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('stopwatch')} style={modeButtonStyle(mode === 'stopwatch')}>SW</button>
          <button onClick={() => setMode('timer')} style={modeButtonStyle(mode === 'timer')}>T</button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setSoundOn(v => !v)}
            title={soundOn ? 'Sound: On' : 'Sound: Off'}
            style={iconButtonStyle(soundOn)}
          >
            🔊
          </button>
          {showTest && (
            <button
              onClick={() => { playBeep().catch(() => {}); }}
              title="Test"
              style={iconButtonStyle(false)}
            >
              Test
            </button>
          )}
          {mode === 'timer' && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[60_000, 5 * 60_000].map(ms => (
                <button
                  key={ms}
                  onClick={() => startTimer(ms)}
                  style={{
                    ...timerPresetStyle,
                  }}
                >
                  {Math.floor(ms / 60000)}m
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === 'stopwatch' ? (
        <div>
          <div style={titleStyle}>
            {formatMs(swElapsed)}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {!swRunning ? (
              <button onClick={() => setSwRunning(true)} style={startBtnStyle}>Start</button>
            ) : (
              <button onClick={() => setSwRunning(false)} style={pauseBtnStyle}>Pause</button>
            )}
            <button onClick={resetStopwatch} style={resetBtnStyle}>Reset</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={titleStyle}>
            {formatMs(tmRemain)}
          </div>
          <ProgressBar value={timerPct} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            {!tmRunning ? (
              <button
                onClick={() => setTmRunning(true)}
                disabled={tmRemain <= 0}
                style={{
                  ...startBtnStyle,
                  opacity: tmRemain <= 0 ? 0.6 : 1,
                  cursor: tmRemain <= 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Start
              </button>
            ) : (
              <button onClick={() => setTmRunning(false)} style={pauseBtnStyle}>Pause</button>
            )}
            <button onClick={resetTimer} style={resetBtnStyle}>Reset</button>
          </div>
        </div>
      )}

      <Modal
        open={showDone}
        title={mode === 'timer' ? 'Time is up!' : 'Done'}
        onClose={() => setShowDone(false)}
        actions={(
          <>
            <button onClick={() => setShowDone(false)} className="btn btn-primary">OK</button>
          </>
        )}
      >
        <p style={{ margin: 0 }}>{mode === 'timer' ? 'The countdown has finished.' : 'Completed.'}</p>
      </Modal>
    </div>
  );
};

export default TimerStopwatch;
