import React, { useState, useMemo } from 'react';
import { ROLE_STRINGS } from '@utils/userUtils';
import { SCREEN_ROLE_ACCESS } from '@constants/screenDefinitions';
import { useLang } from '@contexts/LangContext';

/**
 * Permission Matrix Visualization Page
 * 
 * PURPOSE: Visualize role-based access control across screens and operations
 * Displays a matrix showing which roles have access to which screens
 */

const PermissionMatrixPage = () => {
  const { t, lang } = useLang();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  // Get all screens from SCREEN_ROLE_ACCESS
  const allScreens = useMemo(() => Object.keys(SCREEN_ROLE_ACCESS).sort(), []);
  
  // Get all roles
  const allRoles = useMemo(() => [ROLE_STRINGS.SUPER_ADMIN, ROLE_STRINGS.ADMIN, ROLE_STRINGS.HR, ROLE_STRINGS.INSTRUCTOR, ROLE_STRINGS.STUDENT], []);

  // Role display names
  const roleDisplayNames = {
    [ROLE_STRINGS.SUPER_ADMIN]: 'Super Admin',
    [ROLE_STRINGS.ADMIN]: 'Admin',
    [ROLE_STRINGS.HR]: 'HR',
    [ROLE_STRINGS.INSTRUCTOR]: 'Instructor',
    [ROLE_STRINGS.STUDENT]: 'Student'
  };

  // Group screens by category (based on naming convention)
  const groupedScreens = useMemo(() => {
    const groups = {};
    allScreens.forEach(screen => {
      const category = screen.includes('-') ? screen.split('-')[0] : 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(screen);
    });
    return groups;
  }, [allScreens]);

  // Check if role has access to screen
  const hasAccess = (role, screen) => {
    const allowedRoles = SCREEN_ROLE_ACCESS[screen] || [];
    return allowedRoles.includes(role);
  };

  // Count total permissions per role
  const permissionCounts = useMemo(() => {
    const counts = {};
    allRoles.forEach(role => {
      counts[role] = allScreens.filter(screen => hasAccess(role, screen)).length;
    });
    return counts;
  }, [allRoles, allScreens]);

  // Count total permissions per screen
  const screenCounts = useMemo(() => {
    const counts = {};
    allScreens.forEach(screen => {
      counts[screen] = allRoles.filter(role => hasAccess(role, screen)).length;
    });
    return counts;
  }, [allScreens, allRoles]);

  return (
    <div className="permission-matrix-page" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '600' }}>
        {t('permission_matrix') || 'Permission Matrix'}
      </h1>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {allRoles.map(role => (
          <div 
            key={role}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--panel)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {roleDisplayNames[role]}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--primary)' }}>
              {permissionCounts[role]}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Screens Accessible
            </div>
          </div>
        ))}
      </div>

      {/* Full Matrix */}
      <div style={{ 
        overflowX: 'auto', 
        backgroundColor: 'var(--panel)', 
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid var(--border)'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          minWidth: '800px' 
        }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                borderBottom: '2px solid var(--border)',
                backgroundColor: 'var(--panel)',
                position: 'sticky',
                left: 0
              }}>
                Screen
              </th>
              {allRoles.map(role => (
                <th 
                  key={role}
                  style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center', 
                    borderBottom: '2px solid var(--border)',
                    minWidth: '120px'
                  }}
                >
                  {roleDisplayNames[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedScreens).map(([category, screens]) => (
              <React.Fragment key={category}>
                <tr>
                  <td 
                    colSpan={allRoles.length + 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {category}
                  </td>
                </tr>
                {screens.map(screen => (
                  <tr 
                    key={screen}
                    style={{
                      backgroundColor: selectedScreen === screen ? 'var(--accent-light)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedScreen(selectedScreen === screen ? null : screen)}
                  >
                    <td style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid var(--border)',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      {screen}
                    </td>
                    {allRoles.map(role => (
                      <td 
                        key={`${screen}-${role}`}
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center', 
                          borderBottom: '1px solid var(--border)'
                        }}
                      >
                        {hasAccess(role, screen) ? (
                          <span style={{ 
                            color: '#10b981', 
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </span>
                        ) : (
                          <span style={{ 
                            color: '#ef4444', 
                            fontSize: '1.2rem'
                          }}>
                            ✗
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '1.5rem', 
        display: 'flex', 
        gap: '2rem',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
          <span>Has Access</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>✗</span>
          <span>No Access</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Click on a screen row to highlight</span>
        </div>
      </div>

      {/* Screen Details Panel */}
      {selectedScreen && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--panel)',
          borderRadius: '8px',
          border: '1px solid var(--accent)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
            {selectedScreen}
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Accessible by:</strong>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {allRoles
                .filter(role => hasAccess(role, selectedScreen))
                .map(role => (
                  <span
                    key={role}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {roleDisplayNames[role]}
                  </span>
                ))}
            </div>
          </div>
          <div>
            <strong>Total roles with access:</strong> {screenCounts[selectedScreen]}/{allRoles.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrixPage;
