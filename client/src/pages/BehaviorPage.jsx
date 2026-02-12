import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input, ProgramsSelect } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { getPrograms, getSubjects, fetchSubject, fetchProgram } from '@firebaseServices/programService';
import { getClasses, fetchClass } from '@firebaseServices/classService';
import { getEnrollments, getStudentsByClass } from '@firebaseServices/enrollmentService';
import { createBehavior, updateBehavior, deleteBehavior, loadBehaviors } from '@firebaseServices/behaviorService';
import { getAllUsers, getUserById, getUsersByIds } from '@firebaseServices/userService';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorTypeById } from '@constants/behaviorTypes.jsx';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES,
  COMMON_GRID_COLUMNS
} from '@constants/pageTypes';
import styles from './ProgramsManagementPage.module.css';

const BehaviorPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [behaviorsRaw, setBehaviorsRaw] = useState([]);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectStudents, setSelectStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [formData, setFormData] = useState({
    programId: '',
    studentId: '',
    classId: '',
    subjectId: '',
    type: '',
    description: '',
    points: -1,
    comment: ''
  });
  const [saving, setSaving] = useState(false);

  // Handler functions - same pattern as ActivitiesPage
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

  // Refs for text inputs to prevent re-renders
  const descriptionRef = useRef(null);
  const commentRef = useRef(null);
  const pointsRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = formData.description || '';
    if (commentRef.current) commentRef.current.value = formData.comment || '';
    if (pointsRef.current) pointsRef.current.value = formData.points || -1;
  }, [editingBehavior, formData.description, formData.comment, formData.points]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      description: descriptionRef.current?.value ?? formData.description,
      comment: commentRef.current?.value ?? formData.comment,
      points: parseInt(pointsRef.current?.value) || formData.points || -1
    };
  }, [formData.description, formData.comment, formData.points]);

  // Filter enrollments based on user role for student dropdown
  const filteredEnrollmentsForSelect = useMemo(() => {
    if (isSuperAdmin || isAdmin || isHR) {
      return enrollments; // Admins/HR see all students
    }
    if (isInstructor) {
      // Instructors see students from their classes
      return enrollments.filter(enrollment => {
        const classItem = classes.find(c => (c.docId || c.id) === enrollment.classId);
        return classItem && (
          classItem.instructorId === user?.uid ||
          classItem.ownerEmail === user?.email ||
          classItem.instructor === user?.email
        );
      });
    }
    return []; // Other roles see no students
  }, [enrollments, classes, user?.uid, user?.email, isAdmin, isSuperAdmin, isHR, isInstructor]);

  useEffect(() => {
    const loadSelectStudents = async () => {
      if (isSuperAdmin || isAdmin || isHR) {
        const result = await getAllUsers({ studentsOnly: true });
        setSelectStudents(result.success ? result.data : []);
        return;
      }
      if (isInstructor) {
        const enrollmentUserIds = enrollments
          .map(e => e.userId || e.userDocId)
          .filter(Boolean);
        const result = await getUsersByIds(enrollmentUserIds);
        const usersMap = result.success ? result.data : {};
        setSelectStudents(Object.values(usersMap).filter(Boolean));
        return;
      }
      setSelectStudents([]);
    };
    loadSelectStudents();
  }, [enrollments, isSuperAdmin, isAdmin, isHR, isInstructor]);

  
  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin && !isHR) return;
    loadData();
    // Log page view
    try {
          } catch (e) { }
  }, [isInstructor, isAdmin, isSuperAdmin, isHR]);

  useEffect(() => {
    loadBehaviorsData();
  }, [classes, programs, subjects, toast, t]);

  // Load students when class changes
  useEffect(() => {
    if (!formData.classId) {
      setStudents([]);
      return;
    }
    (async () => {
      try {
        const result = await getStudentsByClass(formData.classId);
        if (result.success) {
          setStudents(result.data);
        } else {
          logger.error('Failed to load students:', result.error);
          setStudents([]);
        }
      } catch (error) {
        logger.error('Failed to load students:', error);
        setStudents([]);
      }
    })();
  }, [formData.classId]);

  // Load students when editing behavior changes (for edit mode)
  useEffect(() => {
    if (editingBehavior && editingBehavior.classId) {
      (async () => {
        try {
          const result = await getStudentsByClass(editingBehavior.classId);
          if (result.success) {
            setStudents(result.data);
          } else {
            logger.error('Failed to load students for edit:', result.error);
            setStudents([]);
          }
        } catch (error) {
          logger.error('Failed to load students for edit:', error);
          setStudents([]);
        }
      })();
    }
  }, [editingBehavior]);

  const loadData = async () => {
    try {
      const [classesRes, programsRes, subjectsRes, enrollmentsRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects(),
        getEnrollments()
      ]);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
    } catch (error) {
      logger.error('Failed to load data:', error);
    }
  };

  const loadBehaviorsData = () => {
    loadBehaviors({
      setBehaviors: setBehaviorsRaw,
      setPageState,
      toast,
      t,
      classes,
      programs,
      subjects,
      filters: {},
      getUserById,
      fetchClass,
      fetchSubject,
      fetchProgram
    });
  };

  const filteredBehaviors = useMemo(() => {
    let filtered = [...behaviorsRaw];
    if (programFilter) {
      filtered = filtered.filter(b => {
        if (b.subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === b.subjectId);
          return subject?.programId === programFilter;
        }
        return false;
      });
    }
    if (subjectFilter) {
      filtered = filtered.filter(b => {
        if (b.subjectId) return b.subjectId === subjectFilter;
        if (b.classId) {
          const classItem = classes.find(c => (c.id || c.docId) === b.classId);
          return classItem?.subjectId === subjectFilter;
        }
        return false;
      });
    }
    if (classFilter) {
      filtered = filtered.filter(b => b.classId === classFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === typeFilter);
    }
    if (studentFilter) {
      filtered = filtered.filter(b => b.studentId === studentFilter);
    }
    return filtered;
  }, [behaviorsRaw, programFilter, subjectFilter, classFilter, typeFilter, studentFilter, classes, subjects]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();
    
    // Validation - description is required for behaviors
    if (!formData.studentId || !formData.classId || !formData.type || !textValues.description.trim()) {
      toast.error(t('fill_required_fields_behavior') || 'Please fill in all required fields (Student, Class, Type, Description)');
      return;
    }

    setSaving(true);
    try {
      const classData = await fetchClass(formData.classId);
      const subjectId = formData.subjectId || classData?.subjectId;
      
      const behaviorData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        programId: formData.programId,
        type: formData.type,
        description: textValues.description.trim(),
        points: textValues.points || 0,
        comment: textValues.comment.trim(),
        createdBy: user.uid,
        performedBy: user.uid,
        performedByName: user.displayName || user.email,
        performedByEmail: user.email
      };

      if (editingBehavior) {
        const result = await updateBehavior(editingBehavior.id, {
          ...behaviorData,
          updatedBy: user.uid
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
                toast.success(t('behavior_updated'));
      } else {
        const studentData = await getUserById(formData.studentId);
        const result = await createBehavior({
          ...behaviorData,
          studentInfo: studentData ? {
            displayName: studentData.displayName || studentData.email,
            email: studentData.email
          } : null,
          className: classData?.name || classData?.code || 'Class',
          sendNotification: true
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
                toast.success(t('behavior_recorded'));
      }

      setEditingBehavior(null);
      resetForm();
      loadBehaviorsData();
    } catch (error) {
      logger.error('Failed to save behavior:', error);
      toast.error(t('failed_to_save_behavior') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingBehavior, descriptionRef, commentRef, t, toast, loadBehaviorsData]);

  const handleEdit = useCallback((behavior) => {
    setEditingBehavior(behavior);
    setFormData({
      programId: behavior.programId || '',
      studentId: behavior.studentId || '',
      classId: behavior.classId || '',
      subjectId: behavior.subjectId || '',
      type: behavior.type || '',
      description: behavior.description || '',
      points: behavior.points || -1,
      comment: behavior.comment || ''
    });
  }, []);

  const handleDelete = useCallback((behavior) => {
    deleteEntity('behavior', behavior, async () => {
      setBehaviors(prev => prev.filter(b => b.docId !== behavior.docId));
      try {
        const result = await deleteBehavior(behavior.id);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
                toast?.showSuccess(t('behavior_deleted'));
        await loadBehaviorsData();
      } catch (error) {
        setBehaviors(prev => [...prev, behavior]);
        logger.error('Delete failed:', error);
        toast?.showError(error.message);
      }
    });
  }, [deleteEntity, toast, t, loadBehaviorsData]);

  const resetForm = () => {
    setFormData({
      programId: '',
      studentId: '',
      classId: '',
      subjectId: '',
      type: '',
      description: '',
      points: -1,
      comment: ''
    });
    // Clear refs
    if (descriptionRef.current) descriptionRef.current.value = '';
    if (commentRef.current) commentRef.current.value = '';
    if (pointsRef.current) pointsRef.current.value = '-1';
    setEditingBehavior(null);
  };

  if (!isInstructor && !isAdmin && !isSuperAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
  }

  const filteredClasses = classes.filter(c => {
    if (subjectFilter && c.subjectId !== subjectFilter) return false;
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
    return true;
  });

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: 'User',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        
                
        // Get studentName and studentEmail from row first
        let studentName = row.studentName || params?.value;
        let studentEmail = row.studentEmail;
        let studentId = row.studentId;
        
        // If studentName is email or missing, try to get realName from user data
        if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
          // Try to find user data to get realName/displayName
          const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
          if (user?.realName) {
            studentName = user.realName;
          } else if (user?.displayName) {
            studentName = user.displayName;
          } else {
            studentName = studentEmail || 'Unknown Student';
          }
        }
        
        // If not available, try to get from behaviors state
        if (!studentName && rowId) {
          const foundRow = behaviorsRaw.find(b => (b.id || b.docId) === rowId);
          studentName = foundRow?.studentName;
          studentEmail = foundRow?.studentEmail;
          studentId = foundRow?.studentId;
          ('Behavior User Debug - Found from behaviors state:', { studentName, studentEmail, studentId });
          
          // Try to get realName from user data
          if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
            const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
            if (user?.realName) {
              studentName = user.realName;
              ('Behavior User Debug - Found realName from students array (fallback):', user.realName);
            } else if (user?.displayName) {
              studentName = user.displayName;
              ('Behavior User Debug - Found displayName from students array (fallback):', user.displayName);
            } else {
              studentName = studentEmail || 'Unknown Student';
            }
          }
        }
        
        const displayName = studentName && studentName !== 'N/A' ? studentName : (studentEmail || 'N/A');
        
        ('Behavior User Debug - Final displayName:', displayName);
        ('Behavior User Debug - Final studentEmail:', studentEmail);
        ('=== BEHAVIOR USER DEBUG END ===');
        
        // Format as "Name (email)" like enrollments, but only if we have both and they're different
        if (studentEmail && studentEmail !== displayName && !displayName.includes('@')) {
          return `${displayName} (${studentEmail})`;
        }
        
        return displayName;
      }
    },
    {
      field: 'className',
      headerName: 'Class',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from behaviors state
        let className = row.className || params?.value;
        if (!className && rowId) {
          const foundRow = behaviorsRaw.find(b => (b.id || b.docId) === rowId);
          className = foundRow?.className;
        }
        let text = className || 'N/A';
        const classTerm = row.classTerm;
        if (classTerm) text += ` (${classTerm})`;
        return text;
      }
    },
    {
      field: 'programName',
      headerName: 'Program',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from behaviors state
        let programName = row.programName || params?.value;
        if (!programName && rowId) {
          const foundRow = behaviorsRaw.find(b => (b.id || b.docId) === rowId);
          programName = foundRow?.programName;
        }
        if (programName && programName !== 'N/A') {
          return programName;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectName',
      headerName: 'Subject',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from behaviors state
        let subjectName = row.subjectName || params?.value;
        if (!subjectName && rowId) {
          const foundRow = behaviorsRaw.find(b => (b.id || b.docId) === rowId);
          subjectName = foundRow?.subjectName;
        }
        if (subjectName && subjectName !== 'N/A') {
          return subjectName;
        }
        return 'N/A';
      }
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 180,
      renderCell: (params) => {
        const behaviorType = getBehaviorTypeById(params.value);
        return behaviorType ? (lang === 'ar' ? behaviorType.label_ar : behaviorType.label_en) : params.value;
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        const value = params?.value || '';
        return (
          <div style={{ 
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={value}>
            {value || '—'}
          </div>
        );
      }
    },
    {
      field: 'points',
      headerName: 'Points',
      width: 100,
      valueGetter: (params) => {
        ('InstructorBehaviorPage: Full params object:', params);
        ('InstructorBehaviorPage: Using params.value directly:', params.value, 'type:', typeof params.value);
        return Number(params.value) || 0;
      },
      renderCell: (params) => {
        // Get the value from the row data directly to ensure we have the correct points value
        const value = params.row.points || params.value || 0;
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontWeight: 'bold',
            color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280'
          }}>
            {value > 0 && '+'}{value}
            {value > 0 && getThemedIcon('ui', 'trending_up', 14, theme)}
            {value < 0 && getThemedIcon('ui', 'trending_down', 14, theme)}
          </div>
        );
      }
    },
    {
      field: 'comment',
      headerName: 'Comment',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.value || '—'
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      valueGetter: (params) => {
        // Debug logging for date investigation
        ('=== BEHAVIOR DATE DEBUG ===');
        ('Behavior Date Debug - params:', params);
        ('Behavior Date Debug - params.value:', params.value);
        ('Behavior Date Debug - params.row:', params.row);
        
        // Check if params directly contains the timestamp
        if (params && typeof params === 'object' && params.seconds) {
          const date = new Date(params.seconds * 1000);
          ('Behavior Date Debug - Using params.seconds:', params.seconds, '-> date:', date);
          ('Behavior Date Debug - Formatted date:', formatQatarDate(date));
          ('=== BEHAVIOR DATE DEBUG END ===');
          return formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          ('Behavior Date Debug - Using params.value.seconds:', params.value.seconds, '-> date:', date);
          ('Behavior Date Debug - Formatted date:', formatQatarDate(date));
          ('=== BEHAVIOR DATE DEBUG END ===');
          return formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        }
        
        // Fallback to original logic
        if (!params.row.createdAt) {
          ('Behavior Date Debug - No createdAt found, returning "No Date"');
          ('=== BEHAVIOR DATE DEBUG END ===');
          return 'No Date';
        }
        // Handle Firebase Timestamp properly
        let date;
        if (params.row.createdAt?.toDate) {
          date = params.row.createdAt.toDate();
        } else if (params.row.createdAt?.seconds) {
          date = new Date(params.row.createdAt.seconds * 1000);
        } else {
          date = new Date(params.row.createdAt);
        }
        if (isNaN(date.getTime())) {
          ('Behavior Date Debug - Invalid date, returning "Invalid Date"');
          ('=== BEHAVIOR DATE DEBUG END ===');
          return 'Invalid Date';
        }
        const formattedDate = formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        ('Behavior Date Debug - Formatted date (fallback):', formattedDate);
        ('=== BEHAVIOR DATE DEBUG END ===');
        return formattedDate;
      }
    },
    ...(hideActions ? [] : [{
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'user', 16, theme)}
            onClick={() => window.open(`/student-profile/${params.row.studentId}`, '_blank')}
            style={{ color: 'var(--attendance-accent, #800020)' }}
          >
            Profile
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'edit', 16, theme)}
            onClick={() => handleEdit(params.row)}
          >
            {t('edit_behavior') || 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('delete_behavior') || 'Delete'}
          </Button>
        </div>
      )
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions]);

  return (
    <div className={styles.container}>
      {!isDashboardTab && editingBehavior && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Behavior: {getBehaviorLabel(editingBehavior.type, lang) || editingBehavior.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} className="dashboard-form">
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={formData.programId}
            selectedSubject={formData.subjectId}
            selectedClass={formData.classId}
            onProgramChange={handleDropdownChange(setFormData, 'programId', ['subjectId', 'classId', 'studentId'])}
            onSubjectChange={handleDropdownChange(setFormData, 'subjectId', ['classId', 'studentId'])}
            onClassChange={(classId) => {
              setFormData(prev => {
                const newState = { ...prev, classId, studentId: '' };
                // Find the subject for this class and update program if needed
                const selectedClass = classes.find(c => (c.id || c.docId) === classId);
                if (selectedClass?.subjectId) {
                  const selectedSubject = subjects.find(s => (s.docId || s.id) === selectedClass.subjectId);
                  const programId = selectedSubject?.programId;
                  newState.subjectId = selectedClass.subjectId;
                  newState.programId = programId || prev.programId;
                }
                return newState;
              });
            }}
            showLabels={false}
            className="flex-1"
          />
        </div>

        {/* Second Row: Student, Type, and other fields */}
        <div className="form-row">
          <Select
            searchable
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={[
              { value: '', label: t('select_student') || 'Select Student' },
              ...students
                .map(u => {
                  // Get user enrollments count
                  const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
                  const enrollmentCount = userEnrollments.length;
                  
                  // Get status utilities
                  const status = getUserStatus(u, userEnrollments);
                  const statusSummary = getUserStatusSummary(u, userEnrollments);
                  const iconProps = getStatusIconProps(status);
                  const IconComponent = () => {
                    switch (iconProps.name) {
                      case 'UserCheck': return getThemedIcon('user_status', 'active', 24, theme);
                      case 'UserX': return getThemedIcon('user_status', 'inactive', 24, theme);
                      case 'UserMinus': return getThemedIcon('user_status', 'suspended', 24, theme);
                      case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 24, theme);
                      default: return getThemedIcon('ui', 'info', 24, theme);
                    }
                  };
                  
                  const isDisabled = status === USER_STATUS.DELETED;
                  const statusLabel = statusSummary?.label || status;
                  
                  return {
                    value: u.docId || u.id,
                    displayLabel: u.displayName || u.realName || u.email || 'Unknown',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 8,
                        opacity: isDisabled ? 0.7 : 1
                      }}>
                        <IconComponent />
                        <span style={{ 
                          textDecoration: isDisabled ? 'line-through' : 'none',
                          flex: 1
                        }}>
                          {u.displayName || u.realName || u.email || 'Unknown'}
                        </span>
                        <span style={{ 
                          fontSize: '0.8em',
                          color: '#9CA3AF',
                          marginLeft: 'auto'
                        }}>
                          {statusLabel}
                          {enrollmentCount > 0 && ` • ${enrollmentCount} ${t('enrollments') || 'enrollments'}`}
                        </span>
                      </div>
                    ),
                    disabled: isDisabled
                  };
                })
            ]}
            placeholder={t('select_student')}
            required
            disabled={!formData.classId}
          />
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: 'Select Type' },
              ...BEHAVIOR_TYPES.map(bt => {
                let icon;
                switch (bt.icon) {
                  case 'MessageSquare':
                    icon = getThemedIcon('ui', 'message_square', 16, theme);
                    break;
                  case 'Bed':
                    icon = getThemedIcon('ui', 'bed', 16, theme);
                    break;
                  case 'Users':
                    icon = getThemedIcon('ui', 'users', 16, theme);
                    break;
                  case 'Smartphone':
                    icon = getThemedIcon('ui', 'smartphone', 16, theme);
                    break;
                  case 'AlertTriangle':
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                    break;
                  case 'Clock':
                    icon = getThemedIcon('ui', 'clock', 16, theme);
                    break;
                  case 'XCircle':
                    icon = getThemedIcon('ui', 'x_circle', 16, theme);
                    break;
                  case 'HelpCircle':
                    icon = getThemedIcon('ui', 'help_circle', 16, theme);
                    break;
                  default:
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                }
                return { value: bt.id, label: getBehaviorLabel(bt.id, lang), icon };
              })
            ]}
            placeholder={t('select_behavior_type')}
            required
          />
        </div>
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <textarea
            ref={descriptionRef}
            defaultValue={formData.description}
            placeholder={t('description_required_behavior')}
            className="dashboard-textarea"
            rows={3}
            required
          />
          <textarea
            ref={commentRef}
            defaultValue={formData.comment}
            placeholder="Comment (optional)"
            className="dashboard-textarea"
            rows={3}
          />
        </div>
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <input
            ref={pointsRef}
            type="number"
            defaultValue={formData.points}
            placeholder="Points"
            min={-10}
            max={10}
            step={1}
            className="dashboard-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {editingBehavior ? (t('update') || 'Update') : (t('save') || 'Save')}
          </Button>
          {editingBehavior && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingBehavior(null);
                resetForm();
              }}
            >
              {t('cancel') || 'Cancel'} {t('edit_behavior') || 'Edit'}
            </Button>
          )}
        </div>
      </form>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'end' }}>
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={programFilter}
            selectedSubject={subjectFilter}
            selectedClass={classFilter}
            onProgramChange={setProgramFilter}
            onSubjectChange={setSubjectFilter}
            onClassChange={setClassFilter}
            showLabels={false}
            className="flex-1"
          />
          <div style={{ minWidth: '200px' }}>
            <Select
              searchable
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              options={[
                { value: '', label: t('all_students') || 'All Students' },
                ...selectStudents
                  .map(u => {
                    // Get user enrollments count
                    const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
                    const enrollmentCount = userEnrollments.length;
                    
                    // Get status utilities
                    const status = getUserStatus(u, userEnrollments);
                    const statusSummary = getUserStatusSummary(u, userEnrollments);
                    const iconProps = getStatusIconProps(status);
                    const IconComponent = () => {
                      switch (iconProps.name) {
                        case 'UserCheck': return getThemedIcon('user_status', 'active', 16, theme);
                        case 'UserX': return getThemedIcon('user_status', 'deleted', 16, theme);
                        case 'UserMinus': return getThemedIcon('user_status', 'archived', 16, theme);
                        case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 16, theme);
                        default: return getThemedIcon('ui', 'info', 16, theme);
                      }
                    };
                    
                    const isDisabled = status === USER_STATUS.DELETED;
                    
                    return {
                      value: u.docId || u.id,
                      displayLabel: u.displayName || u.realName || u.email || (t('unknown') || 'Unknown'),
                      label: (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 6,
                          opacity: isDisabled ? 0.7 : 1
                        }}>
                          <IconComponent />
                          <span style={{ 
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            flex: 1
                          }}>
                            {u.displayName || u.realName || u.email || (t('unknown') || 'Unknown')}
                          </span>
                        </div>
                      ),
                      disabled: isDisabled
                    };
                  })
              ]}
              showLabels={false}
              className="flex-1"
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                ...BEHAVIOR_TYPES.map(bt => {
                  let icon;
                  switch (bt.icon) {
                    case 'MessageSquare':
                      icon = getThemedIcon('ui', 'message_square', 16, theme);
                      break;
                    case 'Bed':
                      icon = getThemedIcon('ui', 'bed', 16, theme);
                      break;
                    case 'Users':
                      icon = getThemedIcon('ui', 'users', 16, theme);
                      break;
                    case 'Smartphone':
                      icon = getThemedIcon('ui', 'smartphone', 16, theme);
                      break;
                    case 'AlertTriangle':
                      icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                      break;
                    case 'Clock':
                      icon = getThemedIcon('ui', 'clock', 16, theme);
                      break;
                    case 'XCircle':
                      icon = getThemedIcon('ui', 'x_circle', 16, theme);
                      break;
                    case 'HelpCircle':
                      icon = getThemedIcon('ui', 'help_circle', 16, theme);
                      break;
                    default:
                      icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                  }
                  return { value: bt.id, label: getBehaviorLabel(bt.id, lang), icon };
                })
              ]}
              placeholder="Type"
            />
          </div>
        </div>
      </div>

      {filteredBehaviors.length !== behaviorsRaw.length && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredBehaviors.length} {t('of') || 'of'} {behaviorsRaw.length} {t('behaviors') || 'Behaviors'}
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {behaviorsRaw.length} Total
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          {getThemedIcon('ui', 'users', 16, theme)}
          {new Set(behaviorsRaw.map(b => b.studentId)).size} Students
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#166534'
        }}>
          {getThemedIcon('ui', 'trending_up', 16, theme)}
          {behaviorsRaw.filter(b => (b.points || 0) > 0).reduce((sum, b) => sum + (b.points || 0), 0)} Positive
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          {getThemedIcon('ui', 'trending_down', 16, theme)}
          {behaviorsRaw.filter(b => (b.points || 0) < 0).reduce((sum, b) => sum + (b.points || 0), 0)} Negative
        </div>
      </div>

      <div className={styles.content}>
        <AdvancedDataGrid
          rows={filteredBehaviors}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          exportFileName="behaviors"
          showExportButton
          exportLabel="Export"
          loadingOverlayMessage={pageState === PAGE_STATES.LOADING ? "Loading behaviors..." : undefined}
          fancyVariant="dots"
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={pageState === PAGE_STATES.LOADING}
        t={t}
      />
    </div>
  );
};

export default BehaviorPage;
