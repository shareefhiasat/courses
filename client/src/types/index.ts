// Centralized TypeScript Type Definitions
// Single source of truth for all application types

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// FIREBASE COLLECTION TYPES (Database Models)
// ============================================================================

// User Management
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'HR';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Academic Structures
export interface Program {
  docId: string;
  name: string;
  nameAr?: string;
  code: string;
  description?: string;
  duration?: number;
  credits?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Subject {
  docId: string;
  name: string;
  nameAr?: string;
  code: string;
  description?: string;
  credits?: number;
  programId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Class {
  docId: string;
  name: string;
  nameAr?: string;
  programId: string;
  subjectId: string;
  instructorId: string;
  schedule?: ClassSchedule[];
  room?: string;
  capacity?: number;
  enrolled?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface ClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}

// Enrollment & Progress
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

// Activities & Assessments
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
  metadata?: Record<string, any>;
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
  answers: Record<string, any>;
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

// Attendance & Participation
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

// Grading
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

// Communications
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
  metadata?: Record<string, any>;
}

export type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'ANNOUNCEMENT' | 'GRADE' | 'ACTIVITY' | 'MESSAGE' | 'CHAT' | 'NEWSLETTER' | 'ATTENDANCE' | 'ABSENCE' | 'PENALTY';

// Resources
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

// Analytics & Reports
export interface AnalyticsRecord {
  docId: string;
  type: AnalyticsType;
  userId?: string;
  classId?: string;
  data: Record<string, any>;
  createdAt: Timestamp;
}

export type AnalyticsType = 'LOGIN' | 'PAGE_VIEW' | 'QUIZ_ATTEMPT' | 'SUBMISSION' | 'ATTENDANCE';

export interface ScheduledReport {
  docId: string;
  name: string;
  type: ReportType;
  schedule: string;
  recipients: string[];
  parameters?: Record<string, any>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type ReportType = 'ATTENDANCE' | 'GRADES' | 'PERFORMANCE' | 'ACTIVITY';

// System
export interface ActivityLog {
  docId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
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

// Gamification
export interface Badge {
  docId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  icon?: string;
  criteria: Record<string, any>;
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
  metadata?: Record<string, any>;
}

// ============================================================================
// UI & FORM TYPES (Not database models)
// ============================================================================

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
  defaultValue?: any;
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
  value?: any;
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

export interface CustomEvent<T = any> {
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

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: number;
}

export interface PaginatedResponse<T = any> extends ServiceResponse<T> {
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
