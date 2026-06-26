import { useEffect } from 'react';
import { useLang } from '../../contexts/LangContext';

export default function HelpRedirect() {
  const { lang } = useLang();

  useEffect(() => {
    window.location.href = `http://localhost:3000/${lang === 'ar' ? 'ar' : 'en'}`;
  }, [lang]);

  return null;
}
