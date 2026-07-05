import React, { memo, useMemo, useCallback } from 'react';
import { SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import useHistorySearch from '@hooks/useHistorySearch';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { formatDateTime } from '@utils/date-formatter.js';

/**
 * Reusable Marks History Drawer Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {Function} props.onClose - Callback when drawer is closed
 * @param {Array} props.historyData - Array of history entries
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.selectedStudent - Selected student object with name and ID
 * @param {Object} props.customFields - Custom fields configuration for rendering
 * @param {Object} props.styles - Custom styles overrides
 * @param {number} props.width - Drawer width in pixels (default: 400)
 * @param {number} props.debounceMs - Search debounce delay (default: 300)
 */
const MarksHistoryDrawer = memo(({
  isOpen,
  onClose,
  historyData = [],
  loading = false,
  selectedStudent = null,
  customFields = null,
  styles = {},
  width: widthProp = 400,
  debounceMs = 300
}) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'marks_history_drawer_width',
    defaultWidth: widthProp,
    minWidth: 320,
    maxWidth: 800,
    isRTL,
  });
  
  // Use custom hook for debounced search
  const {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    hasSearch
  } = useHistorySearch(historyData, debounceMs);

  // Helper function to get grade color
  const getGradeColor = useCallback((grade) => {
    if (!grade) return '#6b7280';
    if (grade === 'A+' || grade === 'A' || grade === 'A-') return '#10b981';
    if (grade.startsWith('B')) return '#3b82f6';
    if (grade.startsWith('C')) return '#f59e0b';
    if (grade.startsWith('D')) return '#ef4444';
    return '#6b7280';
  }, []);

  // Memoized style objects for performance
  const drawerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    right: isRTL ? 'auto' : (isOpen ? 0 : `-${drawerWidth}px`),
    left: isRTL ? (isOpen ? 0 : `-${drawerWidth}px`) : 'auto',
    width: `${drawerWidth}px`,
    height: '100vh',
    background: 'var(--panel)',
    boxShadow: isRTL ? '2px 0 10px rgba(0,0,0,0.1)' : '-2px 0 10px rgba(0,0,0,0.1)',
    transition: 'right 0.3s ease-in-out, left 0.3s ease-in-out',
    zIndex: 1000,
    overflow: 'auto',
    ...styles.drawer
  }), [isOpen, drawerWidth, isRTL, styles.drawer]);

  const backdropStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: isRTL ? `${drawerWidth}px` : 0,
    right: isRTL ? 0 : `${drawerWidth}px`,
    height: '100vh',
    background: 'rgba(0,0,0,0.45)',
    zIndex: 999,
    ...styles.backdrop
  }), [drawerWidth, isRTL, styles.backdrop]);

  const headerStyle = useMemo(() => ({
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    ...styles.header
  }), [styles.header]);

  const searchInputStyle = useMemo(() => ({
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.85rem',
    ...styles.searchInput
  }), [styles.searchInput]);

  const entryStyle = useMemo(() => ({
    padding: '1rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--bg)',
    ...styles.entry
  }), [styles.entry]);

  const changeBoxStyle = useMemo(() => ({
    marginBottom: '0.75rem',
    padding: '0.75rem',
    background: 'var(--panel)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    ...styles.changeBox
  }), [styles.changeBox]);

  // Handle close with escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const toInitCap = useCallback((text) => {
    if (!text || lang === 'ar') return text;
    const normalized = text === text.toUpperCase() && /[A-Z]/.test(text)
      ? text.split(/[_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : text;
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [lang]);

  // Render individual history entry
  const renderHistoryEntry = useCallback((auditEntry, index) => (
    <div 
      key={`${auditEntry.id}-${index}`}
      style={entryStyle}
    >
      {/* Header with action type and user */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            fontSize: 'var(--font-size-sm)', 
            fontWeight: 600,
            color: auditEntry.actionType === 'created' ? '#22c55e' : '#3b82f6',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            {auditEntry.actionType === 'created' 
              ? getIconWithColor('ui', 'plus', 14, '#22c55e')
              : getIconWithColor('ui', 'edit', 14, '#3b82f6')
            }
            {auditEntry.actionType === 'created' ? t('history_created') : t('history_updated')}
          </span>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--muted)'
          }}>
            {t('history_by')} {auditEntry.user ? `${auditEntry.user.firstName} ${auditEntry.user.lastName}` : t('history_unknown_user')}
          </span>
        </div>
        <div style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: 'var(--muted)',
          textAlign: 'right'
        }}>
          {formatDateTime(auditEntry.timestamp, lang)}
        </div>
      </div>

      {/* Changes made in this action */}
      {auditEntry.changes && auditEntry.changes.length > 0 && (
        <div style={changeBoxStyle}>
          {auditEntry.changes.map((change, changeIndex) => (
            <div key={changeIndex} style={{ 
              fontSize: '0.7rem', 
              color: 'var(--muted)', 
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {change.field === 'initial' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {getIconWithColor('ui', 'plus', 12, '#22c55e')}
                  {change.fieldName}
                </span>
              ) : (
                <>
                  <span style={{ fontWeight: 500 }}>{change.fieldName}:</span>
                  <span style={{ 
                    color: '#ef4444', 
                    textDecoration: 'line-through',
                    opacity: 0.7
                  }}>
                    {change.oldValue === null ? 'null' : 
                     change.field === 'isRepeated' ? (change.oldValue ? t('history_repeated') : t('history_first')) :
                     change.field === 'gradeType' ? change.oldValue : 
                     change.oldValue}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>→</span>
                  <span style={{ 
                    color: '#22c55e',
                    fontWeight: 500
                  }}>
                    {change.newValue === null ? 'null' : 
                     change.field === 'isRepeated' ? (change.newValue ? t('history_repeated') : t('history_first')) :
                     change.field === 'gradeType' ? change.newValue : 
                     change.newValue}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current state snapshot */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--muted)'
      }}>
        <div>
          <span>{t('history_attempt')} </span>
          <span style={{ 
            fontWeight: 600,
            color: auditEntry.recordSnapshot?.isRepeated ? '#ef4444' : '#22c55e'
          }}>
            {auditEntry.recordSnapshot?.isRepeated ? t('history_repeated') : t('history_first')}
          </span>
        </div>
        <div>
          <span>{t('history_total')} </span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {auditEntry.recordSnapshot?.totalMarks || 0}%
          </span>
        </div>
        <div>
          <span style={{ 
            padding: '2px 6px',
            borderRadius: '4px',
            background: getGradeColor(auditEntry.recordSnapshot?.letterGrade),
            color: '#ffffff',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700
          }}>
            {auditEntry.recordSnapshot?.letterGrade || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  ), [entryStyle, changeBoxStyle, t, lang, getGradeColor]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for auto-collapse */}
      {isOpen && (
        <div
          style={backdropStyle}
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
        />
      )}
      
      <div 
        className={`marks-history-drawer ${isOpen ? 'open' : ''} ${isRTL ? 'rtl' : ''}`}
        style={drawerStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <h3 id="history-drawer-title" style={{ margin: 0, color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700 }}>
              {toInitCap(t('marks_history'))}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.375rem',
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
              aria-label={t('close')}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              {getThemedIcon('ui', 'x', 20, theme)}
            </button>
          </div>
          
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={t('search_history')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
              aria-label={t('search_history')}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  [isRTL ? 'left' : 'right']: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={t('history_clear_search')}
                aria-label={t('history_clear_search')}
              >
                {getThemedIcon('ui', 'x', 14, theme)}
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '1rem 1.25rem' }}>
          {/* Selected Student Info */}
          {selectedStudent && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              background: 'var(--bg)', 
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                {selectedStudent.studentName || selectedStudent.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted)' }}>
                {t('history_student_id')}: {selectedStudent.studentNumber || selectedStudent.id}
              </div>
            </div>
          )}
          
          {/* History Entries */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <SimpleLoading message={t('loading_history')} />
            </div>
          ) : filteredData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredData.map((auditEntry, index) => renderHistoryEntry(auditEntry, index))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              {hasSearch ? 
                (t('no_search_results')) : 
                (t('no_history_found'))
              }
            </div>
          )}
        </div>
        <div {...resizeHandleProps} />
      </div>
    </>
  );
});

MarksHistoryDrawer.displayName = 'MarksHistoryDrawer';

export default MarksHistoryDrawer;
