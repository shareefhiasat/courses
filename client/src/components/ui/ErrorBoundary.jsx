import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', { 
      errorMessage: error.message, 
      stack: error.stack, 
      componentStack: errorInfo.componentStack 
    });
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, resetError }) => {
  const { t } = useLang();
  // Safe navigation with fallback
  let navigate = null;
  try {
    navigate = useNavigate();
  } catch (navError) {
    console.warn('useNavigate not available in ErrorFallback', { error: navError.message });
    // Fallback: use window.location for navigation
    navigate = (path) => {
      window.location.href = path;
    };
  }

  const handleGoToLogin = () => {
    resetError();
    if (navigate) navigate('/login');
  };

  const handleGoHome = () => {
    resetError();
    if (navigate) navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {/* Error Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          background: 'linear-gradient(135deg, #800020, #600018)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem'
        }}>
          ⚠️
        </div>

        {/* Error Title */}
        <h1 style={{
          margin: '0 0 1rem 0',
          color: '#800020',
          fontSize: '1.8rem',
          fontWeight: 700
        }}>
          {t('oops_something_wrong')}
        </h1>

        {/* Error Message */}
        <p style={{
          color: '#666',
          fontSize: '1rem',
          marginBottom: '1.5rem',
          lineHeight: 1.6
        }}>
          {t('unexpected_error_logged')}
        </p>

        {/* Error Details (Collapsible) */}
        {error && (
          <details style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'left',
            border: '1px solid #dee2e6'
          }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: 600,
              color: '#800020',
              marginBottom: '0.5rem'
            }}>
              {t('technical_details')}
            </summary>
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#666',
              fontFamily: 'var(--font-family-mono)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <strong>{t('error_label')}</strong> {typeof error === 'function' ? 'Function Error' : (error?.toString?.() || String(error))}
              {errorInfo && (
                <>
                  <br /><br />
                  <strong>{t('stack_trace')}</strong>
                  <br />
                  {errorInfo.componentStack}
                </>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleGoToLogin}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(128, 0, 32, 0.3)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {t('go_to_login')}
          </button>

          <button
            onClick={handleGoHome}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#800020',
              border: '2px solid #800020',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#800020';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#800020';
            }}
          >
            {t('go_home')}
          </button>

          <button
            onClick={handleReload}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {t('reload_page')}
          </button>
        </div>

        {/* Help Text */}
        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: '#999'
        }}>
          If this problem persists, please contact support at{' '}
          <a href="mailto:shareef.hiasat@gmail.com" style={{ color: '#800020', textDecoration: 'none', fontWeight: 600 }}>
            shareef.hiasat@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ErrorBoundary;
