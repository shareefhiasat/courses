import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { EmailManager, useToast } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getAllowlist, updateAllowlist } from '@services/other/config';
import { getUsers } from '@services/business/userService';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon } from '@constants/iconTypes';
import { SUPER_ADMIN_EMAILS, isSuperAdminEmail } from '@constants/backendConstants';
import logger from '@utils/logger';

const AllowlistPage = () => {
  const { t } = useLang();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const [allowlist, setAllowlist] = useState({ allowedEmails: [], adminEmails: [], allowedStudents: [], superAdmins: [] });
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [needsCleanup, setNeedsCleanup] = useState(false);
  const [savedTimeDisplay, setSavedTimeDisplay] = useState('');
  const [users, setUsers] = useState([]);
  
  // Optimistic update with instant save
  const saveChanges = useCallback(async (newAllowlist, showSuccessMessage = false) => {
    setSaving(true);
    try {
      const result = await updateAllowlist(newAllowlist);
      if (result.success) {
        const now = new Date();
        setLastSavedTime(now);
        setSavedTimeDisplay('Just saved');
        if (showSuccessMessage) {
          toast?.showSuccess('Changes saved successfully!');
        }
        logger.info('Allowlist saved successfully');
      } else {
        logger.error('Save failed:', result.error);
        toast?.showError('Failed to save changes: ' + result.error);
        // Revert to previous state on error
        const prevResult = await getAllowlist();
        if (prevResult.success) {
          setAllowlist(prevResult.data || { allowedEmails: [], adminEmails: [] });
        }
      }
    } catch (error) {
      logger.error('Save error:', error);
      
      // Check for permission errors specifically
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        const permissionError = isSuperAdmin && user?.email && !allowlist.superAdmins?.includes(user.email)
          ? `Permission Error: Your email (${user.email}) is not in the allowlist superAdmins array. ` +
            `You need to be added to the superAdmins array by an existing super admin to make changes. ` +
            `Alternatively, if the allowlist structure needs cleanup, ask an existing super admin to run the cleanup.`
          : `Permission Error: You don't have permission to modify the allowlist. ` +
            `Only super admins can modify the allowlist configuration.`;
        
        toast?.showError(permissionError);
      } else {
        toast?.showError('Failed to save changes: ' + error.message);
      }
      
      // Revert to previous state on error
      try {
        const prevResult = await getAllowlist();
        if (prevResult.success) {
          setAllowlist(prevResult.data || { allowedEmails: [], adminEmails: [] });
        }
      } catch (revertError) {
        logger.error('Failed to revert changes:', revertError);
      }
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Instant save on any change
  const handleEmailsChange = useCallback(async (newEmails, type) => {
    // Prevent multiple simultaneous saves
    if (saving) return;
    
    const newAllowlist = { 
      ...allowlist, 
      [type]: newEmails 
    };
    
    // Update UI immediately (optimistic update)
    setAllowlist(newAllowlist);
    
    // Save immediately in background
    saveChanges(newAllowlist);
  }, [allowlist, saveChanges, saving]);

  const handleAllowlistSave = async () => {
    await saveChanges(allowlist, true);
  };

  
  // Helper function to get student number by email
  const getStudentNumber = useCallback((email) => {
    const user = users.find(u => u.email === email);
    return user?.studentNumber || null;
  }, [users]);

  // Cleanup function to fix allowlist structure
  const cleanupAllowlistStructure = useCallback((currentAllowlist) => {
    const cleaned = { ...currentAllowlist };
    let changes = [];
    
    // Initialize allowedStudents if it doesn't exist
    if (!cleaned.allowedStudents) {
      cleaned.allowedStudents = [];
      changes.push('Created allowedStudents array');
    }
    
    // Move super admin emails from adminEmails to only be in superAdmins
    SUPER_ADMIN_EMAILS.forEach(superAdminEmail => {
      if (cleaned.adminEmails?.includes(superAdminEmail)) {
        cleaned.adminEmails = cleaned.adminEmails.filter(email => email !== superAdminEmail);
        changes.push(`Moved ${superAdminEmail} from adminEmails to superAdmins only`);
      }
    });
    
    // Move all emails from allowedEmails to allowedStudents (for new structure)
    if (cleaned.allowedEmails?.length > 0) {
      const studentEmails = cleaned.allowedEmails.filter(email => !isSuperAdminEmail(email));
      cleaned.allowedStudents = [...new Set([...cleaned.allowedStudents, ...studentEmails])];
      cleaned.allowedEmails = []; // Clear legacy array
      changes.push(`Moved ${studentEmails.length} emails from allowedEmails to allowedStudents`);
    }
    
    // Ensure superAdmins array exists and contains all super admin emails
    if (!cleaned.superAdmins) {
      cleaned.superAdmins = [...SUPER_ADMIN_EMAILS];
      changes.push('Created superAdmins array with default super admin emails');
    } else {
      // Add any missing super admin emails
      SUPER_ADMIN_EMAILS.forEach(superAdminEmail => {
        if (!cleaned.superAdmins.includes(superAdminEmail)) {
          cleaned.superAdmins.push(superAdminEmail);
          changes.push(`Added ${superAdminEmail} to superAdmins`);
        }
      });
    }
    
    return { cleaned, changes };
  }, []);

  // Auto-cleanup detection
  useEffect(() => {
    if (allowlist && (allowlist.allowedEmails?.length > 0 || 
        SUPER_ADMIN_EMAILS.some(email => allowlist.adminEmails?.includes(email)))) {
      setNeedsCleanup(true);
    } else {
      setNeedsCleanup(false);
    }
  }, [allowlist]);

  // Execute cleanup function
  const executeCleanup = useCallback(async () => {
    const { cleaned, changes } = cleanupAllowlistStructure(allowlist);
    
    logger.info('🧹 ALLOWLIST: Executing cleanup', { changes });
    
    const result = await saveChanges(cleaned, true);
    if (result.success) {
      toast?.showSuccess(`✅ Allowlist structure cleaned up!\n\nChanges made:\n${changes.join('\n')}\n\nThe UI will now show the correct sections.`);
      setNeedsCleanup(false);
    }
  }, [allowlist, cleanupAllowlistStructure, saveChanges, toast]);

  // Create user lookup map for EmailManager
  const userLookupMap = useCallback(() => {
    const map = {};
    users.forEach(user => {
      if (user.studentNumber) {
        map[user.email] = user.studentNumber;
      }
    });
    return map;
  }, [users]);

  // Group emails by role
  const groupEmailsByRole = useCallback(() => {
    const roleGroups = {
      [ROLE_STRINGS.STUDENT]: [],
      [ROLE_STRINGS.INSTRUCTOR]: [],
      [ROLE_STRINGS.HR]: [],
      [ROLE_STRINGS.ADMIN]: [],
      [ROLE_STRINGS.SUPER_ADMIN]: [],
      'unknown': []
    };

    // Helper function to categorize an email based on actual user data and allowlist context
    const categorizeEmail = (email, userList, allowlistContext) => {
      const user = userList.find(u => u.email === email);
      
      // If user exists and has a role, use that role
      if (user && user.role) {
        // Special case: Super admin emails with multiple roles - show as Super Admin (highest priority)
        if (isSuperAdminEmail(email)) {
          return ROLE_STRINGS.SUPER_ADMIN;
        }
        return user.role;
      }
      
      // Special case: Super admin emails are always super admin even if not in arrays
      if (isSuperAdminEmail(email)) {
        return ROLE_STRINGS.SUPER_ADMIN;
      }
      
      // If no user record, determine role based on which allowlist array the email is in
      if (allowlistContext.superAdmins?.includes(email)) {
        return ROLE_STRINGS.SUPER_ADMIN;
      }
      if (allowlistContext.allowedStudents?.includes(email)) {
        return ROLE_STRINGS.STUDENT;
      }
      if (allowlistContext.adminEmails?.includes(email)) {
        // For emails in adminEmails without user records, we can't determine exact role
        // Could be HR, Admin, or Instructor - show as unknown until they sign up
        return 'unknown';
      }
      if (allowlistContext.allowedEmails?.includes(email)) {
        // Legacy support - treat as student
        return ROLE_STRINGS.STUDENT;
      }
      
      return 'unknown';
    };

    // Process allowed students (new dedicated array)
    (allowlist.allowedStudents || []).forEach(email => {
      const role = categorizeEmail(email, users, allowlist);
      if (roleGroups[role]) {
        roleGroups[role].push(email);
      } else {
        roleGroups.unknown.push(email);
      }
    });

    // Process allowed emails (legacy support - should be students, but check actual role)
    (allowlist.allowedEmails || []).forEach(email => {
      const role = categorizeEmail(email, users, allowlist);
      if (roleGroups[role]) {
        roleGroups[role].push(email);
      } else {
        roleGroups.unknown.push(email);
      }
    });

    // Process admin emails (regular admins, HR, instructors)
    (allowlist.adminEmails || []).forEach(email => {
      const role = categorizeEmail(email, users, allowlist);
      if (roleGroups[role]) {
        roleGroups[role].push(email);
      } else {
        roleGroups.unknown.push(email);
      }
    });

    // Process super admins (highest priority)
    (allowlist.superAdmins || []).forEach(email => {
      const role = categorizeEmail(email, users, allowlist);
      // Always treat as super admin regardless of user record
      roleGroups[ROLE_STRINGS.SUPER_ADMIN].push(email);
    });

    // Special case: Always include super admin emails
    SUPER_ADMIN_EMAILS.forEach(superAdminEmail => {
      if (!roleGroups[ROLE_STRINGS.SUPER_ADMIN].includes(superAdminEmail)) {
        roleGroups[ROLE_STRINGS.SUPER_ADMIN].push(superAdminEmail);
      }
    });

    return roleGroups;
  }, [allowlist, users]);

  // Helper function to convert hex to rgba
  const hexToRgba = useCallback((hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : 
      `rgba(0, 0, 0, ${alpha})`;
  }, []);

  // Helper function to get role display info
  const getRoleDisplayInfo = useCallback((role) => {
    const roleInfo = {
      [ROLE_STRINGS.STUDENT]: {
        title: t('students', 'Students', 'الطلاب'),
        color: '#10b981',
        icon: getThemedIcon('user_role', 'student'),
        description: t('student_invitations', 'Student invitations - includes allowedStudents and allowedEmails arrays', 'دعوات الطلاب - تشمل مصفوفات allowedStudents و allowedEmails')
      },
      [ROLE_STRINGS.INSTRUCTOR]: {
        title: t('instructors', 'Instructors', 'المدرسون'),
        color: '#3b82f6',
        icon: getThemedIcon('user_role', 'instructor'),
        description: t('instructor_invitations', 'Instructor invitations', 'دعوات المدرسين')
      },
      [ROLE_STRINGS.HR]: {
        title: t('hr_staff', 'HR Staff', 'موظفو الموارد البشرية'),
        color: '#8b5cf6',
        icon: getThemedIcon('user_role', 'hr'),
        description: t('hr_invitations', 'HR invitations', 'دعوات الموارد البشرية')
      },
      [ROLE_STRINGS.ADMIN]: {
        title: t('administrators', 'Administrators', 'المسؤولون'),
        color: '#f59e0b',
        icon: getThemedIcon('user_role', 'admin'),
        description: t('admin_invitations', 'Admin invitations', 'دعوات المسؤولين')
      },
      [ROLE_STRINGS.SUPER_ADMIN]: {
        title: t('super_administrators', 'Super Administrators', 'المسؤولون الخارقون'),
        color: '#ef4444',
        icon: getThemedIcon('user_role', 'superadmin'),
        description: t('super_admin_invitations', 'Super Admin invitations', 'دعوات المسؤولين الخارقين')
      },
      'unknown': {
        title: t('pending_role_assignment', 'Pending Role Assignment', 'في انتظار تعيين الدور'),
        color: '#6b7280',
        icon: getThemedIcon('ui', 'help'),
        description: t('pending_invitations', 'Invited users who haven\'t signed up yet, or admin emails without specific role assignment', 'المستخدمون المدعوون الذين لم يسجلوا بعد، أو رسائل البريد الإلكتروني للمسؤولين بدون تحديد دور محدد')
      }
    };
    return roleInfo[role] || roleInfo.unknown;
  }, [t]);

  // Render role-based email groups
  const renderRoleGroups = useCallback(() => {
    const roleGroups = groupEmailsByRole();
    const userMap = userLookupMap();
    
    // Calculate totals for summary
    const totalEmails = Object.values(roleGroups).reduce((sum, emails) => sum + emails.length, 0);
    
    return (
      <>
        {/* Summary Section */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'var(--panel, #f8f9fa)',
          border: '1px solid var(--border, #e0e0e0)',
          borderRadius: '12px'
        }}>
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            color: 'var(--text, #333)',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {getThemedIcon('ui', 'bar_chart3')} {t('allowlist_summary', 'Allowlist Summary', 'ملخص قائمة السماح')}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(roleGroups)
              .sort(([roleA], [roleB]) => {
                // Super admins always first, then normal order
                if (roleA === ROLE_STRINGS.SUPER_ADMIN) return -1;
                if (roleB === ROLE_STRINGS.SUPER_ADMIN) return 1;
                
                const roleOrder = [
                  ROLE_STRINGS.STUDENT,
                  ROLE_STRINGS.INSTRUCTOR, 
                  ROLE_STRINGS.HR,
                  ROLE_STRINGS.ADMIN,
                  'unknown'
                ];
                return roleOrder.indexOf(roleA) - roleOrder.indexOf(roleB);
              })
              .map(([role, emails]) => {
                const roleInfo = getRoleDisplayInfo(role);
                const isSuperAdmin = role === ROLE_STRINGS.SUPER_ADMIN;
                
                return (
                  <div key={role} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isSuperAdmin ? '1rem' : '0.75rem',
                    background: isSuperAdmin 
                      ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                      : hexToRgba(roleInfo.color, 0.1),
                    border: isSuperAdmin 
                      ? '2px solid rgba(220, 38, 38, 0.3)'
                      : `1px solid ${hexToRgba(roleInfo.color, 0.2)}`,
                    borderRadius: isSuperAdmin ? '12px' : '8px',
                    position: isSuperAdmin ? 'relative' : 'static',
                    overflow: 'hidden'
                  }}>
                    {isSuperAdmin && (
                      <div style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '0.625rem',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {getThemedIcon('user_role', 'superadmin', 10, 'white')}
                      </div>
                    )}
                    <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{roleInfo.icon}</span>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: roleInfo.color,
                        fontSize: '0.9rem'
                      }}>
                        {emails.length}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary, #666)'
                      }}>
                        {roleInfo.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'var(--color-primary-light, rgba(16, 185, 129, 0.1))',
              border: '1px solid var(--color-primary-border, rgba(16, 185, 129, 0.2))',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{getThemedIcon('ui', 'message_square')}</span>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--color-primary, #10b981)',
                  fontSize: '0.9rem'
                }}>
                  {totalEmails}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary, #666)'
                }}>
                  {t('total_invitations', 'Total', 'الإجمالي')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Groups */}
        {Object.entries(roleGroups)
          .sort(([roleA], [roleB]) => {
            // Super admins always first
            if (roleA === ROLE_STRINGS.SUPER_ADMIN) return -1;
            if (roleB === ROLE_STRINGS.SUPER_ADMIN) return 1;
            
            // Sort roles: Students, Instructors, HR, Admins, Unknown
            const roleOrder = [
              ROLE_STRINGS.STUDENT,
              ROLE_STRINGS.INSTRUCTOR, 
              ROLE_STRINGS.HR,
              ROLE_STRINGS.ADMIN,
              'unknown'
            ];
            return roleOrder.indexOf(roleA) - roleOrder.indexOf(roleB);
          })
          .map(([role, emails]) => {
            const roleInfo = getRoleDisplayInfo(role);
            const isSuperAdmin = role === ROLE_STRINGS.SUPER_ADMIN;
            
            return (
              <div key={role} className="role-group" style={{ marginBottom: '2rem' }}>
                <div className="role-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: isSuperAdmin ? '1rem' : '0.75rem',
                  background: isSuperAdmin 
                    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)'
                    : hexToRgba(roleInfo.color, 0.15),
                  border: isSuperAdmin 
                    ? '2px solid rgba(220, 38, 38, 0.4)'
                    : `1px solid ${hexToRgba(roleInfo.color, 0.3)}`,
                  borderRadius: isSuperAdmin ? '12px' : '8px',
                  position: isSuperAdmin ? 'relative' : 'static'
                }}>
                  {isSuperAdmin && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '0.625rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {getThemedIcon('user_role', 'superadmin', 12, 'white')}
                    </div>
                  )}
                  <span style={{ fontSize: isSuperAdmin ? '1.75rem' : '1.5rem', marginRight: '0.5rem' }}>{roleInfo.icon}</span>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      color: roleInfo.color,
                      fontSize: isSuperAdmin ? '1.25rem' : '1.1rem',
                      fontWeight: isSuperAdmin ? '700' : '600'
                    }}>
                      {roleInfo.title} ({emails.length})
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      color: 'var(--text-secondary, #666)',
                      fontSize: '0.85rem'
                    }}>
                      {roleInfo.description}
                    </p>
                  </div>
                </div>
                
                <div className="emails-list" style={{
                  minHeight: '60px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--border, #e0e0e0)',
                  borderRadius: '6px',
                  background: 'var(--panel, white)',
                  padding: '1rem'
                }}>
                  {emails.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary, #666)', fontStyle: 'italic' }}>
                      {t('no_emails_in_category', 'No emails in this category')}
                    </div>
                  ) : (
                    <div className="emails-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {emails.map((email, index) => {
                        const studentNumber = userMap[email];
                        return (
                          <div key={index} className="email-tag" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: hexToRgba(roleInfo.color, 0.15),
                            border: `1px solid ${hexToRgba(roleInfo.color, 0.3)}`,
                            borderRadius: '20px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s',
                            minWidth: '0'
                          }}>
                            <div className="email-content" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              minWidth: '0',
                              flex: 1,
                              marginRight: '0.5rem'
                            }}>
                              <span className="email-text" style={{
                                color: roleInfo.color,
                                fontWeight: '500',
                                wordBreak: 'break-all'
                              }}>
                                {email}
                              </span>
                              {studentNumber && (
                                <span className="student-number" style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary, #666)',
                                  fontWeight: '600',
                                  background: 'var(--chip-bg, #f5f5f5)',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '8px',
                                  marginTop: '0.2rem',
                                  display: 'inline-block'
                                }}>
                                  #{studentNumber}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                // Remove email from appropriate list
                                const isAllowedStudent = allowlist.allowedStudents?.includes(email);
                                const isLegacyStudent = allowlist.allowedEmails?.includes(email);
                                const isAdminEmail = allowlist.adminEmails?.includes(email);
                                const isSuperAdminEmail = allowlist.superAdmins?.includes(email);
                                
                                let newAllowlist = { ...allowlist };
                                if (isAllowedStudent) {
                                  newAllowlist.allowedStudents = allowlist.allowedStudents.filter(e => e !== email);
                                } else if (isLegacyStudent) {
                                  newAllowlist.allowedEmails = allowlist.allowedEmails.filter(e => e !== email);
                                } else if (isAdminEmail) {
                                  newAllowlist.adminEmails = allowlist.adminEmails.filter(e => e !== email);
                                } else if (isSuperAdminEmail) {
                                  newAllowlist.superAdmins = allowlist.superAdmins.filter(e => e !== email);
                                }
                                
                                setAllowlist(newAllowlist);
                                saveChanges(newAllowlist);
                              }}
                              className="remove-btn"
                              title={t('remove_email', 'Remove email')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#d32f2f',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '1rem',
                                lineHeight: '1',
                                transition: 'all 0.3s',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#d32f2f';
                                e.target.style.color = 'white';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = 'none';
                                e.target.style.color = '#d32f2f';
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </>
    );
  }, [groupEmailsByRole, getRoleDisplayInfo, userLookupMap, allowlist, saveChanges, hexToRgba, t]);
  useEffect(() => {
    if (!lastSavedTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now - lastSavedTime;
      const seconds = Math.floor(diff / 1000);
      
      let displayText;
      if (seconds < 10) {
        displayText = 'Just saved';
      } else if (seconds < 60) {
        displayText = `Saved ${seconds}s ago`;
      } else if (seconds < 3600) {
        displayText = `Saved ${Math.floor(seconds / 60)}m ago`;
      } else {
        displayText = `Saved ${lastSavedTime.toLocaleTimeString()}`;
      }
      
      setSavedTimeDisplay(displayText);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isSuperAdmin) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        const [allowlistResult, usersResult] = await Promise.all([
          getAllowlist(),
          getUsers().catch(error => {
            logger.warn('AllowlistPage: Failed to load users', { error: error.message });
            return { success: false, data: [] };
          })
        ]);
        
        if (allowlistResult.success) {
          const allowlistData = allowlistResult.data || { allowedEmails: [], adminEmails: [], allowedStudents: [], superAdmins: [] };
          setAllowlist(allowlistData);
          
                      
            // AUTO-FIX DISABLED - To prevent infinite loops
// // Automatically attempt to fix permissions after a short delay
// // This prevents the UI from getting stuck in permission errors
// // Only attempt once per page load to prevent infinite loops
// if (!autoFixAttempted.current) {
//   autoFixAttempted.current = true;
//   setTimeout(async () => {
//     logger.info('🔧 ALLOWLIST: Auto-attempting to fix permissions...');
//     try {
//       const result = await fixAllowlistPermissions();
//       
//       if (result.success) {
//         toast?.showSuccess('✅ Permissions automatically fixed! Reloading...');
//         logger.info('✅ ALLOWLIST: Auto-fix successful');
//         
//         // Reload the allowlist to get updated data
//         const allowlistResult = await getAllowlist();
//         if (allowlistResult.success) {
//           setAllowlist(allowlistResult.data || { allowedEmails: [], adminEmails: [], allowedStudents: [], superAdmins: [] });
//           setHasPermissionIssue(false);
//           setNeedsCleanup(false);
//         }
//       } else {
//         logger.error('❌ ALLOWLIST: Auto-fix failed', result);
//         toast?.showError(
//           `Auto-fix failed: ${result.error}. Please click the "Fix Permissions" button manually.`
//         );
//       }
//     } catch (autoFixError) {
//       logger.error('❌ ALLOWLIST: Auto-fix error', autoFixError);
//       toast?.showError(
//         'Auto-fix failed. Please click the "Fix Permissions" button below.'
//       );
//     }
//   }, 2000); // Wait 2 seconds before attempting auto-fix
// }
                  } else {
          toast.error(t('allowlist_failed_to_load'));
        }

        if (usersResult.success) {
          setUsers(usersResult.data || []);
          logger.info('AllowlistPage: Loaded users for student number lookup', { count: usersResult.data?.length || 0 });
        }
      } catch (error) {
        console.error(t('allowlist_error_loading'), error);
        toast.error(t('allowlist_error_loading'));
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, isSuperAdmin, startLoading, toast, cleanupAllowlistStructure, SUPER_ADMIN_EMAILS]);

  return (
    <div className="allowlist-tab">
      {/* Instructions and Guidance */}
      <div style={{ 
        background: 'var(--background-secondary, #f8fafc)', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid var(--border-primary, #e5e7eb)'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary, #111827)' }}>
          {t('email_invitation_management', 'Email Invitation Management')}
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)', lineHeight: '1.5' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>{t('how_it_works', 'How it works')}:</strong> {t('how_it_works_description', 'Add emails to invite users. They\'ll receive automatic role assignment when they sign up.')}
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>{t('role_assignment', 'Role Assignment')}:</strong> {t('role_assignment_description', 'Students → allowedStudents | Admins/HR/Instructors → adminEmails | Super Admins → superAdmins')}
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>{t('next_steps', 'Next Steps')}:</strong> {t('next_steps_description', 'After adding emails, ask users to check their inbox and sign up to activate their accounts.')}
          </p>
          <p style={{ margin: '0' }}>
            <strong>{t('pro_tip', 'Pro Tip')}:</strong> {t('pro_tip_description', 'Use the Users page to invite users with detailed information (student numbers, etc.)')}
          </p>
        </div>
      </div>

      {/* Cleanup Alert */}
      {needsCleanup && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{getThemedIcon('ui', 'warning')}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontWeight: '600' }}>
                {getThemedIcon('ui', 'alert_triangle')} {t('structure_cleanup_needed', 'Structure Cleanup Needed')}
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                {t('cleanup_description', 'Your allowlist needs to be updated to the new structure. This will:')}
              </p>
              <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <li>{t('cleanup_move_super_admins', 'Move super admin emails from adminEmails to superAdmins only')}</li>
                <li>{t('cleanup_move_students', 'Move students from allowedEmails to allowedStudents')}</li>
                <li>{t('cleanup_create_structure', 'Create proper array structure for new features')}</li>
                <li>{t('cleanup_enable_ui', 'Enable super admin special section in UI')}</li>
              </ul>
              <button
                onClick={executeCleanup}
                disabled={saving}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  fontSize: '0.875rem'
                }}
              >
                {saving ? `${getThemedIcon('ui', 'loader')} ${t('cleaning_up', 'Cleaning up...')}` : `${getThemedIcon('ui', 'wrench')} ${t('execute_cleanup', 'Execute Cleanup')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {renderRoleGroups()}
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary, #666)' }}>
          {saving ? (
            <span style={{ color: 'var(--color-primary, #10b981)' }}>
              {getThemedIcon('ui', 'save')} {t('saving', 'Saving...')}
            </span>
          ) : savedTimeDisplay ? (
            <span style={{ color: 'var(--color-success, #22c55e)' }}>
              {getThemedIcon('ui', 'check_circle')} {savedTimeDisplay}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted, #9ca3af)' }}>
              {t('ready_to_edit', 'Ready to edit')}
            </span>
          )}
        </div>
        <button 
          onClick={handleAllowlistSave} 
          className="submit-btn" 
          disabled={saving} 
          style={{ 
            position: 'relative', 
            opacity: saving ? 0.7 : 1,
            background: 'var(--color-primary, #10b981)'
          }}
        >
          {saving && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
          <span style={{ opacity: saving ? 0 : 1 }}>
            {t('allowlist_save_changes')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AllowlistPage;
