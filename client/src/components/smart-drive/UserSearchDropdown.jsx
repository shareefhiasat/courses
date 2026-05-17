import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Search, User } from 'lucide-react';
import axios from 'axios';

export default function UserSearchDropdown({ value, onChange, disabled = false, excludeUserIds = [] }) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      } else {
        setError(response.data.error?.message || 'Search failed');
      }
    } catch (err) {
      console.error('[UserSearchDropdown] search failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [excludeUserIds]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white mb-2">
        <User className="w-4 h-4" aria-hidden="true" />
        {t('drive.selectUser')}
      </label>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('drive.searchUsers')}
          disabled={disabled}
          className="w-full ps-10 pe-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {query.length >= 2 && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
          {loading && (
            <div className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
              {t('common.searching')}&hellip;
            </div>
          )}

          {error && (
            <div className="px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
              {t('drive.noUsersFound')}
            </div>
          )}

          {!loading && !error && users.length > 0 && users.map(user => (
            <button
              key={user.id}
              onClick={() => {
                onChange(user.id);
                setQuery(user.displayName || user.email);
              }}
              className="w-full px-3 py-2.5 text-start hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.displayName || user.email}
              </div>
              {user.displayName && user.email && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user.email}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
