// ============================================================================
// CENTRALIZED TYPESCRIPT TYPE DEFINITIONS
// ============================================================================
// Single source of truth for all application types across the LMS platform
// 
// ARCHITECTURE:
// - Database Models: Types representing Firestore collections (lines 13-410)
// - UI Types: Component props and form types (lines 412-510)
// - Utility Types: Helper types for TypeScript operations (lines 512-567)
// 
// USAGE:
// - Import types: import { User, UserRole, AttendanceRecord } from '@types/index'
// - Do NOT create duplicate types in other files
// - All Firebase collection types MUST be defined here
// - Use these types in both DB services and business services
// - UI components should use these types for props validation
// 
// MAINTENANCE:
// - When adding new Firestore collections, add types in Database Models section
// - Keep comments synchronized with actual field usage
// - Update ServiceResponse type usage across all service layers

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// FIREBASE COLLECTION TYPES (Database Models)
// ============================================================================
// These types represent the exact structure of Firestore collections.
// 
// USAGE IN SERVICES:
// - DB Services: Use these types for function parameters and return values
// - Business Services: Use these types + add business logic validation
// - Components: Receive these types from hooks/services
// 
// FIELD CONVENTIONS:
// - docId: Firestore document ID (always string)
// - createdAt/updatedAt: Firestore Timestamp objects
// - Foreign keys end with 'Id' (userId, classId, programId)
// - Optional fields marked with '?'
// - Arrays for relationships (assignedTo: string[])

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

/**
 * UserRole type definition
 * Using lowercase strings to match the JavaScript constants
 */
export type UserRole = 'admin' | 'super_admin' | 'instructor' | 'hr' | 'student';

export interface User {
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email (unique)
  displayName: string;            // Display name for UI
  role: UserRole;                 // System role for permissions
  photoURL?: string;              // Profile picture URL
  phoneNumber?: string;           // Contact number
  createdAt: Timestamp;           // Account creation time
  updatedAt: Timestamp;           // Last profile update
  lastLogin?: Timestamp;          // Last login tracking
  isActive: boolean;              // Account status (soft delete)
  metadata?: Record<string, unknown>; // Additional user data
}

// ============================================================================
// ACADEMIC STRUCTURE TYPES
// ============================================================================
export interface Program {
  docId: string;                  // Firestore document ID
  nameEn: string;                 // Program name (English)
  nameAr: string;                 // Program name (Arabic)
  code: string;                   // Unique program code
  descriptionEn?: string;         // Program description (English)
  descriptionAr?: string;         // Program description (Arabic)
  durationYears: number;          // Duration in years
  minGPA?: number;                 // Minimum GPA requirement
  totalCreditHours: number;       // Total credit hours
  isActive: boolean;              // Program status
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;              // Creator user ID
  updatedBy?: string;             // Last updater user ID
}

export interface Subject {
  docId: string;                  // Firestore document ID
  name: string;                   // Subject name (English)
  nameAr?: string;                // Subject name (Arabic)
  code: string;                   // Subject code
  description?: string;           // Subject description
  credits?: number;               // Credit hours
  programId: string;               // Parent program ID
  isActive: boolean;              // Subject status
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;              // Creator user ID
}

export interface Class {
  docId: string;                  // Firestore document ID
  name: string;                   // Class name (English)
  nameAr?: string;                // Class name (Arabic)
  programId: string;              // Parent program ID
  subjectId: string;              // Parent subject ID
  instructorId: string;           // Assigned instructor ID
  term?: string;                  // Academic term (Fall, Spring, Summer)
  year?: string;                  // Academic year
  schedule?: ClassSchedule[];     // Class schedule array
  room?: string;                  // Classroom location
  capacity?: number;              // Maximum students
  enrolled?: number;              // Current enrollment count
  isActive: boolean;              // Class status
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;              // Creator user ID
}

export interface ClassSchedule {
  day: string;                    // Day of week (Monday, Tuesday, etc.)
  startTime: string;              // Start time (HH:MM format)
  endTime: string;                // End time (HH:MM format)
  room?: string;                  // Room for this session
}

// ============================================================================
// ENROLLMENT & PROGRESS TYPES
// ============================================================================
export interface Enrollment {
  docId: string;
  userId: string;
  programId: string;
  classId?: string;
  subjectId?: string;
  status: EnrollmentStatus;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  grade?: string | number;
  attendance?: AttendanceRecord[];
}

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED' | 'PENDING';

// ============================================================================
// ACTIVITIES & ASSESSMENTS TYPES
// ============================================================================
export interface Activity {
  docId: string;
  type: ActivityType;
  title: string;
  description?: string;
  assignedTo: string[];
  classId?: string;
  subjectId?: string;
  dueDate?: Timestamp;
  status: ActivityStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export type ActivityType = 'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'PRESENTATION' | 'READING';
export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface Quiz {
  docId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  duration?: number;
  attempts?: number;
  passingScore?: number;
  status: QuizStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points?: number;
  explanation?: string;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface QuizSubmission {
  docId: string;
  userId: string;
  quizId: string;
  answers: Record<string, unknown>;
  score?: number;
  maxScore?: number;
  percentage?: number;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  gradedAt?: Timestamp;
  gradedBy?: string;
  feedback?: string;
}

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE';

export interface Submission {
  docId: string;
  userId: string;
  activityId?: string;
  quizId?: string;
  content?: string;
  attachments?: string[];
  score?: number;
  maxScore?: number;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  gradedAt?: Timestamp;
  gradedBy?: string;
  feedback?: string;
}

// ============================================================================
// ATTENDANCE, PARTICIPATION, BEHAVIOR & PENALTY TYPES
// ============================================================================
// These types are used by the QR Scanner and student tracking systems
export interface AttendanceRecord {
  docId: string;
  userId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: Timestamp;
  checkOutTime?: Timestamp;
  notes?: string;
  markedBy: string;
  location?: string;
  deviceInfo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Attendance status values
 * - PRESENT: Student attended on time
 * - LATE: Student arrived late
 * - ABSENT_NO_EXCUSE: Student absent without valid reason
 * - ABSENT_WITH_EXCUSE: Student absent with valid documentation
 * - EXCUSED_LEAVE: Pre-approved absence
 * - HUMAN_CASE: Special circumstances requiring HR attention
 */
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT_NO_EXCUSE' | 'ABSENT_WITH_EXCUSE' | 'EXCUSED_LEAVE' | 'HUMAN_CASE';

export interface ParticipationRecord {
  docId: string;
  userId: string;
  classId: string;
  type: ParticipationType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
  createdAt: Timestamp;
}

export type ParticipationType = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'QUESTION_ANSWER' | 'PROJECT_WORK' | 'TEAM_WORK';

export interface BehaviorRecord {
  docId: string;
  userId: string;
  classId: string;
  type: BehaviorType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
  createdAt: Timestamp;
}

export type BehaviorType = 'POSITIVE' | 'NEGATIVE' | 'DISRUPTIVE' | 'ABSENT' | 'LATE' | 'SLEEPING' | 'PHONE_USE' | 'NOT_PARTICIPATING';

export interface PenaltyRecord {
  docId: string;
  userId: string;
  classId: string;
  type: PenaltyType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
  status: PenaltyStatus;
  createdAt: Timestamp;
}

export type PenaltyType = 'CHEATING' | 'ATTEMPTED_CHEATING' | 'IMPERSONATION' | 'EXAM_DISRUPTION' | 'FORGERY' | 'REPETITIVE_ABSENCE_WITH_EXCUSE' | 'REPETITIVE_ABSENCE_WITHOUT_EXCUSE' | 'PHONE_USE_DURING_EXAM' | 'PLAGIARISM' | 'DISRUPTIVE_BEHAVIOR' | 'LATE_SUBMISSION' | 'MISSING_DEADLINE';
export type PenaltyStatus = 'ACTIVE' | 'RESOLVED' | 'APPEALED';

// ============================================================================
// GRADING TYPES
// ============================================================================
export interface GradeRecord {
  docId: string;
  userId: string;
  classId?: string;
  subjectId?: string;
  activityId?: string;
  quizId?: string;
  grade: string | number;
  percentage?: number;
  maxGrade?: number;
  gradedBy: string;
  gradedAt: Timestamp;
  feedback?: string;
}

// ============================================================================
// COMMUNICATIONS TYPES
// ============================================================================
export interface Announcement {
  docId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetAudience: string[];
  classId?: string;
  programId?: string;
  status: AnnouncementStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  expiresAt?: Timestamp;
}

export type AnnouncementType = 'GENERAL' | 'URGENT' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'EVENT';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ChatMessage {
  docId: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: MessageType;
  attachments?: string[];
  read: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Notification {
  docId: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  targetUserId?: string;
  targetRole?: UserRole;
  read: boolean;
  archived: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'ANNOUNCEMENT' | 'GRADE' | 'ACTIVITY' | 'MESSAGE' | 'CHAT' | 'NEWSLETTER' | 'ATTENDANCE' | 'ABSENCE' | 'PENALTY';

// ============================================================================
// RESOURCE MANAGEMENT TYPES
// ============================================================================
export interface Resource {
  docId: string;
  name: string;
  description?: string;
  type: ResourceType;
  url?: string;
  filePath?: string;
  classId?: string;
  subjectId?: string;
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ResourceType = 'DOCUMENT' | 'VIDEO' | 'IMAGE' | 'LINK' | 'FOLDER';

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================
export interface AnalyticsRecord {
  docId: string;
  type: AnalyticsType;
  userId?: string;
  classId?: string;
  data: Record<string, unknown>;
  createdAt: Timestamp;
}

export type AnalyticsType = 'LOGIN' | 'PAGE_VIEW' | 'QUIZ_ATTEMPT' | 'SUBMISSION' | 'ATTENDANCE';

export interface ScheduledReport {
  docId: string;
  name: string;
  type: ReportType;
  schedule: string;
  recipients: string[];
  parameters?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type ReportType = 'ATTENDANCE' | 'GRADES' | 'PERFORMANCE' | 'ACTIVITY';

// ============================================================================
// SYSTEM & LOGGING TYPES
// ============================================================================
export interface ActivityLog {
  docId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

export interface Category {
  docId: string;
  name: string;
  nameAr?: string;
  type: CategoryType;
  parentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type CategoryType = 'ACADEMIC' | 'BEHAVIOR' | 'PENALTY' | 'PARTICIPATION' | 'SYSTEM';

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================
export interface Badge {
  docId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  icon?: string;
  criteria: Record<string, unknown>;
  points: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface UserBadge {
  docId: string;
  userId: string;
  badgeId: string;
  earnedAt: Timestamp;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// UI & FORM TYPES (Not database models)
// ============================================================================
// These types are for UI components only and do NOT represent database collections.
// Use these for component props, form validation, and UI state management.

// Base Types
export type Theme = 'light' | 'dark';
export type Size = 'small' | 'medium' | 'large';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormOption[];
  validation?: ValidationRule[];
  defaultValue?: unknown;
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'textarea' 
  | 'date' 
  | 'file';

export interface FormOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  value?: unknown;
}

export type ValidationType = 
  | 'required' 
  | 'email' 
  | 'minLength' 
  | 'maxLength' 
  | 'min' 
  | 'max' 
  | 'pattern';

// ============================================================================
// FILTER & PAGINATION TYPES
// ============================================================================

export interface FilterOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DateRange {
  from: Date | string;
  to: Date | string;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ThemeProps {
  theme?: Theme;
}

export interface SizeProps {
  size?: Size;
}

export interface VariantProps {
  variant?: Variant;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// EVENT & STATE TYPES
// ============================================================================

export interface CustomEvent<T = unknown> {
  type: string;
  payload?: T;
  timestamp: Date;
}

export interface LoadingState {
  loading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface FilterState {
  search?: string;
  status?: string;
  dateRange?: DateRange;
  sortBy?: SortOption;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
// Standard response format for all service layer functions.
// 
// USAGE:
// - All DB service functions should return ServiceResponse<T>
// - All business service functions should return ServiceResponse<T>
// - Components check response.success before accessing response.data
// 
// EXAMPLE:
// const result = await getUserById(userId);
// if (result.success) {
//   console.log(result.data); // User object
// } else {
//   console.error(result.error); // Error message
// }

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: number;
}

export interface PaginatedResponse<T = unknown> extends ServiceResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// REACT TYPE EXPORTS
// ============================================================================

export type {
  ReactNode,
  CSSProperties,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
} from 'react';
