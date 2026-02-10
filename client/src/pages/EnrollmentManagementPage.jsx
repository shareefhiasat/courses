import React, { useState, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, UserSelect, RibbonTabs, AdvancedDataGrid } from '@ui';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { USER_ROLES } from '@constants';
import { ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { getClasses } from '@firebaseServices/classService';

const EnrollmentManagementPage = ({
  enrollments,
  users,
  activities,
  submissions,
  enrollmentForm,
  setEnrollmentForm,
  activeEnrollmentTab,
  setActiveEnrollmentTab,
  deleteModal,
  setDeleteModal,
  loading,
  setLoading,
  loadData,
  theme,
  formatQatarDateOnly,
  ensureString
}) => {
  const { t } = useLang();
  const toast = useToast();

  // Local state for programs, subjects, and classes (NotificationDrawer pattern)
  const [localPrograms, setLocalPrograms] = useState([]);
  const [localSubjects, setLocalSubjects] = useState([]);
  const [localClasses, setLocalClasses] = useState([]);

  // Load programs, subjects, and classes (NotificationDrawer pattern)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [programsRes, subjectsRes, classesRes] = await Promise.all([
          getPrograms(),
          getSubjects(),
          getClasses()
        ]);
        if (programsRes.success) setLocalPrograms(programsRes.data || []);
        if (subjectsRes.success) setLocalSubjects(subjectsRes.data || []);
        if (classesRes.success) setLocalClasses(classesRes.data || []);
      } catch (error) {
        console.error('🔍 [EnrollmentManagementPage] Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Handler functions for dropdown changes
  const handleEnrollmentProgramChange = (e) => {
    const programId = e.target.value;
    setEnrollmentForm(prev => ({ 
      ...prev, 
      programId, 
      subjectId: '', 
      classId: '' 
    }));
  };

  const handleEnrollmentSubjectChange = (e) => {
    const subjectId = e.target.value;
    setEnrollmentForm(prev => ({ 
      ...prev, 
      subjectId, 
      classId: '' 
    }));
  };

  return (
    <div className="enrollments-section" style={{ marginTop: '2rem' }}>
      <RibbonTabs
        categories={[
          {
            id: 'enrollment-fields',
            items: [
              { key: 'user', label: 'User Info', icon: getThemedIcon('ui', 'user', 14, theme) },
              { key: 'class', label: 'Class Info', icon: getThemedIcon('ui', 'home', 14, theme) },
              { key: 'role', label: 'Role', icon: getThemedIcon('ui', 'shield', 14, theme) }
            ]
          }
        ]}
        activeCategory="enrollment-fields"
        activeItem={activeEnrollmentTab}
        onChange={({ category, item }) => setActiveEnrollmentTab(item)}
      />
      <form onSubmit={async (e) => {
        e.preventDefault();
        // Check if enrollment already exists
        const existingEnrollment = enrollments.find(e =>
          e.userId === enrollmentForm.userId && e.classId === enrollmentForm.classId
        );
        if (existingEnrollment) {
          toast?.showError('This user is already enrolled in this class');
          return;
        }
        setLoading(true);
        try {
          const { addEnrollment } = await import('@firebaseServices/enrollmentService');
          const result = await addEnrollment(enrollmentForm);
          if (result.success) {
            // Log activity
            try {
              await logActivity(ACTIVITY_TYPES.ENROLLMENT_CREATED, {
                enrollmentId: result.id,
                userId: enrollmentForm.userId,
                classId: enrollmentForm.classId,
                role: enrollmentForm.role
              });
            } catch (e) { }
            await loadData();
            setEnrollmentForm({ userId: '', classId: '', role: USER_ROLES.STUDENT, programId: '', subjectId: '', year: '', term: '' });
            toast?.showSuccess('Enrollment added successfully!');
          } else {
            toast?.showError('Error: ' + result.error);
          }
        } catch (error) {
          toast?.showError('Error: ' + error.message);
        } finally {
          setLoading(false);
        }
      }} className="dashboard-form">
        {/* User Info Tab */}
        {activeEnrollmentTab === 'user' && (
          <div className="form-row wide-cols">
            <UserSelect
              users={users}
              enrollments={enrollments}
              value={enrollmentForm.userId}
              onChange={e => setEnrollmentForm({ ...enrollmentForm, userId: e.target.value })}
              placeholder={t('select_user') || 'Select User'}
              roleFilter={[USER_ROLES.STUDENT]}
              showEnrollments={true}
              showStatus={true}
              searchable={true}
              required
            />
          </div>
        )}
        {/* Class Info Tab */}
        {activeEnrollmentTab === 'class' && (
          <div className="form-row wide-cols">
            <ProgramsSelect
              programs={localPrograms}
              subjects={localSubjects}
              classes={localClasses}
              selectedProgram={enrollmentForm.programId}
              selectedSubject={enrollmentForm.subjectId}
              selectedClass={enrollmentForm.classId}
              onProgramChange={(programId) => setEnrollmentForm(prev => ({ ...prev, programId, subjectId: '', classId: '' }))}
              onSubjectChange={(subjectId) => setEnrollmentForm(prev => ({ ...prev, subjectId, classId: '' }))}
              onClassChange={(classId) => setEnrollmentForm(prev => ({ ...prev, classId }))}
              showLabels={false}
              required
            />
          </div>
        )}
        {/* Role Tab */}
        {activeEnrollmentTab === 'role' && (
          <div className="form-row wide-cols">
            <Select
              searchable
              placeholder={t('role') || 'Role'}
              value={enrollmentForm.role}
              onChange={e => setEnrollmentForm({ ...enrollmentForm, role: e.target.value })}
              options={[
                { value: USER_ROLES.STUDENT, label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#16a34a' }}>
                      {getThemedIcon('ui', 'user', 16, theme)}
                    </span>
                    {t('student') || 'Student'}
                  </span>
                )}
              ]}
            />
          </div>
        )}
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading} size="medium">
            {t('save') || 'Save'}
          </Button>
        </div>
      </form>
      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={enrollments}
          getRowId={(row) => row.docId || row.id}
          columns={[
          {
            field: 'userId', headerName: t('user_col'), flex: 1, minWidth: 250,
            renderCell: (params) => {
              const user = users.find(u => (u.docId || u.id) === params.value);
              if (!user) return params.value;
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {/*{getThemedIcon('ui', 'user', 16, theme)} */}
                  {user.displayName || user.realName || '—'}{user.email ? ` (${user.email})` : ''}
                </span>
              );
            }
          },
          {
            field: 'programName',
            headerName: t('program') || 'Program',
            flex: 1,
            minWidth: 180,
            valueGetter: (params) => {
              // Try to get the program name directly from the row
              const row = params.row || {};
              const programName = row.programName || 
                               (row.program && (row.program.name_en || row.program.name)) ||
                               (row.programId && localPrograms.find(p => (p.docId || p.id) === row.programId)?.name_en);
              return programName || params.value || '-';
            },
            renderCell: (params) => {
              const row = params.row || {};
              const programName = row.programName || 
                               (row.program && (row.program.name_en || row.program.name)) ||
                               (row.programId && localPrograms.find(p => (p.docId || p.id) === row.programId)?.name_en);
              if (!programName && !params.value) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                    {/*{getThemedIcon('ui', 'target', 16, theme)} */}
                    -
                  </span>
                );
              }
              const finalProgramName = programName || params.value || '-';
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {/*{getThemedIcon('ui', 'target', 16, theme)} */}
                  {finalProgramName}
                </span>
              );
            }
          },
          {
            field: 'subjectName',
            headerName: t('subject_col') || 'Subject',
            flex: 1,
            minWidth: 180,
            valueGetter: (params) => {
              // Try to get the subject name directly from the row
              const row = params.row || {};
              const subjectName = row.subjectName || 
                               (row.subject && (row.subject.name_en || row.subject.name)) ||
                               (row.subjectId && localSubjects.find(s => (s.docId || s.id) === row.subjectId)?.name_en);
              return subjectName || params.value || '-';
            },
            renderCell: (params) => {
              const row = params.row || {};
              const subjectName = row.subjectName || 
                               (row.subject && (row.subject.name_en || row.subject.name)) ||
                               (row.subjectId && localSubjects.find(s => (s.docId || s.id) === row.subjectId)?.name_en);
              if (!subjectName && !params.value) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                    {/*{getThemedIcon('ui', 'book_open', 16, theme)} */}
                    -
                  </span>
                );
              }
              const finalSubjectName = subjectName || params.value || '-';
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {/*{getThemedIcon('ui', 'book_open', 16, theme)} */}
                  {finalSubjectName}
                </span>
              );
            }
          },
          {
            field: 'classId', headerName: t('class_col'), flex: 1, minWidth: 200,
            renderCell: (params) => {
              const classItem = localClasses.find(c => (c.docId || c.id) === params.value);
              if (!classItem) return params.value;
              const codePart = classItem.code ? ` (${classItem.code})` : '';
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {/*{getThemedIcon('ui', 'users', 16, theme)} */}
                  {classItem.name}{codePart}
                </span>
              );
            }
          },
          {
            field: 'role', headerName: t('role_col'), width: 150,
            renderCell: (params) => {
              const roleMap = {
                [USER_ROLES.STUDENT]: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getThemedIcon('ui', 'user', 16, theme)} Student</span>, // User icon for student role
                'ta': <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>👨‍🏫 TA</span>,
                [USER_ROLES.INSTRUCTOR]: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>👩‍🏫 Instructor</span>
              };
              return roleMap[params.value] || params.value;
            }
          },
          {
            field: 'createdAt', headerName: t('enrolled_col'), width: 180,
            valueGetter: (params) => params.value,
            renderCell: (params) => params.value ? formatQatarDateOnly(params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value))) : 'Unknown'
          },
          {
            field: 'actions', headerName: t('actions') || 'Actions', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="ghost" className="deleteHover" icon={getThemedIcon('ui', 'trash', 16, theme)} style={{ color: '#dc2626' }} onClick={() => { // Trash icon for delete enrollment action
                  const enrollment = params.row;
                  const user = users.find(u => (u.docId || u.id) === enrollment.userId);
                  const classItem = localClasses.find(c => (c.docId || c.id) === enrollment.classId);
                  // Submissions are quiz/activity submissions (student work)
                  const userSubmissions = submissions.filter(s => s.userId === enrollment.userId && s.activityId);
                  const relatedActivities = activities.filter(a => a.classId === enrollment.classId);
                  // Create readable item name
                  const userName = user ? (user.displayName || user.realName || user.email || 'Unknown User') : 'Unknown User';
                  const className = classItem ? (classItem.name || classItem.code || 'Unknown Class') : 'Unknown Class';
                  const itemName = `${userName} → ${className}`;
                  setDeleteModal({
                    open: true,
                    item: { ...enrollment, _displayName: itemName },
                    type: 'enrollment',
                    onConfirm: async () => {
                      try {
                        const { deleteEnrollment } = await import('@firebaseServices/enrollmentService');
                        const result = await deleteEnrollment(enrollment.docId);
                        if (result.success) {
                          // Log activity
                          try {
                            await logActivity(ACTIVITY_TYPES.ENROLLMENT_DELETED, {
                              enrollmentId: enrollment.docId,
                              userId: enrollment.userId,
                              classId: enrollment.classId
                            });
                          } catch (e) { }
                          await loadData();
                          toast?.showSuccess('Enrollment removed successfully!');
                          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                        } else {
                          toast?.showError('Error: ' + result.error);
                          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                        }
                      } catch (error) {
                        toast?.showError('Error: ' + error.message);
                        setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                      }
                    },
                    relatedData: {
                      'Activity/Quiz Submissions': userSubmissions.map(s => ({
                        ...s,
                        _label: `Activity/Quiz Submission`
                      })),
                      'Related Activities': relatedActivities
                    },
                    warningMessage: userSubmissions.length > 0 
                      ? `This enrollment has ${userSubmissions.length} activity/quiz submission(s) that should be deleted first.`
                      : null
                  });
                }}>
                  {t('delete') || 'Delete'}
                </Button>
              </div>
            )
          }
        ]}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="enrollments"
          showExportButton
          exportLabel={t('export') || 'Export'}
        />
      </div>
    </div>
  );
};

export default EnrollmentManagementPage;
