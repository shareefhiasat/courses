/**
 * Target Audience Types Constants
 * 
 * Maps frontend values to database IDs for target audience types
 */

export const TARGET_AUDIENCE_TYPES = {
  // Frontend value: Database ID
  all: 1,         // ALL - All Users
  students: 2,    // STUDENTS - Students only
  instructors: 3, // INSTRUCTORS - Instructors only
  admin: 4,       // ADMIN - Administrators only
  program: 5,     // PROGRAM - Program Specific
  class: 6        // CLASS - Class Specific
};

export const TARGET_AUDIENCE_LABELS = {
  en: {
    all: 'All Users',
    students: 'Students',
    instructors: 'Instructors',
    admin: 'Administrators',
    program: 'Program Specific',
    class: 'Class Specific'
  },
  ar: {
    all: 'جميع المستخدمين',
    students: 'الطلاب',
    instructors: 'المدربون',
    admin: 'المسؤولون',
    program: 'برنامج محدد',
    class: 'فصل محدد'
  }
};

export const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', labelAr: 'جميع المستخدمين' },
  { value: 'students', label: 'Students', labelAr: 'الطلاب' },
  { value: 'instructors', label: 'Instructors', labelAr: 'المدربون' },
  { value: 'admin', label: 'Administrators', labelAr: 'المسؤولون' },
  { value: 'program', label: 'Program Specific', labelAr: 'برنامج محدد' },
  { value: 'class', label: 'Class Specific', labelAr: 'فصل محدد' }
];

export default {
  TARGET_AUDIENCE_TYPES,
  TARGET_AUDIENCE_LABELS,
  TARGET_AUDIENCE_OPTIONS
};
