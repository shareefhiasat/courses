import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { Search, User, X } from 'lucide-react';
import axios from 'axios';

export default function UserSearchDropdown({ value, onChange, disabled = false, excludeUserIds = [] }) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/users', {
        params: { search: searchQuery, limit: 20 }
      });
      if (response.data.success) {
        const filtered = (response.data.payload || []).filter(
          u => !excludeUserIds.includes(u.id)
        );
        setUsers(filtered);
        setIsOpen(true);
      } else {
        setError(response.data.error?.message || t('common.unknown_error'));
      }
    } catch (err) {
      console.error('[UserSearchDropdown] search failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [excludeUserIds, t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  const handleSelectUser = (user) => {
    setQuery(user.displayName || user.email);
    onChange(user.id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text, #111827)',
          marginBottom: '0.5rem',
        }}
      >
        <User className="w-4 h-4" aria-hidden="true" />
        {t('drive.selectUser')}
      </label>

      <div style={{ position: 'relative' }}>
        {value && query ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              cursor: 'pointer',
            }}
            onClick={() => { setQuery(''); onChange(null); }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '9999px',
                background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User className="w-4 h-4" style={{ color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
            </div>
            <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
              {query}
            </span>
            <X className="w-4 h-4" style={{ color: 'var(--text-muted, #6b7280)', flexShrink: 0 }} />
          </div>
        ) : (
          <>
            <Search
              style={{
                position: 'absolute',
                insetInlineStart: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: 'var(--text-muted, #6b7280)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (users.length > 0) setIsOpen(true); }}
              placeholder={t('drive.searchUsers')}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.5rem',
                background: 'var(--panel, white)',
                color: 'var(--text, #111827)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'auto',
              }}
              onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-alpha, rgba(37, 99, 235, 0.2))';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #d1d5db)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: '0.375rem',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.75rem',
            background: 'var(--panel, white)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {loading && (
            <div style={{ padding: '1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
              <div style={{ width: '1rem', height: '1rem', border: '2px solid var(--border, #e5e7eb)', borderTopColor: 'var(--color-primary, #2563eb)', borderRadius: '9999px', animation: 'spin 0.6s linear infinite' }} />
              {t('common.searching')}&hellip;
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && query.length >= 2 && (
            <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
              {t('drive.noUsersFound')}
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    textAlign: 'start',
                    border: 'none',
                    borderBottom: '1px solid var(--border, #e5e7eb)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '9999px',
                      background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      {user.displayName || user.email}
                    </div>
                    {user.displayName && user.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
