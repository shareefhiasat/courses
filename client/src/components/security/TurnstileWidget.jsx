import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_ENABLED = import.meta.env.VITE_TURNSTILE_ENABLED === 'true';

let turnstileScriptLoaded = false;
let turnstileResolve = null;

const loadTurnstileScript = () => {
  return new Promise((resolve) => {
    if (turnstileScriptLoaded) {
      resolve();
      return;
    }

    if (turnstileResolve) {
      turnstileResolve = () => {
        turnstileResolve = null;
        resolve();
      };
      return;
    }

    turnstileResolve = resolve;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      turnstileScriptLoaded = true;
      if (turnstileResolve) {
        turnstileResolve();
        turnstileResolve = null;
      }
    };
    document.head.appendChild(script);
  });
};

const TurnstileWidget = ({ action = 'login', onVerify, theme = 'auto' }) => {
  const { t } = useLang();
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_ENABLED) {
      setIsReady(true);
      if (onVerify) {
        onVerify('dev-bypass');
      }
      return;
    }

    let isMounted = true;

    const initTurnstile = async () => {
      try {
        await loadTurnstileScript();

        if (!isMounted || !containerRef.current || !window.turnstile) return;

        const container = containerRef.current;
        container.innerHTML = '';

        const id = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          action: action,
          theme: theme,
          callback: (token) => {
            setError(null);
            if (onVerify) {
              onVerify(token);
            }
          },
          'error-callback': () => {
            setError(t('turnstile_error'));
            if (onVerify) {
              onVerify(null);
            }
          },
          'expired-callback': () => {
            setError(t('session_expired_verify'));
            if (onVerify) {
              onVerify(null);
            }
          },
        });

        widgetIdRef.current = id;
        setIsReady(true);
      } catch (err) {
        error('Turnstile init error:', err);
        setError(t('failed_to_load_security'));
      }
    };

    initTurnstile();

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [action, theme, onVerify]);

  const resetWidget = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setError(null);
    if (onVerify) {
      onVerify(null);
    }
  };

  if (!TURNSTILE_ENABLED) {
    return null;
  }

  return (
    <div className="turnstile-widget-container" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} />
      {error && (
        <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
          {error}
          <button
            type="button"
            onClick={resetWidget}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '8px',
            }}
          >
            {t('retry')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TurnstileWidget;
