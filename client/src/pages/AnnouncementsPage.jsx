import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, getQatarNow } from '@utils/qatarDate';
import { getPrograms, getSubjects, getClasses } from '@firebaseServices/programService.js';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement as deleteAnnouncementService } from '@firebaseServices/activityService';
import { getUsers, getUserById } from '@firebaseServices/userService';
import { notificationGateway } from '@firebaseServices/notificationGateway';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { Button, ToggleSwitch, Select } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { RECORD_TYPES } from '@utils/sharedTypes';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import logger from '@utils/logger';

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
  const { user } = useAuth();
  const toast = useToast();
  
  // Internal state management
  const [announcements, setAnnouncements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    id: '', title: '', content: '', content_ar: '',
    target: 'global', programId: '', subjectId: '', classId: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Filter state
  const [announcementProgramFilter, setAnnouncementProgramFilter] = useState('');
  const [announcementSubjectFilter, setAnnouncementSubjectFilter] = useState('');
  const [announcementClassFilter, setAnnouncementClassFilter] = useState('');
  
  const [emailOptions, setEmailOptions] = useState({
    sendEmail: false,
    emailLang: 'en'
  });
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for text inputs — avoids re-rendering the whole page on every keystroke
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const contentArRef = useRef(null);

  // Data loading function
  const loadData = useCallback(async () => {
    setDataLoading(true);
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
      toast?.showError('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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
      id: '', title: '', content: '', content_ar: '',
      target: 'global', programId: '', subjectId: '', classId: ''
    });
  }, []);

  const handleEmailOptionChange = useCallback((field, value) => {
    setEmailOptions(prev => ({ ...prev, [field]: value }));
  }, []);

  // Sync refs when editing an existing announcement
  useEffect(() => {
    if (titleRef.current) titleRef.current.value = announcementForm.title || '';
    if (contentRef.current) contentRef.current.value = announcementForm.content || '';
    if (contentArRef.current) contentArRef.current.value = announcementForm.content_ar || '';
  }, [editingAnnouncement]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      title: titleRef.current?.value ?? announcementForm.title,
      content: contentRef.current?.value ?? announcementForm.content,
      content_ar: contentArRef.current?.value ?? announcementForm.content_ar,
    };
  }, [announcementForm]);

  const handleAnnouncementSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    console.time('[PERF] handleAnnouncementSubmit');
    setLoading(true);

    try {
      // Read text fields from refs (uncontrolled inputs)
      const textValues = syncRefsToState();
      console.log('[FORM] Text values from refs:', textValues);

      if (!textValues.title || textValues.title.trim() === '') {
        throw new Error('Announcement title is required');
      }
      
      // Clean the announcement data
      const announcementData = {
        ...announcementForm,
        ...textValues,
        title: textValues.title.trim(),
        content: textValues.content?.trim() || '',
        content_ar: textValues.content_ar?.trim() || '',
        updatedAt: getQatarNow(),
        updatedBy: user?.id || 'unknown'
      };

      if (editingAnnouncement && editingAnnouncement.docId && editingAnnouncement.docId !== 'new') {
        await updateAnnouncement(editingAnnouncement.docId, announcementData, emailOptions);
        toast?.showSuccess('Announcement updated successfully');
        
        // Update local announcements array instead of reloading
        setAnnouncements(prev => prev.map(a => 
          (a.docId || a.id) === editingAnnouncement.docId 
            ? { ...a, ...announcementData, docId: editingAnnouncement.docId }
            : a
        ));
      } else {
        announcementData.createdAt = getQatarNow();
        announcementData.updatedAt = getQatarNow();
        announcementData.createdBy = user?.id || 'unknown';
        
        const result = await addAnnouncement(announcementData);
        
        if (result.success) {
          console.log('🔍 [SAVE] Announcement created successfully with ID:', result.id);
          toast?.showSuccess('Announcement created successfully');
          
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
                      studentName: student.displayName || student.name || 'Student',
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
          throw new Error(result.error || 'Failed to create announcement');
        }
      }

      // Reset form and clear refs
      resetAnnouncementForm();
      if (titleRef.current) titleRef.current.value = '';
      if (contentRef.current) contentRef.current.value = '';
      if (contentArRef.current) contentArRef.current.value = '';
      setEditingAnnouncement(null);
      setEmailOptions({ sendEmail: false, emailLang: 'en' });
      await loadData();
    } catch (error) {
      logger.error('Error saving announcement:', error);
      toast?.showError(error.message || 'Error saving announcement');
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleAnnouncementSubmit');
    }
  }, [announcementForm, editingAnnouncement, user, toast, syncRefsToState, resetAnnouncementForm, emailOptions, users, loadData]);

  const handleEditAnnouncement = useCallback((announcement) => {
    setEditingAnnouncement(announcement);
    
    // Set basic form data first
    setAnnouncementForm({
      id: announcement.id || '',
      title: announcement.title || '',
      content: announcement.content || '',
      content_ar: announcement.content_ar || '',
      target: announcement.target || 'global',
      programId: announcement.programId || '',
      subjectId: announcement.subjectId || '',
      classId: announcement.classId || ''
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    if (titleRef.current) titleRef.current.value = '';
    if (contentRef.current) contentRef.current.value = '';
    if (contentArRef.current) contentArRef.current.value = '';
  }, [resetAnnouncementForm]);

  // Memoize columns to prevent re-renders
  const gridColumns = useMemo(() => [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    {
      field: 'content', headerName: 'Content', flex: 2, minWidth: 250,
      renderCell: (params) => params.value ? (params.value.length > 100 ? params.value.substring(0, 100) + '...' : params.value) : 'No content'
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
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'target', 16, theme)} {programName}
          </span>
        );
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
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'book_open', 16, theme)} {subjectName}
          </span>
        );
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
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'users', 16, theme)} {classItem.name}{classItem.code ? ` (${classItem.code})` : ''}
          </span>
        );
      }
    },
    {
      field: 'target', headerName: 'Target', width: 120,
      renderCell: (params) => {
         const { programId, subjectId, classId } = params.row;
         if (classId) return (
           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
             {getThemedIcon('ui', 'users', 16, theme)} Class
           </span>
         );
         if (subjectId) return (
           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
             {getThemedIcon('ui', 'book_open', 16, theme)} Subject
           </span>
         );
         if (programId) return (
           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
             {getThemedIcon('ui', 'target', 16, theme)} Program
           </span>
         );
         return (
           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
             {getThemedIcon('ui', 'globe', 16, theme)} Global
           </span>
         );
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
  ], [programs, subjects, classes, theme, lang, t, handleEditAnnouncement, toast, loadData, deleteEntity, announcements]);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcementProgramFilter && announcementProgramFilter !== 'all' && announcement.programId !== announcementProgramFilter) return false;
    if (announcementSubjectFilter && announcementSubjectFilter !== 'all' && announcement.subjectId !== announcementSubjectFilter) return false;
    if (announcementClassFilter && announcementClassFilter !== 'all' && announcement.classId !== announcementClassFilter) return false;
    return true;
  });

  return (
    <div className="announcements-tab">
      {editingAnnouncement && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
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

        {/* Title Input */}
        <div className="form-row">
          <div>
            <input
              ref={titleRef}
              type="text"
              placeholder={(t('announcement_title') || 'Announcement Title') + '*'}
              defaultValue={announcementForm.title}
              className="dashboard-input"
              required
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="form-row">
          <div style={{ flex: 1, marginRight: '16px' }}>
            <textarea
              ref={contentRef}
              placeholder={t('announcement_content_english') || 'Content (English)'}
              defaultValue={announcementForm.content}
              rows={4}
              className="dashboard-input dashboard-textarea"
              required
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <textarea
              ref={contentArRef}
              placeholder={t('announcement_content_arabic') || 'Content (Arabic)'}
              defaultValue={announcementForm.content_ar}
              rows={4}
              className="dashboard-input dashboard-textarea"
              style={{ direction: 'rtl' }}
            />
          </div>
        </div>

        {/* Email Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          padding: '1rem',
          background: '#f0f8ff',
          borderRadius: '8px',
          border: '2px solid var(--color-primary, #800020)'
        }}>
          <ToggleSwitch
            label={t('send_email_notification') || 'Send email notification'}
            checked={emailOptions.sendEmail}
            onChange={(checked) => handleEmailOptionChange('sendEmail', checked)}
          />
          {emailOptions.sendEmail && (
            <div>
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
              />
            </div>
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
      <div style={{ 
        padding: '1rem', 
        background: 'var(--color-surface, #f9fafb)', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        border: '1px solid var(--color-border, #e5e7eb)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            programValue={announcementProgramFilter}
            subjectValue={announcementSubjectFilter}
            classValue={announcementClassFilter}
            onProgramChange={setAnnouncementProgramFilter}
            onSubjectChange={setAnnouncementSubjectFilter}
            onClassChange={setAnnouncementClassFilter}
            showLabels={false}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAnnouncementProgramFilter('');
              setAnnouncementSubjectFilter('');
              setAnnouncementClassFilter('');
            }}
            icon={getThemedIcon('ui', 'x', 16, theme)}
          >
            {t('clear_filters') || 'Clear Filters'}
          </Button>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          key={`announcements-grid-${lang}`}
          rows={filteredAnnouncements}
          getRowId={(row) => row.docId || row.id}
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
          fancyVariant="dots"
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
