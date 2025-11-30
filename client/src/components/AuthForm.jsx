import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { signIn, signUp, resetPassword } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getAllowlist } from '../firebase/firestore';
import { useLang } from '../contexts/LangContext';
import './AuthForm.css';

// Helper function to translate Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error) => {
  const errorString = String(error).toLowerCase();
  
  // Check for 503 Service Unavailable
  if (errorString.includes('503') || errorString.includes('service unavailable')) {
    return '⚠️ Firebase service is temporarily unavailable. Your account may have been created successfully. Please wait a moment and try logging in, or try again later.';
  }
  
  // Check for 429 Too Many Requests
  if (errorString.includes('429') || errorString.includes('too many requests')) {
    return '⏳ Too many attempts. Please wait a few minutes before trying again.';
  }
  
  // Check for network errors
  if (errorString.includes('network') || errorString.includes('fetch')) {
    return '🌐 Network error. Please check your internet connection and try again.';
  }
  
  // Check for auth errors
  if (errorString.includes('email-already-in-use')) {
    return '📧 This email is already registered. Try logging in instead.';
  }
  
  if (errorString.includes('weak-password')) {
    return '🔒 Password must be at least 6 characters.';
  }
  
  if (errorString.includes('invalid-email')) {
    return '📧 Invalid email address format.';
  }
  
  if (errorString.includes('user-not-found')) {
    return '❌ No account found with this email.';
  }
  
  if (errorString.includes('wrong-password')) {
    return '🔑 Incorrect password. Please try again.';
  }
  
  // Default error message
  return `❌ ${error}`;
};

const AuthForm = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [realName, setRealName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { t, lang } = useLang?.() || {};

  const tr = (key, fallbackEn, fallbackAr) => {
    if (typeof t === 'function') {
      const translated = t(key);
      if (translated) return translated;
    }
    if (lang === 'ar' && fallbackAr) return fallbackAr;
    return fallbackEn;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.success) {
          setMessage(tr('reset_email_sent', 'Password reset email sent! Check your inbox.', 'تم إرسال بريد إعادة التعيين! تحقق من صندوقك.'));
        } else {
          setError(getFirebaseErrorMessage(result.error));
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError(tr('passwords_mismatch', 'Passwords do not match', 'كلمتا المرور غير متطابقتين'));
          setLoading(false);
          return;
        }
        
        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
          setError(tr('password_min_length', 'Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
          setLoading(false);
          return;
        }
        
        // Check if email is in allowlist
        try {
          const allowlistResult = await getAllowlist();
          if (allowlistResult.success) {
            const { allowedEmails = [], adminEmails = [] } = allowlistResult.data;
            const userEmail = email.toLowerCase();
            const isAllowed = [...allowedEmails, ...adminEmails]
              .map(e => e.toLowerCase())
              .includes(userEmail);
            
            if (!isAllowed) {
              setError(tr('registration_restricted', 'Registration is restricted. Your email is not on the allowlist. Please contact an administrator.', 'التسجيل مقيد. بريدك غير موجود في قائمة السماح. تواصل مع الإدارة.'));
              return;
            }
          } else {
            setError(tr('allowlist_error', 'Unable to verify registration permissions. Please try again later.', 'تعذر التحقق من صلاحيات التسجيل. حاول لاحقاً.'));
            return;
          }
        } catch (allowlistError) {
          setError(tr('allowlist_error', 'Unable to verify registration permissions. Please try again later.', 'تعذر التحقق من صلاحيات التسجيل. حاول لاحقاً.'));
          return;
        }
        
        const result = await signUp(email, password, displayName);
        if (result.success) {
          try {
            // Persist profile fields immediately
            await setDoc(doc(db, 'users', result.user.uid), {
              email,
              displayName: displayName || null,
              realName: realName || null,
              studentNumber: studentNumber || null,
            }, { merge: true });
            
            // Send welcome email
            try {
              const { httpsCallable } = await import('firebase/functions');
              const { functions } = await import('../firebase/config');
              const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
              await sendWelcomeEmail({
                email: email,
                displayName: displayName || email.split('@')[0],
                userId: result.user.uid
              });
            } catch (emailError) {
              console.log('Welcome email not sent:', emailError);
              // Don't block signup if email fails
            }
          } catch {}
          setMessage(tr('signup_success', '✅ Account created successfully! Redirecting...', '✅ تم إنشاء الحساب بنجاح! سيتم التحويل...'));
          setTimeout(() => navigate('/'), 1500);
        } else {
          setError(getFirebaseErrorMessage(result.error));
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          // Set remember me cookie if checked
          if (rememberMe) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.cookie = `rememberMe=true; expires=${expiryDate.toUTCString()}; path=/`;
          }
          setMessage(tr('login_success', '✅ Login successful! Redirecting...', '✅ تم تسجيل الدخول بنجاح! سيتم التحويل...'));
          setTimeout(() => navigate('/'), 1000);
        } else {
          setError(getFirebaseErrorMessage(result.error));
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(getFirebaseErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2 className="auth-title">
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
        </h2>
        
        {/* Only show tabs when not in reset mode */}
        {mode !== 'reset' && (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              autoComplete="email"
              name="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                name="password"
                minLength={6}
              />
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input"
                  autoComplete="new-password"
                  name="confirm-password"
                  minLength={6}
                />
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#666', 
                marginTop: '-8px', 
                marginBottom: '12px',
                padding: '8px 12px',
                background: '#f0f8ff',
                borderRadius: '6px',
                border: '1px solid #d0e8ff'
              }}>
                💡 Password must be at least 6 characters
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
                name="display-name"
                autoComplete="name"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Real Name (First Last)"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                className="form-input"
                name="real-name"
                autoComplete="name"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Student Number (optional)"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="form-input"
                name="student-number"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group" style={{ marginTop: '8px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Remember me</span>
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #800020 0%, #600018 100%)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 
             mode === 'login' ? 'Sign In' : 
             mode === 'signup' ? 'Sign Up' : 
             'Send Reset Email'}
          </button>
        </form>

        {mode === 'login' && (
          <button 
            className="reset-link"
            onClick={() => setMode('reset')}
          >
            Forgot Password?
          </button>
        )}

        {mode === 'reset' && (
          <button 
            className="reset-link"
            onClick={() => setMode('login')}
          >
            Back to Login
          </button>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
      </div>
    </div>
  );
};

export default AuthForm;
