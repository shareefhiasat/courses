import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LangContext';
import AuthForm from '../components/AuthForm';
import { Container, Spinner } from '../components/ui';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  
  const pageClass = `${styles.loginPage} ${isDark ? styles.dark : ''}`;

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
      <Container maxWidth="sm" className={styles.formContainer}>
        <AuthForm />
      </Container>
    </div>
  );
};

export default LoginPage;
