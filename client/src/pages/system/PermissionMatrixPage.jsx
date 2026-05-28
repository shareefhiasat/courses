import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
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
  const { isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Role display names
  const roleDisplayNames = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    hr: 'HR',
    instructor: 'Instructor',
    student: 'Student'
  };

  const allRoles = useMemo(() => ['super_admin', 'admin', 'hr', 'instructor', 'student'], []);

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;
    
    const query = searchQuery.toLowerCase();
    return permissions.filter(screen => {
      const screenName = (screen.nameEn || screen.nameAr || '').toLowerCase();
      const screenId = (screen.screenId || '').toLowerCase();
      
      // Check if screen matches
      if (screenName.includes(query) || screenId.includes(query)) return true;
      
      // Check if any operation matches
      const hasMatchingOperation = screen.operations.some(op => {
        const opName = (op.nameEn || op.nameAr || '').toLowerCase();
        const opKey = (op.operationKey || '').toLowerCase();
        return opName.includes(query) || opKey.includes(query);
      });
      
      return hasMatchingOperation;
    });
  }, [permissions, searchQuery]);

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
      const token = localStorage.getItem('keycloak_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1'}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
    fetchPermissions(); // Revert optimistic updates
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', margin: 0 }}>
            {t('permission_matrix') || 'Permission Matrix'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
            {t('permission_matrix_description') || 'View and manage role-based access control for screens and operations'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
              minWidth: '250px'
            }}
          />
            {editMode && (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
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
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (saving || pendingUpdates.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (saving || pendingUpdates.length === 0) ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : (t('permission_matrix_save') || 'Save Changes')}
                  {pendingUpdates.length > 0 && ` (${pendingUpdates.length})`}
                </button>
              </>
            )}
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: '1px solid var(--accent)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('permission_matrix_edit') || 'Edit Permissions'}
              </button>
            )}
          </div>
      </div>

      {saveMessage && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--success)',
          color: 'white',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {saveMessage}
        </div>
      )}

      {/* Permission Tree */}
      {filteredPermissions.map(screen => (
        <div 
          key={screen.id}
          style={{ 
            marginBottom: '2rem',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}
        >
          {/* Screen Header */}
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--header-bg)',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => setSelectedScreen(selectedScreen === screen.id ? null : screen.id)}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                {screen.name}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {screen.description}
              </p>
            </div>
            <div style={{ fontSize: '1.25rem' }}>
              {selectedScreen === screen.id ? '▼' : '▶'}
            </div>
          </div>

          {/* Operations */}
          {selectedScreen === screen.id && (
            <div style={{ padding: '1rem' }}>
              {screen.operations.map(operation => (
                <div 
                  key={operation.id}
                  style={{ 
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>{operation.name}</strong>
                    {operation.description && (
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        - {operation.description}
                      </span>
                    )}
                  </div>
                  
                  {/* Role Permissions Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${allRoles.length}, 1fr)`, 
                    gap: '1rem' 
                  }}>
                    {allRoles.map(role => {
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
                            gap: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: hasPendingUpdate ? 'var(--accent-light)' : 'transparent',
                            borderRadius: '4px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allowed}
                            disabled={!editMode}
                            onChange={() => handleTogglePermission(screen.id, operation.id, role, allowed)}
                            style={{
                              cursor: editMode ? 'pointer' : 'default',
                              width: '18px',
                              height: '18px'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>
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
      ))}
    </div>
  );
};

export default PermissionMatrixPage;
