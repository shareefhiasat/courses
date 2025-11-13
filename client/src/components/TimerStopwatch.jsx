import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';

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

const ProgressBar = ({ value }) => (
  <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: '#22c55e', transition: 'width 0.2s' }} />
  </div>
);

const TimerStopwatch = ({ compact = false, showTest = false }) => {
  const [mode, setMode] = usePersistedState('ts_mode', 'stopwatch'); // 'stopwatch' | 'timer'

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

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: compact ? '0.6rem' : '0.9rem',
      color: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('stopwatch')} style={{
            padding: '0.25rem 0.5rem', borderRadius: 6,
            background: mode==='stopwatch'?'#667eea':'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)'
          }}>SW</button>
          <button onClick={() => setMode('timer')} style={{
            padding: '0.25rem 0.5rem', borderRadius: 6,
            background: mode==='timer'?'#667eea':'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)'
          }}>T</button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setSoundOn(v=>!v)} title={soundOn? 'Sound: On' : 'Sound: Off'} style={{ padding: '0.25rem 0.5rem', borderRadius: 6, background: soundOn?'#22c55e':'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>🔊</button>
          {showTest && (
            <button onClick={() => { playBeep().catch(()=>{}); }} title="Test" style={{ padding: '0.25rem 0.5rem', borderRadius: 6, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>Test</button>
          )}
          {mode === 'timer' && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[60_000, 5*60_000, 10*60_000].map(ms => (
                <button key={ms} onClick={() => startTimer(ms)} style={{ padding: '0.25rem 0.4rem', borderRadius: 6, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {Math.floor(ms/60000)}m
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === 'stopwatch' ? (
        <div>
          <div style={{ fontSize: compact ? '1.25rem' : '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
            {formatMs(swElapsed)}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {!swRunning ? (
              <button onClick={() => setSwRunning(true)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: '#22c55e', color: 'white', border: 'none' }}>Start</button>
            ) : (
              <button onClick={() => setSwRunning(false)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: '#f59e0b', color: 'white', border: 'none' }}>Pause</button>
            )}
            <button onClick={resetStopwatch} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>Reset</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: compact ? '1.25rem' : '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
            {formatMs(tmRemain)}
          </div>
          <ProgressBar value={timerPct} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            {!tmRunning ? (
              <button onClick={() => setTmRunning(true)} disabled={tmRemain<=0} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: '#22c55e', color: 'white', border: 'none', opacity: tmRemain<=0?0.6:1 }}>Start</button>
            ) : (
              <button onClick={() => setTmRunning(false)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: '#f59e0b', color: 'white', border: 'none' }}>Pause</button>
            )}
            <button onClick={resetTimer} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>Reset</button>
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
