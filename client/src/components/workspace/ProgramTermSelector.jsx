import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getInstructorPrograms, getAllPrograms } from '@services/business/attendanceWorkspaceService';
import styles from './programTermSelector.module.css';

const STORAGE_PROGRAM_KEY = 'workspace_last_program_id';

const ProgramTermSelector = ({ onSelect }) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { isInstructor } = useAuth();
  const isDark = theme === 'dark';

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true);
      const result = isInstructor
        ? await getInstructorPrograms()
        : await getAllPrograms();
      if (result.success) {
        setPrograms(result.data);
      }
      setLoading(false);
    };
    loadPrograms();
  }, [isInstructor]);

  const handleProgramClick = useCallback((program) => {
    localStorage.setItem(STORAGE_PROGRAM_KEY, String(program.id));
    onSelect({ program });
  }, [onSelect]);

  if (loading) {
    return (
      <div className={styles.loading} style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('loading')}
      </div>
    );
  }

  return (
    <div className={styles.wrap} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={styles.title} style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
        {t('workspace_select_program')}
      </h2>
      <p className={styles.hint} style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('workspace_select_program_hint')}
      </p>

      <div className={styles.grid}>
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            data-testid={`program-card-${program.id}`}
            onClick={() => handleProgramClick(program)}
            className={styles.card}
            style={{
              '--card-border': isDark ? '#334155' : '#e2e8f0',
              '--card-bg': isDark ? '#1e293b' : '#ffffff',
            }}
          >
            <div className={styles.cardName} style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {lang === 'ar' && program.nameAr ? program.nameAr : program.nameEn}
            </div>
            <div className={styles.cardCode} style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {program.code}
            </div>
          </button>
        ))}
      </div>

      {programs.length === 0 && (
        <div className={styles.empty} style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('workspace_no_programs')}
        </div>
      )}
    </div>
  );
};

export default ProgramTermSelector;
