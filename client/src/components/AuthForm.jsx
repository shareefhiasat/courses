import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { signIn, signUp, resetPassword } from '@services/business/authService';
import { verifyTurnstileToken } from '@services/business/turnstileService';
import { useNavigate, useLocation } from 'react-router-dom';
import logger from '@utils/logger';
import { getAllowlist } from '@services/business/configService';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { useToast } from '@ui';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { ToggleSwitch } from '@ui';
import { usePostHog } from 'posthog-js/react';
import TurnstileWidget from '@components/security/TurnstileWidget';
import './AuthForm.css';

// Helper function to translate Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error, t) => {
  const errorString = String(error).toLowerCase();
  
  // Check for 503 Service Unavailable
  if (errorString.includes('503') || errorString.includes('service unavailable')) {
    return t ? t('error_503_service_unavailable') : '⚠️ Firebase service is temporarily unavailable. Your account may have been created successfully. Please wait a moment and try logging in, or try again later.';
  }
  
  // Check for 429 Too Many Requests
  if (errorString.includes('429') || errorString.includes('too many requests')) {
    return t ? t('error_429_too_many_requests') : '⏳ Too many attempts. Please wait a few minutes before trying again.';
  }
  
  // Check for network errors
  if (errorString.includes('network') || errorString.includes('fetch')) {
    return t ? t('error_network') : '🌐 Network error. Please check your internet connection and try again.';
  }
  
  // Check for auth errors
  if (errorString.includes('email-already-in-use')) {
    return t ? t('error_email_already_in_use') : '📧 This email is already registered. Try logging in instead.';
  }
  
  if (errorString.includes('weak-password')) {
    return t ? t('error_weak_password') : '🔒 Password must be at least 6 characters.';
  }
  
  if (errorString.includes('invalid-email')) {
    return t ? t('error_invalid_email') : '📧 Invalid email address format.';
  }
  
  if (errorString.includes('user-not-found')) {
    return t ? t('error_user_not_found') : '❌ No account found with this email.';
  }
  
  if (errorString.includes('wrong-password')) {
    return t ? t('error_wrong_password') : '🔑 Incorrect password. Please try again.';
  }
  
  if (errorString.includes('invalid-credential')) {
    return t ? t('error_invalid_credential') : '❌ Invalid email or password. Please try again.';
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
  const [turnstileToken, setTurnstileToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLang } = useLang?.() || {};
  const { theme, toggleTheme } = useTheme();
  const { primaryColor } = useColorTheme();
  const toast = useToast();
  const showSuccess = toast?.showSuccess;
  const posthog = usePostHog();

  const tr = (key, fallbackEn, fallbackAr) => {
    if (typeof t === 'function') {
      const translated = t(key);
      if (translated) return translated;
    }
    if (lang === 'ar' && fallbackAr) return fallbackAr;
    return fallbackEn;
  };

  // Handle post-login redirect with backUrl
  const handlePostLoginRedirect = () => {
    const urlParams = new URLSearchParams(location.search);
    const backUrl = urlParams.get('backUrl');
    
    if (backUrl) {
      // Validate the backUrl to prevent open redirects
      try {
        const url = new URL(backUrl, window.location.origin);
        // Only allow same-origin redirects
        if (url.origin === window.location.origin) {
          navigate(backUrl, { replace: true });
          return true;
        }
      } catch (error) {
        console.warn('Invalid backUrl:', backUrl);
      }
    }
    
    // Fallback to default redirect
    navigate('/', { replace: true });
    return false;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Helper function to adjust color brightness
  const adjustColor = (color, amount) => {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Track form submission start
    logger.log('🔍 PostHog - Form submission started:', {
      mode,
      email: email.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    });
    
    posthog.capture('auth_form_submitted', {
      auth_mode: mode,
      email: email.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    });

    // Custom validation for browser messages
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    
    if (emailInput && !emailInput.value) {
      emailInput.setCustomValidity(tr('validation_required', 'Please fill out this field', 'يرجى ملء هذا الحقل'));
    } else if (emailInput && emailInput.value) {
      emailInput.setCustomValidity('');
    }
    
    passwordInputs.forEach(input => {
      if (input && !input.value) {
        input.setCustomValidity(tr('validation_required', 'Please fill out this field', 'يرجى ملء هذا الحقل'));
      } else if (input && input.value && input.value.length < 6) {
        input.setCustomValidity(tr('validation_password_min', 'Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
      } else {
        input.setCustomValidity('');
      }
    });

    // Check if form is valid
    if (!form.checkValidity()) {
      form.reportValidity();
      setLoading(false);
      
      // Track validation error
      posthog.capture('auth_form_validation_error', {
        auth_mode: mode,
        email: email.substring(0, 5) + '...',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    // Verify Turnstile token for all modes (login, signup, reset)
    const captchaResult = await verifyTurnstileToken(turnstileToken, mode);
    if (!captchaResult.success) {
      setError(tr('captcha_failed', 'Please complete the security check.', 'يرجى إكمال التحقق الأمني.'));
      setLoading(false);
      return;
    }

    try {
      if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.success) {
          logger.log('🔍 PostHog - Password reset successful:', {
            email: email.substring(0, 5) + '...',
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('password_reset_success', {
            email: email.substring(0, 5) + '...',
            timestamp: new Date().toISOString()
          });
          
          setMessage(tr('reset_email_sent', 'Password reset email sent! Check your inbox.', 'تم إرسال بريد إعادة التعيين! تحقق من صندوقك.'));
        } else {
          logger.log('🔍 PostHog - Password reset failed:', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('password_reset_failed', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          setError(getFirebaseErrorMessage(result.error, t));
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
          logger.log('🔍 PostHog - Sign up successful:', {
            email: email.substring(0, 5) + '...',
            displayName: displayName || 'N/A',
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('sign_up_success', {
            email: email.substring(0, 5) + '...',
            display_name: displayName || 'N/A',
            timestamp: new Date().toISOString()
          });
          
          try {
            // Persist profile fields immediately
            await setDoc(doc(db, 'users', result.user.uid), {
              email,
              displayName: displayName || null,
              realName: realName || null,
              studentNumber: studentNumber || null,
            }, { merge: true });
            
            // Log user creation activity
            try {
              await logActivity(ACTIVITY_LOG_TYPES.USER_CREATED, {
                userId: result.user.uid,
                userEmail: email,
                userDisplayName: displayName || null,
                userRealName: realName || null,
                userStudentNumber: studentNumber || null
              });
            } catch (logError) {
              logger.warn('Failed to log user creation activity:', logError);
            }
            
            // Send welcome email
            try {
              const { httpsCallable } = await import('firebase/functions');
              const { functions } = await import('@services/other/config');
              const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
              await sendWelcomeEmail({
                email: email,
                displayName: displayName || email.split('@')[0],
                userId: result.user.uid
              });
            } catch (emailError) {
              logger.log('Welcome email not sent:', emailError);
              // Don't block signup if email fails
            }
          } catch {}
          setMessage(tr('signup_success', '✅ Account created successfully! Redirecting...', '✅ تم إنشاء الحساب بنجاح! سيتم التحويل...'));
          setTimeout(() => handlePostLoginRedirect(), 1500);
        } else {
          logger.log('🔍 PostHog - Sign up failed:', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('sign_up_failed', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          setError(getFirebaseErrorMessage(result.error, t));
        }
      } else {
        // Login mode
        logger.log('🔍 PostHog - Login attempt:', {
          email: email.substring(0, 5) + '...',
          rememberMe,
          timestamp: new Date().toISOString()
        });
        
        const result = await signIn(email, password);
        if (result.success) {
          logger.log('🔍 PostHog - Login successful:', {
            email: email.substring(0, 5) + '...',
            userId: result.user.uid,
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('login_success', {
            email: email.substring(0, 5) + '...',
            user_id: result.user.uid,
            remember_me: rememberMe,
            timestamp: new Date().toISOString()
          });
          
          // Identify user in PostHog
          posthog.identify(result.user.uid, {
            email: email,
            display_name: result.user.displayName || email.split('@')[0]
          });
          // Set remember me cookie if checked
          if (rememberMe) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.cookie = `rememberMe=true; expires=${expiryDate.toUTCString()}; path=/`;
          }
          if (showSuccess) {
            showSuccess(tr('login_success', 'Login successful! Redirecting...', ' تم تسجيل الدخول بنجاح! سيتم التحويل...'));
          } else {
            setMessage(tr('login_success', 'Login successful! Redirecting...', ' تم تسجيل الدخول بنجاح! سيتم التحويل...'));
          }
          setTimeout(() => handlePostLoginRedirect(), 1000);
        } else {
          logger.log('🔍 PostHog - Login failed:', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          posthog.capture('login_failed', {
            email: email.substring(0, 5) + '...',
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          setError(getFirebaseErrorMessage(result.error, t));
        }
      }
    } catch (err) {
      logger.error('Auth error:', err);
      logger.log('🔍 PostHog - Auth error:', {
        mode,
        email: email.substring(0, 5) + '...',
        error: err.message || err,
        timestamp: new Date().toISOString()
      });
      
      posthog.capture('auth_error', {
        auth_mode: mode,
        email: email.substring(0, 5) + '...',
        error: err.message || err,
        timestamp: new Date().toISOString()
      });
      
      setError(getFirebaseErrorMessage(err.message || err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        {/* Language and Theme Toggles */}
        <div className="auth-controls">
          <button
            type="button"
            className="auth-control-btn"
            onClick={toggleLang}
            aria-label={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          >
            {getThemedIcon('ui', 'globe', 16, theme)}
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            type="button"
            className="auth-control-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
          >
            {theme === 'light' ? getThemedIcon('ui', 'moon', 16, theme) : getThemedIcon('ui', 'sun', 16, theme)}
          </button>
        </div>
        
        {/* Only show tabs when not in reset mode */}
        {mode !== 'reset' && (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              {tr('sign_in', 'Login', 'تسجيل الدخول')}
            </button>
            <button 
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              {tr('sign_up', 'Sign Up', 'إنشاء حساب')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <input
              type="email"
              placeholder={tr('email', 'Email', 'البريد الإلكتروني')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
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
                placeholder={tr('password', 'Password', 'كلمة المرور')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
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
                  placeholder={tr('confirm_password', 'Confirm Password', 'تأكيد كلمة المرور')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                  className="form-input"
                  autoComplete="new-password"
                  name="confirm-password"
                  minLength={6}
                />
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary, #666)', 
                marginTop: '-8px', 
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'var(--color-info-light, rgba(23, 162, 184, 0.1))',
                borderRadius: '6px',
                border: '1px solid var(--color-info-border, rgba(23, 162, 184, 0.2))'
              }}>
                💡 {tr('password_hint', 'Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')}
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <input
                type="text"
                placeholder={tr('display_name', 'Display Name (optional)', 'الاسم المعروض (اختياري)')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
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
                placeholder={tr('real_name', 'Real Name (First Last)', 'الاسم الحقيقي (الاسم الأول والأخير)')}
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                onKeyDown={handleKeyDown}
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
                placeholder={tr('student_number', 'Student Number (optional)', 'رقم الطالب (اختياري)')}
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                className="form-input"
                name="student-number"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group" style={{ marginTop: '8px', marginBottom: '12px' }}>
              <ToggleSwitch
                label={tr('remember_me', 'Remember me', 'تذكرني')}
                checked={rememberMe}
                onChange={setRememberMe}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
            onClick={() => {
              logger.log('🔍 PostHog - Auth button clicked:', {
                mode,
                email: email.substring(0, 5) + '...',
                timestamp: new Date().toISOString()
              });
              
              posthog.capture('auth_button_clicked', {
                auth_mode: mode,
                email: email.substring(0, 5) + '...',
                timestamp: new Date().toISOString()
              });
            }}
            style={{
              background: loading ? 'var(--color-primary-light, #a01234)' : `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? tr('loading', 'Loading...', 'جاري التحميل...') : 
             mode === 'login' ? tr('sign_in', 'Sign In', 'تسجيل الدخول') : 
             mode === 'signup' ? tr('sign_up', 'Sign Up', 'إنشاء حساب') : 
             tr('send_reset_email', 'Send Reset Email', 'إرسال بريد إعادة التعيين')}
          </button>
        </form>

        {mode === 'login' && (
          <button 
            className="reset-link"
            onClick={() => setMode('reset')}
          >
            {tr('forgot_password', 'Forgot Password?', 'نسيت كلمة المرور؟')}
          </button>
        )}

        {mode === 'reset' && (
          <button 
            className="reset-link"
            onClick={() => setMode('login')}
          >
            {tr('back_to_login', 'Back to Login', 'العودة لتسجيل الدخول')}
          </button>
        )}

        <TurnstileWidget
          action={mode}
          onVerify={setTurnstileToken}
        />

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
      </div>
    </div>
  );
};

export default AuthForm;
