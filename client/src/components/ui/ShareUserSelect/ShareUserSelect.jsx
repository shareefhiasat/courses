import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import UserSelect from '@ui/UserSelect';
import { getThemedIcon } from '@constants/iconTypes';
import { getAllUsers } from '@services/business/userService';
import { ROLE_STRINGS } from '@utils/userUtils';
import selectStyles from '@ui/Select/Select.module.css';

const STAFF_ROLES = [
  ROLE_STRINGS.INSTRUCTOR,
  ROLE_STRINGS.ADMIN,
  ROLE_STRINGS.HR,
  ROLE_STRINGS.SUPER_ADMIN,
];

/** Staff-only preload cap — much smaller than Users grid (5000) since students are excluded. */
const DEFAULT_PRELOAD_LIMIT = 500;

let staffUsersCache = null;
let staffUsersCacheKey = '';
let staffUsersLoadPromise = null;

async function preloadStaffUsers({ excludeStudents, limit }) {
  const cacheKey = `${excludeStudents}:${limit}`;
  if (staffUsersCache && staffUsersCacheKey === cacheKey) {
    return staffUsersCache;
  }
  if (staffUsersLoadPromise && staffUsersCacheKey === cacheKey) {
    return staffUsersLoadPromise;
  }

  staffUsersCacheKey = cacheKey;
  staffUsersLoadPromise = getAllUsers({ excludeStudents, limit })
    .then((result) => {
      staffUsersCache = result.success ? (result.data || []) : [];
      return staffUsersCache;
    })
    .catch(() => {
      staffUsersCache = [];
      return staffUsersCache;
    })
    .finally(() => {
      staffUsersLoadPromise = null;
    });

  return staffUsersLoadPromise;
}

const userAvatarIcon = (theme) => (
  <div
    style={{
      width: '2rem',
      height: '2rem',
      borderRadius: '9999px',
      background: 'var(--color-primary-alpha, rgba(37,99,235,0.1))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {getThemedIcon('ui', 'user', 16, theme === 'dark' ? 'light' : 'primary')}
  </div>
);

/**
 * ShareUserSelect — UserSelect with preloaded staff list (Classes / Users page pattern).
 * Users appear immediately on open; in-dropdown search filters locally (no server round-trip).
 */
export default function ShareUserSelect({
  label,
  value,
  onChange,
  multiple = false,
  placeholder,
  disabled = false,
  required = false,
  excludeStudents = true,
  excludeUserIds = [],
  preloadLimit = DEFAULT_PRELOAD_LIMIT,
  fullWidth = true,
  className = '',
  style = {},
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [knownUsers, setKnownUsers] = useState({});
  const [pickerValue, setPickerValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const selectedIds = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }, [multiple, value]);

  const mergeKnownUsers = useCallback((nextUsers = []) => {
    if (!nextUsers.length) return;
    setKnownUsers((prev) => {
      const merged = { ...prev };
      nextUsers.forEach((user) => {
        const id = user.id ?? user.docId;
        if (!id) return;
        merged[id] = {
          id,
          label: user.displayName || user.email || user.name,
          subtext: user.displayName && user.email && user.email !== user.displayName ? user.email : null,
        };
      });
      return merged;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const fetched = await preloadStaffUsers({
          excludeStudents,
          limit: preloadLimit,
        });
        if (cancelled) return;
        mergeKnownUsers(fetched);
        setUsers(fetched);
      } catch (err) {
        if (!cancelled) {
          console.error('[ShareUserSelect] preload failed:', err);
          setLoadError(err.message || 'Failed to load users');
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();
    return () => { cancelled = true; };
  }, [excludeStudents, preloadLimit, mergeKnownUsers]);

  useEffect(() => {
    if (multiple || value == null || value === '') return;
    setPickerValue(String(value));
  }, [value, multiple]);

  const selectableUsers = useMemo(
    () => users.filter((user) => {
      const id = user.id ?? user.docId;
      if (excludeUserIds.includes(id)) return false;
      if (multiple) return !selectedIds.includes(id);
      return true;
    }),
    [users, selectedIds, excludeUserIds, multiple]
  );

  const handleUserSelectChange = (selectedValue) => {
    if (!selectedValue) return;

    const userId = Number(selectedValue);
    const matchedUser = users.find(
      (user) => String(user.id ?? user.docId) === String(selectedValue)
    );
    if (matchedUser) mergeKnownUsers([matchedUser]);

    if (multiple) {
      if (!selectedIds.includes(userId)) {
        onChange?.([...selectedIds, userId]);
      }
      setPickerValue('');
    } else {
      onChange?.(userId);
      setPickerValue(String(userId));
    }
  };

  const removeUser = (userId) => {
    if (multiple) {
      onChange?.(selectedIds.filter((id) => id !== userId));
    } else {
      onChange?.(null);
      setPickerValue('');
    }
  };

  const selectValue = multiple
    ? pickerValue
    : (pickerValue || (value != null && value !== '' ? String(value) : ''));

  const resolvedPlaceholder = loading
    ? (t('common.loading') || 'Loading...')
    : (placeholder || t('drive.selectUser') || t('select_user') || 'Select user');

  return (
    <div className={className} style={{ width: fullWidth ? '100%' : undefined, ...style }}>
      <UserSelect
        label={label}
        required={required}
        users={selectableUsers}
        enrollments={[]}
        classes={[]}
        value={selectValue}
        onChange={handleUserSelectChange}
        placeholder={resolvedPlaceholder}
        searchPlaceholder={t('search') || 'Search...'}
        useEmailAsValue={false}
        showEnrollments={false}
        showStatus={true}
        roleFilter={excludeStudents ? STAFF_ROLES : null}
        searchable
        fullWidth={fullWidth}
        disabled={disabled || loading}
        theme={theme}
      />

      {multiple && selectedIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '0.75rem' }}>
          {selectedIds.map((userId) => {
            const user = knownUsers[userId];
            return (
              <span
                key={userId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                {userAvatarIcon(theme)}
                <span>{user?.label || `#${userId}`}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeUser(userId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '18px',
                      lineHeight: 1,
                      opacity: 0.7,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    aria-label={t('common.remove') || 'Remove'}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {loadError && (
        <span className={selectStyles.errorText}>{loadError}</span>
      )}
    </div>
  );
}

/** Clear session cache (e.g. after logout) */
export function clearShareUserSelectCache() {
  staffUsersCache = null;
  staffUsersCacheKey = '';
  staffUsersLoadPromise = null;
}
