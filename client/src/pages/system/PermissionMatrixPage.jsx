import React, { useState, useEffect, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { getAuthToken } from '@utils/authHelpers';

/**
 * Permission Matrix Visualization Page (Editable)
 * 
 * PURPOSE: Visualize and manage role-based access control for screens and operations
 * Displays a tree structure: Screens → Operations → Roles (checkboxes)
 */

const PermissionMatrixPage = () => {
  const { t, lang } = useLang();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedScreens, setExpandedScreens] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);

  // Role display names
  const roleDisplayNames = {
    super_admin: 'SUPER ADMIN',
    admin: 'ADMIN',
    hr: 'HR',
    instructor: 'INSTRUCTOR',
    student: 'STUDENT'
  };

  const allRoles = useMemo(() => ['super_admin', 'admin', 'hr', 'instructor', 'student'], []);

  const categoryDisplayNames = {
    main: 'Main',
    quiz: 'Quiz',
    classes: 'Classes',
    academic: 'Academic',
    attendance: 'Attendance',
    analytics: 'Analytics',
    communication: 'Communication',
    scheduling: 'Scheduling',
    admin: 'Admin',
    settings: 'Settings',
    drive: 'Drive',
    workflow: 'Workflow',
  };

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;
    
    const query = searchQuery.toLowerCase();
    return permissions.filter(screen => {
      const screenName = (screen.nameEn || screen.nameAr || '').toLowerCase();
      const screenId = (screen.screenId || '').toLowerCase();
      
      if (screenName.includes(query) || screenId.includes(query)) return true;
      
      const hasMatchingOperation = screen.operations.some(op => {
        const opName = (op.nameEn || op.nameAr || '').toLowerCase();
        const opKey = (op.operationKey || '').toLowerCase();
        return opName.includes(query) || opKey.includes(query);
      });
      
      return hasMatchingOperation;
    });
  }, [permissions, searchQuery]);

  // Group filtered permissions by category
  const groupedPermissions = useMemo(() => {
    const groups = {};
    for (const screen of filteredPermissions) {
      const cat = screen.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(screen);
    }
    return groups;
  }, [filteredPermissions]);

  const categoryNames = useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

  // Count pending updates per category
  const pendingCountByCategory = useMemo(() => {
    const counts = {};
    for (const upd of pendingUpdates) {
      const screen = permissions.find(s => s.id === upd.screenId);
      const cat = screen?.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [pendingUpdates, permissions]);

  const toggleScreen = (screenId) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(screenId)) next.delete(screenId);
      else next.add(screenId);
      return next;
    });
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categoryNames));
    setExpandedScreens(new Set(filteredPermissions.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedScreens(new Set());
  };

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1'}/permissions`, {
        headers: {
          'Accept-Language': lang,
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch permissions');
      
      const data = await response.json();
      setPermissions(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (screenId, operationId, role, currentAllowed) => {
    if (!editMode) return;

    const update = {
      role,
      screenId,
      operationId,
      allowed: !currentAllowed
    };

    setPendingUpdates(prev => {
      const existingIndex = prev.findIndex(
        u => u.role === role && u.screenId === screenId && u.operationId === operationId
      );
      
      if (existingIndex >= 0) {
        const newUpdates = [...prev];
        newUpdates[existingIndex] = update;
        return newUpdates;
      }
      
      return [...prev, update];
    });

    // Optimistic UI update
    setPermissions(prev => {
      return prev.map(screen => {
        if (screen.id !== screenId) return screen;
        
        return {
          ...screen,
          operations: screen.operations.map(op => {
            if (op.id !== operationId) return op;
            
            return {
              ...op,
              permissions: op.permissions.map(perm => {
                if (perm.role !== role) return perm;
                return { ...perm, allowed: !perm.allowed };
              })
            };
          })
        };
      });
    });
  };

  const handleSave = async () => {
    if (pendingUpdates.length === 0) return;

    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1'}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang,
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ updates: pendingUpdates })
      });

      if (!response.ok) throw new Error('Failed to save permissions');

      setSaveMessage(t('permission_matrix_saved') || 'Permissions saved successfully');
      setPendingUpdates([]);
      setEditMode(false);
      
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Refresh permissions
      await fetchPermissions();
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingUpdates([]);
    setEditMode(false);
    fetchPermissions();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          {t('loading') || 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>
          {error}
        </div>
        <button 
          onClick={fetchPermissions}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: 'var(--accent)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {t('retry') || 'Retry'}
        </button>
      </div>
    );
  }

  if (!permissions || permissions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>
          {t('permission_matrix') || 'Permission Matrix'}
        </h2>
        <p>{t('no_permissions_configured') || 'No permissions configured'}</p>
      </div>
    );
  }

  const btnStyle = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', margin: 0 }}>
            {t('permission_matrix') || 'Permission Matrix'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
            {t('permission_matrix_description') || 'View and manage role-based access control for screens and operations'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={t('search_screens') || 'Search screens...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              minWidth: '220px'
            }}
          />
          <button
            onClick={expandAll}
            style={{ ...btnStyle, backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {t('expand_all') || 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            style={{ ...btnStyle, backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {t('collapse_all') || 'Collapse All'}
          </button>
          {editMode ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  ...btnStyle,
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {t('permission_matrix_cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || pendingUpdates.length === 0}
                style={{
                  ...btnStyle,
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  cursor: (saving || pendingUpdates.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (saving || pendingUpdates.length === 0) ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : (t('permission_matrix_save') || 'Save Changes')}
                {pendingUpdates.length > 0 && ` (${pendingUpdates.length})`}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              style={{
                ...btnStyle,
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: '1px solid var(--accent)'
              }}
            >
              {t('permission_matrix_edit') || 'Edit Permissions'}
            </button>
          )}
        </div>
      </div>

      {/* Role Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
          {t('filter_by_role') || 'Filter by role:'}
        </span>
        <button
          onClick={() => setRoleFilter(null)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            border: `1px solid ${roleFilter === null ? 'var(--accent)' : 'var(--border)'}`,
            backgroundColor: roleFilter === null ? 'var(--accent)' : 'var(--surface)',
            color: roleFilter === null ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}
        >
          {t('all_roles') || 'All'}
        </button>
        {allRoles.map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? null : role)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              border: `1px solid ${roleFilter === role ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: roleFilter === role ? 'var(--accent)' : 'var(--surface)',
              color: roleFilter === role ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            {roleDisplayNames[role]}
          </button>
        ))}
      </div>

      {saveMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--success)',
          color: 'white',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {saveMessage}
        </div>
      )}

      {/* Permission Tree — Grouped by Category */}
      {categoryNames.map(cat => {
        const screens = groupedPermissions[cat];
        const isCatExpanded = expandedCategories.has(cat);
        const pendingCount = pendingCountByCategory[cat] || 0;

        return (
          <div key={cat} style={{ marginBottom: '1.5rem' }}>
            {/* Category Header */}
            <div
              onClick={() => toggleCategory(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--header-bg)',
                borderRadius: '6px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{isCatExpanded ? '▼' : '▶'}</span>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', textTransform: 'capitalize' }}>
                {categoryDisplayNames[cat] || cat}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ({screens.length} {screens.length === 1 ? 'screen' : 'screens'})
              </span>
              {pendingCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '0.1rem 0.5rem',
                  fontSize: '0.7rem',
                  fontWeight: '700'
                }}>
                  {pendingCount} pending
                </span>
              )}
            </div>

            {/* Screens in Category */}
            {isCatExpanded && screens.map(screen => {
              const isScreenExpanded = expandedScreens.has(screen.id);
              return (
                <div
                  key={screen.id}
                  style={{
                    marginTop: '0.5rem',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Screen Header */}
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--surface)',
                      borderBottom: isScreenExpanded ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => toggleScreen(screen.id)}
                  >
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {screen.name}
                      </span>
                      {screen.description && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          — {screen.description}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      {isScreenExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Operations */}
                  {isScreenExpanded && (
                    <div style={{ padding: '0.75rem' }}>
                      {screen.operations.map(operation => (
                        <div
                          key={operation.id}
                          style={{
                            marginBottom: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--surface)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{operation.name}</strong>
                            {operation.description && (
                              <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                — {operation.description}
                              </span>
                            )}
                          </div>

                          {/* Role Permissions Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${allRoles.length}, 1fr)`,
                            gap: '0.5rem'
                          }}>
                            {allRoles.map(role => {
                              if (roleFilter && roleFilter !== role) return null;
                              const perm = operation.permissions.find(p => p.role === role);
                              const allowed = perm ? perm.allowed : false;
                              const hasPendingUpdate = pendingUpdates.some(
                                u => u.role === role && u.screenId === screen.id && u.operationId === operation.id
                              );

                              return (
                                <div
                                  key={role}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.4rem',
                                    backgroundColor: hasPendingUpdate ? 'var(--accent-light)' : 'transparent',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.15s'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={allowed}
                                    disabled={!editMode}
                                    onChange={() => handleTogglePermission(screen.id, operation.id, role, allowed)}
                                    style={{
                                      cursor: editMode ? 'pointer' : 'default',
                                      width: '16px',
                                      height: '16px'
                                    }}
                                  />
                                  <span style={{ fontSize: '0.8rem' }}>
                                    {roleDisplayNames[role]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionMatrixPage;
