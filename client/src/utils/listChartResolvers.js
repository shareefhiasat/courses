import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * List Chart Resolvers
 * Centralized resolvers for mapping IDs to human-readable values
 * with fallback chains to eliminate N/A and ObjectID displays
 */

/**
 * Resolve user/student information
 * @param {string} userId - User/Student ID
 * @param {Array} users - Users collection from rawData
 * @param {Object} t - Translation function
 * @returns {Object} Resolved user info
 */
export const resolveUser = (userId, users = [], t) => {
  const translate = t || ((key) => key);
  if (!userId) return { 
    nameEn: translate('unknown_student'),
    nameAr: translate('unknown_student'),
    number: translate('not_available'), 
    email: '—' 
  };
  
  const user = users.find(u => u.id === userId || u.studentId === userId || u.userId === userId);
  
  if (!user) {
    return { 
      nameEn: translate('unknown_student'),
      nameAr: translate('unknown_student'),
      number: translate('not_available'), 
      email: '—',
      phone: '—',
      address: '—',
      parentName: '—'
    };
  }
  
  return {
    nameEn: user.displayName || user.realName || user.name || user.email || translate('unknown_student'),
    nameAr: user.displayNameAr
      || (user.firstNameAr && user.lastNameAr ? `${user.firstNameAr} ${user.lastNameAr}` : null)
      || user.displayName || user.realName || user.name || user.email || translate('unknown_student'),
    number: user.studentNumber || user.studentId || user.id?.substring(0, 8) || translate('not_available'),
    email: user.email || '—',
    phone: user.phone || user.phoneNumber || '—',
    address: user.address || '—',
    parentName: user.parentName || user.guardianName || '—',
    role: user.role || '—',
    displayNameEn: user.displayName || user.realName || '—',
    displayNameAr: user.displayNameAr
      || (user.firstNameAr && user.lastNameAr ? `${user.firstNameAr} ${user.lastNameAr}` : null)
      || user.displayName || user.realName || '—'
  };
};

/**
 * Resolve class information
 * @param {string} classId - Class ID
 * @param {Array} classes - Classes collection from rawData
 * @param {Object} t - Translation function
 * @returns {Object} Resolved class info
 */
export const resolveClass = (classId, classes = [], t) => {
  const translate = t || ((key) => key);
  if (!classId) return { 
    nameEn: translate('not_specified'),
    nameAr: translate('not_specified'),
    instructor: '—', 
    schedule: '—', 
    room: '—'
  };
  
  const classItem = classes.find(c => c.id === classId || c.classId === classId);
  
  if (!classItem) {
    return { 
      nameEn: translate('not_specified'),
      nameAr: translate('not_specified'),
      instructor: '—', 
      schedule: '—', 
      room: '—',
      subject: '—'
    };
  }
  
  return {
    nameEn: classItem.name_en || classItem.nameEn || classItem.name || classItem.className || translate('not_specified'),
    nameAr: classItem.name_ar || classItem.nameAr || classItem.name || classItem.className || translate('not_specified'),
    instructor: classItem.instructor || classItem.teacherName || classItem.instructorName || '—',
    schedule: classItem.schedule || classItem.timeSlot || classItem.time || '—',
    room: classItem.room || classItem.classroom || classItem.location || '—',
    subject: classItem.subject || classItem.subjectName || '—'
  };
};

/**
 * Resolve program information
 * @param {string} programId - Program ID
 * @param {Array} programs - Programs collection from rawData
 * @param {Object} t - Translation function
 * @returns {Object} Resolved program info
 */
export const resolveProgram = (programId, programs = [], t) => {
  const translate = t || ((key) => key);
  if (!programId) return { 
    nameEn: translate('not_specified'),
    nameAr: translate('not_specified'),
    type: '—', 
    duration: '—' 
  };
  
  const program = programs.find(p => p.id === programId || p.programId === programId);
  
  if (!program) {
    return { 
      nameEn: translate('not_specified'),
      nameAr: translate('not_specified'),
      type: '—', 
      duration: '—' 
    };
  }
  
  return {
    nameEn: program.name_en || program.nameEn || program.name || program.programName || translate('not_specified'),
    nameAr: program.name_ar || program.nameAr || program.name || program.programName || translate('not_specified'),
    type: program.type || program.programType || '—',
    duration: program.duration || program.programDuration || '—'
  };
};

/**
 * Normalize attendance status for display
 * @param {string} status - Raw status value
 * @param {Object} t - Translation function
 * @returns {string} Localized status
 */
export const normalizeAttendanceStatus = (status, t) => {
  const translate = t || ((key) => key);
  if (!status) return translate('not_specified');
  
  const statusMap = {
    'present': translate('present') || 'Present',
    'late': translate('late') || 'Late',
    'absent': translate('absent_no_excuse') || 'Absent',
    'absent_with_excuse': translate('absent_excused') || 'Absent Excused',
    'absent_without_excuse': translate('absent_no_excuse') || 'Absent',
    'excused': translate('absent_excused') || 'Absent Excused',
    'human_case': translate('human_case') || 'Human Case',
    'not_specified': translate('not_specified') || 'Not Specified'
  };
  
  return statusMap[status.toLowerCase()] || status;
};

/**
 * Normalize activity type for display
 * @param {string} type - Raw type value
 * @param {Object} t - Translation function
 * @returns {string} Localized type
 */
export const normalizeActivityType = (type, t) => {
  const translate = t || ((key) => key);
  if (!type) return translate('not_specified');
  
  const typeMap = {
    'homework': translate('homework') || 'Homework',
    'quiz': translate('quiz') || 'Quiz',
    'assignment': translate('assignment') || 'Assignment',
    'exam': translate('exam') || 'Exam',
    'project': translate('project') || 'Project',
    'video': translate('video') || 'Video',
    'link': translate('link') || 'Link',
    'document': translate('document') || 'Document',
    'announcement': translate('announcement') || 'Announcement',
    'resource': translate('resource') || 'Resource',
    'unknown': translate('not_specified') || 'Not Specified'
  };
  
  return typeMap[type.toLowerCase()] || type;
};

/**
 * Format date for display
 * @param {string|Date} date - Date value
 * @param {Object} t - Translation function
 * @returns {string} Formatted date
 */
export const formatDate = (date, t) => {
  const translate = t || ((key) => key);
  if (!date) return '—';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '—';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return '—';
  }
};

/**
 * Truncate ID for display
 * @param {string} id - Full ID
 * @param {number} length - Length to truncate to
 * @returns {string} Truncated ID
 */
export const truncateId = (id, length = 8) => {
  if (!id) return '—';
  return id.length > length ? `${id.substring(0, length)}...` : id;
};

/**
 * Resolve related collection value
 * @param {Object} item - Data item
 * @param {string} columnKey - Column key (e.g., 'users_studentEmail')
 * @param {Object} rawData - All raw data collections
 * @param {Object} t - Translation function
 * @returns {string} Resolved value
 */
export const resolveRelatedColumn = (item, columnKey, rawData = {}, t) => {
  const translate = t || ((key) => key);
  const [collection, field] = columnKey.split('_');
  
  if (!collection || !field) return '—';
  
  // Map field to relation ID in the item
  const relationMap = {
    'studentEmail': 'studentId',
    'studentPhone': 'studentId',
    'studentAddress': 'studentId',
    'studentNumber': 'studentId',
    'parentName': 'studentId',
    'classInstructor': 'classId',
    'classSchedule': 'classId',
    'classRoom': 'classId',
    'classSubject': 'classId',
    'programName': 'programId',
    'programType': 'programId',
    'programDuration': 'programId',
    'creatorEmail': 'createdBy',
    'creatorRole': 'createdBy'
  };
  
  const relationField = relationMap[field];
  if (!relationField || !item[relationField]) return '—';
  
  const relationId = item[relationField];
  
  // Resolve based on collection
  if (collection === 'users') {
    const user = resolveUser(relationId, rawData.users || [], t);
    const fieldMap = {
      'studentEmail': user.email,
      'studentPhone': user.phone,
      'studentAddress': user.address,
      'studentNumber': user.number,
      'parentName': user.parentName,
      'creatorEmail': user.email,
      'creatorRole': user.role
    };
    return fieldMap[field] || '—';
  }
  
  if (collection === 'classes') {
    const classInfo = resolveClass(relationId, rawData.classes || [], t);
    const fieldMap = {
      'classInstructor': classInfo.instructor,
      'classSchedule': classInfo.schedule,
      'classRoom': classInfo.room,
      'classSubject': classInfo.subject
    };
    return fieldMap[field] || '—';
  }
  
  if (collection === 'programs') {
    const program = resolveProgram(relationId, rawData.programs || [], t);
    const fieldMap = {
      'programName': program.name,
      'programType': program.type,
      'programDuration': program.duration
    };
    return fieldMap[field] || '—';
  }
  
  return '—';
};
