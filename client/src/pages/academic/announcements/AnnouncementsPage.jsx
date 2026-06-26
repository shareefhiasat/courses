import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useToast } from '@ui';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, getQatarNow } from '@utils/qatarDate';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { getPrograms } from '@services/business/programService.js';
import { getSubjects } from '@services/business/subjectService.js';
import { getClasses } from '@services/business/classService.js';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement as deleteAnnouncementService } from '@services/business/announcementService';
import { getAllPriorityTypes } from '@services/business/priorityTypesService.js';
// import { getAllTargetAudienceTypes } from '@services/business/targetAudienceService.js'; // Using constants instead
import { getUsers, getUserById } from '@services/business/userService';
// import { notificationGateway } from '@services/business/notificationGateway'; // Removed - notifications now handled by backend
import { getEnrollments } from '@services/business/enrollmentService';
// import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes'; // Removed - notifications now handled by backend
import { Button, ToggleSwitch, Select, Input, SimpleLoading, RichTextEditor } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { ProgramsSelect } from '@ui';
import { getLocalizedName, createDropdownOptions } from '@utils/languageHelpers';
// OLD: import { TARGET_AUDIENCE_TYPES, TARGET_AUDIENCE_OPTIONS, PRIORITY_TYPES, getPriorityColor, getPriorityCode } from '@constants';
// NOW: Using useLookupTypes hook for all lookup data
import { TARGET_AUDIENCE_TYPES, TARGET_AUDIENCE_OPTIONS, getPriorityColor, getPriorityCode } from '@constants';

/**
 * AnnouncementsPage - Announcements management page
 * 
 * Refactored to match ActivitiesPage patterns:
 * - Performance optimizations with refs and memoization
 * - Unified DeleteModal integration
 * - Qatar date utilities
 * - Proper logging and error handling
 * - Single continuous form (no tabs)
 */
const AnnouncementsPage = ({ isDashboardTab = false }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();

  const PRIORITY_TYPES = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
  };

  const toast = useToast();

  // Helper functions for icon mapping
  const getTargetAudienceIcon = (code) => {
    const iconMap = {
      'ALL': 'users',
      'STUDENTS': 'user',
      'INSTRUCTORS': 'graduation_cap',
      'ADMIN': 'shield',
      'PROGRAM': 'book_open',
      'CLASS': 'users'
    };
    return iconMap[code] || 'users';
  };

  const getPriorityIcon = (code) => {
    const iconMap = {
      'LOW': 'clock',
      'NORMAL': 'check_circle',
      'HIGH': 'alert_triangle',
      'URGENT': 'zap',
      'CRITICAL': 'x_circle'
    };
    return iconMap[code] || 'check_circle';
  };

  const getTargetAudienceValue = (targetAudienceId) => {
    // Reverse mapping from TARGET_AUDIENCE_TYPES
    const reverseMap = {
      1: 'all',         // ALL
      2: 'students',    // STUDENTS
      3: 'instructors', // INSTRUCTORS
      4: 'admin',       // ADMIN
      5: 'program',     // PROGRAM
      6: 'class'        // CLASS
    };
    return reverseMap[targetAudienceId] || 'all';
  };

  const isDark = theme === 'dark';
  
  // Internal state management
  const [announcements, setAnnouncements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [priorityTypes, setPriorityTypes] = useState([]);
  // Use TARGET_AUDIENCE_OPTIONS constants instead of API call
  const [announcementForm, setAnnouncementForm] = useState({
    id: '', title: '', titleEn: '', titleAr: '', contentEn: '',
    target: 'all', programId: '', subjectId: '', classId: '', featured: false,
    priorityId: PRIORITY_TYPES.NORMAL // Default to 'normal' priority
  });
  const [arabicContent, setArabicContent] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Filter state
  const [announcementProgramFilter, setAnnouncementProgramFilter] = useState('');
  const [announcementSubjectFilter, setAnnouncementSubjectFilter] = useState('');
  const [announcementClassFilter, setAnnouncementClassFilter] = useState('');
  const [announcementTitleEnFilter, setAnnouncementTitleEnFilter] = useState('');
  const [announcementTitleArFilter, setAnnouncementTitleArFilter] = useState('');
  const [announcementContentEnFilter, setAnnouncementContentEnFilter] = useState('');
  const [announcementContentArFilter, setAnnouncementContentArFilter] = useState('');
  
  const [emailOptions, setEmailOptions] = useState({
    sendEmail: false,
    emailLang: 'en'
  });
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `announcesTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.announce_filters'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="announce-form"]', content: t('tour.announce_add'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="announce-grid"]', content: t('tour.announce_grid'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="announce-grid"]', content: t('tour.announce_priority'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="announce-grid"]', content: t('tour.announce_edit'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="announce-grid"]', content: t('tour.announce_delete'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status } = data || {};
    if (status === 'finished' || status === 'skipped') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────
  const { startLoading } = useGlobalLoading();
  
  // Refs for text inputs — avoids re-rendering the whole page on every keystroke
  const titleRef = useRef(null);
  const titleArRef = useRef(null);

  // Data loading function
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setDataLoading(true);
    try {
      const [
        programsResult,
        subjectsResult,
        classesResult,
        usersResult,
        announcementsResult,
        priorityTypesResult
      ] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getUsers(),
        getAnnouncements(),
        getAllPriorityTypes()
      ]);
      
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (announcementsResult.success) setAnnouncements(announcementsResult.data || []);
      if (priorityTypesResult.success) setPriorityTypes(priorityTypesResult.data || []);
    } catch (err) {
      error('Error loading data:', err);
      toast?.showError(t('announcements_failed_to_load_data'));
    } finally {
      if (!isInitial) setDataLoading(false);
    }
  }, [toast, t]);

  // Load data on component mount with Global Loading
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_announcements') || 'Loading announcements...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setDataLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler functions
  const handleDropdownChange = useCallback((setter, field, resetFields = []) => {
    return (e) => {
      // Handle both event objects and direct values (like SubjectsPage fix)
      // ProgramsSelect now passes numbers, so we need to handle both string and number
      const value = e?.target?.value !== undefined ? e.target.value : e;
      
      setter(prev => {
        const newState = { ...prev, [field]: value };
        resetFields.forEach(resetField => {
          newState[resetField] = '';
        });
        return newState;
      });
    };
  }, []);

  const resetAnnouncementForm = useCallback(() => {
    setAnnouncementForm({
      id: '', title: '', titleEn: '', titleAr: '', contentEn: '',
      target: 'all', programId: '', subjectId: '', classId: '', featured: false,
      priorityId: PRIORITY_TYPES.NORMAL
    });
    setArabicContent('');
  }, []);

  const handleEmailOptionChange = useCallback((field, value) => {
    setEmailOptions(prev => ({ ...prev, [field]: value }));
  }, []);

  // Sync refs when editing an existing announcement
  useEffect(() => {
    if (titleRef.current) titleRef.current.value = announcementForm.titleEn || announcementForm.title || '';
    if (titleArRef.current) titleArRef.current.value = announcementForm.titleAr || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAnnouncement]);

  // Read text values from refs into form state before submit
  // content and content_ar are now controlled via state (WYSIWYG)
  const syncRefsToState = useCallback(() => {
    const titleEn = titleRef.current?.value ?? announcementForm.titleEn ?? announcementForm.title;
    return {
      title: titleEn,
      titleEn: titleEn,
      titleAr: titleArRef.current?.value ?? announcementForm.titleAr,
      contentEn: announcementForm.contentEn,
      contentAr: arabicContent,
    };
  }, [announcementForm, arabicContent]);

  const validateForm = useCallback(() => {
    const textValues = syncRefsToState();
    
    // Check if title is provided
    if (!textValues.title || textValues.title.trim() === '') {
      return false;
    }
    
    // Add any additional validation here if needed
    return true;
  }, [syncRefsToState]);

  const handleAnnouncementSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleAnnouncementSubmit');
    info('[DEBUG] Form state:', { 
      editingAnnouncement: editingAnnouncement?.docId, 
      isEditing: !!(editingAnnouncement && editingAnnouncement.docId && editingAnnouncement.docId !== 'new'),
      formValid: validateForm()
    });
    
    if (!validateForm()) {
      error('Form validation failed');
      console.timeEnd('[PERF] handleAnnouncementSubmit');
      return;
    }  
    setLoading(true);

    try {
      // Read text fields from refs (uncontrolled inputs)
      const textValues = syncRefsToState();
      info('[FORM] Text values from refs:', textValues);

      if (!textValues.title || textValues.title.trim() === '') {
        throw new Error(t('announcements_title_required'));
      }
      
      // Clean the announcement data - only include the fields we want
      // Use constants for target audience mapping
      const announcementData = {
        title: textValues.title.trim(),
        titleEn: textValues.titleEn,
        titleAr: textValues.titleAr,
        descriptionEn: textValues.contentEn?.trim() || '',
        descriptionAr: textValues.contentAr?.trim() || '',
        targetAudienceId: TARGET_AUDIENCE_TYPES[announcementForm.target] || TARGET_AUDIENCE_TYPES.global,
        programId: announcementForm.programId,
        subjectId: announcementForm.subjectId,
        classId: announcementForm.classId,
        featured: announcementForm.featured,
        priorityId: announcementForm.priorityId
      };

      info('🔍 Announcement data being sent:', announcementData);

      if (editingAnnouncement && (editingAnnouncement.docId || editingAnnouncement.id) && editingAnnouncement.docId !== 'new') {
        info('[DEBUG] Updating announcement:', { 
          id: editingAnnouncement.docId, 
          data: announcementData,
          user: user?.email
        });
        const updateResult = await updateAnnouncement(editingAnnouncement.docId || editingAnnouncement.id, announcementData, user, emailOptions);
        info('[DEBUG] Update result:', updateResult);
        
        if (updateResult.success) {
          toast?.showSuccess(t('announcements_updated_successfully'));
          
          // Update local announcements array instead of reloading
          setAnnouncements(prev => prev.map(a => 
            (a.docId || a.id) === (editingAnnouncement.docId || editingAnnouncement.id) 
              ? { ...a, ...announcementData, docId: editingAnnouncement.docId || editingAnnouncement.id }
              : a
          ));
        } else {
          throw new Error(updateResult.error || 'Update failed');
        }
      } else {
        info('[DEBUG] Creating new announcement:', { 
          data: announcementData,
          user: user?.email
        });
        const result = await addAnnouncement(announcementData, user);
        info('[DEBUG] Create result:', result);
        
        if (result.success) {
          info('🔍 [SAVE] Announcement created successfully with ID:', result.id);
          toast?.showSuccess(t('announcements_created_successfully'));
          
          // Add new announcement to local state immediately for UI feedback
          const newAnnouncement = {
            ...announcementData,
            docId: result.id,
            id: result.id
            // Note: Audit fields will be populated when data is refreshed
          };
          setAnnouncements(prev => [newAnnouncement, ...prev]);
          
          // Notifications are now handled by the backend announcement service
        } else {
          throw new Error(result.error || t('announcements_failed_to_create'));
        }
      }

      // Reset form and clear refs
      resetAnnouncementForm();
      if (titleRef.current) titleRef.current.value = '';
      if (titleArRef.current) titleArRef.current.value = '';
      setEditingAnnouncement(null);
      setEmailOptions({ sendEmail: false, emailLang: 'en' });
      await loadData();
    } catch (err) {
      error('Error saving announcement:', err);
      toast?.showError(err.message || t('announcements_error_saving'));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleAnnouncementSubmit');
    }
  }, [announcementForm, editingAnnouncement, user, toast, syncRefsToState, resetAnnouncementForm, emailOptions, loadData, t, validateForm]);

  const handleEditAnnouncement = useCallback((announcement) => {
    info('[DEBUG] Editing announcement:', { 
      id: announcement.docId || announcement.id,
      title: announcement.titleEn || announcement.title,
      priorityId: announcement.priorityId || announcement.priority?.id
    });
    
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      id: announcement.id || '',
      title: announcement.titleEn || announcement.title || '',
      titleEn: announcement.titleEn || announcement.title || '',
      titleAr: announcement.titleAr || '',
      contentEn: announcement.descriptionEn || announcement.contentEn || '',
      target: getTargetAudienceValue(announcement.targetAudienceId) || 'all',
      programId: announcement.programId || '',
      subjectId: announcement.subjectId || '',
      classId: announcement.classId || '',
      featured: announcement.featured || false,
      priorityId: announcement.priorityId || announcement.priority?.id || PRIORITY_TYPES.NORMAL
    });
    setArabicContent(announcement.descriptionAr || announcement.contentAr || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    if (titleRef.current) titleRef.current.value = '';
    if (titleArRef.current) titleArRef.current.value = '';
  }, [resetAnnouncementForm]);

  const auditColumns = useAuditGridColumns({ users });

  // Memoize columns to prevent re-renders
  const gridColumns = useMemo(() => [
    { 
      field: 'title_en', 
      headerName: t('announcements_title_en_header'), 
      flex: 1, 
      minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.titleEn || row.title || params?.value || '';
      },
      renderCell: (params) => {
        const title = params?.row?.titleEn || params?.row?.title || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    { 
      field: 'title_ar', 
      headerName: t('announcements_title_ar_header'), 
      flex: 1, 
      minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.titleAr || params?.value || '';
      },
      renderCell: (params) => {
        const title = params?.row?.titleAr || params?.row?.title || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    {
      field: 'priorityId', 
      headerName: t('priority') || 'Priority', 
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.priorityId || row.priority?.id || null;
      },
      renderCell: (params) => {
        const priorityId = params?.row?.priorityId || params?.row?.priority?.id;
        
        // Try to get priority from row first (if included in API response)
        let priority = params?.row?.priority;
        
        // If not found, look up from priorityTypes state
        if (!priority && priorityId) {
          priority = priorityTypes.find(p => p.id === priorityId);
        }
        
        if (!priority) {
          return <span style={{ color: 'var(--text-muted, #6b7280)' }}>—</span>;
        }
        
        const name = lang === 'ar' ? priority.nameAr : priority.nameEn;
        
        // Use centralized priority color and code functions
        const color = getPriorityColor(priority.id);
        const code = getPriorityCode(priority.id);
        
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            fontWeight: code === 'urgent' ? 'bold' : 'normal'
          }}>
            <span style={{ color: color }}>
              {getThemedIcon('ui', 'flag', 14, theme)}
            </span>
            {name}
          </span>
        );
      }
    },
    {
      field: 'descriptionEn', 
      headerName: t('announcements_content_en_header'), 
      flex: 1, 
      minWidth: 250,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.descriptionEn || row.contentEn || row.content_en || params?.value || '';
      },
      renderCell: (params) => {
        const content = params?.row?.descriptionEn || params?.row?.contentEn || params?.row?.content_en || params?.value || '';
        if (!content) return t('announcements_no_content') || 'No content';
        // Strip HTML tags for display
        const plainText = content.replace(/<[^>]*>/g, '');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
      }
    },
    {
      field: 'descriptionAr', 
      headerName: t('announcements_content_ar_header'), 
      flex: 1, 
      minWidth: 250,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.descriptionAr || row.contentAr || row.content_ar || params?.value || '';
      },
      renderCell: (params) => {
        const content = params?.row?.descriptionAr || params?.row?.contentAr || params?.row?.content_ar || params?.value || '';
        if (!content) return t('announcements_no_content') || 'No content';
        // Strip HTML tags for display
        const plainText = content.replace(/<[^>]*>/g, '');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
      }
    },
    {
      field: 'programId',
      headerName: t('program') || 'Program',
      width: 150,
      renderCell: (params) => {
        const programId = params.value || params.row?.programId;
        if (!programId) return '—';
        const program = programs.find(p => (p.docId || p.id) === programId);
        if (!program) return programId;
        const programName = lang === 'ar' ? (program.nameAr || program.nameEn) : (program.nameEn || program.nameAr);
        return programName;
      }
    },
    {
      field: 'subjectId',
      headerName: t('subject') || 'Subject',
      width: 150,
      renderCell: (params) => {
        const subjectId = params.value || params.row?.subjectId;
        if (!subjectId) return '—';
        const subject = subjects.find(s => (s.docId || s.id) === subjectId);
        if (!subject) return subjectId;
        const subjectName = lang === 'ar' ? (subject.nameAr || subject.nameEn) : (subject.nameEn || subject.nameAr);
        return subjectName;
      }
    },
    {
      field: 'classId',
      headerName: t('class_col') || 'Class',
      width: 150,
      renderCell: (params) => {
        const classId = params.value || params.row?.classId;
        if (!classId) return '—';
        const classItem = classes.find(c => (c.docId || c.id) === classId);
        if (!classItem) return classId;
        const className = lang === 'ar' 
          ? (classItem.nameAr || classItem.nameEn || classItem.name) 
          : (classItem.nameEn || classItem.nameAr || classItem.name);
        return `${className}${classItem.code ? ` (${classItem.code})` : ''}`;
      }
    },
    {
      field: 'target', headerName: 'Target', width: 120,
      renderCell: (params) => {
         // TARGET CALCULATION LOGIC:
         // Priority: Class > Subject > Program > Global
         // 1. If classId exists → "Class" (most specific - targets students in a specific class)
         // 2. If subjectId exists → "Subject" (targets students in a specific subject)  
         // 3. If programId exists → "Program" (targets students in a specific program)
         // 4. If none exist → "Global" (targets all users system-wide)
         const { programId, subjectId, classId } = params.row;
         if (classId) return 'Class';
         if (subjectId) return 'Subject';
         if (programId) return 'Program';
         return 'Global';
      }
    },
    ...auditColumns,
    {
      field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="sm" 
            variant="ghost" 
            className="editHover" 
            icon={getThemedIcon('ui', 'edit', 16, theme)} 
            onClick={() => handleEditAnnouncement(params.row)}
          >
            {t('edit') || 'Edit'}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="deleteHover" 
            icon={getThemedIcon('ui', 'trash', 16, theme)} 
            style={{ color: '#dc2626' }} 
            onClick={() => {
              const announcement = params.row;
              deleteEntity('announcement', announcement, async () => {
                info('[DEBUG] Deleting announcement:', { 
                  id: announcement.docId || announcement.id,
                  announcement: announcement.titleEn || announcement.title,
                  user: user?.email
                });
                
                setAnnouncements(prev => prev.filter(a => (a.docId || a.id) !== (announcement.docId || announcement.id)));
                try {
                  const result = await deleteAnnouncementService(announcement.docId || announcement.id, announcement);
                  info('[DEBUG] Delete result:', result);
                  
                  if (result.success) {
                    toast?.showSuccess(t('announcement_deleted_successfully') || 'Announcement deleted successfully!');
                    await loadData();
                  } else {
                    setAnnouncements(prev => [...prev, announcement]);
                    toast?.showError(t('error_deleting_announcement') || 'Error deleting announcement: ' + result.error);
                  }
                } catch (err) {
                  setAnnouncements(prev => [...prev, announcement]);
                  toast?.showError(t('error_deleting_announcement') || 'Error deleting announcement: ' + err.message);
                }
              });
            }}
          >
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [programs, subjects, classes, priorityTypes, users, user?.email, theme, lang, t, handleEditAnnouncement, toast, loadData, deleteEntity, auditColumns]);

  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcementProgramFilter && announcement.programId !== announcementProgramFilter) return false;
    if (announcementSubjectFilter && announcement.subjectId !== announcementSubjectFilter) return false;
    if (announcementClassFilter && announcement.classId !== announcementClassFilter) return false;
    
    // Text search filters
    if (announcementTitleEnFilter && (!announcement.title || !announcement.title.toLowerCase().includes(announcementTitleEnFilter.toLowerCase()))) return false;
    if (announcementTitleArFilter && (!announcement.titleAr || !announcement.titleAr.includes(announcementTitleArFilter))) return false;
    if (announcementContentEnFilter && (!announcement.content || !announcement.content.toLowerCase().includes(announcementContentEnFilter.toLowerCase()))) return false;
    if (announcementContentArFilter && (!announcement.contentAr || !announcement.contentAr.includes(announcementContentArFilter))) return false;
    
    return true;
  });

  return (
    <div className="announcements-tab">
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {editingAnnouncement && (
        <div style={{
          padding: '0.75rem 1rem',
          background: isDark ? '#78350f' : '#fef3c7',
          border: isDark ? '1px solid #92400e' : '1px solid #fbbf24',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: isDark ? '#fef3c7' : '#78350f'
        }}>
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_announcement') || 'Editing Announcement'}: {editingAnnouncement.title}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.5rem' }}>
        
      </div>
      <form data-tour="announce-form" onSubmit={handleAnnouncementSubmit} className="dashboard-form">
        {/* Program/Subject/Class Selection */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={announcementForm.programId}
            selectedSubject={announcementForm.subjectId}
            selectedClass={announcementForm.classId}
            onProgramChange={handleDropdownChange(setAnnouncementForm, 'programId', ['subjectId', 'classId'])}
            onSubjectChange={handleDropdownChange(setAnnouncementForm, 'subjectId', ['classId'])}
            onClassChange={handleDropdownChange(setAnnouncementForm, 'classId')}
            showLabels={false}
            className="flex gap-2"
          />
        </div>

        {/* Target Audience Selection */}
        <div className="form-row">
          <Select
            searchable
            placeholder={t('target_audience') || 'Target Audience'}
            value={announcementForm.target}
            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target: e.target.value }))}
            options={TARGET_AUDIENCE_OPTIONS.map(type => ({
              value: type.value,
              label: lang === 'ar' ? type.labelAr : type.label,
              icon: getThemedIcon('ui', getTargetAudienceIcon(type.value.toUpperCase()), 16, theme)
            }))}
            style={{ minWidth: '200px' }}
          />
          
          <Select
            searchable
            placeholder={t('priority') || 'Priority'}
            value={announcementForm.priorityId}
            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priorityId: parseInt(e.target.value) }))}
            options={priorityTypes.map(priority => ({
              value: priority.id,
              label: lang === 'ar' ? priority.nameAr : priority.nameEn,
              icon: getThemedIcon('ui', getPriorityIcon(priority.code), 16, theme)
            }))}
            style={{ minWidth: '150px' }}
          />
        </div>

        {/* Title Inputs - EN + AR */}
        <div className="form-row">
          <input
            ref={titleRef}
            type="text"
            placeholder={(t('title_english') || 'Title (English)') + '*'}
            defaultValue={announcementForm.titleEn || announcementForm.title}
            className="dashboard-input"
            required
          />
          <input
            ref={titleArRef}
            type="text"
            placeholder={t('title_arabic') || 'Title (Arabic)'}
            defaultValue={announcementForm.titleAr}
            className="dashboard-input"
            style={{ direction: 'rtl' }}
          />
        </div>

        {/* Content Section - WYSIWYG */}
        <div className="form-row">
          <div style={{ flex: 1, marginInlineEnd: '16px' }}>
            <RichTextEditor
              value={announcementForm.contentEn}
              onChange={(html) => setAnnouncementForm(prev => ({ ...prev, contentEn: html }))}
              placeholder={t('announcement_content_english') || 'Announcement Content (English)'}
              height={120}
              dir="ltr"
            />
          </div>
          <div style={{ flex: 1 }}>
            <RichTextEditor
              value={arabicContent}
              onChange={setArabicContent}
              placeholder={t('announcement_content_arabic') || 'المحتوى بالعربية'}
              height={120}
              dir="rtl"
            />
          </div>
        </div>

        {/* Toggles row: Featured + Email on same line */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleSwitch
            label={t('featured') || 'Featured'}
            checked={announcementForm.featured || false}
            onChange={(checked) => setAnnouncementForm(prev => ({ ...prev, featured: checked }))}
          />
          {/* Email notification option hidden per user request */}
          {/* <ToggleSwitch
            label={t('send_email_notification') || 'Send email notification'}
            checked={emailOptions.sendEmail}
            onChange={(checked) => handleEmailOptionChange('sendEmail', checked)}
          />
          {emailOptions.sendEmail && (
            <Select
              searchable
              placeholder={t('language') || 'Language'}
              value={emailOptions.emailLang}
              onChange={(e) => handleEmailOptionChange('emailLang', e.target.value)}
              options={[
                { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                { value: 'both', label: lang === 'ar' ? 'ثنائي اللغة' : 'Bilingual' }
              ]}
              style={{ minWidth: '150px' }}
            />
          )} */}
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button type="submit" variant="primary" loading={loading}>
                {(editingAnnouncement ? (t('update') || 'Update') : (t('save') || 'Save'))}
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
                style={{ display: editingAnnouncement ? 'block' : 'none' }}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="filters-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem', 
        marginBottom: '1rem', 
        background: isDark ? '#1f2937' : '#f8f9fa', 
        padding: '1rem', 
        borderRadius: 12, 
        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', 
        width: '100%' 
      }}>
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={announcementProgramFilter}
          selectedSubject={announcementSubjectFilter}
          selectedClass={announcementClassFilter}
          onProgramChange={(e) => {
            const programId = e?.target?.value !== undefined ? e.target.value : e;
            setAnnouncementProgramFilter(programId);
          }}
          onSubjectChange={(e) => {
            const subjectId = e?.target?.value !== undefined ? e.target.value : e;
            setAnnouncementSubjectFilter(subjectId);
          }}
          onClassChange={(e) => {
            const classId = e?.target?.value !== undefined ? e.target.value : e;
            setAnnouncementClassFilter(classId);
          }}
          showClass={true}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Third row: Title and Content filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            value={announcementTitleEnFilter}
            onChange={(e) => setAnnouncementTitleEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (إنجليزي)' : 'Search by Title (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={announcementTitleArFilter}
            onChange={(e) => setAnnouncementTitleArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (عربي)' : 'Search by Title (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={announcementContentEnFilter}
            onChange={(e) => setAnnouncementContentEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالمحتوى (إنجليزي)' : 'Search by Content (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
          
          <Input
            value={announcementContentArFilter}
            onChange={(e) => setAnnouncementContentArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالمحتوى (عربي)' : 'Search by Content (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
        </div>
      </div>
      
      {(announcementProgramFilter || announcementSubjectFilter || announcementClassFilter || announcementTitleEnFilter || announcementTitleArFilter || announcementContentEnFilter || announcementContentArFilter) && (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: isDark ? '#1e3a8a' : '#eff6ff',
          border: isDark ? '1px solid #3b82f6' : '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredAnnouncements.length} {t('of') || 'of'} {announcements.length} {t('announcements') || 'Announcements'}
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#1e3a8a' : '#f0f9ff', 
          border: isDark ? '1px solid #3b82f6' : '1px solid #bae6fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#0369a1'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {announcements.length} {t('total') || 'Total'}
        </div>
        
        {/* Target Type Chips */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#78350f' : '#fef3c7', 
          border: isDark ? '1px solid #92400e' : '1px solid #fde68a', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#fef3c7' : '#92400e'
        }}>
          {getThemedIcon('ui', 'megaphone', 16, theme)}
          {announcements.filter(a => a.target === 'global').length} {lang === 'ar' ? 'عالمي' : 'Global'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#831843' : '#fce7f3', 
          border: isDark ? '1px solid #be185d' : '1px solid #fbcfe8', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#fce7f3' : '#831843'
        }}>
          {getThemedIcon('ui', 'graduation_cap', 16, theme)}
          {announcements.filter(a => a.programId).length} {lang === 'ar' ? 'برامج' : 'Programs'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#14532d' : '#f0fdf4', 
          border: isDark ? '1px solid #16a34a' : '1px solid #bbf7d0', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dcfce7' : '#166534'
        }}>
          {getThemedIcon('ui', 'book', 16, theme)}
          {announcements.filter(a => a.subjectId).length} {lang === 'ar' ? 'مواد' : 'Subjects'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#0c4a6e' : '#e0f2fe', 
          border: isDark ? '1px solid #0ea5e9' : '1px solid #7dd3fc', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#e0f2fe' : '#0c4a6e'
        }}>
          {getThemedIcon('ui', 'users', 16, theme)}
          {announcements.filter(a => a.classId).length} {lang === 'ar' ? 'فصول' : 'Classes'}
        </div>
        
        {/* Email Notification Chips */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#581c87' : '#f3e8ff', 
          border: isDark ? '1px solid #7c3aed' : '1px solid #c4b5fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#e9d5ff' : '#6b21a8'
        }}>
          {getThemedIcon('ui', 'mail', 16, theme)}
          {announcements.filter(a => a.sendEmail).length} {lang === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
        </div>
      </div>

      <div data-tour="announce-grid" style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          key={`announcements-grid-${lang}`}
          rows={filteredAnnouncements}
          getRowId={(row) => row.docId || row.id || `announcement-${Math.random().toString(36).substr(2, 9)}`}
          direction={lang === 'ar' ? 'rtl' : 'ltr'}
          lang={lang}
          columns={gridColumns}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          checkboxSelection
          exportFileName="announcements"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={dataLoading ? "Loading..." : undefined}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default AnnouncementsPage;
