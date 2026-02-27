import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useToast } from '@ui';
import logger from '@utils/logger';
import { AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, getQatarNow } from '@utils/qatarDate';
import { getPrograms, getSubjects, getClasses } from '@services/business/programService.js';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement as deleteAnnouncementService } from '@services/business/announcementService';
import { getUsers, getUserById } from '@services/business/userService';
import { notificationGateway } from '@services/business/notificationGateway';
import { getEnrollments } from '@services/business/enrollmentService';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { Button, ToggleSwitch, Select, Input, SimpleLoading, RichTextEditor } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { ProgramsSelect } from '@ui';

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
const AnnouncementsPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const toast = useToast();
  
  // Internal state management
  const [announcements, setAnnouncements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    id: '', title: '', titleEn: '', titleAr: '', contentEn: '',
    target: 'global', programId: '', subjectId: '', classId: '', featured: false
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
        announcementsResult
      ] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getUsers(),
        getAnnouncements()
      ]);
      
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (announcementsResult.success) setAnnouncements(announcementsResult.data || []);
    } catch (error) {
      logger.error('Error loading data:', error);
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
    return (value) => {
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
      target: 'global', programId: '', subjectId: '', classId: '', featured: false
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

  const handleAnnouncementSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    console.time('[PERF] handleAnnouncementSubmit');
    setLoading(true);

    try {
      // Read text fields from refs (uncontrolled inputs)
      const textValues = syncRefsToState();
      logger.log('[FORM] Text values from refs:', textValues);

      if (!textValues.title || textValues.title.trim() === '') {
        throw new Error(t('announcements_title_required'));
      }
      
      // Clean the announcement data - only include the fields we want
      const announcementData = {
        title: textValues.title.trim(),
        titleEn: textValues.titleEn,
        titleAr: textValues.titleAr,
        contentEn: textValues.contentEn?.trim() || '',
        contentAr: textValues.contentAr?.trim() || '',
        target: announcementForm.target,
        programId: announcementForm.programId,
        subjectId: announcementForm.subjectId,
        classId: announcementForm.classId,
        featured: announcementForm.featured
      };

      console.log('🔍 Announcement data being sent:', announcementData);

      if (editingAnnouncement && editingAnnouncement.docId && editingAnnouncement.docId !== 'new') {
        await updateAnnouncement(editingAnnouncement.docId, announcementData, user, emailOptions);
        toast?.showSuccess(t('announcements_updated_successfully'));
        
        // Update local announcements array instead of reloading
        setAnnouncements(prev => prev.map(a => 
          (a.docId || a.id) === editingAnnouncement.docId 
            ? { ...a, ...announcementData, docId: editingAnnouncement.docId }
            : a
        ));
      } else {
        const result = await addAnnouncement(announcementData, user);
        
        if (result.success) {
          logger.log('🔍 [SAVE] Announcement created successfully with ID:', result.id);
          toast?.showSuccess(t('announcements_created_successfully'));
          
          // Add new announcement to local state immediately for UI feedback
          const newAnnouncement = {
            ...announcementData,
            docId: result.id,
            id: result.id
            // Note: Audit fields will be populated when data is refreshed
          };
          setAnnouncements(prev => [newAnnouncement, ...prev]);
          
          // Send notifications using notification gateway (only for new announcements)
          const { programId, subjectId, classId } = announcementData;
          
          try {
            if (classId) {
              const enrollmentsResult = await getEnrollments({ classId });
              const studentIds = (enrollmentsResult.data || []).map(e => e.userId);
              
              for (const studentId of studentIds) {
                const { data: student } = await getUserById(studentId);
                if (student && student.email) {
                  await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW, {
                    userId: studentId,
                    role: 'student',
                    classId,
                    email: student.email,
                    lang: student.preferredLanguage || 'en',
                    variables: {
                      studentName: student.displayName || student.name || t('announcements_student_name'),
                      announcementTitle: announcementData.title,
                      announcementContent: announcementData.content
                    }
                  });
                }
              }
            }
          } catch (notifyError) {
            logger.warn('Failed to send notifications:', notifyError);
          }

          // Optional email blast removed - handled by notification gateway
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
    } catch (error) {
      logger.error('Error saving announcement:', error);
      toast?.showError(error.message || t('announcements_error_saving'));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleAnnouncementSubmit');
    }
  }, [announcementForm, editingAnnouncement, user, toast, syncRefsToState, resetAnnouncementForm, emailOptions, loadData, t]);

  const handleEditAnnouncement = useCallback((announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      id: announcement.id || '',
      title: announcement.titleEn || announcement.title || '',
      titleEn: announcement.titleEn || announcement.title || '',
      titleAr: announcement.titleAr || '',
      contentEn: announcement.contentEn || '',
      target: announcement.target || 'global',
      programId: announcement.programId || '',
      subjectId: announcement.subjectId || '',
      classId: announcement.classId || '',
      featured: announcement.featured || false
    });
    setArabicContent(announcement.contentAr || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    if (titleRef.current) titleRef.current.value = '';
    if (titleArRef.current) titleArRef.current.value = '';
  }, [resetAnnouncementForm]);

  // Memoize columns to prevent re-renders
  const gridColumns = useMemo(() => [
    { 
      field: 'title_en', 
      headerName: t('announcements_title_en_header'), 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.title_en || params?.row?.title || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    { 
      field: 'title_ar', 
      headerName: t('announcements_title_ar_header'), 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.title_ar || '';
        return title || (t('no_title') || 'No title');
      }
    },
    {
      field: 'content', headerName: t('announcements_content_header'), flex: 2, minWidth: 250,
      renderCell: (params) => params.value ? (params.value.length > 100 ? params.value.substring(0, 100) + '...' : params.value) : t('announcements_no_content')
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
        const programName = lang === 'ar' ? (program.name_ar || program.name_en) : (program.name_en || program.name_ar);
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
        const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar);
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
        return `${classItem.name}${classItem.code ? ` (${classItem.code})` : ''}`;
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
    {
      field: 'createdAt', headerName: 'Created', width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        if (!params.value) return 'Unknown';
        return formatQatarStandard(params.value);
      },
      valueFormatter: (params) => {
        if (!params.value) return 'Unknown';
        return formatQatarStandard(params.value);
      }
    },
    {
      field: 'createdBy', headerName: 'Created By', width: 150,
      renderCell: (params) => {
        const createdBy = params.value || params.row?.createdBy;
        if (!createdBy) return 'Unknown';
        
        // Try to find user display name from users array
        const user = users.find(u => (u.uid || u.id) === createdBy);
        if (user) {
          return user.displayName || user.name || user.email || createdBy;
        }
        
        return createdBy;
      }
    },
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
                setAnnouncements(prev => prev.filter(a => (a.docId || a.id) !== (announcement.docId || announcement.id)));
                try {
                  const result = await deleteAnnouncementService(announcement.docId, announcement);
                  if (result.success) {
                    toast?.showSuccess(t('announcement_deleted_successfully') || 'Announcement deleted successfully!');
                    await loadData();
                  } else {
                    setAnnouncements(prev => [...prev, announcement]);
                    toast?.showError(t('error_deleting_announcement') || 'Error deleting announcement: ' + result.error);
                  }
                } catch (error) {
                  setAnnouncements(prev => [...prev, announcement]);
                  toast?.showError(t('error_deleting_announcement') || 'Error deleting announcement: ' + error.message);
                }
              });
            }}
          >
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [programs, subjects, classes, theme, lang, t, handleEditAnnouncement, toast, loadData, deleteEntity]);

  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcementProgramFilter && announcement.programId !== announcementProgramFilter) return false;
    if (announcementSubjectFilter && announcement.subjectId !== announcementSubjectFilter) return false;
    if (announcementClassFilter && announcement.classId !== announcementClassFilter) return false;
    
    // Text search filters
    if (announcementTitleEnFilter && (!announcement.title || !announcement.title.toLowerCase().includes(announcementTitleEnFilter.toLowerCase()))) return false;
    if (announcementTitleArFilter && (!announcement.title_ar || !announcement.title_ar.includes(announcementTitleArFilter))) return false;
    if (announcementContentEnFilter && (!announcement.content || !announcement.content.toLowerCase().includes(announcementContentEnFilter.toLowerCase()))) return false;
    if (announcementContentArFilter && (!announcement.content_ar || !announcement.content_ar.includes(announcementContentArFilter))) return false;
    
    return true;
  });

  return (
    <div className="announcements-tab">
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

      <form onSubmit={handleAnnouncementSubmit} className="dashboard-form">
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

        {/* Title Inputs - EN + AR */}
        <div className="form-row">
          <input
            ref={titleRef}
            type="text"
            placeholder={(t('title_english') || 'Title (English)') + '*'}
            defaultValue={announcementForm.title_en || announcementForm.title}
            className="dashboard-input"
            required
          />
          <input
            ref={titleArRef}
            type="text"
            placeholder={t('title_arabic') || 'Title (Arabic)'}
            defaultValue={announcementForm.title_ar}
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
          <ToggleSwitch
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
          )}
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
          onProgramChange={(programId) => setAnnouncementProgramFilter(programId)}
          onSubjectChange={(subjectId) => setAnnouncementSubjectFilter(subjectId)}
          onClassChange={(classId) => setAnnouncementClassFilter(classId)}
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

      <div style={{ marginTop: '1rem' }}>
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
