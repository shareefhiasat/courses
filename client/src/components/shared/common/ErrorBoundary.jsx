import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    resetError();
    navigate('/login');
  };

  const handleGoHome = () => {
    resetError();
    navigate('/');
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
          Oops! Something went wrong
        </h1>

        {/* Error Message */}
        <p style={{
          color: '#666',
          fontSize: '1rem',
          marginBottom: '1.5rem',
          lineHeight: 1.6
        }}>
          We encountered an unexpected error. Don't worry, this has been logged and we'll look into it.
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
              🔍 Technical Details
            </summary>
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#666',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <strong>Error:</strong> {error.toString()}
              {errorInfo && (
                <>
                  <br /><br />
                  <strong>Stack Trace:</strong>
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
            🔑 Go to Login
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
            🏠 Go Home
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
            🔄 Reload Page
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
