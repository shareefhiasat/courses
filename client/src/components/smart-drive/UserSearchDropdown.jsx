import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Search, User } from 'lucide-react';
import axios from 'axios';

/**
 * UserSearchDropdown - Async user search with debounce
 * Searches across all system users via /api/v1/users
 */
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
      <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
        <User className="w-4 h-4 inline me-1" />
        {t('drive.selectUser')}
      </label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d90a0]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('drive.searchUsers')}
          disabled={disabled}
          className="w-full ps-10 pe-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white placeholder-[#8d90a0] focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Results Dropdown */}
      {query.length >= 2 && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-[#434655]/30 rounded-lg bg-[#1d1f27]">
          {loading && (
            <div className="px-3 py-2 text-sm text-[#8d90a0]">
              {t('common.searching')}...
            </div>
          )}
          
          {error && (
            <div className="px-3 py-2 text-sm text-[#ffb4ab]">
              {error}
            </div>
          )}
          
          {!loading && !error && users.length === 0 && (
            <div className="px-3 py-2 text-sm text-[#8d90a0]">
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
              className="w-full px-3 py-2 text-start hover:bg-[#32343d] transition-colors border-b border-[#434655]/10 last:border-b-0"
            >
              <div className="text-sm font-medium text-white">
                {user.displayName || user.email}
              </div>
              {user.displayName && user.email && (
                <div className="text-xs text-[#8d90a0]">
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
