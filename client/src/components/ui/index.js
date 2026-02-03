// Core UI Components
export { default as Button } from './Button';
export { default as Card, CardHeader, CardBody, CardFooter } from './Card';
export { default as Badge } from './Badge';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { ToastProvider, useToast } from './Toast';
export { default as Spinner } from './Spinner';
export { default as Modal } from './Modal';
export { default as Tabs } from './Tabs';
export { default as StoryboardChip } from './StoryboardChip/StoryboardChip';
export { default as StoryboardTabs } from './StoryboardTabs/StoryboardTabs';

// Data Display Components
export { default as Table } from './Table';
export { default as DataGrid } from './DataGrid';
export { default as Avatar } from './Avatar';
export { default as Tooltip } from './Tooltip';
export { default as ProgressBar } from './ProgressBar';
export { default as Accordion } from './Accordion';

// History Components
export { StudentHistory } from './history';
export { default as Breadcrumb } from './Breadcrumb';
export { default as Chart } from './Chart';
export { default as InfoTooltip } from './InfoTooltip/InfoTooltip';

// Form Components
export { default as DatePicker } from './DatePicker';
export { default as DateRangeSlider } from './DateRangeSlider';
export { default as DateRangePicker } from './DateRangePicker';
export { default as FileUpload } from './FileUpload';
export { default as UrlInput } from './UrlInput/UrlInput';
export { default as Checkbox } from './Checkbox/Checkbox';
export { default as Textarea } from './Textarea/Textarea';
export { default as NumberInput } from './NumberInput/NumberInput';
export { default as YearSelect } from './YearSelect/YearSelect';
export { default as RichTextEditor } from './RichTextEditor/RichTextEditor';

// Navigation & Interaction
export { default as Dropdown } from './Dropdown';
export { default as Pagination } from './Pagination';
export { default as SearchBar } from './SearchBar';
export { default as Steps } from './Steps';
export { default as Drawer } from './Drawer';
export { default as StudentSelectOption } from './StudentSelectOption/StudentSelectOption';
export { default as StudentSelect } from './StudentSelect/StudentSelect';

// Feedback & Status
export { default as Tag } from './Tag';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton } from './Skeleton';
export { default as FancyLoading } from './FancyLoading';
export { default as Loading } from './Loading';
export { default as PermissionAwareLoading } from './PermissionAwareLoading';
export { default as AdvancedDataGrid } from './AdvancedDataGrid/AdvancedDataGrid';
export { default as ExpandablePanel } from './ExpandablePanel/ExpandablePanel';
export { default as CollapsibleDashboardSection } from './CollapsibleDashboardSection/CollapsibleDashboardSection';
export { default as CollapsibleSection } from './CollapsibleDashboardSection/CollapsibleDashboardSection';
export { default as LanguageSwitcher } from './LanguageSwitcher';

// Newly Organized Components
export { default as FilterChips } from './FilterChips/FilterChips';
export { default as NotificationBell } from './NotificationBell/NotificationBell';
export { default as NotificationDrawer } from './NotificationDrawer';
export { default as QRCodeGenerator } from './QRCodeGenerator/QRCodeGenerator';
export { default as RibbonTabs } from './RibbonTabs/RibbonTabs';
export { default as SeedDefaultTemplates } from './SeedDefaultTemplates/SeedDefaultTemplates';
export { default as StatusBadge } from './StatusBadge/StatusBadge';
export { default as Stopwatch } from './Stopwatch/Stopwatch';
export { default as Timer } from './Timer/Timer';
export { default as TimerStopwatch } from './TimerStopwatch/TimerStopwatch';
export { default as ToggleSwitch } from './ToggleSwitch/ToggleSwitch';
export { default as VirtualScroll } from './VirtualScroll/VirtualScroll';
export { default as WindowControls } from './WindowControls/WindowControls';

// Standalone Components
export { default as AttendanceFilters } from './AttendanceFilters';
export { default as ClassSelector } from './ClassSelector';
export { default as DateTimePicker } from './DateTimePicker';
export { default as GenericFilters } from './GenericFilters';
export { default as LanguageToggle } from './LanguageToggle';
export { default as SmartGrid } from './SmartGrid/SmartGrid';
export { default as DragGrid } from '../DragGrid';
export { default as EmailManager } from './EmailManager/EmailManager';
export { default as UserDeletionModal } from './UserDeletionModal/UserDeletionModal';
export { default as EmailTemplates } from './EmailTemplates/EmailTemplates';
export { default as EmailLogs } from './EmailLogs/EmailLogs';
export { default as SmartEmailComposer } from './SmartEmailComposer/SmartEmailComposer';

// Layout Components
export { default as Container } from './Container';
export { default as Grid } from './Grid';
export { default as Stack } from './Stack';

// Additional UI Components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as HelpDrawer } from './HelpDrawer';
export { default as SideDrawer } from './SideDrawer/SideDrawer';
export { default as Navbar } from './Navbar/Navbar';
export { default as RankDisplay } from './RankDisplay';
export { default as RankHistory } from './RankHistory';
export { default as VariableHelper } from './VariableHelper';
export { default as StudentQRCodeDisplay } from './StudentQRCodeDisplay/StudentQRCodeDisplay';
export { default as CollapsibleSideWindow } from './CollapsibleSideWindow';
export { default as StudentQuickActionModal } from './StudentQuickActionModal';

// Dashboard Components
export { default as Leaderboard } from './Leaderboard/Leaderboard';
export { default as ProgressWidget } from './ProgressWidget/ProgressWidget';
export { default as StatCard } from './StatCard/StatCard';
export { default as StreakWidget } from './StreakWidget/StreakWidget';

// Special Components
export { default as DraggableClock } from './DraggableClock/DraggableClock';

// Remove non-existent components that were referenced but don't exist
// These will need to be created or imports will need to be updated:
// - DeleteConfirmationModal (doesn't exist)
// - XIcon, HistoryIcon, TypeIcon (don't exist in icons folder)
// - EmailManager, EmailComposer, EmailSettings, EmailTemplates, EmailTemplateEditor, EmailTemplateList, EmailLogs, SmartEmailComposer (don't exist)
