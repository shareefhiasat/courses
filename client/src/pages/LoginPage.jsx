import React from 'react';
import { Navigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthForm from '../components/AuthForm';
import { Container, Spinner } from '../components/ui';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const pageClass = `${styles.loginPage} ${isDark ? styles.dark : ''}`;
  const heroClass = `${styles.hero} ${isDark ? styles.darkHero : ''}`;
  const heroTitle = (t && t('welcome_back')) || (lang === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back');
  const heroSubtitle = (t && t('login_subtitle')) || (lang === 'ar' ? 'سجّل الدخول لمتابعة رحلتك التعليمية' : 'Sign in to continue your learning journey');

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={pageClass}>
      <div className={heroClass}>
        <Container maxWidth="lg">
          <div className={styles.heroTopRow}>
            <div className={styles.heroSpacer} />
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.iconPill}
                onClick={toggleLang}
                aria-label={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                {lang === 'en' ? 'AR' : 'EN'}
              </button>
              <button
                type="button"
                className={styles.iconPill}
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>
          <h1 className={styles.title}>{heroTitle}</h1>
          <p className={styles.subtitle}>{heroSubtitle}</p>
        </Container>
      </div>
      <Container maxWidth="sm" className={styles.formContainer}>
        <AuthForm />
      </Container>
    </div>
  );
};

export default LoginPage;
