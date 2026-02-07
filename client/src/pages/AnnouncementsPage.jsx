import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { addAnnouncement, updateAnnouncement, deleteAnnouncement, addActivityLog } from '@firebaseServices/activityService';
import { notifyAllUsers, notifyUsersByClass } from '@firebaseServices/notificationService';
import { sendEmail } from '@firebaseServices/emailService';
import { logActivity, ACTIVITY_TYPES } from '@firebaseServices/activityLogger.jsx';
import { formatQatarDate } from '@utils/timezone';
import { 
  Button, 
  Input, 
  Textarea, 
  Select, 
  AdvancedDataGrid, 
  useToast, 
  ToggleSwitch 
} from '@ui';
import { RibbonTabs, SmartEmailComposer } from '@ui';
import logger from '@utils/logger';

const AnnouncementsPage = ({ 
  announcements = [],
  programs = [],
  subjects = [],
  classes = [],
  users = [],
  announcementForm = { title: '', content: '', content_ar: '', target: 'global', programId: '', subjectId: '', classId: '' },
  setAnnouncementForm,
  editingAnnouncement,
  setEditingAnnouncement,
  activeAnnouncementFormTab,
  setActiveAnnouncementFormTab,
  announcementEmailOptions = { sendEmail: false, lang: 'both' },
  setAnnouncementEmailOptions,
  deleteModal,
  setDeleteModal,
  setAnnouncements,
  loadData,
  theme,
  loading,
  setLoading,
  enrollmentProgramFilter,
  enrollmentSubjectFilter,
  enrollmentClassFilter,
  smartComposerOpen,
  setSmartComposerOpen,
  activityProgramOptions,
  activitySubjectOptions,
  activityClassOptions,
  handleDropdownChange,
  user
}) => {
  const { t, lang } = useLang();
  const uiToast = useToast();
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = editingAnnouncement ?
        await updateAnnouncement(editingAnnouncement.docId, announcementForm) :
        await addAnnouncement(announcementForm);

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingAnnouncement ? ACTIVITY_TYPES.ANNOUNCEMENT_UPDATED : ACTIVITY_TYPES.ANNOUNCEMENT_CREATED, {
            announcementId: editingAnnouncement?.docId || result.id,
            announcementTitle: announcementForm.title,
            target: announcementForm.target,
            programId: announcementForm.programId,
            subjectId: announcementForm.subjectId,
            classId: announcementForm.classId
          });
        } catch (e) { }
        
        // Legacy log (keep for backward compatibility)
        if (!editingAnnouncement) {
          try {
            await addActivityLog({
              type: 'announcement_created',
              userId: user?.uid,
              timestamp: new Date(),
              userAgent: navigator.userAgent,
              metadata: {
                announcementId: result.id,
                title: announcementForm.title,
                target: announcementForm.target,
                programId: announcementForm.programId,
                subjectId: announcementForm.subjectId,
                classId: announcementForm.classId
              }
            });
          } catch (e) { }
        }
        // Send notifications only for new announcements
        if (!editingAnnouncement) {
          const { programId, subjectId, classId } = announcementForm;
          let notificationSent = false;

          if (classId) {
            await notifyUsersByClass(
              classId,
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
            notificationSent = true;
          }

          if (!notificationSent) {
            await notifyAllUsers(
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
          }

          // Optional email blast
          if (announcementEmailOptions.sendEmail) {
            const buildBody = () => {
              const en = announcementForm.content?.trim();
              const ar = announcementForm.content_ar?.trim();
              // Always send bilingual when available: EN first, then AR if provided
              return [`<div>${en || ''}</div>`, ar ? `<hr/><div dir="rtl" style="text-align:right">${ar}</div>` : ''].join('');
            };

            // Get recipients based on target
            let recipients = [];
            if (classId) {
              // Get users in specific class
              const classUsers = users.filter(u => u.enrollments?.some(e => e.classId === classId));
              recipients = classUsers.map(u => u.email).filter(Boolean);
            } else if (subjectId) {
              // Get users in specific subject
              const subjectUsers = users.filter(u => u.enrollments?.some(e => e.subjectId === subjectId));
              recipients = subjectUsers.map(u => u.email).filter(Boolean);
            } else if (programId) {
              // Get users in specific program
              const programUsers = users.filter(u => u.enrollments?.some(e => e.programId === programId));
              recipients = programUsers.map(u => u.email).filter(Boolean);
            } else {
              // All users
              recipients = users.map(u => u.email).filter(Boolean);
            }

            if (recipients.length > 0) {
              const sendRes = await sendEmail({
                to: recipients,
                subject: `📢 ${announcementForm.title}`,
                html: buildBody(),
                type: 'announcement'
              });
              if (!sendRes.success) {
                logger.error('Email send failed:', sendRes.error);
              }
            }
          }
        }

        await loadData();
        setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global', programId: '', subjectId: '', classId: '' });
        setAnnouncementEmailOptions({ sendEmail: false, lang: 'both' });
        setEditingAnnouncement(null);
        toast?.showSuccess(editingAnnouncement ?
          'Announcement updated successfully!' :
          'Announcement created and notifications sent!'
        );
      } else {
        toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + result.error);
      }
    } catch (error) {
      logger.error('Error with announcement:', error);
      toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (params) => {
    setEditingAnnouncement(params.row);
    setAnnouncementForm({
      title: params.row.title || '',
      content: params.row.content || '',
      content_ar: params.row.content_ar || '',
      target: params.row.target || 'global',
      programId: params.row.programId || '',
      subjectId: params.row.subjectId || '',
      classId: params.row.classId || ''
    });
  };

  const handleDelete = (params) => {
    setDeleteModal({
      open: true,
      item: params.row,
      type: 'announcement',
      onConfirm: async () => {
        const announcement = params.row;
        // Optimistic update
        const prevAnnouncements = announcements;
        setAnnouncements(prev => prev.filter(a => a.docId !== announcement.docId));
        try {
          const result = await deleteAnnouncement(announcement.docId);
          if (result.success) {
            // Log activity
            try {
              await logActivity(ACTIVITY_TYPES.ANNOUNCEMENT_DELETED, {
                announcementId: announcement.docId,
                announcementTitle: announcement.title
              });
            } catch (e) { }
            toast?.showSuccess('Announcement deleted successfully!');
            await loadData();
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          } else {
            // Rollback on error
            setAnnouncements(prevAnnouncements);
            toast?.showError('Error deleting announcement: ' + result.error);
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          }
        } catch (error) {
          // Rollback on error
          setAnnouncements(prevAnnouncements);
          toast?.showError('Error deleting announcement: ' + error.message);
          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global', programId: '', subjectId: '', classId: '' });
    setActiveAnnouncementFormTab('basic');
  };

  const handleTabNavigation = (direction) => {
    if (direction === 'next') {
      if (activeAnnouncementFormTab === 'basic') {
        setActiveAnnouncementFormTab('content');
      } else if (activeAnnouncementFormTab === 'content') {
        setActiveAnnouncementFormTab('email');
      }
    } else {
      if (activeAnnouncementFormTab === 'email') {
        setActiveAnnouncementFormTab('content');
      } else if (activeAnnouncementFormTab === 'content') {
        setActiveAnnouncementFormTab('basic');
      }
    }
  };

  const columns = [
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
        const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
        return formatQatarDate(date);
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
            onClick={() => handleEdit(params)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="deleteHover" 
            icon={getThemedIcon('ui', 'trash', 16, theme)} 
            style={{ color: '#dc2626' }} 
            onClick={() => handleDelete(params)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const filteredAnnouncements = announcements.filter(a => {
    if (enrollmentClassFilter !== 'all') {
      return a.classId === enrollmentClassFilter;
    }
    if (enrollmentSubjectFilter !== 'all') {
      return a.subjectId === enrollmentSubjectFilter;
    }
    if (enrollmentProgramFilter !== 'all') {
      return a.programId === enrollmentProgramFilter;
    }
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Announcement: {editingAnnouncement.title}
        </div>
      )}

      <RibbonTabs
        categories={[
          {
            id: 'announcement-fields',
            items: [
              { key: 'basic', label: t('basic_info') || 'Basic Info', icon: getThemedIcon('ui', 'bell', 14, theme) },
              { key: 'content', label: t('content') || 'Content', icon: getThemedIcon('ui', 'edit', 14, theme) },
              { key: 'email', label: t('email_options') || 'Email Options', icon: getThemedIcon('ui', 'mail', 14, theme) }
            ]
          }
        ]}
        activeCategory="announcement-fields"
        activeItem={activeAnnouncementFormTab}
        onChange={({ item }) => setActiveAnnouncementFormTab(item)}
      />
      
      <form onSubmit={handleAnnouncementSubmit} className="announcement-form dashboard-form">
        {/* Basic Info Tab */}
        {activeAnnouncementFormTab === 'basic' && (
          <>
            <div className="form-row wide-cols">
              <Select
                searchable
                placeholder={t('program_optional') || 'Program (Optional)'}
                value={announcementForm.programId}
                onChange={handleDropdownChange(setAnnouncementForm, 'programId', ['subjectId', 'classId'])}
                options={activityProgramOptions}
              />
              <Select
                searchable
                placeholder={t('subject_optional') || 'Subject (Optional)'}
                value={announcementForm.subjectId}
                onChange={handleDropdownChange(setAnnouncementForm, 'subjectId', ['classId'])}
                options={activitySubjectOptions.filter(o => !announcementForm.programId || o.value === '' || subjects.find(s => s.docId === o.value)?.programId === announcementForm.programId)}
                disabled={!announcementForm.programId}
              />
              <Select
                searchable
                placeholder={t('class_optional') || 'Class (Optional)'}
                value={announcementForm.classId}
                onChange={handleDropdownChange(setAnnouncementForm, 'classId')}
                options={activityClassOptions.map(o => {
                const classData = classes.find(c => c.docId === o.value);
                if (!classData) return o;
                return {
                  ...o,
                  label: `${classData.name || classData.code || 'Unnamed'}${classData.code ? ` (${classData.code})` : ''}${classData.term ? ` - ${classData.term}` : ''}${classData.year ? ` ${classData.year}` : ''}`
                };
              }).filter(o => !announcementForm.subjectId || o.value === '' || classes.find(c => c.docId === o.value)?.subjectId === announcementForm.subjectId)}
                disabled={!announcementForm.subjectId}
              />
            </div>
            <div className="form-row">
              <Input
                type="text"
                placeholder={t('announcement_title')}
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                required
              />
            </div>
          </>
        )}

        {/* Content Tab */}
        {activeAnnouncementFormTab === 'content' && (
          <div className="form-row">
            <Textarea
              placeholder={t('announcement_content_english')}
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              rows={4}
              required
              fullWidth
            />
            <Textarea
              placeholder={t('announcement_content_arabic')}
              value={announcementForm.content_ar}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content_ar: e.target.value })}
              rows={4}
              fullWidth
            />
          </div>
        )}

        {/* Email Options Tab */}
        {activeAnnouncementFormTab === 'email' && (
          <>
            <div className="form-row flex-row with-top-margin">
              <ToggleSwitch
                label={t('send_email_notification') || 'Send Email Notification'}
                checked={announcementEmailOptions.sendEmail}
                onChange={(checked) => setAnnouncementEmailOptions({ ...announcementEmailOptions, sendEmail: checked })}
              />
            </div>
            {announcementEmailOptions.sendEmail && (
              <div className="form-row">
                <div>
                  <small>{t('language') || 'Language'}</small>
                  <Select
                    searchable
                    placeholder={t('language') || 'Language'}
                    value={announcementEmailOptions.lang}
                    onChange={(e) => setAnnouncementEmailOptions({ ...announcementEmailOptions, lang: e.target.value })}
                    options={[
                      { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                      { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                      { value: 'both', label: lang === 'ar' ? 'اللغتين' : 'Both Languages' }
                    ]}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Form Actions - Show on all tabs */}
        <div className="form-row flex-row">
          <div className="form-actions" style={{ flex: 1, justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activeAnnouncementFormTab !== 'basic' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleTabNavigation('previous')}
                >
                  ← Previous
                </Button>
              )}
              {activeAnnouncementFormTab !== 'email' && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTabNavigation('next')}
                >
                  Next →
                </Button>
              )}
              {activeAnnouncementFormTab === 'email' && (
                <Button type="submit" variant="primary" loading={loading}>
                  {(editingAnnouncement ? (t('update') || 'Update') : (t('save') || 'Save'))}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSmartComposerOpen(true)}
              >
                {t('compose_email') || 'Compose Email'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredAnnouncements}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          showExportButton
          exportFileName="announcements"
          exportLabel={t('export') || 'Export'}
        />
      </div>

      {smartComposerOpen && (
        <SmartEmailComposer
          isOpen={smartComposerOpen}
          onClose={() => setSmartComposerOpen(false)}
          programs={programs}
          subjects={subjects}
          classes={classes}
        />
      )}
    </div>
  );
};

export default AnnouncementsPage;
