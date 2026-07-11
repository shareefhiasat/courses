import { useEffect } from 'react';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function HelpRedirect() {
  const { lang } = useLang();
  const { isSuperAdmin } = useAuth() || {};

  useEffect(() => {
    if (!isSuperAdmin) return;
    window.location.href = `${import.meta.env.VITE_HELP_URL || 'http://localhost:3000'}/${lang === 'ar' ? 'ar' : 'en'}`;
  }, [lang, isSuperAdmin]);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return null;
}
