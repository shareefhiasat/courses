import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getProgramTerms } from '@services/business/attendanceWorkspaceService';
import { useAuth } from '@contexts/AuthContext';

const STORAGE_TERM_KEY = 'workspace_academic_term_id';

const YearTermSelector = ({ program, onSelect, onBack, showBack = true }) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { isAdmin, isSuperAdmin } = useAuth();
  const isDark = theme === 'dark';

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTermId, setSelectedTermId] = useState(null);

  useEffect(() => {
    if (!program?.id) return;

    const loadTerms = async () => {
      setLoading(true);
      const result = await getProgramTerms(program.id, { all: isAdmin || isSuperAdmin });
      if (result.success) {
        setTerms(result.data || []);
        const saved = localStorage.getItem(STORAGE_TERM_KEY);
        const savedNum = saved ? parseInt(saved, 10) : null;
        const savedTerm = result.data?.find((term) => term.id === savedNum);
        const activeTerm = result.data?.find((term) => term.isActive);
        const defaultTerm = savedTerm || activeTerm || result.data?.[0];
        if (defaultTerm) {
          setSelectedTermId(defaultTerm.id);
        }
      }
      setLoading(false);
    };

    loadTerms();
  }, [program?.id, isAdmin, isSuperAdmin]);

  const handleTermClick = useCallback((term) => {
    setSelectedTermId(term.id);
    localStorage.setItem(STORAGE_TERM_KEY, String(term.id));
    onSelect({ program, academicTerm: term });
  }, [onSelect, program]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}>
        <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        maxWidth: '800px',
        margin: '0 auto',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            alignSelf: lang === 'ar' ? 'flex-end' : 'flex-start',
            marginBottom: '16px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: 'transparent',
            color: isDark ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          ← {t('workspace_back')}
        </button>
      )}

      <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 8px' }}>
        {lang === 'ar' && program.nameAr ? program.nameAr : program.nameEn}
      </p>
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '8px',
          color: isDark ? '#f1f5f9' : '#1e293b',
          textAlign: 'center',
        }}
      >
        {t('workspace_select_term')}
      </h2>
      <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '28px', textAlign: 'center' }}>
        {t('workspace_select_term_hint')}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
          width: '100%',
        }}
      >
        {terms.map((term) => {
          const isSelected = selectedTermId === term.id;
          return (
            <button
              key={term.id}
              type="button"
              data-testid={`term-card-${term.id}`}
              onClick={() => handleTermClick(term)}
              style={{
                padding: '20px',
                borderRadius: '14px',
                border: isSelected
                  ? '2px solid var(--color-primary, #3b82f6)'
                  : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                background: isSelected
                  ? (isDark ? '#1e3a5f' : '#eff6ff')
                  : (isDark ? '#1e293b' : '#ffffff'),
                cursor: 'pointer',
                textAlign: lang === 'ar' ? 'right' : 'left',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {lang === 'ar' && term.nameAr ? term.nameAr : term.nameEn}
              </div>
              <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '6px' }}>
                {term.code}
                {term.classCount > 0 && (
                  <span style={{ marginInlineStart: '8px' }}>
                    · {term.classCount} {t('workspace_classes')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {terms.length === 0 && (
        <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '24px' }}>
          {t('workspace_no_terms')}
        </div>
      )}
    </div>
  );
};

export default YearTermSelector;
