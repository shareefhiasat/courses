import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUsers } from '@services/business/userService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import useDataScope from '@hooks/useDataScope';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Manages cascading program → subject → class → student selection for the
 * Student Dashboard. For non-student roles, enforces "selection-first" so
 * heavy data queries only fire after a context is chosen.
 *
 * Returns:
 *  - Raw lists: programs, subjects, classes, students
 *  - Filtered lists based on current cascade: filteredSubjects, filteredClasses, filteredStudents
 *  - Selection state: selectedProgramId, selectedSubjectId, selectedClassId, selectedStudentId
 *  - Setters that cascade resets downstream
 *  - grouping: 'year' | 'class' | 'term'
 *  - hasSelection: true when enough context is chosen to load data
 *  - loading, reload
 */
const useStudentDashboardFilters = ({ isStaff = false } = {}) => {
  const { user, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const { scope: dataScope, filterItems: filterByScope, isUnrestricted } = useDataScope();

  const shouldLoadStudents = isStaff || isAdmin || isInstructor || isHR || isSuperAdmin;

  // Raw data lists
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cascade selections
  const [selectedProgramId, setSelectedProgramIdRaw] = useState('all');
  const [selectedSubjectId, setSelectedSubjectIdRaw] = useState('all');
  const [selectedClassId, setSelectedClassIdRaw] = useState('all');
  const [selectedStudentId, setSelectedStudentIdRaw] = useState('');

  // Grouping mode
  const [grouping, setGrouping] = useState('class');

  // Cascade: selecting program resets downstream
  const setSelectedProgramId = useCallback((id) => {
    setSelectedProgramIdRaw(id);
    setSelectedSubjectIdRaw('all');
    setSelectedClassIdRaw('all');
    setSelectedStudentIdRaw('');
  }, []);

  // Cascade: selecting subject resets class + student
  const setSelectedSubjectId = useCallback((id) => {
    setSelectedSubjectIdRaw(id);
    setSelectedClassIdRaw('all');
    setSelectedStudentIdRaw('');
  }, []);

  // Cascade: selecting class resets student
  const setSelectedClassId = useCallback((id) => {
    setSelectedClassIdRaw(id);
    setSelectedStudentIdRaw('');
  }, []);

  const setSelectedStudentId = useCallback((id) => {
    setSelectedStudentIdRaw(id);
  }, []);

  // Load all reference data on mount
  const loadFilters = useCallback(async () => {
    setLoading(true);
    try {
      info('[StudentDashboardFilters] Loading filters data...');
      const [programsRes, subjectsRes, classesRes, studentsRes] = await Promise.allSettled([
        getPrograms(),
        getSubjects(),
        getClasses(),
        shouldLoadStudents ? getUsers() : Promise.resolve({ success: true, data: [] }),
      ]);

      const programsData = programsRes.status === 'fulfilled' ? (programsRes.value?.data || []) : [];
      const subjectsData = subjectsRes.status === 'fulfilled' ? (subjectsRes.value?.data || []) : [];
      const classesData = classesRes.status === 'fulfilled' ? (classesRes.value?.data || []) : [];
      const studentsData = studentsRes.status === 'fulfilled' ? (studentsRes.value?.data || []) : [];

      info('[StudentDashboardFilters] Raw data counts:', {
        programs: programsData.length,
        subjects: subjectsData.length,
        classes: classesData.length,
        students: studentsData.length,
        shouldLoadStudents
      });

      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);
      
      // Don't filter by role here - let UserSelect component handle role filtering
      // This matches the enrollment page pattern
      const allUsers = shouldLoadStudents ? studentsData : [];
      info('[StudentDashboardFilters] Loaded users (no role filter):', allUsers.length);
      setStudents(allUsers);
    } catch (error) {
      error('Failed to load dashboard filters', error);
    } finally {
      setLoading(false);
    }
  }, [shouldLoadStudents]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Derived: subjects filtered by selected program (and data scope for normal admin)
  const filteredSubjects = useMemo(() => {
    let result = subjects;
    if (!isUnrestricted) {
      result = filterByScope(result, {
        idField: 'id',
        categoryField: 'categoryId',
        programField: 'programId',
        subjectField: 'id',
        classField: 'id',
      });
    }
    if (!selectedProgramId || selectedProgramId === 'all') return result;
    return result.filter(s => {
      const subProgramId = s.programId || s.program || '';
      return subProgramId === selectedProgramId;
    });
  }, [subjects, selectedProgramId, isUnrestricted, filterByScope]);

  // Derived: classes filtered by selected subject (and program if no subject) and data scope
  const filteredClasses = useMemo(() => {
    let result = classes;
    if (!isUnrestricted) {
      result = filterByScope(result, {
        idField: 'id',
        categoryField: 'categoryId',
        programField: 'programId',
        subjectField: 'subjectId',
        classField: 'id',
      });
    }
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      result = result.filter(c => c.subjectId === selectedSubjectId);
    } else if (selectedProgramId && selectedProgramId !== 'all') {
      const subjectIds = new Set(filteredSubjects.map(s => s.id || s.docId));
      result = result.filter(c => subjectIds.has(c.subjectId));
    }
    return result;
  }, [classes, selectedSubjectId, selectedProgramId, filteredSubjects, isUnrestricted, filterByScope]);

  // Derived: students filtered by selected class/subject/program
  const filteredStudents = useMemo(() => {
    // If class is selected, filter students enrolled in that class
    if (selectedClassId && selectedClassId !== 'all') {
      const filtered = students.filter(s => {
        if (s.enrollments && Array.isArray(s.enrollments)) {
          return s.enrollments.some(enrollment => enrollment.classId === selectedClassId);
        }
        return s.classId === selectedClassId || s.enrolledClassIds?.includes(selectedClassId);
      });
      info('[StudentDashboardFilters] Filtered students for class', selectedClassId, ':', filtered.length, 'from', students.length);
      return filtered;
    }
    
    // If subject or program is selected, show all students (HR/Super Admin needs to see all to enroll them)
    // Only filter by enrollment when a specific class is selected
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      info('[StudentDashboardFilters] Subject selected but no class, showing all students:', students.length);
      return students;
    }
    
    if (selectedProgramId && selectedProgramId !== 'all') {
      info('[StudentDashboardFilters] Program selected but no class, showing all students:', students.length);
      return students;
    }
    
    // No filters selected, return all students
    info('[StudentDashboardFilters] No filters selected, returning all students:', students.length);
    return students;
  }, [students, selectedClassId, selectedSubjectId, selectedProgramId]);

  // hasSelection: for staff, at least a class must be selected to trigger data load
  const hasSelection = useMemo(() => {
    if (!isStaff && !isAdmin && !isInstructor && !isHR && !isSuperAdmin) {
      // Student: always has selection (own data)
      return true;
    }
    // Staff: need at least a class or a student selected
    return (selectedClassId && selectedClassId !== 'all') ||
      (selectedStudentId && selectedStudentId !== '');
  }, [isStaff, isAdmin, isInstructor, isHR, isSuperAdmin, selectedClassId, selectedStudentId]);

  // Effective class IDs for data queries
  const effectiveClassIds = useMemo(() => {
    if (selectedClassId && selectedClassId !== 'all') return [selectedClassId];
    return filteredClasses.map(c => c.id || c.docId).filter(Boolean);
  }, [selectedClassId, filteredClasses]);

  return {
    // Raw lists
    programs,
    subjects,
    classes,
    students,

    // Filtered lists (cascade-aware)
    filteredSubjects,
    filteredClasses,
    filteredStudents,

    // Selections
    selectedProgramId,
    selectedSubjectId,
    selectedClassId,
    selectedStudentId,

    // Setters (cascade-aware)
    setSelectedProgramId,
    setSelectedSubjectId,
    setSelectedClassId,
    setSelectedStudentId,

    // Grouping
    grouping,
    setGrouping,

    // Derived
    hasSelection,
    effectiveClassIds,

    // Meta
    loading,
    reload: loadFilters,

    // Data scope
    dataScope,
    isUnrestricted,
  };
};

export default useStudentDashboardFilters;
