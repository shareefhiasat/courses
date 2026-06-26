/**
 * Centralized test data fixtures for all E2E tests
 * Provides reusable test data for CRUD operations across modules
 */

export const testTimestamp = () => Date.now();

export const testPrefix = 'E2E';

export const sampleProgram = {
  code: `${testPrefix}-PROG-${testTimestamp()}`,
  nameEn: `${testPrefix} Test Program`,
  nameAr: `برنامج اختبار ${testPrefix}`,
  descriptionEn: 'Test program for E2E testing',
  descriptionAr: 'برنامج اختبار',
  isActive: true,
};

export const sampleSubject = {
  code: `${testPrefix}-SUBJ-${testTimestamp()}`,
  nameEn: `${testPrefix} Test Subject`,
  nameAr: `مادة اختبار ${testPrefix}`,
  credits: 3,
  subjectTypeId: 1,
  requirementTypeId: 1,
  programId: 1,
  isActive: true,
};

export const sampleClass = {
  code: `${testPrefix}-CLS-${testTimestamp()}`,
  nameEn: `${testPrefix} Test Class`,
  nameAr: `صف اختبار ${testPrefix}`,
  programId: 1,
  subjectId: 5,
  instructorId: 14,
  maxCapacity: 30,
  isActive: true,
};

export const sampleActivity = {
  titleEn: `${testPrefix} Test Activity`,
  titleAr: `نشاط اختبار ${testPrefix}`,
  descriptionEn: 'Test activity for E2E',
  descriptionAr: 'نشاط اختبار',
  typeId: 1,
  classId: 1,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
};

export const sampleAnnouncement = {
  titleEn: `${testPrefix} Test Announcement`,
  titleAr: `إعلان اختبار ${testPrefix}`,
  descriptionEn: 'Test announcement description',
  descriptionAr: 'وصف الإعلان',
  bodyEn: 'Test announcement body',
  bodyAr: 'محتوى الإعلان',
  priority: 'normal',
  targetAudience: 'all',
  isActive: true,
};

export const sampleQuiz = {
  title: `${testPrefix} Test Quiz ${testTimestamp()}`,
  description: 'Test quiz for E2E',
  classId: 1,
  passingScore: 60,
  timeLimit: 30,
  maxAttempts: 3,
  isPublished: false,
};

export const sampleEnrollment = {
  studentId: 1,
  classId: 1,
  status: 'active',
};

export const sampleAttendance = {
  studentId: 1,
  classId: 1,
  date: new Date().toISOString().split('T')[0],
  status: 'present',
};

export const samplePenalty = {
  studentId: 1,
  classId: 1,
  type: 'LATE_SUBMISSION',
  descriptionEn: `${testPrefix} test penalty`,
  points: 5,
};

export const sampleParticipation = {
  studentId: 1,
  classId: 1,
  participationTypeId: 1,
  points: 10,
  date: new Date().toISOString().split('T')[0],
};

export const sampleBehavior = {
  studentId: 1,
  classId: 1,
  behaviorTypeId: 1,
  rating: 'positive',
  notes: `${testPrefix} test behavior`,
  date: new Date().toISOString().split('T')[0],
};

export const sampleClassroom = {
  code: `${testPrefix}-CLRM-${testTimestamp()}`,
  nameEn: `${testPrefix} Test Classroom`,
  nameAr: `قاعة اختبار ${testPrefix}`,
  capacity: 50,
  status: 'available',
};

export const sampleHoliday = {
  nameEn: `${testPrefix} Test Holiday`,
  nameAr: `عطلة اختبار ${testPrefix}`,
  date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  programId: 1,
};

export const sampleTimeSlot = {
  nameEn: `${testPrefix} Test Slot`,
  startTime: '08:00',
  endTime: '09:30',
  programId: 1,
  isSchedulable: true,
};

export const sampleChatMessage = {
  content: `${testPrefix} test message ${testTimestamp()}`,
};

export const sampleWorkflowDocument = {
  title: `${testPrefix} Test Workflow ${testTimestamp()}`,
  type: 'leave-request',
  description: 'Test workflow document',
};

export const sampleFolder = {
  name: `${testPrefix} Test Folder ${testTimestamp()}`,
  parentId: null,
};

export default {
  testTimestamp,
  testPrefix,
  sampleProgram,
  sampleSubject,
  sampleClass,
  sampleActivity,
  sampleAnnouncement,
  sampleQuiz,
  sampleEnrollment,
  sampleAttendance,
  samplePenalty,
  sampleParticipation,
  sampleBehavior,
  sampleClassroom,
  sampleHoliday,
  sampleTimeSlot,
  sampleChatMessage,
  sampleWorkflowDocument,
  sampleFolder,
};
