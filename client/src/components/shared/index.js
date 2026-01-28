/**
 * Shared Components Index
 * Centralized exports for all shared components
 */

// Common Components
export { default as Loading } from './common/Loading';
export { default as Modal } from './common/Modal';
export { default as DeleteConfirmationModal } from './common/DeleteConfirmationModal';
export { default as ErrorBoundary } from './common/ErrorBoundary';
export { default as NotificationDrawer } from './common/NotificationDrawer';
export { default as HelpDrawer } from './common/HelpDrawer';
export { default as SmartGrid } from './common/SmartGrid';
export { default as DragGrid } from './common/DragGrid';
export { default as CollapsibleSideWindow } from './common/CollapsibleSideWindow';
export { default as NotificationBell } from './common/NotificationBell';
export { default as QRCodeGenerator } from './common/QRCodeGenerator';
export { default as Timer } from './common/Timer';
export { default as Stopwatch } from './common/Stopwatch';
export { default as RankDisplay } from './common/RankDisplay';
export { default as RankHistory } from './common/RankHistory';
export { default as RankUpgradeModal } from './common/RankUpgradeModal';
export { default as RecentMedals } from './common/RecentMedals';
export { default as VariableHelper } from './common/VariableHelper';
export { default as InstructorActivityForm } from './common/InstructorActivityForm';
export { default as QuizCard } from './common/QuizCard';
export { default as GenericForm } from './common/GenericForm';
export { default as UnifiedCard } from './common/UnifiedCard';
export { default as EmailManager } from './common/EmailManager';
export { default as EmailComposer } from './common/EmailComposer';
export { default as EmailSettings } from './common/EmailSettings';
export { default as EmailTemplates } from './common/EmailTemplates';
export { default as EmailTemplateEditor } from './common/EmailTemplateEditor';
export { default as EmailTemplateList } from './common/EmailTemplateList';
export { default as EmailLogs } from './common/EmailLogs';
export { default as SmartEmailComposer } from './common/SmartEmailComposer';
export { default as UserDeletionModal } from './common/UserDeletionModal';

// UI Components
export { default as ToggleSwitch } from './ui/ToggleSwitch';
export { default as LanguageToggle } from './ui/LanguageToggle';
export { default as FilterChips } from './ui/FilterChips';
export { default as WindowControls } from './ui/WindowControls';
export { default as AttendanceFilters } from './ui/AttendanceFilters';
export { default as GenericFilters } from './ui/GenericFilters';
export { default as StatusBadge } from './ui/StatusBadge';
export { default as ClassSelector } from './ui/ClassSelector';
export { default as DateTimePicker } from './ui/DateTimePicker';
export { default as SeedDefaultTemplates } from './ui/SeedDefaultTemplates';
export { default as RibbonTabs } from './ui/RibbonTabs';

// Icons (already exported from Icons.jsx)
export * from './Icons';

// Utilities
export * from '../../utils/typeHelpers';
export * from '../../utils/avatarUtils';
