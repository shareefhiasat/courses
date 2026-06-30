import React, { memo, useMemo, useCallback } from 'react';
import { Button, SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useHistorySearch from '@hooks/useHistorySearch';

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
  width = 400,
  debounceMs = 300
}) => {
  const { t } = useLang();
  const { isDarkMode } = useTheme();
  
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
    right: isOpen ? 0 : `-${width}px`,
    width: `${width}px`,
    height: '100vh',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    transition: 'right 0.3s ease-in-out',
    zIndex: 1000,
    overflow: 'auto',
    ...styles.drawer
  }), [isOpen, width, isDarkMode, styles.drawer]);

  const backdropStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: `${width}px`,
    height: '100vh',
    background: 'rgba(0,0,0,0.1)',
    zIndex: 999,
    ...styles.backdrop
  }), [width, styles.backdrop]);

  const headerStyle = useMemo(() => ({
    padding: '1rem',
    borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    ...styles.header
  }), [isDarkMode, styles.header]);

  const searchInputStyle = useMemo(() => ({
    width: '100%',
    padding: '0.5rem 2.5rem 0.5rem 0.75rem',
    border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
    borderRadius: '6px',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f3f4f6' : '#111827',
    fontSize: 'var(--font-size-sm)',
    ...styles.searchInput
  }), [isDarkMode, styles.searchInput]);

  const entryStyle = useMemo(() => ({
    padding: '1rem',
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    ...styles.entry
  }), [isDarkMode, styles.entry]);

  const changeBoxStyle = useMemo(() => ({
    marginBottom: '0.75rem',
    padding: '0.75rem',
    background: isDarkMode ? '#374151' : '#f9fafb',
    borderRadius: '6px',
    border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
    ...styles.changeBox
  }), [isDarkMode, styles.changeBox]);

  // Handle close with escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

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
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            fontSize: 'var(--font-size-sm)', 
            fontWeight: 'bold',
            color: auditEntry.actionType === 'created' ? '#22c55e' : '#3b82f6'
          }}>
            {auditEntry.actionType === 'created' ? '📝 Created' : '✏️ Updated'}
          </span>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            by {auditEntry.user ? `${auditEntry.user.firstName} ${auditEntry.user.lastName}` : 'Unknown User'}
          </span>
        </div>
        <div style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'right'
        }}>
          {new Date(auditEntry.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Changes made in this action */}
      {auditEntry.changes && auditEntry.changes.length > 0 && (
        <div style={changeBoxStyle}>
          {auditEntry.changes.map((change, changeIndex) => (
            <div key={changeIndex} style={{ 
              fontSize: '0.7rem', 
              color: isDarkMode ? '#d1d5db' : '#6b7280', 
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {change.field === 'initial' ? (
                <span>📝 {change.fieldName}</span>
              ) : (
                <>
                  <span style={{ fontWeight: '500' }}>{change.fieldName}:</span>
                  <span style={{ 
                    color: '#ef4444', 
                    textDecoration: 'line-through',
                    opacity: 0.7
                  }}>
                    {change.oldValue === null ? 'null' : 
                     change.field === 'isRepeated' ? (change.oldValue ? 'Yes' : 'No') :
                     change.field === 'gradeType' ? change.oldValue : 
                     change.oldValue}
                  </span>
                  <span style={{ color: '#6b7280' }}>→</span>
                  <span style={{ 
                    color: '#22c55e',
                    fontWeight: '500'
                  }}>
                    {change.newValue === null ? 'null' : 
                     change.field === 'isRepeated' ? (change.newValue ? 'Yes' : 'No') :
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
        color: isDarkMode ? '#d1d5db' : '#6b7280'
      }}>
        <div>
          <span>Attempt: </span>
          <span style={{ 
            fontWeight: 'bold',
            color: auditEntry.recordSnapshot?.isRepeated ? '#ef4444' : '#22c55e'
          }}>
            {auditEntry.recordSnapshot?.isRepeated ? 'Repeated' : 'First'}
          </span>
        </div>
        <div>
          <span>Total: </span>
          <span style={{ fontWeight: 'bold' }}>
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
            fontWeight: 'bold'
          }}>
            {auditEntry.recordSnapshot?.letterGrade || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  ), [entryStyle, changeBoxStyle, isDarkMode, getGradeColor]);

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
        className={`marks-history-drawer ${isOpen ? 'open' : ''}`}
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
            alignItems: 'center' 
          }}>
            <h3 id="history-drawer-title" style={{ margin: 0, color: isDarkMode ? '#f3f4f6' : '#111827' }}>
              {t('marks_history') || 'Marks History'}
            </h3>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={onClose}
              style={{ padding: '4px 8px' }}
              aria-label="Close"
            >
              ×
            </Button>
          </div>
          
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
              aria-label="Search history"
            />
            <span style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    padding: '0',
                    borderRadius: '2px'
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
              🔍
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '1rem' }}>
          {/* Selected Student Info */}
          {selectedStudent && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              background: isDarkMode ? '#374151' : '#f9fafb', 
              borderRadius: '6px' 
            }}>
              <div style={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                {selectedStudent.studentName || selectedStudent.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
                ID: {selectedStudent.studentNumber || selectedStudent.id}
              </div>
            </div>
          )}
          
          {/* History Entries */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <SimpleLoading message={t('loading_history') || 'Loading history...'} />
            </div>
          ) : filteredData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredData.map((auditEntry, index) => renderHistoryEntry(auditEntry, index))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              {hasSearch ? 
                (t('no_search_results') || 'No results found for your search') : 
                (t('no_history_found') || 'No history found')
              }
            </div>
          )}
        </div>
      </div>
    </>
  );
});

MarksHistoryDrawer.displayName = 'MarksHistoryDrawer';

export default MarksHistoryDrawer;
