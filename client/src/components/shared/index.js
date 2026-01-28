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

// UI Components
export { default as ToggleSwitch } from './ui/ToggleSwitch';
export { default as LanguageToggle } from './ui/LanguageToggle';
export { default as FilterChips } from './ui/FilterChips';

// Icons (already exported from Icons.jsx)
export * from './Icons';

// Utilities
export * from '../utils/typeHelpers';
export * from '../utils/avatarUtils';

// CSS Files (for direct import if needed)
export { default as LoadingCSS } from './css/Loading.css';
export { default as ModalCSS } from './css/Modal.css';
export { default as NavbarCSS } from './css/Navbar.css';
export { default as ToastProviderCSS } from './css/ToastProvider.css';
export { default as SmartGridCSS } from './css/SmartGrid.css';
export { default as DraggableClockCSS } from './css/DraggableClock.css';
export { default as EmailManagerCSS } from './css/EmailManager.css';
