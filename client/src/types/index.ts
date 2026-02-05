// Centralized TypeScript Type Definitions
// This file contains all common types and interfaces used across the application

// Base Types
export type Theme = 'light' | 'dark';

export type Size = 'small' | 'medium' | 'large';

export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// User Types
export interface User {
  docId?: string;
  id?: string;
  email: string;
  displayName?: string;
  realName?: string;
  name?: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  phone?: string;
  studentNumber?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type UserRole = 
  | 'superadmin' 
  | 'admin' 
  | 'instructor' 
  | 'hr' 
  | 'student';

export type UserStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended' 
  | 'pending' 
  | 'deleted';

// Class Types
export interface Class {
  docId?: string;
  id?: string;
  name: string;
  description?: string;
  programId?: string;
  subjectId?: string;
  instructorId?: string;
  instructorEmail?: string;
  schedule?: ClassSchedule[];
  capacity?: number;
  enrolled?: number;
  status?: ClassStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export type ClassStatus = 'active' | 'inactive' | 'completed' | 'cancelled';

// Program Types
export interface Program {
  docId?: string;
  id?: string;
  name: string;
  description?: string;
  duration?: string;
  status?: ProgramStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ProgramStatus = 'active' | 'inactive' | 'archived';

// Subject Types
export interface Subject {
  docId?: string;
  id?: string;
  name: string;
  description?: string;
  code?: string;
  credits?: number;
  programId?: string;
  status?: SubjectStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type SubjectStatus = 'active' | 'inactive' | 'archived';

// Enrollment Types
export interface Enrollment {
  docId?: string;
  id?: string;
  userId: string;
  programId?: string;
  classId?: string;
  subjectId?: string;
  status?: EnrollmentStatus;
  enrolledAt?: Date | string;
  completedAt?: Date | string;
  grade?: string | number;
  attendance?: AttendanceRecord[];
}

export type EnrollmentStatus = 
  | 'active' 
  | 'completed' 
  | 'dropped' 
  | 'suspended' 
  | 'pending';

// Attendance Types
export interface AttendanceRecord {
  docId?: string;
  id?: string;
  userId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  markedBy?: string;
  location?: string;
  deviceInfo?: string;
}

export type AttendanceStatus = 
  | 'present' 
  | 'late' 
  | 'absent_no_excuse' 
  | 'absent_with_excuse' 
  | 'excused_leave' 
  | 'human_case';

// Activity Types
export interface Activity {
  docId?: string;
  id?: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date | string;
  details?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'failed_login' 
  | 'password_reset'
  | 'quiz_start'
  | 'quiz_submit'
  | 'assignment_submit'
  | 'attendance_mark'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'class_create'
  | 'class_update'
  | 'class_delete';

// Notification Types
export interface Notification {
  docId?: string;
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  targetUserId?: string;
  targetRole?: UserRole;
  read: boolean;
  archived: boolean;
  createdAt: Date | string;
  expiresAt?: Date | string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'announcement' 
  | 'grade' 
  | 'activity' 
  | 'message' 
  | 'chat' 
  | 'newsletter' 
  | 'attendance' 
  | 'absence' 
  | 'penalty';

// Quiz Types
export interface Quiz {
  docId?: string;
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  duration?: number;
  attempts?: number;
  passingScore?: number;
  status?: QuizStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export type QuizStatus = 'draft' | 'published' | 'archived';

// Submission Types
export interface Submission {
  docId?: string;
  id?: string;
  userId: string;
  quizId?: string;
  assignmentId?: string;
  answers?: Record<string, any>;
  score?: number;
  maxScore?: number;
  status?: SubmissionStatus;
  submittedAt?: Date | string;
  gradedAt?: Date | string;
  gradedBy?: string;
  feedback?: string;
}

export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'graded' 
  | 'returned' 
  | 'late';

// Participation Types
export interface Participation {
  docId?: string;
  id?: string;
  userId: string;
  classId: string;
  type: ParticipationType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
}

export type ParticipationType = 
  | 'excellent' 
  | 'good' 
  | 'average' 
  | 'poor' 
  | 'question_answer' 
  | 'project_work' 
  | 'team_work';

// Behavior Types
export interface Behavior {
  docId?: string;
  id?: string;
  userId: string;
  classId: string;
  type: BehaviorType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
}

export type BehaviorType = 
  | 'positive' 
  | 'negative' 
  | 'disruptive' 
  | 'absent' 
  | 'late' 
  | 'sleeping' 
  | 'phone_use' 
  | 'not_participating';

// Penalty Types
export interface Penalty {
  docId?: string;
  id?: string;
  userId: string;
  classId: string;
  type: PenaltyType;
  points?: number;
  description?: string;
  date: string;
  markedBy: string;
  status?: PenaltyStatus;
}

export type PenaltyType = 
  | 'cheating' 
  | 'attempted_cheating' 
  | 'impersonation' 
  | 'exam_disruption' 
  | 'forgery' 
  | 'repetitive_absence_with_excuse' 
  | 'repetitive_absence_without_excuse' 
  | 'phone_use_during_exam' 
  | 'plagiarism' 
  | 'disruptive_behavior' 
  | 'late_submission' 
  | 'missing_deadline';

export type PenaltyStatus = 'active' | 'resolved' | 'appealed';

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

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
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

// Component Props Types
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

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event Types
export interface CustomEvent<T = any> {
  type: string;
  payload?: T;
  timestamp: Date;
}

// State Management Types
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

// Export all types for easy importing
export type {
  // Re-export commonly used types
  ReactNode,
  CSSProperties,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
} from 'react';
