import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Drawer } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getAuthToken } from '@utils/authHelpers';
import { getThemedIcon } from '@constants/iconTypes';
import { getClassOptionLabel } from '@utils/academicSelectOptions';
import { SimpleLoading } from '@ui';

function labelFor(item, lang, fallback = '—') {
  if (!item) return fallback;
  return lang === 'ar'
    ? item.nameAr || item.nameEn || item.code || fallback
    : item.nameEn || item.nameAr || item.code || fallback;
}

export default function MyDataScopeDrawer({ isOpen, onClose }) {
  const { user, isSuperAdmin, isAdmin, isInstructor, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  const roleLabel = useMemo(() => {
    if (isSuperAdmin) return t('role_label_super_admin');
    if (isHR) return t('role_label_hr');
    if (isAdmin) return t('role_label_admin');
    if (isInstructor) return t('role_label_instructor');
    return t('role_label_student');
  }, [isSuperAdmin, isHR, isAdmin, isInstructor, t]);

  const loadDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const base = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';
      const res = await fetch(`${base}/me/data-scope?details=1`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load access scope');
      }
      setDetails(json.data || null);
    } catch (err) {
      setError(err.message || t('error_loading_data'));
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (isOpen) loadDetails();
  }, [isOpen, loadDetails]);

  const groupedClasses = useMemo(() => {
    if (!details?.classes?.length) return [];
    const programMap = new Map((details.programs || []).map((p) => [Number(p.id), p]));
    const subjectMap = new Map((details.subjects || []).map((s) => [Number(s.id), s]));
    const groups = new Map();

    details.classes.forEach((cls) => {
      const programId = Number(cls.programId);
      const key = programId || 0;
      if (!groups.has(key)) {
        groups.set(key, {
          program: programMap.get(programId) || null,
          classes: [],
        });
      }
      groups.get(key).classes.push(cls);
    });

    return [...groups.values()].sort((a, b) =>
      labelFor(a.program, lang).localeCompare(labelFor(b.program, lang), lang === 'ar' ? 'ar' : 'en'),
    );
  }, [details, lang]);

  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const panelBg = theme === 'dark' ? '#111827' : '#f9fafb';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      size="md"
      title={t('my_data_access')}
      resizable
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: panelBg, border: `1px solid ${border}` }}>
          <div style={{ fontSize: '0.75rem', color: muted, marginBottom: 4 }}>{t('signed_in_as')}</div>
          <div style={{ fontWeight: 600 }}>{user?.displayName || user?.email || '—'}</div>
          <div style={{ fontSize: '0.85rem', color: muted, marginTop: 4 }}>{roleLabel}</div>
        </div>

        {loading && <SimpleLoading message={t('loading')} />}

        {!loading && error && (
          <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>
        )}

        {!loading && !error && details && (
          <>
            {details.unlimited ? (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${border}`, background: panelBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getThemedIcon('ui', 'shield', 18, 'success')}
                  <span style={{ fontWeight: 500 }}>{t('my_access_unlimited')}</span>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: muted }}>{t('my_access_unlimited_hint')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'programs', count: details.programs?.length || 0, label: t('programs') },
                    { key: 'subjects', count: details.subjects?.length || 0, label: t('subjects') },
                    { key: 'classes', count: details.classes?.length || 0, label: t('classes') },
                  ].map((chip) => (
                    <span
                      key={chip.key}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: theme === 'dark' ? '#1f2937' : '#fff',
                        border: `1px solid ${border}`,
                      }}
                    >
                      {chip.count} {chip.label}
                    </span>
                  ))}
                </div>

                {(details.programs?.length === 0 && details.classes?.length === 0) && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px dashed ${border}`, color: muted, fontSize: '0.875rem' }}>
                    {t('my_access_empty')}
                  </div>
                )}

                {groupedClasses.map((group) => (
                  <div key={group.program?.id || 'unknown'} style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                      {labelFor(group.program, lang, t('unknown_program'))}
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {group.classes.map((cls) => (
                        <li
                          key={cls.id}
                          style={{
                            padding: '0.6rem 0.85rem',
                            borderTop: `1px solid ${border}`,
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ fontWeight: 500 }}>{getClassOptionLabel(cls, lang)}</div>
                          {cls.instructor && (
                            <div style={{ color: muted, fontSize: '0.78rem', marginTop: 2 }}>
                              {t('instructor')}: {lang === 'ar'
                                ? cls.instructor.displayNameAr || cls.instructor.displayName
                                : cls.instructor.displayName}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {details.subjects?.length > 0 && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                      {t('subjects')}
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '0.25rem 0' }}>
                      {details.subjects.map((sub) => (
                        <li key={sub.id} style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                          {sub.code} — {labelFor(sub, lang)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <p style={{ margin: 0, fontSize: '0.78rem', color: muted }}>{t('my_data_access_hint')}</p>
          </>
        )}
      </div>
    </Drawer>
  );
}
