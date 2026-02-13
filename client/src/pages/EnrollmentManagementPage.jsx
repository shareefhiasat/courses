import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, UserSelect, AdvancedDataGrid } from '@ui';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { USER_ROLES } from '@constants';
import { ACTIVITY_LOG_TYPES, logActivity } from '@firebaseServices/activityLogger';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { getClasses } from '@firebaseServices/classService';
import logger from '@utils/logger';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';

const EnrollmentManagementPage = () => {
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal: deleteModalState, deleteItem, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // Refs for form fields to avoid re-renders on keystroke
  const userSelectRef = useRef(null);

  // Internal state management
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    userId: '', 
    classId: '', 
    role: USER_ROLES.STUDENT, 
    programId: '', 
    subjectId: '', 
    year: '', 
    term: '' 
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Load all data
  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        enrollmentsResult,
        usersResult,
        activitiesResult,
        submissionsResult
      ] = await Promise.all([
        import('@firebaseServices/enrollmentService').then(m => m.getEnrollments()),
        import('@firebaseServices/userService').then(m => m.getUsers()),
        import('@firebaseServices/activityService').then(m => m.getActivities()),
        import('@firebaseServices/submissionService').then(m => m.getSubmissions())
      ]);
      
      if (enrollmentsResult.success) setEnrollments(enrollmentsResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (activitiesResult.success) setActivities(activitiesResult.data || []);
      if (submissionsResult.success) setSubmissions(submissionsResult.data || []);
    } catch (error) {
      logger.error('[EnrollmentManagementPage] Error loading data:', error);
      toast?.showError(t('failed_to_load_data') || 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper function for date formatting
  const formatQatarDateOnly = (date) => {
    if (!date) return 'Unknown';
    const dateObj = date?.toDate ? date.toDate() : (date?.seconds ? new Date(date.seconds * 1000) : new Date(date));
    return dateObj.toLocaleDateString('en-QA');
  };

  const ensureString = (value) => {
    return value ? String(value) : '';
  };

  // Local state for programs, subjects, and classes (NotificationDrawer pattern)
  const [localPrograms, setLocalPrograms] = useState([]);
  const [localSubjects, setLocalSubjects] = useState([]);
  const [localClasses, setLocalClasses] = useState([]);

  // Load programs, subjects, and classes (NotificationDrawer pattern)
  const loadFilters = useCallback(async () => {
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
      logger.error('[EnrollmentManagementPage] Error loading filters:', error);
      toast?.showError(t('failed_to_load_filters') || 'Failed to load filters');
    }
  }, [t, toast]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Memoized handler functions for dropdown changes
  const handleEnrollmentProgramChange = useCallback((e) => {
    const programId = e.target.value;
    setEnrollmentForm(prev => ({ 
      ...prev, 
      programId, 
      subjectId: '', 
      classId: '' 
    }));
  }, [setEnrollmentForm]);

  const handleEnrollmentSubjectChange = useCallback((e) => {
    const subjectId = e.target.value;
    setEnrollmentForm(prev => ({ 
      ...prev, 
      subjectId, 
      classId: '' 
    }));
  }, [setEnrollmentForm]);

  const handleEnrollmentSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Check if enrollment already exists
    const existingEnrollment = enrollments.find(enrollment =>
      enrollment.userId === enrollmentForm.userId && enrollment.classId === enrollmentForm.classId
    );
    if (existingEnrollment) {
      toast?.showError(t('user_already_enrolled') || 'This user is already enrolled in this class');
      return;
    }
    
    setLoading(true);
    try {
      const { addEnrollment } = await import('@firebaseServices/enrollmentService');
      const result = await addEnrollment(enrollmentForm);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_CREATED, {
            enrollmentId: result.id,
            userId: enrollmentForm.userId,
            classId: enrollmentForm.classId,
            role: enrollmentForm.role
          });
        } catch (error) {
          logger.warn('[EnrollmentManagementPage] Failed to log activity:', error);
        }
        await loadData();
        setEnrollmentForm({ userId: '', classId: '', role: USER_ROLES.STUDENT, programId: '', subjectId: '', year: '', term: '' });
        toast?.showSuccess(t('enrollment_added_successfully') || 'Enrollment added successfully!');
      } else {
        toast?.showError(t('error') + ': ' + result.error);
      }
    } catch (error) {
      logger.error('[EnrollmentManagementPage] Error adding enrollment:', error);
      toast?.showError(t('error') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [enrollments, enrollmentForm, setLoading, loadData, setEnrollmentForm, toast, t]);

  const enrollmentRows = useMemo(() => {
    return (enrollments || []).map((row) => {
      const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
      const subject = classItem?.subjectId
        ? localSubjects.find(s => (s.docId || s.id) === classItem.subjectId)
        : null;
      const program = subject?.programId
        ? localPrograms.find(p => (p.docId || p.id) === subject.programId)
        : null;

      const subjectName = subject
        ? (subject.name_en || subject.name_ar || subject.name || subject.code || 'N/A')
        : 'N/A';
      const programName = program
        ? (program.name_en || program.name_ar || program.name || program.code || 'N/A')
        : 'N/A';
      const className = classItem
        ? `${classItem.name || classItem.code || 'N/A'}${classItem.code ? ` (${classItem.code})` : ''}`
        : 'N/A';

      return {
        ...row,
        programNameDisplay: programName,
        subjectNameDisplay: subjectName,
        classNameDisplay: className
      };
    });
  }, [enrollments, localClasses, localSubjects, localPrograms]);

  return (
    <div className="enrollments-section" style={{ marginTop: '2rem' }}>
      {dataLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3', 
              borderTop: '4px solid #3498db', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <div>{t('loading') || 'Loading...'}</div>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleEnrollmentSubmit} className="dashboard-form">
        <div className="form-row wide-cols">
          <UserSelect
            ref={userSelectRef}
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
        
        <div className="form-row wide-cols">
          <ProgramsSelect
            programs={localPrograms}
            subjects={localSubjects}
            classes={localClasses}
            selectedProgram={enrollmentForm.programId}
            selectedSubject={enrollmentForm.subjectId}
            selectedClass={enrollmentForm.classId}
            onProgramChange={handleEnrollmentProgramChange}
            onSubjectChange={handleEnrollmentSubjectChange}
            onClassChange={(classId) => setEnrollmentForm(prev => ({ ...prev, classId }))}
            showLabels={false}
            required
          />
        </div>
        
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
        
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading} size="medium">
            {t('save') || 'Save'}
          </Button>
        </div>
      </form>
      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={enrollmentRows}
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
            field: 'programNameDisplay',
            headerName: t('program') || 'Program',
            flex: 1,
            minWidth: 180
          },
          {
            field: 'subjectNameDisplay',
            headerName: t('subject_col') || 'Subject',
            flex: 1,
            minWidth: 180
          },
          {
            field: 'classNameDisplay', headerName: t('class_col'), flex: 1, minWidth: 200
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
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="deleteHover" 
                  icon={getThemedIcon('ui', 'trash', 16, theme)} 
                  style={{ color: '#dc2626' }} 
                  onClick={() => {
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
                    
                    deleteItem(
                      { ...enrollment, _displayName: itemName },
                      async () => {
                        try {
                          const { deleteEnrollment } = await import('@firebaseServices/enrollmentService');
                          const result = await deleteEnrollment(enrollment.docId);
                          if (result.success) {
                            // Log activity
                            try {
                              await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_DELETED, {
                                enrollmentId: enrollment.docId,
                                userId: enrollment.userId,
                                classId: enrollment.classId
                              });
                            } catch (error) {
                              logger.warn('[EnrollmentManagementPage] Failed to log activity:', error);
                            }
                            await loadData();
                            toast?.showSuccess(t('enrollment_removed_successfully') || 'Enrollment removed successfully!');
                          } else {
                            throw new Error(result.error);
                          }
                        } catch (error) {
                          logger.error('[EnrollmentManagementPage] Error deleting enrollment:', error);
                          throw error;
                        }
                      },
                      {
                        'Activity/Quiz Submissions': userSubmissions.map(s => ({
                          ...s,
                          _label: `Activity/Quiz Submission`
                        })),
                        'Related Activities': relatedActivities
                      },
                      userSubmissions.length > 0 
                        ? t('enrollment_delete_warning') || `This enrollment has ${userSubmissions.length} activity/quiz submission(s) that should be deleted first.`
                        : null
                    );
                  }}
                >
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
      
      {/* Delete Modal */}
      <DeleteModal 
        modal={deleteModalState} 
        onConfirm={handleDeleteConfirm} 
        onHide={hideDeleteModal}
      />
        </>
      )}
    </div>
  );
};

export default EnrollmentManagementPage;
