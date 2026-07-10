import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeycloakProvider } from './providers/KeycloakProvider';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { LangProvider } from '@contexts/LangContext';
import { TypographyProvider } from '@contexts/TypographyContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ColorThemeProvider } from '@contexts/ColorThemeContext';
import MuiAppThemeProvider from './providers/MuiAppThemeProvider';
import { GlobalLoadingProvider, GlobalLoadingFallback } from '@contexts/GlobalLoadingContext';
import HelpCommandPalette from './components/help/HelpCommandPalette.jsx';
import HelpRedirect from './components/help/HelpRedirect.jsx';
import { info, error, warn, debug } from './services/utils/logger.js';
import { drawerTlog } from '@utils/drawerTlog';
import { installTourEventRouter } from '@utils/tourScheduler';
import { ROLE_STRINGS } from './utils/userUtils.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import './App.css';
import './styles/colors.css';
import './styles/tokens.css';
import './styles/theme.css';
import './styles/joyride-modal.css';
import './utils/userRoleManager';
// allowlistManager removed - now using Keycloak for user management

// Direct imports — always-on shell components (not lazy, no barrel)
import Navbar from '@ui/Navbar/Navbar';
import SideDrawer from '@ui/SideDrawer/SideDrawer';
import LoadingProgress from '@ui/LoadingProgress/LoadingProgress';
import ToastProvider from '@ui/ToastProvider.jsx';
import StudentQuickActionModal from '@ui/StudentQuickActionModal.jsx';
import StudentQRCodeDisplay from '@ui/StudentQRCodeDisplay/StudentQRCodeDisplay';
import SilentCheckSso from './components/auth/SilentCheckSso.jsx';
import OperationsBoardShell from './layouts/OperationsBoardShell.jsx';
import chatSocket from '@services/realtime/chatSocket.js';

// Lazy-loaded pages — each becomes its own JS chunk
const HomePage = lazy(() => import('./pages/HomePage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const LoginPage = lazy(() => import('./pages/system/LoginPage'));
const UnauthorizedPage = lazy(() => import('./pages/system/UnauthorizedPage'));
const ChatPage = lazy(() => import('./pages/communications/chat/ChatPage'));
const ActivityDetailPage = lazy(() => import('./pages/academic/activities/ActivityDetailPage'));
const NotificationsPage = lazy(() => import('./pages/communications/notifications/NotificationsPage'));
const ProfileSettingsPage = lazy(() => import('./pages/users/ProfileSettingsPage'));
const AttendancePage = lazy(() => import('./pages/operations/attendance/AttendancePage'));
const AttendanceWorkspacePage = lazy(() => import('./pages/AttendanceWorkspacePage'));
const StudentAttendancePage = lazy(() => import('./pages/operations/attendance/StudentAttendancePage'));
const HRAttendancePage = lazy(() => import('./pages/operations/attendance/HRAttendancePage'));
const PenaltiesPage = lazy(() => import('./pages/operations/penalty/PenaltiesPage'));
const ParticipationPage = lazy(() => import('./pages/operations/participation/ParticipationPage'));
const BehaviorPage = lazy(() => import('./pages/operations/behavior/BehaviorPage'));
const QRScannerPage = lazy(() => import('./pages/operations/attendance/QRScannerPage'));
const QRCodeDisplayPage = lazy(() => import('./pages/operations/attendance/QRCodeDisplayPage'));
const EnrollmentsPage = lazy(() => import('./pages/academic/enrollments/EnrollmentsPage'));
const PermissionMatrixPage = lazy(() => import('./pages/system/PermissionMatrixPage'));
// RoleAccessPro removed - now using Keycloak roles for RBAC
const StudentProfilePage = lazy(() => import('./pages/users/StudentProfilePage'));
const StudentDashboardPage = lazy(() => import('./pages/dashboard/StudentDashboardPage'));
const QuizzesPage = lazy(() => import('./pages/quizzes/QuizzesPage'));
const QuizPreviewPage = lazy(() => import('./pages/quizzes/QuizPreviewPage'));
const StudentQuizPage = lazy(() => import('./pages/quizzes/StudentQuizPage'));
const QuestionBankPage = lazy(() => import('./pages/quizzes/QuestionBankPage'));
const QuizResultsPage = lazy(() => import('./pages/quizzes/quiz-results/QuizResultsPage'));
const ReviewResultsPage = lazy(() => import('./pages/quizzes/quiz-results/ReviewResultsPage'));
const ProgramsManagementPage = lazy(() => import('./pages/academic/programs/ProgramsPage'));
const SubjectsManagementPage = lazy(() => import('./pages/academic/subjects/SubjectsPage'));
const ScheduledReportsPage = lazy(() => import('./pages/feedback/reports/ScheduledReportsPage'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'));
const SummaryDashboardPage = lazy(() => import('./pages/SummaryDashboardPage'));
const SchedulingCalendarPage = lazy(() => import('./pages/SchedulingCalendarPage'));
const InstructorAvailabilityPage = lazy(() => import('./pages/InstructorAvailabilityPage'));
const UserCategoryAccessPage = lazy(() => import('./pages/UserCategoryAccessPage'));
const ClassroomAvailabilityPage = lazy(() => import('./pages/ClassroomAvailabilityPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const MarksPage = lazy(() => import('./pages/academic/enrollments/grading/MarksPage'));
const WorkflowInboxPage = lazy(() => import('./pages/workflow/WorkflowInboxPage'));
const WorkflowDetailPage = lazy(() => import('./pages/workflow/WorkflowDetailPage'));
const WorkflowDocumentDetailPage = lazy(() => import('./pages/workflow/WorkflowDocumentDetailPage'));
const CalendarCompliancePage = lazy(() => import('./pages/workflow/CalendarCompliancePage'));
const WorkflowAnalyticsPage = lazy(() => import('./pages/workflow/WorkflowAnalyticsPage'));
const WorkflowConfigPage = lazy(() => import('./pages/workflow/WorkflowConfigPage'));
const SmartDrivePage = lazy(() => import('./pages/SmartDrivePage'));

const lazyProtectedRoutes = [
  { path: '/dashboard', screenId: 'dashboard', screenName: 'Dashboard', Component: DashboardPage },
  { path: '/summary-dashboard', screenId: 'summaryDashboard', screenName: 'Summary Dashboard', Component: SummaryDashboardPage },
  { path: '/scheduling-calendar', screenId: 'schedulingCalendar', screenName: 'Scheduling Calendar', Component: SchedulingCalendarPage },
  { path: '/instructor-availability', screenId: 'instructorAvailability', screenName: 'Instructor Availability', Component: InstructorAvailabilityPage },
  { path: '/user-category-access', screenId: 'userCategoryAccess', screenName: 'User Access', Component: UserCategoryAccessPage },
  { path: '/classroom-availability', screenId: 'classroomAvailability', screenName: 'Classroom Availability', Component: ClassroomAvailabilityPage },
  { path: '/categories', screenId: 'categories', screenName: 'Categories', Component: CategoriesPage },
  { path: '/student-dashboard', screenId: 'studentDashboard', screenName: 'Student Dashboard', Component: StudentDashboardPage },
  { path: '/workflow/inbox', screenId: 'workflow', screenName: 'Workflow Inbox', Component: WorkflowInboxPage },
  { path: '/workflow-documents/:documentId', screenId: 'workflow', screenName: 'Workflow Document Detail', Component: WorkflowDocumentDetailPage },
  { path: '/smart-drive', screenId: 'drive', screenName: 'Smart Drive', Component: SmartDrivePage },
  { path: '/workflow/:documentId', screenId: 'workflow', screenName: 'Workflow Detail', Component: WorkflowDetailPage },
  { path: '/workflow/compliance', screenId: 'workflow', screenName: 'Calendar Compliance', Component: CalendarCompliancePage },
  { path: '/workflow/analytics', screenId: 'workflow', screenName: 'Workflow Analytics', Component: WorkflowAnalyticsPage },
  { path: '/workflow/config', screenId: 'workflow', screenName: 'Workflow Configuration', Component: WorkflowConfigPage },
];

const protectedRoutes = [
  { path: '/welcome', screenId: 'welcome', screenName: 'Welcome', Component: WelcomePage },
  { path: '/attendance-workspace', screenId: 'attendance', screenName: 'Attendance Workspace', Component: AttendanceWorkspacePage },
  { path: '/', screenId: 'home', screenName: 'Home', Component: HomePage },
  { path: '/student-profile', screenId: 'studentProfile', screenName: 'Student Profile', Component: StudentProfilePage },
  { path: '/activity/:activityId', screenId: 'activities', screenName: 'Activity Details', Component: ActivityDetailPage },
  { path: '/quizzes', screenId: 'quizzes', screenName: 'Quizzes', Component: QuizzesPage },
  { path: '/quiz-preview/:quizId', screenId: 'quizzes', screenName: 'Quiz Preview', Component: QuizPreviewPage },
  { path: '/quiz/:quizId', screenId: 'quizzes', screenName: 'Take Quiz', Component: StudentQuizPage },
  { path: '/review-results', screenId: 'review-results', screenName: 'Review Results', Component: ReviewResultsPage },
  { path: '/attendance', screenId: 'attendance', screenName: 'Attendance', Component: AttendancePage },
  { path: '/hr-attendance', screenId: 'hrAttendance', screenName: 'HR Attendance', Component: HRAttendancePage },
  { path: '/penalty', screenId: 'penalty', screenName: 'Penalty', Component: PenaltiesPage },
  { path: '/participation', screenId: 'participation', screenName: 'Participation', Component: ParticipationPage },
  { path: '/behavior', screenId: 'behavior', screenName: 'Behavior', Component: BehaviorPage },
  { path: '/qr-scanner', screenId: 'qrScanner', screenName: 'QR Scanner', Component: QRScannerPage },
  { path: '/enrollments', screenId: 'enrollments', screenName: 'Enrollments', Component: EnrollmentsPage },
  { path: '/manage-enrollments', screenId: 'manageEnrollments', screenName: 'Manage Enrollments', Component: EnrollmentsPage },
  { path: '/programs', screenId: 'programs', screenName: 'Programs', Component: ProgramsManagementPage },
  { path: '/subjects', screenId: 'subjects', screenName: 'Subjects', Component: SubjectsManagementPage },
  { path: '/marks-entry', screenId: 'marksEntry', screenName: 'Marks Entry', Component: MarksPage },
  { path: '/advanced-analytics', screenId: 'advancedAnalytics', screenName: 'Advanced Analytics', Component: AdvancedAnalytics },
  { path: '/chat', screenId: 'chat', screenName: 'Chat', Component: ChatPage },
  { path: '/notifications', screenId: 'notifications', screenName: 'Notifications', Component: NotificationsPage },
  { path: '/scheduled-reports', screenId: 'scheduledReports', screenName: 'Scheduled Reports', Component: ScheduledReportsPage },
  { path: '/profile', screenId: 'profile', screenName: 'Profile Settings', Component: ProfileSettingsPage },
];

const redirectRoutes = [
  { from: '/home', to: '/' },
  { from: '/activities', to: '/?mode=activities' },
  { from: '/resources', to: '/?mode=resources' },
  { from: '/progress', to: '/student-dashboard' },
  { from: '/my-attendance', to: '/student-dashboard' },
  { from: '/my-enrollments', to: '/student-dashboard' },
  { from: '/my-progress', to: '/student-dashboard' },
  { from: '/quiz-management', to: '/quizzes' },
  { from: '/quiz-builder', to: '/quizzes?mode=add' },
  { from: '/course-progress/:courseId', to: '/student-dashboard' },
  { from: '/class-schedules', to: '/scheduling-calendar?tab=classes' },
];

// Track page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    info('🔍 PageTracker - Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString()
    });
    
    // Analytics removed - PostHog disabled
  }, [location]);
  
  return null;
}

const AppContent = () => {
  const { user, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isSideDrawerCollapsed, setIsSideDrawerCollapsed] = useState(false);

  // Redirect non-student users to /welcome when they land on / for the first time
  useEffect(() => {
    if (user && !isStudent && location.pathname === '/') {
      const hasVisitedWelcome = sessionStorage.getItem('welcome_visited');
      if (!hasVisitedWelcome) {
        sessionStorage.setItem('welcome_visited', '1');
        navigate('/welcome', { replace: true });
      }
    }
  }, [user, isStudent, location.pathname, navigate]);
  
  // useRealTimeUpdates(); // Temporarily disabled to fix notification spam

  const prevTokenRef = useRef(null);
  useEffect(() => {
    const token = user?.token || null;
    if (token && token !== prevTokenRef.current) {
      chatSocket.disconnect();
      chatSocket.connect(token);
      prevTokenRef.current = token;
    } else if (!token && prevTokenRef.current) {
      chatSocket.disconnect();
      prevTokenRef.current = null;
    }
  }, [user?.token]);
  
  const toggleSideDrawer = useCallback(() => {
    drawerTlog('app:hamburger-click', { isSideDrawerCollapsed, isSideDrawerOpen });
    if (isSideDrawerCollapsed) {
      drawerTlog('app:hamburger-uncollapse-orphan', {
        note: 'App isSideDrawerCollapsed was true; SideDrawer uses its own collapsed state',
      });
      setIsSideDrawerCollapsed(false);
    } else {
      setIsSideDrawerOpen((prev) => {
        const next = !prev;
        drawerTlog('app:isOpen-toggle', {
          from: prev,
          to: next,
          hint: 'SideDrawer visible when isOpen || stickyMode (sticky from localStorage)',
        });
        return next;
      });
    }
  }, [isSideDrawerCollapsed, isSideDrawerOpen]);

  const closeSideDrawer = useCallback(() => {
    drawerTlog('app:onClose', {
      wasOpen: isSideDrawerOpen,
      note: 'drawer may stay mounted when auto-hide edge strip is active',
    });
    setIsSideDrawerOpen(false);
  }, [isSideDrawerOpen]);

  const openSideDrawer = useCallback(() => {
    drawerTlog('app:onOpen', { wasOpen: isSideDrawerOpen });
    setIsSideDrawerOpen(true);
  }, [isSideDrawerOpen]);

  const toggleSideDrawerCollapse = useCallback(() => {
    setIsSideDrawerCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    installTourEventRouter();
  }, []);

  // Handle keyboard shortcut to toggle drawer (Cmd+M / Ctrl+M)
  useEffect(() => {
    const handleToggleDrawer = () => {
      drawerTlog('app:keyboard-toggle', { key: 'Cmd/Ctrl+M' });
      toggleSideDrawer();
    };
    window.addEventListener('toggle-drawer', handleToggleDrawer);
    return () => window.removeEventListener('toggle-drawer', handleToggleDrawer);
  }, [toggleSideDrawer]);
  
  return (
    <div className="app">
      <LoadingProgress />
        <PageTracker />
        {user && (
          <>
            <Navbar 
              onToggleSidebar={toggleSideDrawer}
            />
            <SideDrawer
              isOpen={isSideDrawerOpen}
              onClose={closeSideDrawer}
              onOpen={openSideDrawer}
              isCollapsed={isSideDrawerCollapsed}
              onToggleCollapse={toggleSideDrawerCollapse}
            />
          </>
        )}
        {user && <HelpCommandPalette />}
        <main className="main-content">
        <Suspense fallback={<GlobalLoadingFallback />}>
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES (No authentication required) */}
          {/* ============================================ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/qrcode/:studentId" element={<QRCodeDisplayPage />} />
          <Route path="/silent-check-sso.html" element={<SilentCheckSso />} />
          
          {/* ============================================ */}
          {/* ============================================ */}
          {/* MAIN ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {lazyProtectedRoutes.map(({ path, screenId, screenName, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute screenId={screenId} screenName={screenName}>
                  <Suspense fallback={<GlobalLoadingFallback />}>
                    <Component />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          ))}

          {protectedRoutes.map(({ path, screenId, screenName, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute screenId={screenId} screenName={screenName}>
                  <Component />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Permission Matrix - Super Admin only */}
          <Route
            path="/permission-matrix"
            element={
              <ProtectedRoute allowedRoles={[ROLE_STRINGS.SUPER_ADMIN]}>
                <PermissionMatrixPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================ */}
          {/* REDIRECTS */}
          {/* ============================================ */}
          {redirectRoutes.map(({ from, to }) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
        </Routes>
        </Suspense>
        </main>
      </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <KeycloakProvider>
        <LangProvider>
          <AuthProvider>
          <TypographyProvider>
          <ThemeProvider>
              <ColorThemeProvider>
                <MuiAppThemeProvider>
                <GlobalLoadingProvider>
                  <Router>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/help" element={<HelpRedirect />} />
                        <Route path="/operations/board" element={<OperationsBoardShell />} />
                        <Route path="*" element={<AppContent />} />
                      </Routes>
                    </ErrorBoundary>
                  </Router>
                </GlobalLoadingProvider>
                </MuiAppThemeProvider>
              </ColorThemeProvider>
          </ThemeProvider>
          </TypographyProvider>
        </AuthProvider>
        </LangProvider>
      </KeycloakProvider>
    </ErrorBoundary>
  );
}

export default App;

