import { info, error, warn, debug } from '@services/utils/logger.js';

// Semester Report Export Function
// This will be integrated into QRScannerPage.jsx

const exportSemesterReport = useCallback(async () => {
  if (!selectedClassId) {
    showError(t('please_select_class') || 'Please select a class first');
    return;
  }

  try {
    // Determine the scope based on selections
    let scope = 'class';
    let scopeId = selectedClassId;
    
    if (selectedClassId === 'all' && selectedSubjectId && selectedSubjectId !== 'all') {
      scope = 'subject';
      scopeId = selectedSubjectId;
    } else if (selectedSubjectId === 'all' && selectedProgramId) {
      scope = 'program';
      scopeId = selectedProgramId;
    }

    info('📊 Semester Report - Scope:', { scope, scopeId, selectedClassId, selectedSubjectId, selectedProgramId });

    // Get all attendance data for the semester (no date filter)
    const attendanceResponse = await getAttendanceRecords({ 
      classId: scope === 'class' ? selectedClassId : undefined,
      subjectId: scope === 'subject' ? selectedSubjectId : undefined,
      // For program level, we'll need to fetch all classes in the program
    });
    
    const attendanceData = attendanceResponse.success ? attendanceResponse.data : [];
    
    console.log('📊 Semester Report - Attendance Data:', {
      totalRecords: attendanceData.length,
      sampleRecord: attendanceData[0]
    });

    // Get all students
    const usersResponse = await getUsers();
    const allUsers = usersResponse.success ? usersResponse.data : [];

    // Aggregate attendance data by student
    const studentAttendanceMap = {};
    
    attendanceData.forEach(record => {
      const studentId = record.studentId;
      
      if (!studentAttendanceMap[studentId]) {
        studentAttendanceMap[studentId] = {
          present: 0,
          absent: 0,
          late: 0,
          humanCase: 0,
          absenceExcused: 0,
          total: 0
        };
      }
      
      const status = record.status?.toLowerCase() || 'present';
      studentAttendanceMap[studentId].total++;
      
      // Map status to counters
      if (status === 'present') {
        studentAttendanceMap[studentId].present++;
      } else if (status === 'absent') {
        studentAttendanceMap[studentId].absent++;
      } else if (status === 'late') {
        studentAttendanceMap[studentId].late++;
      } else if (status === 'human_case' || status === 'humancase') {
        studentAttendanceMap[studentId].humanCase++;
      } else if (status === 'absence_excused' || status === 'absenceexcused' || status === 'excused') {
        studentAttendanceMap[studentId].absenceExcused++;
      }
    });

    console.log('📊 Semester Report - Aggregated Data:', {
      totalStudents: Object.keys(studentAttendanceMap).length,
      sampleStudent: Object.entries(studentAttendanceMap)[0]
    });

    // Create enriched data with calculations
    const enrichedData = Object.entries(studentAttendanceMap).map(([studentId, stats]) => {
      const student = allUsers.find(u => u.id === studentId);
      
      // Calculate attendance percentage
      const attendancePercentage = stats.total > 0 
        ? ((stats.present / stats.total) * 100).toFixed(2)
        : '0.00';
      
      // Calculate mark deductions
      const absentDeduction = stats.absent * 0.5;
      const excusedDeduction = stats.absenceExcused * 0.5;
      const humanCaseDeduction = stats.humanCase * 0.5;
      const totalDeduction = absentDeduction + excusedDeduction + humanCaseDeduction;
      
      return {
        studentNumber: student?.studentNumber || studentId || '',
        studentName: student?.displayName || student?.realName || '',
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        humanCase: stats.humanCase,
        absenceExcused: stats.absenceExcused,
        totalSessions: stats.total,
        attendancePercentage: attendancePercentage + '%',
        absentDeduction: absentDeduction.toFixed(2),
        excusedDeduction: excusedDeduction.toFixed(2),
        humanCaseDeduction: humanCaseDeduction.toFixed(2),
        totalMarkDeduction: totalDeduction.toFixed(2)
      };
    });

    // Sort by student number
    enrichedData.sort((a, b) => {
      const numA = parseInt(a.studentNumber) || 0;
      const numB = parseInt(b.studentNumber) || 0;
      return numA - numB;
    });

    console.log('📊 Semester Report - Enriched Data:', {
      totalStudents: enrichedData.length,
      sampleStudent: enrichedData[0]
    });

    if (enrichedData.length === 0) {
      showError(t('no_attendance_records_found') || 'No attendance records found for this semester');
      return;
    }

    // Create CSV content with headers
    const headers = lang === 'ar' ? [
      '#',
      t('student_number') || 'رقم الطالب',
      t('student_name') || 'اسم الطالب',
      t('present') || 'حاضر',
      t('absent') || 'غائب',
      t('late') || 'متأخر',
      t('human_case') || 'حالة إنسانية',
      t('absence_excused') || 'غياب معذور',
      t('total_sessions') || 'إجمالي الجلسات',
      t('attendance_percentage') || 'نسبة الحضور',
      t('absent_deduction') || 'خصم الغياب (×0.5)',
      t('excused_deduction') || 'خصم المعذور (×0.5)',
      t('human_case_deduction') || 'خصم الحالة (×0.5)',
      t('total_mark_deduction') || 'إجمالي الخصم'
    ] : [
      '#',
      t('student_number') || 'Student Number',
      t('student_name') || 'Student Name',
      t('present') || 'Present',
      t('absent') || 'Absent',
      t('late') || 'Late',
      t('human_case') || 'Human Case',
      t('absence_excused') || 'Absence Excused',
      t('total_sessions') || 'Total Sessions',
      t('attendance_percentage') || 'Attendance %',
      t('absent_deduction') || 'Absent Deduction (×0.5)',
      t('excused_deduction') || 'Excused Deduction (×0.5)',
      t('human_case_deduction') || 'Human Case Deduction (×0.5)',
      t('total_mark_deduction') || 'Total Mark Deduction'
    ];

    const csvContent = [
      headers.join(','),
      ...enrichedData.map((row, index) => [
        `"${index + 1}"`,
        `"${row.studentNumber}"`,
        `"${row.studentName}"`,
        `"${row.present}"`,
        `"${row.absent}"`,
        `"${row.late}"`,
        `"${row.humanCase}"`,
        `"${row.absenceExcused}"`,
        `"${row.totalSessions}"`,
        `"${row.attendancePercentage}"`,
        `"${row.absentDeduction}"`,
        `"${row.excusedDeduction}"`,
        `"${row.humanCaseDeduction}"`,
        `"${row.totalMarkDeduction}"`
      ].join(','))
    ].join('\n');

    // Get names for filename
    const programsResponse = await getPrograms();
    const allPrograms = programsResponse.success ? programsResponse.data : [];
    const currentProgram = allPrograms.find(p => (p.id === selectedProgramId) || (p.docId === selectedProgramId));
    
    const subjectsResponse = await getSubjects(selectedProgramId);
    const allSubjects = subjectsResponse.success ? subjectsResponse.data : [];
    const currentSubject = allSubjects.find(s => (s.id === selectedSubjectId) || (s.docId === selectedSubjectId));
    
    const classesResponse = await getClasses(selectedSubjectId);
    const allClasses = classesResponse.success ? classesResponse.data : [];
    const currentClass = allClasses.find(c => (c.id === selectedClassId) || (c.docId === selectedClassId));
    
    const programName = currentProgram?.nameEn || currentProgram?.name || 'All';
    const subjectName = currentSubject?.nameEn || currentSubject?.name || 'All';
    const className = currentClass?.nameEn || currentClass?.name || 'All';
    
    // Create filename
    const filename = lang === 'ar' 
      ? `تقرير_الفصل_الدراسي_${programName}_${subjectName}_${className}.csv`
      : `semester_report_${programName}_${subjectName}_${className}.csv`;

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(t('semester_report_exported_successfully') || 'Semester report exported successfully');

  } catch (error) {
    error('Semester Report Export failed:', error);
    showError((t('export_failed') || 'Export failed: ') + error.message);
  }
}, [selectedClassId, selectedSubjectId, selectedProgramId, programs, subjects, classes, lang, t, showError, showSuccess]);
