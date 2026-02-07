import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { RibbonTabs, AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import { formatQatarDate } from '@utils/timezone';
import logger from '@utils/logger';
import { ACTIVITY_TYPES } from '@constants/activityTypes';
import { Select, Input, Textarea, DatePicker, NumberInput, Button, ToggleSwitch, UrlInput } from '@ui';

/**
 * ActivitiesPage - Activities management page
 * 
 * This component provides a comprehensive activities management interface,
 * extracted from DashboardPage.jsx for better modularity.
 * 
 * Features:
 * - Multi-tab activity form (Basic Info, Content, Settings)
 * - Activity creation and editing
 * - Quiz integration with override settings
 * - Advanced data grid with filtering and export
 * - Email notification options
 * - Activity deletion with confirmation
 */
const ActivitiesPage = ({
  activities,
  programs,
  subjects,
  classes,
  quizzes,
  courses,
  users,
  activityForm,
  setActivityForm,
  editingActivity,
  setEditingActivity,
  activeActivityFormTab,
  setActiveActivityFormTab,
  formErrors,
  loading,
  setLoading,
  emailOptions,
  setEmailOptions,
  deleteModal,
  setDeleteModal,
  loadData,
  enrollmentProgramFilter,
  enrollmentSubjectFilter,
  enrollmentClassFilter,
  activityProgramOptions,
  activitySubjectOptions,
  activityClassOptions,
  handleDropdownChange,
  handleActivitySubmit,
  handleEditActivity,
  user
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  return (
    <div className="activities-tab">
      {editingActivity && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Activity: {editingActivity.id} - {editingActivity.title_en}
        </div>
      )}
      
      <RibbonTabs
        categories={[
          {
            id: 'activity-fields',
            items: [
              { key: 'basic', label: t('basic_info') || 'Basic Info', icon: getThemedIcon('ui', 'file_text', 14, theme) },
              { key: 'content', label: t('content') || 'Content', icon: getThemedIcon('ui', 'edit', 14, theme) },
              { key: 'settings', label: t('settings') || 'Settings', icon: getThemedIcon('ui', 'settings', 14, theme) }
            ]
          }
        ]}
        activeCategory="activity-fields"
        activeItem={activeActivityFormTab}
        onChange={({ item }) => setActiveActivityFormTab(item)}
      />
      
      <form onSubmit={handleActivitySubmit} className="dashboard-form">
        {/* Basic Info Tab */}
        {activeActivityFormTab === 'basic' && (
          <>
            <div className="form-row">
              <div style={{ border: '0px solid #ccc', padding: '0px', margin: '0px 0', borderRadius: '4px' }}>
                <Select
                  searchable
                  placeholder={t('all_programs')}
                  value={activityForm.programId}
                  onChange={(value) => {
                    handleDropdownChange(
                      setActivityForm,
                      'programId',
                      ['subjectId', 'classId']
                    )(value);
                  }}
                  options={activityProgramOptions}
                  style={{ width: '100%' }}
                  icon={getThemedIcon('ui', 'filter', 16, theme)}
                />
              </div>
              <Select
                searchable
                placeholder={t('all_subjects')}
                value={activityForm.subjectId || null}
                onChange={handleDropdownChange(
                  setActivityForm,
                  'subjectId',
                  ['classId']
                )}
                options={activitySubjectOptions}
                style={{ width: '100%' }}
                disabled={!activityForm.programId}
                icon={getThemedIcon('ui', 'filter', 16, theme)}
              />
              <Select
                searchable
                placeholder={t('all_classes')}
                value={activityForm.classId || null}
                onChange={handleDropdownChange(
                  setActivityForm,
                  'classId'
                )}
                options={activityClassOptions.map(o => {
                const classData = classes.find(c => c.docId === o.value);
                if (!classData) return o;
                return {
                  ...o,
                  label: `${classData.name || classData.code || 'Unnamed'}${classData.code ? ` (${classData.code})` : ''}${classData.term ? ` - ${classData.term}` : ''}${classData.year ? ` ${classData.year}` : ''}`
                };
              }).filter(o => !activityForm.subjectId || o.value === '' || classes.find(c => c.docId === o.value)?.subjectId === activityForm.subjectId)}
                style={{ width: '100%' }}
                disabled={!activityForm.subjectId}
                icon={getThemedIcon('ui', 'filter', 16, theme)}
              />
            </div>
            <div className="form-row">
              <div>
                <Input
                  type="text"
                  placeholder={t('activity_id') || 'Activity ID'}
                  value={activityForm.id}
                  onChange={(e) => setActivityForm({ ...activityForm, id: e.target.value })}
                  required
                  error={formErrors.id}
                />
              </div>
              <Select
                searchable
                placeholder={t('course') || 'Course'}
                value={activityForm.course}
                onChange={(e) => setActivityForm({ ...activityForm, course: e.target.value })}
                options={[
                  { value: '', label: lang === 'ar' ? 'لا يوجد فئة' : 'No Category' },
                  ...(courses && courses.length > 0 ? courses : [
                    { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
                    { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
                    { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
                    { docId: 'general', name_en: 'General', name_ar: 'عام' },
                  ]).map(c => ({
                    value: c.docId,
                    label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)
                  }))
                ]}
                style={{ width: '100%' }}
              />
              <Select
                searchable
                placeholder={t('type') || 'Activity Type'}
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                options={[
                  { value: 'quiz', label: t('quiz') || 'Quiz', icon: getThemedIcon('ui', 'target', 16, theme) },
                  { value: 'homework', label: t('homework') || 'Homework', icon: getThemedIcon('ui', 'file_text', 16, theme) },
                  { value: 'training', label: t('training') || 'Training', icon: getThemedIcon('ui', 'award', 16, theme) },
                  { value: 'labandproject', label: 'Lab & Project', icon: getThemedIcon('ui', 'zap', 16, theme) }
                ]}
                style={{ width: '100%' }}
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <Select
                  searchable
                  placeholder={t('difficulty') || 'Difficulty'}
                  value={activityForm.difficulty || 'beginner'}
                  onChange={(e) => {
                    if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                      toast?.showInfo?.('Difficulty is synced from quiz. Enable "Override quiz settings" to edit.');
                      return;
                    }
                    setActivityForm({ ...activityForm, difficulty: e.target.value });
                  }}
                  options={[
                    { value: 'beginner', label: t('beginner') || 'Beginner', icon: getThemedIcon('ui', 'book_open', 16, theme) },
                    { value: 'intermediate', label: t('intermediate') || 'Intermediate', icon: getThemedIcon('ui', 'target', 16, theme) },
                    { value: 'advanced', label: t('advanced') || 'Advanced', icon: getThemedIcon('ui', 'zap', 16, theme) }
                  ]}
                  style={{ width: '100%' }}
                  disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                />
                {activityForm.quizId && !activityForm.overrideQuizSettings && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '32px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#ef4444',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                    title="Locked - synced from quiz"
                  >
                    {getThemedIcon('ui', 'lock', 16, theme)}
                  </div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div>
                <Input
                  type="text"
                  placeholder={t('title_english') || t('title_en') || 'Title (English)'}
                  value={activityForm.title_en}
                  onChange={(e) => setActivityForm({ ...activityForm, title_en: e.target.value })}
                  required
                  error={formErrors.title_en}
                />
              </div>
              <Input
                type="text"
                placeholder={t('title_arabic') || t('title_ar') || 'Title (Arabic)'}
                value={activityForm.title_ar}
                onChange={(e) => setActivityForm({ ...activityForm, title_ar: e.target.value })}
              />
            </div>
          </>
        )}
        
        {/* Content Tab */}
        {activeActivityFormTab === 'content' && (
          <>
            <div className="form-row">
              <Textarea
                placeholder={t('description_english') || t('description_en') || 'Description (English)'}
                value={activityForm.description_en}
                onChange={(e) => setActivityForm({ ...activityForm, description_en: e.target.value })}
                rows={3}
                fullWidth
              />
              <Textarea
                placeholder={t('description_arabic') || t('description_ar') || 'Description (Arabic)'}
                value={activityForm.description_ar}
                onChange={(e) => setActivityForm({ ...activityForm, description_ar: e.target.value })}
                rows={3}
                fullWidth
              />
            </div>
            <div className="form-row">
              <div>
                <UrlInput
                  placeholder={t('activity_url_label') || 'Activity URL'}
                  value={activityForm.url}
                  onChange={(e) => setActivityForm({ ...activityForm, url: e.target.value })}
                  required={activityForm.type !== 'quiz'}
                  error={formErrors.url}
                  onOpen={(href) => window.open(href, '_blank')}
                  onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                  onClear={() => setActivityForm({ ...activityForm, url: '' })}
                  fullWidth
                />
              </div>
              <DatePicker
                type="datetime"
                value={activityForm.dueDate}
                onChange={(iso) => setActivityForm({ ...activityForm, dueDate: iso })}
                placeholder={t('pick_due_date') || 'Pick due date & time'}
              />
              <UrlInput
                placeholder={t('image_url') || 'Image URL'}
                value={activityForm.image}
                onChange={(e) => setActivityForm({ ...activityForm, image: e.target.value })}
                onOpen={(href) => window.open(href, '_blank')}
                onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                onClear={() => setActivityForm({ ...activityForm, image: '' })}
                fullWidth
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <NumberInput
                  placeholder={t('max_score') || 'Max Score'}
                  value={activityForm.maxScore || 100}
                  onChange={(e) => {
                    if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                      toast?.showInfo?.('Max score is synced from quiz. Enable "Override quiz settings" to edit.');
                      return;
                    }
                    setActivityForm({ ...activityForm, maxScore: Math.max(1, Number.parseInt(e.target.value || '0', 10)) });
                  }}
                  min={1}
                  fullWidth
                  disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                />
                {activityForm.quizId && !activityForm.overrideQuizSettings && (
                  <span 
                    style={{ 
                      position: 'absolute',
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#ef4444',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                    title="Locked - synced from quiz"
                  >
                    {getThemedIcon('ui', 'lock', 16, theme)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quiz Selector - Only show for quiz type */}
            {activityForm.type === 'quiz' && (
              <div className="form-row single-column">
                <Select
                  searchable
                  placeholder={t('select_quiz') || 'Select Quiz (Optional)'}
                  value={activityForm.quizId || ''}
                  onChange={(e) => {
                    const selectedQuizId = e.target.value;
                    const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
                    if (selectedQuiz) {
                      const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                      const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                      const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                        ? selectedQuiz.settings.allowRetake 
                        : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                      setActivityForm(prev => ({
                        ...prev,
                        quizId: selectedQuizId,
                        ...(prev.overrideQuizSettings ? {} : {
                          difficulty: quizDifficulty,
                          allowRetake: quizAllowRetake,
                          maxScore: quizMaxScore
                        })
                      }));
                    } else {
                      setActivityForm(prev => ({
                        ...prev,
                        quizId: ''
                      }));
                    }
                  }}
                  options={[
                    { value: '', label: t('select_quiz') || 'Select Quiz (Optional)' },
                    ...quizzes
                      .filter((quiz, index, self) => 
                        index === self.findIndex(q => q.id === quiz.id)
                      )
                      .filter(quiz => quiz.id)
                      .map((quiz) => ({
                        value: quiz.id,
                        label: `${quiz.title || 'Untitled Quiz'} (${quiz.questions?.length || quiz.questionCount || 0} questions)`
                      }))
                  ]}
                  style={{ width: '100%' }}
                />
                {activityForm.quizId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0f8ff', borderRadius: '6px' }}>
                    <ToggleSwitch
                      label="Override quiz settings (retake, difficulty, total marks)"
                      checked={activityForm.overrideQuizSettings || false}
                      onChange={(checked) => {
                        setActivityForm(prev => {
                          if (!checked && prev.quizId) {
                            const selectedQuiz = quizzes.find(q => q.id === prev.quizId);
                            if (selectedQuiz) {
                              const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                              const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                              const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                                ? selectedQuiz.settings.allowRetake 
                                : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                              return {
                                ...prev,
                                overrideQuizSettings: false,
                                difficulty: quizDifficulty,
                                allowRetake: quizAllowRetake,
                                maxScore: quizMaxScore
                              };
                            }
                          }
                          return { ...prev, overrideQuizSettings: checked };
                        });
                      }}
                    />
                    {!activityForm.overrideQuizSettings && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'lock', 12, theme)} Synced from quiz
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Settings Tab */}
        {activeActivityFormTab === 'settings' && (
          <>
            <div className="form-row compact-cols">
              <ToggleSwitch
                label={t('show_to_students') || 'Show to students'}
                checked={activityForm.show}
                onChange={(checked) => setActivityForm({ ...activityForm, show: checked })}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ToggleSwitch
                  label={t('allow_retakes') || 'Allow retakes'}
                  checked={activityForm.allowRetake || false}
                  onChange={(checked) => {
                    if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                      toast?.showInfo?.('Allow retakes is synced from quiz. Enable "Override quiz settings" to edit.');
                      return;
                    }
                    setActivityForm({ ...activityForm, allowRetake: checked });
                  }}
                  disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                />
                {activityForm.quizId && !activityForm.overrideQuizSettings && (
                  <span 
                    style={{ color: '#ef4444', flexShrink: 0 }} 
                    title="Locked - synced from quiz"
                  >
                    {getThemedIcon('ui', 'lock', 14, theme)}
                  </span>
                )}
              </div>
              <ToggleSwitch
                label={t('featured') || 'Featured'}
                checked={activityForm.featured}
                onChange={(checked) => setActivityForm({ ...activityForm, featured: checked })}
              />
              <ToggleSwitch
                label={t('optional') || 'Optional (if off: Required)'}
                checked={activityForm.optional}
                onChange={(checked) => setActivityForm({ ...activityForm, optional: checked })}
              />
              <ToggleSwitch
                label={t('requires_submission') || 'Requires Submission'}
                checked={activityForm.requiresSubmission}
                onChange={(checked) => setActivityForm({ ...activityForm, requiresSubmission: checked })}
              />
            </div>
            
            {/* Email Notification Options */}
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
                label={t('send_email_to_students') || 'Send email to students'}
                checked={emailOptions.sendEmail}
                onChange={(checked) => setEmailOptions({ ...emailOptions, sendEmail: checked })}
              />
              <ToggleSwitch
                label={t('create_announcement') || 'Create announcement'}
                checked={emailOptions.createAnnouncement}
                onChange={(checked) => setEmailOptions({ ...emailOptions, createAnnouncement: checked })}
              />
              {emailOptions.sendEmail && (
            <div>
              <small>{t('language') || 'Language'}</small>
              <Select
                searchable
                placeholder={t('language') || 'Language'}
                value={emailOptions.emailLang}
                onChange={(e) => setEmailOptions({ ...emailOptions, emailLang: e.target.value })}
                options={[
                  { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                  { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                  { value: 'both', label: lang === 'ar' ? 'ثنائي اللغة' : 'Bilingual' }
                ]}
              />
            </div>
          )}
        </div>
        
        {/* Form Actions - Show on all tabs */}
        <div className="form-actions">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activeActivityFormTab !== 'basic' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (activeActivityFormTab === 'settings') {
                      setActiveActivityFormTab('content');
                    } else if (activeActivityFormTab === 'content') {
                      setActiveActivityFormTab('basic');
                    }
                  }}
                >
                  ← Previous
                </Button>
              )}
              {activeActivityFormTab !== 'settings' && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    if (activeActivityFormTab === 'basic') {
                      setActiveActivityFormTab('content');
                    } else if (activeActivityFormTab === 'content') {
                      setActiveActivityFormTab('settings');
                    }
                  }}
                >
                  Next →
                </Button>
              )}
              {activeActivityFormTab === 'settings' && (
                <Button type="submit" variant="primary" loading={loading}>
                  {(editingActivity ? (t('update') || 'Update') : (t('save') || 'Save'))}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingActivity(null);
                  setActivityForm({
                    id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
                    type: 'homework', classId: '', difficulty: 'easy', maxScore: 100,
                    allowRetake: false, dueDate: null, show: true, quizId: '',
                    overrideQuizSettings: false
                  });
                  setActiveActivityFormTab('basic');
                }}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
          </>
        )}
      </form>
      
      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={activities.filter(a => {
            if (enrollmentClassFilter !== 'all') {
              return a.classId === enrollmentClassFilter;
            }
            if (enrollmentSubjectFilter !== 'all') {
              const classItem = classes.find(c => (c.id || c.docId) === a.classId);
              return classItem?.subjectId === enrollmentSubjectFilter;
            }
            if (enrollmentProgramFilter !== 'all') {
              const classItem = classes.find(c => (c.id || c.docId) === a.classId);
              const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
              return subject?.programId === enrollmentProgramFilter;
            }
            return true;
          })}
          getRowId={(row) => row.docId || row.id}
          columns={[
            { field: 'id', headerName: t('id_col'), width: 90 },
            { field: 'title_en', headerName: t('title_en_col'), flex: 1, minWidth: 160 },
            {
              field: 'programId',
              headerName: t('program') || 'Program',
              width: 150,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.programId || row.program || params?.value || null;
              },
              renderCell: (params) => {
                const programId = params.value || params.row?.programId || params.row?.program;
                if (!programId) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                    {getThemedIcon('ui', 'archive', 16, theme)} General
                  </span>
                );
                const program = programs.find(p => (p.docId || p.id) === programId);
                if (!program) return '—';
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
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.subjectId || row.subject || params?.value || null;
              },
              renderCell: (params) => {
                const subjectId = params.value || params.row?.subjectId || params.row?.subject;
                if (!subjectId) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                    {getThemedIcon('ui', 'book_open', 16, theme)} General
                  </span>
                );
                const subject = subjects.find(s => (s.docId || s.id) === subjectId);
                if (!subject) return '—';
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
              width: 180,
              renderCell: (params) => {
                if (!params.value) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                    {getThemedIcon('ui', 'users',16, theme)} General
                  </span>
                );
                const classItem = classes.find(c => (c.docId || c.id) === params.value);
                if (!classItem) return params.value;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {getThemedIcon('ui', 'users', 16, theme)} {classItem.name}{classItem.code ? ` (${classItem.code})` : ''}
                  </span>
                );
              }
            },
            { field: 'course', headerName: t('course_col') || 'Course', width: 140 },
            { 
              field: 'type', 
              headerName: t('type_col') || 'Type', 
              width: 140,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.type || params?.value || null;
              },
              renderCell: (params) => {
                const type = params.value || params.row?.type;
                if (!type) return '—';
                const typeMap = {
                  'quiz': { icon: getThemedIcon('ui', 'target',16, theme), text: 'Quiz' },
                  'homework': { icon: getThemedIcon('ui', 'home', 16, theme), text: 'Homework' },
                  'training': { icon: getThemedIcon('ui', 'target',16, theme), text: 'Training' }
                };
                const typeConfig = typeMap[type] || { icon: getThemedIcon('ui', 'file_text', 16, theme), text: type };
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {typeConfig.icon} {typeConfig.text}
                  </span>
                );
              }
            },
            { 
              field: 'difficulty', 
              headerName: t('difficulty_col'), 
              width: 140,
              renderCell: (params) => {
                const difficulty = params.value;
                if (!difficulty) return '—';
                const difficultyMap = {
                  'easy': { icon: getThemedIcon('ui', 'check_circle',16, theme), text: 'Easy' },
                  'medium': { icon: getThemedIcon('ui', 'alert_triangle', 16, theme), text: 'Medium' },
                  'hard': { icon: getThemedIcon('ui', 'x_circle',16, theme), text: 'Hard' }
                };
                const difficultyConfig = difficultyMap[difficulty.toLowerCase()] || { icon: getThemedIcon('ui', 'info', 16, theme), text: difficulty };
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {difficultyConfig.icon} {difficultyConfig.text}
                  </span>
                );
              }
            },
            {
              field: 'maxScore',
              headerName: t('max_score') || 'Max Score',
              width: 120,
              renderCell: (params) => params.value || '—'
            },
            {
              field: 'allowRetake',
              headerName: t('allow_retakes') || 'Retake',
              width: 100,
              renderCell: (params) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  {params.value ? 
                    <>{getThemedIcon('ui', 'check_circle', 16, theme)} Yes</> : 
                    <>{getThemedIcon('ui', 'x_circle', 16, theme)} No</>
                  }
                </span>
              )
            },
            {
              field: 'quizId',
              headerName: t('quiz') || 'Quiz',
              width: 200,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.quizId || row.quiz || params?.value || null;
              },
              renderCell: (params) => {
                const quizId = params.value || params.row?.quizId || params.row?.quiz;
                if (!quizId) return '—';
                const quiz = quizzes.find(q => q.id === quizId);
                return quiz ? (quiz.title || 'Untitled Quiz') : quizId;
              }
            },
            {
              field: 'dueDate', headerName: t('assignment_due_date_col'), flex: 1, minWidth: 200,
              valueGetter: (params) => params.value,
              renderCell: (params) => (params.value ? formatDateTime(params.value) : (t('no_deadline_set') || 'No deadline set'))
            },
            {
              field: 'createdAt', headerName: 'Created Date', width: 180,
              valueGetter: (params) => params.value,
              renderCell: (params) => {
                if (!params.value) return 'Unknown';
                // Log the raw value for debugging
                logger.debug('Activities Date Debug - Raw params.value:', params.value);
                logger.debug('Activities Date Debug - Type:', typeof params.value);
                logger.debug('Activities Date Debug - Has toDate:', typeof params.value?.toDate);
                let date;
                if (params.value?.toDate) {
                  date = params.value.toDate();
                  logger.debug('Activities Date Debug - Using toDate():', date);
                } else if (params.value?.seconds) {
                  date = new Date(params.value.seconds * 1000);
                  logger.debug('Activities Date Debug - Using seconds:', params.value.seconds, '-> date:', date);
                } else if (typeof params.value === 'string' || typeof params.value === 'number') {
                  date = new Date(params.value);
                  logger.debug('Activities Date Debug - Using new Date():', date);
                } else {
                  date = new Date(params.value);
                  logger.debug('Activities Date Debug - Fallback new Date():', date);
                }
                logger.debug('Activities Date Debug - Final date:', date, 'isValid:', !isNaN(date.getTime()));
                if (isNaN(date.getTime())) {
                  return 'Invalid Date';
                }
                return formatQatarDate(date);
              }
            },
            {
              field: 'show', headerName: t('visible') || 'Visible', width: 120,
              renderCell: (params) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  {params.value ? 
                    <>{getThemedIcon('ui', 'eye',16, theme)} {t('yes') || 'Yes'}</> : 
                    <>{getThemedIcon('ui', 'eye_off', 16, theme)} {t('no') || 'No'}</>
                  }
                </span>
              )
            },
            {
              field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
              renderCell: (params) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="ghost" className="editHover" icon={getThemedIcon('ui', 'edit', 16, theme)} onClick={() => handleEditActivity(params.row)}>
                    {t('edit') || 'Edit'}
                  </Button>
                  <Button size="sm" variant="ghost" className="deleteHover" icon={getThemedIcon('ui', 'trash', 16, theme)} style={{ color: '#dc2626' }} onClick={() => {
                    setDeleteModal({
                      open: true,
                      item: params.row,
                      type: 'activity',
                      onConfirm: async () => {
                        const activity = params.row;
                        setActivities(prev => prev.filter(a => (a.docId || a.id) !== (activity.docId || activity.id)));
                        try {
                          const result = await deleteActivity(activity.docId);
                          if (result.success) {
                            // Log activity
                            try {
                              await logActivity(ACTIVITY_TYPES.ACTIVITY_DELETED, {
                                activityId: activity.docId,
                                activityTitle: activity.title_en || activity.title,
                                activityType: activity.type
                              });
                            } catch (e) { }
                            toast?.showSuccess('Activity deleted successfully!');
                            await loadData();
                            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                          } else {
                            setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                            toast?.showError('Error deleting activity: ' + result.error);
                            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                          }
                        } catch (error) {
                          setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                          toast?.showError('Error deleting activity: ' + error.message);
                          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                        }
                      }
                    });
                  }}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          checkboxSelection
          exportFileName="activities"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading..." : undefined} fancyVariant="dots"
        />
      </div>
    </div>
  );
};

export default ActivitiesPage;
