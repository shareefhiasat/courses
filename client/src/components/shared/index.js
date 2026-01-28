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

// UI Components
export { default as ToggleSwitch } from './ui/ToggleSwitch';
export { default as LanguageToggle } from './ui/LanguageToggle';
export { default as FilterChips } from './ui/FilterChips';
export { default as WindowControls } from './ui/WindowControls';

// Icons (already exported from Icons.jsx)
export * from './Icons';

// Utilities
export * from '../../utils/typeHelpers';
export * from '../../utils/avatarUtils';
