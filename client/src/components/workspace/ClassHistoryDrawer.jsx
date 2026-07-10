import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import useResizableDrawer from '@hooks/useResizableDrawer';
import ExportHistoryDrawer from '@pages/operations/attendance/ExportHistoryDrawer';
import LectureLogDrawer from '@components/workspace/LectureLogDrawer';

const TABS = {
  EXPORT: 'export',
  LECTURE: 'lecture',
};

const ClassHistoryDrawer = ({ isOpen, onClose, classInfo, date, initialTab = null }) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState(initialTab || TABS.EXPORT);
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'class_history_drawer_width',
    defaultWidth: 520,
    minWidth: 360,
    maxWidth: 900,
    isRTL,
  });

  const classLabel = classInfo
    ? (lang === 'ar' && classInfo.nameAr ? classInfo.nameAr : classInfo.nameEn || classInfo.code)
    : '';

  if (!isOpen) return null;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 11990,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          insetInlineEnd: 0,
          width: `${drawerWidth}px`,
          maxWidth: '100vw',
          height: '100vh',
          background: isDark ? '#0f172a' : '#ffffff',
          borderInlineStart: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          zIndex: 12000,
          display: 'flex',
          flexDirection: 'column',
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        }}
        data-testid="class-history-drawer"
      >
        <div {...resizeHandleProps} />
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_class_history')}
            </div>
            {classLabel && (
              <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                {classLabel}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {getThemedIcon('ui', 'close', 20, isDark ? 'inverse' : 'primary')}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        >
          {[
            { key: TABS.EXPORT, label: t('export_history'), icon: 'download' },
            { key: TABS.LECTURE, label: t('workspace_lookup_previous'), icon: 'clipboard_list' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${active ? 'var(--color-primary, #3b82f6)' : (isDark ? '#334155' : '#e2e8f0')}`,
                  background: active ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)') : 'transparent',
                  color: active ? 'var(--color-primary, #3b82f6)' : (isDark ? '#94a3b8' : '#64748b'),
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                data-testid={`class-history-tab-${tab.key}`}
              >
                {getThemedIcon('ui', tab.icon, 14, active ? 'primary' : theme)}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeTab === TABS.EXPORT && (
            <ExportHistoryDrawer
              isOpen
              onClose={onClose}
              lang={lang}
              t={t}
              theme={theme}
              classId={classInfo?.id}
              embedded
            />
          )}
          {activeTab === TABS.LECTURE && (
            <LectureLogDrawer
              isOpen
              onClose={onClose}
              classInfo={classInfo}
              date={date}
              embedded
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ClassHistoryDrawer;
