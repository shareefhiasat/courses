import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { debug } from "@services/utils/logger";
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { Button, Select, SimpleLoading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input, ProgramsSelect } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { getPrograms, getSubjects, fetchSubject, fetchProgram } from '@services/business/programService';
import { getClasses, fetchClass } from '@services/business/classService';
import { getEnrollments, getStudentsByClass } from '@services/business/enrollmentService';
import { createBehavior, updateBehavior, deleteBehavior, loadBehaviors } from '@services/business/behaviorService';
import { getAllUsers, getUserById, getUsersByIds } from '@services/business/userService';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
// OLD: import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorTypeById } from '@constants/behaviorTypes.jsx';
// NOW: Using useLookupTypes hook for all lookup data
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES,
  COMMON_GRID_COLUMNS
} from '@constants/pageTypes';

const BehaviorPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { data: lookupData } = useLookupTypes({
    types: ['behavior-types']
  });

  // Helper function to get behavior label from lookup data
  const getBehaviorLabel = useCallback((behaviorId, lang) => {
    const behaviorTypes = lookupData['behavior-types'] || [];
    const behavior = behaviorTypes.find(bt => bt.id === behaviorId);
    if (!behavior) return behaviorId;
    return lang === 'ar' ? behavior.nameAr : behavior.nameEn || behavior.name;
  }, [lookupData, lang]);
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
  const commentRef = useRef(null);
  const pointsRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (commentRef.current) commentRef.current.value = formData.comment || '';
    if (pointsRef.current) pointsRef.current.value = formData.points || -1;
  }, [editingBehavior, formData.comment, formData.points]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      comment: commentRef.current?.value ?? formData.comment,
      points: parseInt(pointsRef.current?.value) || formData.points || -1
    };
  }, [formData.comment, formData.points]);

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
  }, [enrollments, isSuperAdmin, isAdmin, isHR, isInstructor, getAllUsers]);

  const { startLoading } = useGlobalLoading();

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');

  // Initial Data Loading
  useLayoutEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin && !isHR) return;

    let stopLoading = null;

    const loadAll = async () => {
      stopLoading = startLoading({ message: t('behavior_loading_behavior') });
      
      try {
        // 1. Load Reference Data
        const [classesRes, programsRes, subjectsRes, enrollmentsRes] = await Promise.all([
          getClasses(),
          getPrograms(),
          getSubjects(),
          getEnrollments()
        ]);

        const classesData = classesRes.success ? classesRes.data || [] : [];
        const programsData = programsRes.success ? programsRes.data || [] : [];
        const subjectsData = subjectsRes.success ? subjectsRes.data || [] : [];
        const enrollmentsData = enrollmentsRes.success ? enrollmentsRes.data || [] : [];

        setClasses(classesData);
        setPrograms(programsData);
        setSubjects(subjectsData);
        setEnrollments(enrollmentsData);

        // 2. Load users for display resolution
        let usersData = [];
        if (isSuperAdmin || isAdmin || isHR) {
          const allUsersResult = await getAllUsers();
          usersData = allUsersResult.success ? allUsersResult.data : [];
        }
        setStudents(usersData);

        // 3. Load Behaviors using the fetched data
        await loadBehaviors({
          setBehaviors: setBehaviorsRaw,
          setPageState: () => {}, // We handle page state via global loading mostly
          toast,
          t,
          lang,
          classes: classesData,
          programs: programsData,
          subjects: subjectsData,
          students: usersData,
          filters: {},
          getUserById,
          fetchClass,
          fetchSubject,
          fetchProgram
        });
        
        setPageState(PAGE_STATES.SUCCESS);
      } catch (error) {
        debug(t('behavior_failed_to_load_data'), error);
        toast.error(t('error_loading_data'));
        setPageState(PAGE_STATES.ERROR);
      } finally {
        if (stopLoading) stopLoading();
      }
    };

    loadAll();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [isInstructor, isAdmin, isSuperAdmin, isHR]);

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
          // Transform enrollment data to student structure
          const students = result.data.map(enrollment => ({
            id: enrollment.userId,
            docId: enrollment.userId,
            displayName: enrollment.user?.displayName || enrollment.user?.realName || enrollment.user?.email,
            email: enrollment.user?.email,
            realName: enrollment.user?.realName,
            isDisabled: enrollment.isDisabled
          }));
          setStudents(students);
        } else {
          debug(t('behavior_failed_to_load_students'), result.error);
          setStudents([]);
        }
      } catch (error) {
        debug(t('behavior_failed_to_load_students'), error);
        setStudents([]);
      }
    })();
  }, [formData.classId, t]);

  // Load students when editing behavior changes (for edit mode)
  useEffect(() => {
    if (editingBehavior && editingBehavior.classId) {
      (async () => {
        try {
          const result = await getStudentsByClass(editingBehavior.classId);
          if (result.success) {
            // Transform enrollment data to student structure
            const students = result.data.map(enrollment => ({
              id: enrollment.userId,
              docId: enrollment.userId,
              displayName: enrollment.user?.displayName || enrollment.user?.realName || enrollment.user?.email,
              email: enrollment.user?.email,
              realName: enrollment.user?.realName,
              isDisabled: enrollment.isDisabled
            }));
            setStudents(students);
          } else {
            debug(t('behavior_failed_to_load_students_for_edit'), result.error);
            setStudents([]);
          }
        } catch (error) {
          debug(t('behavior_failed_to_load_students_for_edit'), error);
          setStudents([]);
        }
      })();
    }
  }, [editingBehavior, t]);

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
      debug(t('behavior_failed_to_load_data'), error);
    }
  };

  const loadBehaviorsData = useCallback(() => {
    loadBehaviors({
      setBehaviors: setBehaviorsRaw,
      setPageState,
      toast,
      t,
      lang,
      classes,
      programs,
      subjects,
      students,
      filters: {},
      getUserById,
      fetchClass,
      fetchSubject,
      fetchProgram
    });
  }, [toast, t, lang]);

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
  }, [behaviorsRaw, programFilter, subjectFilter, classFilter, typeFilter, studentFilter]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Early validation - check if form is properly filled
    if (!formData.studentId || !formData.type) {
      setTimeout(() => {
        toast.error(t('behavior.select_student_and_type', 'Please select a student and behavior type'));
      }, 0);
      return false;
    }
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();

    setSaving(true);
    try {
      // Only fetch class data if classId is provided
      let classData = null;
      let subjectId = formData.subjectId;
      
      if (formData.classId) {
        classData = await fetchClass(formData.classId);
        subjectId = formData.subjectId || classData?.subjectId;
      }
      
      const behaviorData = {
        userId: parseInt(formData.studentId), // Convert to integer
        classId: formData.classId ? parseInt(formData.classId) : null, // Optional
        subjectId: subjectId ? parseInt(subjectId) : null, // Optional
        programId: formData.programId ? parseInt(formData.programId) : null, // Optional
        typeId: parseInt(formData.type), // Convert to integer
        descriptionEn: 'Behavior record', // Required field
        descriptionAr: 'سجل السلوك', // Required field
        points: textValues.points || 0,
        comment: textValues.comment?.trim() || '', // Optional comment
        isActive: true
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
      debug(t('behavior_failed_to_save_behavior'), error);
      toast.error(t('behavior_failed_to_save_behavior') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingBehavior, loadBehaviorsData, syncRefsToState, user]);

  const handleEdit = useCallback((behavior) => {
    setEditingBehavior(behavior);
    setFormData({
      programId: behavior.programId || '',
      studentId: behavior.studentId || '',
      classId: behavior.classId || '',
      subjectId: behavior.subjectId || '',
      type: behavior.typeId || behavior.type || '',
      points: behavior.points || -1,
      comment: behavior.comment || ''
    });
  }, []);

  const handleDelete = useCallback((behavior) => {
    deleteEntity(RECORD_TYPES.BEHAVIOR, behavior, async () => {
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
        debug(t('behavior_delete_failed'), error);
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
      points: -1,
      comment: ''
    });
    // Clear refs
    if (commentRef.current) commentRef.current.value = '';
    if (pointsRef.current) pointsRef.current.value = '-1';
    setEditingBehavior(null);
  };

  const filteredClasses = classes.filter(c => {
    if (subjectFilter && c.subjectId !== subjectFilter) return false;
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
    return true;
  });

  const auditColumns = useAuditGridColumns({
    users: students,
  });

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('behavior_user'),
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
            studentName = studentEmail || t('behavior_unknown_student');
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
              studentName = studentEmail || t('behavior_unknown_student');
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
      headerName: t('behavior_class'),
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
      headerName: t('program'),
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
      headerName: t('subject'),
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
      field: 'typeId',
      headerName: t('behavior_type'),
      width: 180,
      renderCell: (params) => {
        // Try to get the behaviorType object from the row data first
        const row = params.row;
        let typeName = params.value; // Default to the numeric value
        
        if (row.behaviorType) {
          // Use the behaviorType object from the enriched data
          typeName = lang === 'ar' ? row.behaviorType.nameAr : row.behaviorType.nameEn;
        } else if (row.type) {
          // Fallback: try to find by frontend type ID
          const behaviorType = (lookupData['behavior-types'] || []).find(bt => bt.id === row.type);
          typeName = behaviorType ? (lang === 'ar' ? (behaviorType.nameAr || behaviorType.nameEn) : behaviorType.nameEn) : row.type;
        } else {
          // Final fallback: try to match numeric typeId with frontend types (index-based)
          const typeIndex = parseInt(params.value) - 1; // Assuming IDs start from 1
          const behaviorTypesArray = lookupData['behavior-types'] || [];
          if (typeIndex >= 0 && typeIndex < behaviorTypesArray.length) {
            const behaviorType = behaviorTypesArray[typeIndex];
            typeName = lang === 'ar' ? (behaviorType.nameAr || behaviorType.nameEn) : behaviorType.nameEn;
          }
        }
        
        return typeName || params.value || '—';
      }
    },
    {
      field: 'points',
      headerName: t('behavior_points'),
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
      headerName: t('behavior_comment'),
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.value || '—'
    },
    ...auditColumns,
    ...(hideActions ? [] : [{
      field: 'actions',
      headerName: t('behavior_actions'),
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
            {t('behavior_edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('behavior_delete')}
          </Button>
        </div>
      )
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions, behaviorsRaw, students, auditColumns]);

  return (
    <div>
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('behavior_edit_behavior')}: {getBehaviorLabel(editingBehavior.type, lang) || editingBehavior.type}
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

        {/* Second Row: Student */}
        <div className="form-row">
          <Select
            searchable
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={[
              { value: '', label: t('behavior_select_student') },
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
            className="flex-1"
          />
        </div>

        {/* Third Row: Type */}
        <div className="form-row">
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: t('behavior_select_type') },
              ...(lookupData['behavior-types'] || []).map(bt => {
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
            className="flex-1"
          />
        </div>
        {/* Comment and Points Row */}
        <div className="form-row">
          <textarea
            ref={commentRef}
            defaultValue={formData.comment}
            placeholder={t('behavior_enter_comment')}
            className="dashboard-textarea"
            rows={3}
          />
          <input
            ref={pointsRef}
            type="number"
            defaultValue={formData.points}
            placeholder={t('behavior_enter_points')}
            min={-10}
            max={10}
            step={1}
            className="dashboard-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {editingBehavior ? t('behavior_edit_behavior') : t('behavior_add_behavior')}
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
              {t('behavior_cancel')} {t('behavior_edit')}
            </Button>
          )}
        </div>
      </form>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        {/* First Row: Program, Subject, Class */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
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
        </div>
        
        {/* Second Row: Student and Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
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
                        case 'UserX': return getThemedIcon('user_status', 'inactive', 16, theme);
                        case 'UserMinus': return getThemedIcon('user_status', 'suspended', 16, theme);
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
                { value: 'all', label: t('behavior_all_types') },
                ...(lookupData['behavior-types'] || []).map(bt => {
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
              placeholder={t('behavior.type_placeholder', 'Type')}
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
          {behaviorsRaw.length} {t('behavior_total_badge')}
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
          {new Set(behaviorsRaw.map(b => b.studentId)).size} {t('behavior_students_badge')}
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
          {behaviorsRaw.filter(b => (b.points || 0) > 0).reduce((sum, b) => sum + (b.points || 0), 0)} {t('behavior_positive')}
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
          {behaviorsRaw.filter(b => (b.points || 0) < 0).reduce((sum, b) => sum + (b.points || 0), 0)} {t('behavior_negative')}
        </div>
      </div>

      <div>
        <AdvancedDataGrid
          rows={filteredBehaviors}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          exportFileName="behaviors"
          showExportButton
          exportLabel={t('export')}
          loadingOverlayMessage={pageState === PAGE_STATES.LOADING ? t('behavior_loading_behaviors') : undefined}
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

